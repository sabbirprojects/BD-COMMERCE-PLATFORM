import { model } from "@medusajs/framework/utils"

/**
 * District master (database.md §3.8.2).
 * `division_code` references `geo_division.code` (same-module logical
 * reference, seed-validated). Example code: `BD-DHK-GAZ`.
 */
export const GeoDistrict = model
  .define("geo_district", {
    code: model.text().primaryKey(),
    division_code: model.text(),
    name_en: model.text(),
    name_bn: model.text(),
    bbs_code: model.text().nullable(),
    is_active: model.boolean().default(true),
  })
  .indexes([
    { on: ["division_code"] },
    {
      on: ["bbs_code"],
      unique: true,
      where: `"bbs_code" IS NOT NULL`,
    },
  ])

export default GeoDistrict
