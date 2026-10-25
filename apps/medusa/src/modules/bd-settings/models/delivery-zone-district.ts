import { model } from "@medusajs/framework/utils"

/**
 * District → delivery zone mapping (database.md §3.8.3).
 * A district belongs to exactly one zone (`district_code` unique).
 * `delivery_zone_code` references `delivery_zone.code` (same-module logical
 * reference, seed-validated).
 */
export const DeliveryZoneDistrict = model
  .define("delivery_zone_district", {
    id: model.id({ prefix: "zonedist_" }).primaryKey(),
    delivery_zone_code: model.text(),
    district_code: model.text().unique(),
  })
  .indexes([
    { on: ["delivery_zone_code", "district_code"], unique: true },
  ])

export default DeliveryZoneDistrict
