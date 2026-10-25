import { model } from "@medusajs/framework/utils"

/**
 * Division master (database.md §3.8.2). Stable codes, never reused.
 * Example code: `BD-DHK`.
 */
export const GeoDivision = model
  .define("geo_division", {
    code: model.text().primaryKey(),
    name_en: model.text(),
    name_bn: model.text(),
    bbs_code: model.text().nullable(),
    sort_order: model.number().default(0),
    is_active: model.boolean().default(true),
  })
  .indexes([
    {
      on: ["bbs_code"],
      unique: true,
      where: `"bbs_code" IS NOT NULL`,
    },
  ])

export default GeoDivision
