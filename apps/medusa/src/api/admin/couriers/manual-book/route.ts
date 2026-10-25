import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID, createHash } from "crypto"
import jwt from "jsonwebtoken"
import { sendSmsNotification } from "../../../../lib/sms"

function getUserFromReq(req: MedusaRequest) {
  const authHeader = req.headers["authorization"] || ""
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7)
    const decoded = jwt.decode(token) as any
    if (decoded) {
      return {
        id: decoded.actor_id || decoded.app_metadata?.user_id || "user_staff",
        role: decoded.app_metadata?.role || decoded.role || "operations",
      }
    }
  }
  const authContext = (req as any).auth_context
  if (authContext) {
    return {
      id: authContext.actor_id || "user_staff",
      role: authContext.app_metadata?.role || "operations",
    }
  }
  return (req as any).user || { id: "user_admin", role: "owner" }
}

/**
 * POST /admin/couriers/manual-book
 *
 * Manual courier booking / external consignment fallback (CHK-FUL-02, AC-7.3, AC-12.2):
 * - Staff enters courier name, consignment number, and tracking code
 * - Bypasses external API entirely (works even during complete courier outage)
 * - Transitions order to 'dispatched' without blocking operations
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const user = getUserFromReq(req)

  const permittedRoles = ["owner", "manager", "warehouse", "operations", "admin"]
  if (!permittedRoles.includes(user.role)) {
    return res.status(403).json({
      success: false,
      error: "unauthorized_role",
      message: "Only Warehouse, Manager, or Owner roles can record manual courier shipments.",
    })
  }

  const {
    order_id,
    courier_name = "Manual Courier",
    consignment_id,
    tracking_code,
    courier_fee_bdt = 50,
    notes,
  } = req.body as any

  if (!order_id || !consignment_id) {
    return res.status(400).json({
      success: false,
      error: "order_id and consignment_id are required",
    })
  }

  const orderRes = await pg.raw(
    `SELECT o.id, o.display_id, obd.*
     FROM "order" o
     JOIN order_bd_details obd ON obd.order_id = o.id
     WHERE o.id = ? AND obd.deleted_at IS NULL
     LIMIT 1`,
    [order_id]
  )
  const order = orderRes.rows?.[0]
  if (!order) {
    return res.status(404).json({ success: false, error: "Order not found" })
  }
  const resolvedOrderId = order_id

  const resolvedTracking = tracking_code || consignment_id
  const courierFeePaisa = Math.round(Number(courier_fee_bdt) * 100)
  const codAmountPaisa = order.payment_method_code === "cod" ? Number(order.cod_collectable_paisa || 0) : 0

  // 1. Deactivate prior consignments
  await pg.raw(
    `UPDATE courier_consignment
     SET is_active = false, updated_at = now()
     WHERE order_id = ? AND is_active = true AND deleted_at IS NULL`,
    [resolvedOrderId]
  )

  // 2. Persist Manual Consignment
  const internalConsId = `consign_${randomUUID().replace(/-/g, "").slice(0, 24)}`
  await pg.raw(
    `INSERT INTO courier_consignment (
      id, order_id, courier_code, consignment_external_id, tracking_code,
      status, is_active, booked_at, cod_collectable_paisa,
      delivery_charge_to_customer_paisa, courier_fee_paisa,
      metadata, created_at, updated_at
    ) VALUES (
      ?, ?, 'manual', ?, ?,
      'booked', true, now(), ?,
      ?, ?,
      ?, now(), now()
    )`,
    [
      internalConsId,
      resolvedOrderId,
      consignment_id,
      resolvedTracking,
      codAmountPaisa,
      Number(order.customer_paid_delivery_paisa || 0),
      courierFeePaisa,
      JSON.stringify({ courier_name, notes, mode: "manual_entry", recorded_by: user.id }),
    ]
  )

  // 3. Record Initial Manual Courier Event
  const eventId = `courev_${randomUUID().replace(/-/g, "").slice(0, 24)}`
  const payloadStr = JSON.stringify({ consignment_id, courier_name, recorded_by: user.id })
  const payloadSha = createHash("sha256").update(payloadStr).digest("hex")

  await pg.raw(
    `INSERT INTO courier_event (
      id, order_id, courier_consignment_id, event_type, courier_status_raw,
      occurred_at, received_at, source, payload_redacted, payload_sha256,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, 'booked', 'booked_manually',
      now(), now(), 'manual', ?, ?,
      now(), now()
    )`,
    [
      eventId,
      resolvedOrderId,
      internalConsId,
      payloadStr,
      payloadSha,
    ]
  )

  // 4. Update Order BD Details
  await pg.raw(
    `UPDATE order_bd_details
     SET shipment_state = 'dispatched',
         active_courier_code = 'manual',
         courier_provider = 'manual',
         courier_tracking_code = ?,
         courier_consignment_id = ?,
         courier_cost_paisa = ?,
         raw_courier_cost_paisa = ?,
         updated_at = now()
     WHERE order_id = ?`,
    [
      resolvedTracking,
      consignment_id,
      courierFeePaisa,
      JSON.stringify({ value: String(courierFeePaisa), precision: 20 }),
      resolvedOrderId,
    ]
  )

  // 5. Audit Log
  await pg.raw(
    `INSERT INTO audit_log (
      id, occurred_at, actor_id, actor_type, actor_role,
      entity_type, entity_id, action, reason, after_redacted, record_hash
    ) VALUES (
      ?, now(), ?, 'user', ?,
      'order', ?, 'manual_consignment_recorded', 'Staff recorded manual courier dispatch', ?, 'pending-db-chain'
    )`,
    [
      `aud_${randomUUID().replace(/-/g, "").slice(0, 24)}`,
      user.id,
      user.role,
      resolvedOrderId,
      JSON.stringify({ courier_name, consignment_id, tracking_code: resolvedTracking }),
    ]
  )

  // 6. SMS notification
  const addr = order.address_snapshot || {}
  await sendSmsNotification({
    orderId: resolvedOrderId,
    eventType: "order.dispatched",
    phone: addr.phone || "",
    data: {
      order_no: order.display_id || resolvedOrderId,
      courier: courier_name,
      tracking_url: resolvedTracking,
    },
    pg,
  }).catch(() => {})

  return res.json({
    success: true,
    consignment_id: internalConsId,
    courier_code: "manual",
    courier_name,
    consignment_external_id: consignment_id,
    tracking_code: resolvedTracking,
    shipment_state: "dispatched",
    message: `Manual shipment recorded with ${courier_name} (CHK-FUL-02, AC-7.3).`,
  })
}
