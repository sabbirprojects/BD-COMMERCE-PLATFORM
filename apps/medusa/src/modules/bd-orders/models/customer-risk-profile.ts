import { model } from "@medusajs/framework/utils"

export const CustomerRiskProfile = model.define("customer_risk_profile", {
  id: model.id().primaryKey(),
  phone_e164: model.text().unique(),
  customer_id: model.text().index().nullable(),
  display_name: model.text().nullable(),
  orders_placed: model.number().default(0),
  orders_delivered: model.number().default(0),
  orders_rto: model.number().default(0),
  orders_canceled: model.number().default(0),
  orders_expired: model.number().default(0),
  delivery_success_rate: model.float().nullable(),
  risk_level: model.enum(["low", "medium", "high", "blocked"]).default("low"),
  is_flagged_fraud: model.boolean().default(false),
  flag_reason: model.text().nullable(),
  notes: model.text().nullable(),
  last_order_at: model.dateTime().nullable(),
  last_delivered_at: model.dateTime().nullable(),
  last_rto_at: model.dateTime().nullable(),
  evaluated_at: model.dateTime().nullable(),
  reconciled_at: model.dateTime().nullable(),
})

export default CustomerRiskProfile
