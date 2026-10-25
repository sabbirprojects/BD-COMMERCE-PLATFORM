import { model } from "@medusajs/framework/utils"

/**
 * Normalized options for enum category attributes (database.md §3.3.5).
 * Stores bilingual labels (English and Bangla) per option value code.
 */
export const CategoryAttributeOption = model
  .define("category_attribute_option", {
    id: model.id({ prefix: "catopt_" }).primaryKey(),
    category_attribute_id: model.text().index(),
    value_code: model.text(),
    label_en: model.text(),
    label_bn: model.text(),
    sort_order: model.number().default(0),
    is_active: model.boolean().default(true),
  })
  .indexes([
    {
      on: ["category_attribute_id", "value_code"],
      unique: true,
      where: `"deleted_at" IS NULL`,
    },
  ])

export default CategoryAttributeOption
