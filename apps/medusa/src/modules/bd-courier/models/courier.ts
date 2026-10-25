import { model } from "@medusajs/framework/utils"

export const Courier = model.define("courier", {
  id: model.id().primaryKey(),
  code: model.text().index(),
  name_en: model.text(),
  name_bn: model.text(),
  adapter_key: model.text(),
  supports_cod: model.boolean().default(true),
  supports_partial_delivery: model.boolean().default(false),
  supports_area_api: model.boolean().default(false),
  supports_return_booking: model.boolean().default(false),
  tracking_url_template: model.text().nullable(),
  secret_ref: model.text().nullable(),
  key_version: model.text().nullable(),
  last_rotated_at: model.dateTime().nullable(),
  is_active: model.boolean().default(true),
  sort_order: model.number().default(0),
  metadata: model.json().nullable(),
})

export default Courier
