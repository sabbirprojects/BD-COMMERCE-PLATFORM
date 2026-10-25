import { model } from "@medusajs/framework/utils"

export const ReturnPolicyScope = model.define("return_policy_scope", {
  id: model.id().primaryKey(),
  return_policy_id: model.text().index(),
  category_id: model.text().nullable(),
  product_id: model.text().nullable(),
  is_returnable: model.boolean().default(true),
  window_days_override: model.number().nullable(),
  note_en: model.text().nullable(),
  note_bn: model.text().nullable(),
})

export default ReturnPolicyScope
