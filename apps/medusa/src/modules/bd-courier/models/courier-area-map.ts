import { model } from "@medusajs/framework/utils"

export const CourierAreaMap = model.define("courier_area_map", {
  id: model.id().primaryKey(),
  courier_code: model.text().index(),
  thana_code: model.text().index(),
  courier_city_id: model.text().nullable(),
  courier_zone_id: model.text().nullable(),
  courier_area_id: model.text().nullable(),
  area_name_raw: model.text().nullable(),
  is_active: model.boolean().default(true),
  verified_at: model.dateTime().nullable(),
})

export default CourierAreaMap
