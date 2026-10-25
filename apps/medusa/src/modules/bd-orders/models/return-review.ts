import { model } from "@medusajs/framework/utils"

export const ReturnReview = model.define("return_review", {
  id: model.id().primaryKey(),
  return_id: model.text().unique(),
  order_id: model.text().index(),
  return_type: model.text(), // customer_return | rto | partial_delivery | damaged_delivery | wrong_item
  status: model.text().default("pending_manual_review"), // pending_manual_review | approved | rejected | info_requested | awaiting_receipt | received_evaluating | completed | canceled
  policy_id: model.text().nullable(),
  policy_snapshot: model.json().nullable(),
  requested_at: model.dateTime(),
  reviewed_by: model.text().nullable(),
  reviewed_at: model.dateTime().nullable(),
  approved_at: model.dateTime().nullable(),
  rejected_at: model.dateTime().nullable(),
  received_at: model.dateTime().nullable(),
  completed_at: model.dateTime().nullable(),
  rejection_reason_code: model.text().nullable(),
  rejection_note: model.text().nullable(),
  info_request_note: model.text().nullable(),
  staff_note: model.text().nullable(),
  customer_visible_note: model.text().nullable(),
  return_shipping_cost_paisa: model.bigNumber().nullable(),
  return_shipping_paid_by: model.text().nullable(), // customer | merchant | shared
  refund_status: model.text().default("pending"), // not_applicable | pending | approved | paid | failed | voided
  refund_amount_paisa: model.bigNumber().nullable(),
  refund_trx_id: model.text().nullable(),
  restocked_at: model.dateTime().nullable(),
  restocked_by: model.text().nullable(),
  quarantine_location_id: model.text().nullable(),
  condition: model.text().default("uninspected"), // uninspected | sellable | damaged | not_restockable
  condition_recorded_by: model.text().nullable(),
  condition_recorded_at: model.dateTime().nullable(),
})

export default ReturnReview
