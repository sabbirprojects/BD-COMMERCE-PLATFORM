import { model } from "@medusajs/framework/utils"

/**
 * payment_attempt
 *
 * Implements database.md §3.7.2:
 * - Gateway audit log for every payment attempt, initiate, callback, query, and replay
 * - Preserves evidence for zero-orphan architecture and dropped-callback recovery
 * - State authority: native payment and payment_session are authoritative; payment_attempt is evidence.
 */
const PaymentAttempt = model.define("payment_attempt", {
  id: model.id({ prefix: "payatt" }).primaryKey(),
  payment_collection_id: model.text().index().nullable(),
  payment_session_id: model.text().index().nullable(),
  payment_id: model.text().index().nullable(),
  order_id: model.text().index().nullable(),
  cart_id: model.text().index().nullable(),
  provider_code: model.text().index(),
  attempt_type: model.enum([
    "initiate",
    "callback",
    "execute",
    "query",
    "capture",
    "refund",
    "replay",
  ]),
  amount_paisa: model.bigNumber(),
  currency_code: model.text().default("bdt"),
  gateway_transaction_id: model.text().index().nullable(),
  gateway_status: model.text().nullable(),
  gateway_status_raw: model.text().nullable(),
  payer_msisdn_masked: model.text().nullable(),
  provider_fee_paisa: model.bigNumber().nullable(),
  is_signature_verified: model.boolean().default(false),
  is_server_verified: model.boolean().default(false),
  idempotency_key: model.text().index().nullable(),
  failure_code: model.text().nullable(),
  failure_reason_redacted: model.text().nullable(),
  response_redacted: model.json().nullable(),
  initiated_at: model.dateTime(),
  completed_at: model.dateTime().nullable(),
  request_id: model.text().nullable(),
})

export default PaymentAttempt
