import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID, createHash } from "crypto"
import jwt from "jsonwebtoken"
import { getCourierAdapter } from "../../../../lib/courier"

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
 * POST /admin/couriers/cancel
 *
 * Pre-pickup consignment cancellation and re-routing (GAP-07, DFD P5.8):
 * - Cancels consignment with external courier adapter if not manual
 * - Sets consignment status -> 'canceled' and is_active -> false
 * - Resets order_bd_details.shipment_state -> 'ready_to_ship'
 * - Clears tracking and consignment IDs on order
 * - Records cancellation in courier_event and audit_log
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const user = getUserFromReq(req)

  const permittedRoles = ["owner", "manager", "warehouse", "operations", "admin"]
  if (!permittedRoles.includes(user.role)) {
    return res.status(403).json({
      success: false,
      error: "unauthorized_role",
      message: "Only Warehouse, Manager, or Owner roles can cancel courier consignments.",
    })
  }

  const { order_id, consignment_id, reason = "Staff canceled consignment before dispatch" } = req.body as any

  if (!order_id && !consignment_id) {
    return res.status(400).json({
      success: false,
      error: "order_id or consignment_id is required",
    })
  }

  const whereClause = consignment_id ? `cc.id = ?` : `cc.order_id = ? AND cc.is_active = true`
  const param = consignment_id || order_id

  const consignRes = await pg.raw(
    `SELECT cc.*, obd.shipment_state
     FROM courier_consignment cc
     JOIN order_bd_details obd ON obd.order_id = cc.order_id
     WHERE ${whereClause} AND cc.deleted_at IS NULL
     LIMIT 1`,
    [param]
  )
  const consignment = consignRes.rows?.[0]
  if (!consignment) {
    return res.status(404).json({ success: false, error: "Active consignment not found" })
  }

  // 1. Cancel via courier adapter if automated
  if (consignment.courier_code !== "manual" && consignment.consignment_external_id) {
    try {
      const adapter = getCourierAdapter(consignment.courier_code)
      await adapter.cancelParcel(consignment.consignment_external_id, reason)
    } catch (err: any) {
      console.warn(`External courier cancel warning: ${err.message}`)
    }
  }

  // 2. Mark consignment canceled
  await pg.raw(
    `UPDATE courier_consignment
     SET status = 'canceled',
         is_active = false,
         canceled_at = now(),
         cancel_reason = ?,
         updated_at = now()
     WHERE id = ?`,
    [reason, consignment.id]
  )

  // 3. Record cancel event
  const eventId = `courev_${randomUUID().replace(/-/g, "").slice(0, 24)}`
  const payloadStr = JSON.stringify({ reason, canceled_by: user.id })
  const payloadSha = createHash("sha256").update(payloadStr).digest("hex")

  await pg.raw(
    `INSERT INTO courier_event (
      id, order_id, courier_consignment_id, event_type, courier_status_raw,
      occurred_at, received_at, source, payload_redacted, payload_sha256,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, 'canceled', 'canceled',
      now(), now(), 'manual', ?, ?,
      now(), now()
    )`,
    [
      eventId,
      consignment.order_id,
      consignment.id,
      payloadStr,
      payloadSha,
    ]
  )

  // 4. Reset Order BD Details back to 'ready_to_ship'
  await pg.raw(
    `UPDATE order_bd_details
     SET shipment_state = 'ready_to_ship',
         courier_provider = NULL,
         courier_tracking_code = NULL,
         courier_consignment_id = NULL,
         updated_at = now()
     WHERE order_id = ?`,
    [consignment.order_id]
  )

  // 5. Audit Log
  await pg.raw(
    `INSERT INTO audit_log (
      id, occurred_at, actor_id, actor_type, actor_role,
      entity_type, entity_id, action, reason, after_redacted, record_hash
    ) VALUES (
      ?, now(), ?, 'user', ?,
      'order', ?, 'consignment_canceled', ?, ?, 'pending-db-chain'
    )`,
    [
      `aud_${randomUUID().replace(/-/g, "").slice(0, 24)}`,
      user.id,
      user.role,
      consignment.order_id,
      reason,
      JSON.stringify({ consignment_id: consignment.id, courier_code: consignment.courier_code }),
    ]
  )

  return res.json({
    success: true,
    consignment_id: consignment.id,
    order_id: consignment.order_id,
    shipment_state: "ready_to_ship",
    message: "Consignment canceled successfully. Order reset to ready_to_ship.",
  })
}
