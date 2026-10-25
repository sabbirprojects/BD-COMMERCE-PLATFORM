import { model } from "@medusajs/framework/utils"

export const AddressBdDetail = model.define("address_bd_detail", {
  id: model.id().primaryKey(),
  address_id: model.text().unique(),
  division_code: model.text().index(),
  district_code: model.text().index(),
  thana_code: model.text().index(),
  landmark: model.text().nullable(),
  alt_phone_e164: model.text().nullable(),
  postal_code: model.text().nullable(),
  delivery_zone_code: model.text().nullable(),
  is_verified: model.boolean().default(false),
  verification_source: model.enum(["customer_input", "staff", "courier_feedback"]).default("customer_input"),
})

export default AddressBdDetail
