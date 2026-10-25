import { model } from "@medusajs/framework/utils"

export const ReturnPolicy = model.define("return_policy", {
  id: model.id().primaryKey(),
  version: model.number().default(1),
  name: model.text(),
  window_days: model.number().nullable(), // NULL = not configured (PRD FR-6.7.3)
  eligibility_note_en: model.text().nullable(),
  eligibility_note_bn: model.text().nullable(),
  return_shipping_paid_by: model.text().nullable(), // customer | merchant | shared
  refund_methods: model.array().nullable(),
  allow_partial_return: model.boolean().default(true),
  requires_unboxing_video: model.boolean().default(false),
  is_active: model.boolean().default(false),
  effective_from: model.dateTime().nullable(),
  effective_to: model.dateTime().nullable(),
  published_at: model.dateTime().nullable(),
  created_by: model.text().nullable(),
})

export default ReturnPolicy
