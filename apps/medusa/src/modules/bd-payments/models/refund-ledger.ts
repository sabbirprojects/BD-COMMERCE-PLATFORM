import { model } from "@medusajs/framework/utils"

/**
 * refund_ledger
 *
 * Implements database.md §3.7.3:
 * - Business refund lifecycle tracking (intent -> staff approval -> payout)
 * - Supports manual payouts via bKash/Nagad and bank transfers
 * - Prevents double payouts via idempotency_key
 * - PRD FR-6.7.12: No provider auto-refund; staff-approved only
 */
const RefundLedger = model.define("refund_ledger", {
  id: model.id({ prefix: "refund" }).primaryKey(),
  order_id: model.text().index(),
  return_id: model.text().index().nullable(),
  native_refund_id: model.text().index().nullable(),
  order_transaction_id: model.text().nullable(),
  refund_type: model.enum([
    "return_refund",
    "stockout_refund",
    "delivery_fee_refund",
    "goodwill",
    "rto_adjustment",
    "duplicate_payment",
  ]).default("return_refund"),
  amount_paisa: model.bigNumber(),
  currency_code: model.text().default("bdt"),
  method_code: model.text(),
  status: model.enum([
    "pending_approval",
    "approved",
    "processing",
    "paid",
    "failed",
    "voided",
  ]).default("pending_approval"),
  target_account_enc: model.text().nullable(),
  target_account_last4: model.text().nullable(),
  target_account_key_version: model.text().nullable(),
  target_account_holder_enc: model.text().nullable(),
  trx_id: model.text().index().nullable(),
  reason_code: model.text().nullable(),
  reason_note: model.text().nullable(),
  requested_by: model.text(),
  approved_by: model.text().nullable(),
  approved_at: model.dateTime().nullable(),
  paid_at: model.dateTime().nullable(),
  recorded_by: model.text().nullable(),
  failure_reason: model.text().nullable(),
  void_reason: model.text().nullable(),
  idempotency_key: model.text().index().nullable(),
  audit_log_id: model.text().nullable(),
})

export default RefundLedger
