import { model } from "@medusajs/framework/utils"

/**
 * Redacted inbound webhook log for payments and couriers
 * (database.md §3.12.2). Replaces the superseded `payment_webhook_log` and
 * `courier_webhook_log`. Raw payloads/headers are never persisted; only
 * redacted projections plus a `payload_sha256` for dedupe + integrity.
 */
export const WebhookEvent = model
  .define("webhook_event", {
    id: model.id({ prefix: "whk_" }).primaryKey(),
    source: model.text(),
    event_type: model.text().nullable(),
    external_event_id: model.text().nullable(),
    payment_provider_code: model.text().nullable(),
    courier_code: model.text().nullable(),
    order_id: model.text().index().nullable(),
    payment_attempt_id: model.text().index().nullable(),
    courier_consignment_id: model.text().index().nullable(),
    http_method: model.text(),
    endpoint: model.text(),
    ip_address: model.text().nullable(),
    headers_redacted: model.json(),
    payload_redacted: model.json().nullable(),
    payload_sha256: model.text(),
    signature_valid: model.boolean().default(false),
    signature_algorithm: model.text().nullable(),
    verification_status: model.enum([
      "pending",
      "verified",
      "failed",
      "skipped",
    ]),
    processing_status: model.enum([
      "received",
      "processing",
      "processed",
      "ignored",
      "failed",
    ]),
    attempts: model.number().default(0),
    processed_at: model.dateTime().nullable(),
    error_code: model.text().nullable(),
    error_message_redacted: model.text().nullable(),
  })
  .indexes([
    // Dedupe when the provider sends an event id.
    {
      on: ["source", "external_event_id"],
      unique: true,
      where: `"external_event_id" IS NOT NULL`,
    },
    // Dedupe when the provider sends no event id (replay-safe by content).
    {
      on: ["source", "payload_sha256"],
      unique: true,
      where: `"external_event_id" IS NULL`,
    },
    // Webhook processing queue (IDX_whk_queue).
    { on: ["processing_status", "created_at"] },
    // Webhook by source/time (IDX_whk_source).
    { on: ["source", "created_at"] },
  ])

export default WebhookEvent
