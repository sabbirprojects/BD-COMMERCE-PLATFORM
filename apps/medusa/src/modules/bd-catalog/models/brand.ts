import { model } from "@medusajs/framework/utils"

/**
 * Brand entity (database.md §3.3.4).
 * Brand is product-level (not a variant option).
 */
export const Brand = model.define("brand", {
  id: model.id({ prefix: "brand_" }).primaryKey(),
  slug: model.text().unique(),
  name_en: model.text(),
  name_bn: model.text().nullable(),
  logo_key: model.text().nullable(),
  description_en: model.text().nullable(),
  description_bn: model.text().nullable(),
  is_active: model.boolean().default(true),
  sort_order: model.number().default(0),
})

export default Brand
