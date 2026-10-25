import { model } from "@medusajs/framework/utils"

export const CustomerIdentity = model.define("customer_identity", {
  id: model.id().primaryKey(),
  customer_id: model.text().index(),
  phone_e164: model.text().index(),
  phone_raw: model.text().nullable(),
  is_primary: model.boolean().default(false),
  locale_preference: model.enum(["en", "bn"]).default("bn"),
  sms_opt_out: model.boolean().default(false),
  sms_opt_out_at: model.dateTime().nullable(),
  sms_opt_out_source: model.text().nullable(),
  whatsapp_opt_in: model.boolean().default(false),
  whatsapp_opt_in_at: model.dateTime().nullable(),
  verified_at: model.dateTime().nullable(),
})

export default CustomerIdentity
