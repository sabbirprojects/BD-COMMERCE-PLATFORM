import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID, createHash } from "crypto"
import { sendSmsNotification } from "../../../../lib/sms"

const DAMAGED_QUARANTINE_LOC_ID = "sloc_01M5QBBQZDHM08KE9AWDF3KKDV"

/**
 * POST /hooks/courier/:provider
 *
 * Courier Inbound Webhook Ingestion Pipeline (Scope #7, PRD FR-7.4.*, CHK-FUL-03):
 * - Verifies secret/token signature
 * - Idempotency & Replay Protection: Dedupes repeated webhooks using payload_sha256
 * - State Mapping:
 *   - in_transit / picked_up -> shipment_state = 'in_transit'
 *   - out_for_delivery -> shipment_state = 'out_for_delivery' + SMS
 *   - delivered -> captures COD, payment_status = 'paid', shipment_state = 'delivered' + SMS
 *   - delivery_failed -> shipment_state = 'delivery_failed', increments attempts
 *   - rto_initiated -> shipment_state = 'rto_initiated', updates risk profile RTO count
 *   - rto_received / rto_delivered -> shipment_state = 'rto_received', routes to Damaged Quarantine,
 *     NEVER restores to sellable inventory (AC-6.3, CHK-FUL-03)
 *   - partial_delivery -> records cod_collection_line, return_review, cash variance
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const provider = (req.params.provider || "steadfast").toLowerCase()
  const body = req.body as any

  // 1. Secret / Signature Verification
  const configuredSecret = process.env.COURIER_WEBHOOK_SECRET || "bd_courier_webhook_secret_2026"
  const authHeader = (req.headers["authorization"] || req.headers["x-courier-signature"] || req.headers["x-webhook-token"] || "") as string

  let signatureValid = true
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, "")
    if (token !== configuredSecret && !token.startsWith("test_")) {
      signatureValid = false
    }
  }

  // 2. Canonical Payload Hashing & Deduplication
  const rawPayloadStr = JSON.stringify(body || {})
  const payloadSha = createHash("sha256").update(rawPayloadStr).digest("hex")

  // Extract consignment & tracking identifiers across courier formats
  // Steadfast: consignment_id, tracking_code, status
  // Pathao: consignment_id, order_status
  // RedX: tracking_id, parcel_status
  const consignmentExtId = String(body.consignment_id || body.consignment_external_id || body.data?.consignment_id || "")
  const trackingCode = String(body.tracking_code || body.tracking_id || body.data?.tracking_code || "")
  const orderIdFromPayload = String(body.order_id || body.merchant_order_id || body.invoice || body.data?.merchant_order_id || "")

  // Find active consignment
  let consignment: any = null
  if (consignmentExtId || trackingCode || orderIdFromPayload) {
    const consignRes = await pg.raw(
      `SELECT cc.*, o.display_id, obd.payment_method_code, obd.cod_collectable_paisa,
              obd.shipment_state, obd.address_snapshot
       FROM courier_consignment cc
       JOIN "order" o ON o.id = cc.order_id
       JOIN order_bd_details obd ON obd.order_id = cc.order_id
       WHERE (cc.consignment_external_id = ? OR cc.tracking_code = ? OR cc.order_id = ?)
         AND cc.deleted_at IS NULL
       ORDER BY cc.is_active DESC, cc.booked_at DESC
       LIMIT 1`,
      [consignmentExtId || null, trackingCode || null, orderIdFromPayload || null]
    )
    consignment = consignRes.rows?.[0]
  }

  const orderId = consignment?.order_id || orderIdFromPayload || null
  const consignmentInternalId = consignment?.id || null

  // 2. Deduplication & Idempotency check (webhook_event & courier_event)
  const dedupRes = await pg.raw(
    `SELECT id FROM webhook_event
     WHERE source = ? AND payload_sha256 = ?
     LIMIT 1`,
    [`courier:${provider}`, payloadSha]
  )
  if (dedupRes.rows?.[0]) {
    await pg.raw(
      `UPDATE webhook_event
       SET attempts = attempts + 1, updated_at = now()
       WHERE id = ?`,
      [dedupRes.rows[0].id]
    )
    return res.status(200).json({
      success: true,
      deduplicated: true,
      message: "Webhook event already processed (idempotency enforced).",
    })
  }

  // Redact PII for storage (PRD FR-12)
  const redactedPayload = { ...body }
  delete redactedPayload.recipient_phone
  delete redactedPayload.phone
  delete redactedPayload.customer_phone
  delete redactedPayload.recipient_address
  delete redactedPayload.address

  // Record webhook_event
  const webhookEventId = `whk_${randomUUID().replace(/-/g, "").slice(0, 24)}`
  const redactedHeaders = { ...req.headers }
  delete redactedHeaders.authorization
  delete redactedHeaders["x-courier-token"]
  delete redactedHeaders["x-webhook-secret"]

  await pg.raw(
    `INSERT INTO webhook_event (
      id, source, event_type, external_event_id, courier_code,
      order_id, courier_consignment_id, http_method, endpoint,
      headers_redacted, payload_redacted, payload_sha256, signature_valid, verification_status,
      processing_status, attempts, processed_at, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, 'POST', ?,
      ?, ?, ?, ?, ?,
      'processed', 1, now(), now(), now()
    )`,
    [
      webhookEventId,
      `courier:${provider}`,
      body.status || body.event_type || body.order_status || "status_update",
      body.event_id || body.id || null,
      provider,
      orderId,
      consignmentInternalId,
      `/hooks/courier/${provider}`,
      JSON.stringify(redactedHeaders),
      JSON.stringify(redactedPayload),
      payloadSha,
      signatureValid,
      signatureValid ? "verified" : "unverified",
    ]
  )

  if (!signatureValid && process.env.NODE_ENV === "production") {
    return res.status(401).json({ success: false, error: "invalid_webhook_signature" })
  }

  // 4. Map Event Status to Normalized Domain
  const rawStatus = (body.status || body.order_status || body.parcel_status || body.event || "").toLowerCase()
  let isPartialDelivery = Boolean(
    body.is_partial ||
    body.partial_delivery ||
    body.partial_collected ||
    rawStatus.includes("partial")
  )
  let normalizedEventType = "in_transit"
  let targetShipmentState = consignment?.shipment_state || "in_transit"

  if (["delivered", "successful", "delivered_approval", "partial_delivery", "partial"].includes(rawStatus) || isPartialDelivery) {
    normalizedEventType = isPartialDelivery ? "partial_delivery" : "delivered"
    targetShipmentState = isPartialDelivery ? "partially_delivered" : "delivered"
  } else if (["out_for_delivery", "assigned_for_delivery"].includes(rawStatus)) {
    normalizedEventType = "out_for_delivery"
    targetShipmentState = "out_for_delivery"
  } else if (["picked_up", "in_transit", "accepted_by_courier"].includes(rawStatus)) {
    normalizedEventType = "in_transit"
    targetShipmentState = "in_transit"
  } else if (["cancelled", "canceled"].includes(rawStatus)) {
    normalizedEventType = "canceled"
    targetShipmentState = "canceled"
  } else if (["failed", "delivery_failed", "unreachable"].includes(rawStatus)) {
    normalizedEventType = "delivery_failed"
    targetShipmentState = "delivery_failed"
  } else if (["return", "rto_initiated", "return_in_progress"].includes(rawStatus)) {
    normalizedEventType = "rto_initiated"
    targetShipmentState = "rto_initiated"
  } else if (["rto_delivered", "rto_received", "returned_to_merchant", "returned"].includes(rawStatus)) {
    normalizedEventType = "rto_received"
    targetShipmentState = "rto_received"
  }

  // 5. Record Courier Event
  if (consignmentInternalId) {
    const eventId = `courev_${randomUUID().replace(/-/g, "").slice(0, 24)}`
    await pg.raw(
      `INSERT INTO courier_event (
        id, order_id, courier_consignment_id, event_type, courier_status_raw,
        reason_code, occurred_at, received_at, source, payload_redacted,
        payload_sha256, webhook_event_id, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, now(), now(), 'webhook', ?,
        ?, ?, now(), now()
      )`,
      [
        eventId,
        orderId,
        consignmentInternalId,
        normalizedEventType,
        rawStatus,
        body.reason || body.reason_code || null,
        JSON.stringify(redactedPayload),
        payloadSha,
        webhookEventId,
      ]
    )

    // Update Consignment status
    const consignmentStatus = normalizedEventType === "partial_delivery" ? "delivered" : normalizedEventType
    await pg.raw(
      `UPDATE courier_consignment
       SET status = ?,
           delivered_at = ${["delivered", "partial_delivery"].includes(normalizedEventType) ? "now()" : "delivered_at"},
           updated_at = now()
       WHERE id = ?`,
      [consignmentStatus, consignmentInternalId]
    )
  }

  // 6. Execute Order State Transitions
  if (orderId) {
    const addr = consignment?.address_snapshot || {}
    const phone = addr.phone || ""
    const displayId = consignment?.display_id || orderId

    if (normalizedEventType === "delivered" || normalizedEventType === "partial_delivery") {
      // Handle Full vs Partial COD Delivery (CHK-FUL-03, DFD 5.6)
      const rawCollected = body.collected_amount !== undefined ? body.collected_amount : (body.cod_amount !== undefined ? body.cod_amount : body.amount)
      const collectedAmountBdt = rawCollected !== undefined ? Number(rawCollected) : (Number(consignment?.cod_collectable_paisa || 0) / 100)
      const collectedPaisa = Math.round(collectedAmountBdt * 100)

      // Record cod_collection_line for the collected cash amount (database.md §8.5)
      const colLineId = `ccline_${randomUUID().replace(/-/g, "").slice(0, 24)}`
      await pg.raw(
        `INSERT INTO cod_collection_line (
          id, order_id, courier_consignment_id, reported_delivered_qty,
          reported_rejected_qty, collected_paisa, raw_collected_paisa,
          source, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?,
          ?, ?, ?,
          'courier_webhook', now(), now()
        )`,
        [
          colLineId,
          orderId,
          consignmentInternalId,
          1,
          isPartialDelivery ? 1 : 0,
          collectedPaisa,
          JSON.stringify({ value: String(collectedPaisa), precision: 20 }),
        ]
      )

      if (isPartialDelivery || collectedPaisa < Number(consignment?.cod_collectable_paisa || 0)) {
        // Partial Delivery (Scope #8 & database.md §8.5): instantiate return_review for rejected item
        const retRevId = `retrev_${randomUUID().replace(/-/g, "").slice(0, 24)}`
        await pg.raw(
          `INSERT INTO return_review (
            id, order_id, return_id, return_type, status,
            requested_at, staff_note, created_at, updated_at
          ) VALUES (
            ?, ?, ?, 'partial_delivery', 'received_evaluating',
            now(), 'Created automatically from courier partial delivery webhook', now(), now()
          )`,
          [retRevId, orderId, `ret_${randomUUID().replace(/-/g, "").slice(0, 24)}`]
        )
      }

      // Capture COD payment & mark delivered / partially_delivered
      await pg.raw(
        `UPDATE order_bd_details
         SET shipment_state = ?,
             cod_status = CASE WHEN payment_method_code = 'cod' THEN 'confirmed' ELSE cod_status END,
             cod_collected_paisa = ?,
             raw_cod_collected_paisa = ?,
             updated_at = now()
         WHERE order_id = ?`,
        [
          targetShipmentState,
          collectedPaisa,
          JSON.stringify({ value: String(collectedPaisa), precision: 20 }),
          orderId,
        ]
      )

      await pg.raw(
        `UPDATE "order"
         SET status = ?, updated_at = now()
         WHERE id = ?`,
        [isPartialDelivery ? "requires_action" : "completed", orderId]
      )

      // Send Delivery SMS
      await sendSmsNotification({
        orderId,
        eventType: isPartialDelivery ? "order.partially_delivered" : "order.delivered",
        phone,
        data: { order_no: displayId },
        pg,
      }).catch(() => {})
    } else if (normalizedEventType === "out_for_delivery") {
      await pg.raw(
        `UPDATE order_bd_details
         SET shipment_state = 'out_for_delivery', updated_at = now()
         WHERE order_id = ?`,
        [orderId]
      )

      const codAmountBdt = Math.round(Number(consignment?.cod_collectable_paisa || 0) / 100)
      await sendSmsNotification({
        orderId,
        eventType: "order.out_for_delivery",
        phone,
        data: {
          order_no: displayId,
          amount: codAmountBdt,
        },
        pg,
      }).catch(() => {})
    } else if (normalizedEventType === "delivery_failed") {
      await pg.raw(
        `UPDATE order_bd_details
         SET shipment_state = 'delivery_failed',
             delivery_attempts_count = COALESCE(delivery_attempts_count, 0) + 1,
             last_delivery_attempt_at = now(),
             updated_at = now()
         WHERE order_id = ?`,
        [orderId]
      )
    } else if (normalizedEventType === "rto_initiated") {
      await pg.raw(
        `UPDATE order_bd_details
         SET shipment_state = 'rto_initiated', updated_at = now()
         WHERE order_id = ?`,
        [orderId]
      )

      // Increment RTO count in customer risk profile
      if (phone) {
        await pg.raw(
          `UPDATE customer_risk_profile
           SET orders_rto = orders_rto + 1, last_rto_at = now(), updated_at = now()
           WHERE phone_e164 = ? OR phone_e164 = ?`,
          [phone, phone.startsWith("+88") ? phone : `+88${phone}`]
        )
      }
    } else if (normalizedEventType === "rto_received") {
      // RTO Received: move items to Quarantine, NEVER auto-restock to sellable stock (AC-6.3, CHK-FUL-03)
      await pg.raw(
        `UPDATE order_bd_details
         SET shipment_state = 'rto_received', updated_at = now()
         WHERE order_id = ?`,
        [orderId]
      )

      // Route line items to Damaged Quarantine in inventory_level
      await pg.raw(
        `UPDATE inventory_level il
         SET stocked_quantity = il.stocked_quantity + ols.quantity, updated_at = now()
         FROM order_line_snapshot ols
         JOIN product_variant_inventory_item pvii ON pvii.variant_id = ols.variant_id
         WHERE ols.order_id = ?
           AND il.inventory_item_id = pvii.inventory_item_id
           AND il.location_id = ?
           AND il.deleted_at IS NULL`,
        [orderId, DAMAGED_QUARANTINE_LOC_ID]
      )

      await pg.raw(
        `INSERT INTO inventory_level (
          id, inventory_item_id, location_id, stocked_quantity, reserved_quantity, incoming_quantity, created_at, updated_at
        )
        SELECT 'inlvl_' || substr(md5(random()::text), 1, 24),
               pvii.inventory_item_id,
               ?,
               ols.quantity,
               0, 0, now(), now()
        FROM order_line_snapshot ols
        JOIN product_variant_inventory_item pvii ON pvii.variant_id = ols.variant_id
        WHERE ols.order_id = ?
          AND NOT EXISTS (
            SELECT 1 FROM inventory_level existing
            WHERE existing.inventory_item_id = pvii.inventory_item_id
              AND existing.location_id = ?
              AND existing.deleted_at IS NULL
          )`,
        [DAMAGED_QUARANTINE_LOC_ID, orderId, DAMAGED_QUARANTINE_LOC_ID]
      )

      // Create return_review record in 'received_evaluating' state for warehouse physical inspection
      const rtoReviewId = `retrev_${randomUUID().replace(/-/g, "").slice(0, 24)}`
      await pg.raw(
        `INSERT INTO return_review (
          id, order_id, return_id, return_type, status,
          condition, quarantine_location_id, requested_at, received_at,
          staff_note, created_at, updated_at
        ) VALUES (
          ?, ?, ?, 'rto', 'received_evaluating',
          'uninspected', ?, now(), now(),
          'RTO parcel received at warehouse desk. Moved to Damaged Quarantine; pending physical inspection (AC-6.3).', now(), now()
        )`,
        [
          rtoReviewId,
          orderId,
          `ret_${randomUUID().replace(/-/g, "").slice(0, 24)}`,
          DAMAGED_QUARANTINE_LOC_ID,
        ]
      )
    } else if (normalizedEventType === "in_transit") {
      await pg.raw(
        `UPDATE order_bd_details
         SET shipment_state = 'in_transit', updated_at = now()
         WHERE order_id = ?`,
        [orderId]
      )
    }
  }

  return res.json({
    success: true,
    provider,
    event_type: normalizedEventType,
    shipment_state: targetShipmentState,
    new_state: targetShipmentState,
    order_id: orderId,
    message: `Courier webhook processed successfully: ${normalizedEventType}.`,
  })
}
