import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID, createHash } from "crypto"
import jwt from "jsonwebtoken"
import { getCourierAdapter, resolveCourierArea } from "../../../../lib/courier"
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
 * POST /admin/couriers/book
 *
 * Automated courier parcel booking workflow (CHK-FUL-01, PRD FR-7.4.*):
 * - Resolves 4-tier address
 * - Unmapped area gate: blocks courier with courier_area_unmapped, offers Manual (FR-7.4.4)
 * - Invokes courier adapter createParcel()
 * - Records consignment & courier_event
 * - Updates order_bd_details.shipment_state -> dispatched
 * - Enqueues Dispatched SMS notification
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const user = getUserFromReq(req)

  const permittedRoles = ["owner", "manager", "warehouse", "operations", "admin"]
  if (!permittedRoles.includes(user.role)) {
    return res.status(403).json({
      success: false,
      error: "unauthorized_role",
      message: "Only Warehouse, Manager, or Owner roles can book courier consignments.",
    })
  }

  const { order_id, courier_code, notes, weight_grams = 500 } = req.body as any

  if (!order_id || !courier_code) {
    return res.status(400).json({
      success: false,
      error: "order_id and courier_code are required",
    })
  }

  // 1. Fetch Order and BD Details
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

  // 2. Fetch Courier Config
  const courierRes = await pg.raw(
    `SELECT * FROM courier WHERE code = ? AND deleted_at IS NULL LIMIT 1`,
    [courier_code]
  )
  const courier = courierRes.rows?.[0]
  if (!courier || !courier.is_active) {
    return res.status(400).json({
      success: false,
      error: "courier_not_configured",
      message: `Courier '${courier_code}' is not active or not integrated (PRD FR-7.4.6).`,
    })
  }

  // 3. Resolve 4-Tier Address
  const addr = order.address_snapshot || {}
  const recipientName = `${addr.first_name || ""} ${addr.last_name || ""}`.trim() || "Customer"
  const recipientPhone = addr.phone || ""
  const recipientAddress = addr.street_address || addr.address_1 || ""
  const division = order.division_code || addr.division_code || ""
  const district = order.district_code || addr.district_code || ""
  const thana = order.thana_code || addr.thana_code || ""

  // 4. Resolve Area Mapping (database.md §8.2)
  const areaMapping = await resolveCourierArea({
    courierCode: courier_code,
    thanaCode: thana,
    districtCode: district,
    districtName: district,
    thanaName: thana,
    pg,
  })

  if (!areaMapping.mapped && courier_code !== "manual") {
    return res.status(422).json({
      success: false,
      error: "courier_area_unmapped",
      fallback: "manual",
      courier_code,
      thana_code: thana,
      message: `Recipient thana '${thana}' is not mapped for ${courier.name_en}. Never guess zone; please use Manual Courier fallback (PRD FR-7.4.4).`,
      message_bn: `প্রাপকের থানা '${thana}' ${courier.name_bn}-এ ম্যাপিং করা নেই। অনুগ্রহ করে ম্যানুয়াল কুরিয়ার অপশন ব্যবহার করুন।`,
    })
  }

  // 5. Invoke Courier Adapter
  const adapter = getCourierAdapter(courier_code)
  const codAmountPaisa = order.payment_method_code === "cod" ? Number(order.cod_collectable_paisa || 0) : 0

  let bookingResult
  try {
    bookingResult = await adapter.createParcel({
      orderId: resolvedOrderId,
      displayId: order.display_id || resolvedOrderId,
      recipientName,
      recipientPhone,
      recipientAddress,
      division,
      district,
      thana,
      codAmountPaisa,
      weightGrams: weight_grams,
      notes,
      areaMap: areaMapping,
    })
  } catch (err: any) {
    return res.status(502).json({
      success: false,
      error: "courier_api_error",
      message: `Courier API error: ${err.message}`,
    })
  }

  // 6. Deactivate any previous active consignment for this order
  await pg.raw(
    `UPDATE courier_consignment
     SET is_active = false, updated_at = now()
     WHERE order_id = ? AND is_active = true AND deleted_at IS NULL`,
    [resolvedOrderId]
  )

  // 7. Persist New Active Consignment (courier_consignment)
  const consignmentId = `consign_${randomUUID().replace(/-/g, "").slice(0, 24)}`
  const courierFeePaisa = bookingResult.courierFeePaisa || 6000

  await pg.raw(
    `INSERT INTO courier_consignment (
      id, order_id, courier_code, consignment_external_id, tracking_code,
      status, is_active, booked_at, cod_collectable_paisa,
      delivery_charge_to_customer_paisa, courier_fee_paisa, weight_grams,
      label_url, metadata, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?,
      'booked', true, now(), ?,
      ?, ?, ?,
      ?, ?, now(), now()
    )`,
    [
      consignmentId,
      resolvedOrderId,
      courier_code,
      bookingResult.consignmentExternalId,
      bookingResult.trackingCode,
      codAmountPaisa,
      Number(order.customer_paid_delivery_paisa || 0),
      courierFeePaisa,
      weight_grams,
      bookingResult.labelUrl || null,
      JSON.stringify(bookingResult.rawResponse || {}),
    ]
  )

  // 8. Record Initial Courier Event (courier_event)
  const eventId = `courev_${randomUUID().replace(/-/g, "").slice(0, 24)}`
  const payloadStr = JSON.stringify(bookingResult.rawResponse || { action: "booked" })
  const payloadSha = createHash("sha256").update(payloadStr).digest("hex")

  await pg.raw(
    `INSERT INTO courier_event (
      id, order_id, courier_consignment_id, event_type, courier_status_raw,
      occurred_at, received_at, source, payload_redacted, payload_sha256,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, 'booked', 'booked',
      now(), now(), 'manifest', ?, ?,
      now(), now()
    )`,
    [
      eventId,
      resolvedOrderId,
      consignmentId,
      payloadStr,
      payloadSha,
    ]
  )

  // 9. Update Order BD Details (shipment_state = 'dispatched')
  await pg.raw(
    `UPDATE order_bd_details
     SET shipment_state = 'dispatched',
         active_courier_code = ?,
         courier_provider = ?,
         courier_tracking_code = ?,
         courier_consignment_id = ?,
         courier_cost_paisa = ?,
         raw_courier_cost_paisa = ?,
         updated_at = now()
     WHERE order_id = ?`,
    [
      courier_code,
      courier_code,
      bookingResult.trackingCode,
      bookingResult.consignmentExternalId,
      courierFeePaisa,
      JSON.stringify({ value: String(courierFeePaisa), precision: 20 }),
      resolvedOrderId,
    ]
  )

  // 10. Record Audit Log
  await pg.raw(
    `INSERT INTO audit_log (
      id, occurred_at, actor_id, actor_type, actor_role,
      entity_type, entity_id, action, reason, after_redacted, record_hash
    ) VALUES (
      ?, now(), ?, 'user', ?,
      'order', ?, 'consignment_booked', ?, ?, 'pending-db-chain'
    )`,
    [
      `aud_${randomUUID().replace(/-/g, "").slice(0, 24)}`,
      user.id,
      user.role,
      resolvedOrderId,
      `Parcel booked with ${courier.name_en}`,
      JSON.stringify({
        courier_code,
        consignment_id: bookingResult.consignmentExternalId,
        tracking_code: bookingResult.trackingCode,
      }),
    ]
  )

  // 11. Enqueue / Send Dispatched SMS Notification
  const trackingUrl = courier.tracking_url_template
    ? courier.tracking_url_template.replace("{tracking_code}", bookingResult.trackingCode)
    : `https://example.com/track/${bookingResult.trackingCode}`

  await sendSmsNotification({
    orderId: resolvedOrderId,
    eventType: "order.dispatched",
    phone: recipientPhone,
    data: {
      order_no: order.display_id || resolvedOrderId,
      courier: courier.name_bn || courier.name_en,
      tracking_url: trackingUrl,
    },
    pg,
  }).catch((smsErr) => {
    // Non-blocking as per FR-11.6.3
    console.error("SMS dispatch failed:", smsErr);
  })

  return res.json({
    success: true,
    consignment_id: consignmentId,
    courier_code,
    consignment_external_id: bookingResult.consignmentExternalId,
    tracking_code: bookingResult.trackingCode,
    shipment_state: "dispatched",
    tracking_url: trackingUrl,
    label_url: bookingResult.labelUrl,
    message: `Parcel booked successfully with ${courier.name_en}.`,
  })
}
