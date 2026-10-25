import { model } from "@medusajs/framework/utils"

/**
 * Thana / Upazila master (database.md §3.8.2).
 * `district_code` references `geo_district.code` (same-module logical
 * reference, seed-validated). Example code: `BD-DHK-GAZ-KAL`.
 */
export const GeoThana = model
  .define("geo_thana", {
    code: model.text().primaryKey(),
    district_code: model.text(),
    name_en: model.text(),
    name_bn: model.text(),
    bbs_code: model.text().nullable(),
    postal_codes: model.array().nullable(),
    is_city_corporation: model.boolean().default(false),
    is_active: model.boolean().default(true),
  })
  .indexes([
    { on: ["district_code", "name_en"] },
    {
      on: ["bbs_code"],
      unique: true,
      where: `"bbs_code" IS NOT NULL`,
    },
  ])

export default GeoThana
