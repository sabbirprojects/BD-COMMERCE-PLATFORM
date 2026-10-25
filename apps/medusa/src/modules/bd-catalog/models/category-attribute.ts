import { model } from "@medusajs/framework/utils"

/**
 * Category-specific dynamic attribute definition (database.md §3.3.5, PRD FR-3.1.1).
 * Supported input types: text, number, enum, boolean.
 */
export const CategoryAttribute = model
  .define("category_attribute", {
    id: model.id({ prefix: "catattr_" }).primaryKey(),
    category_id: model.text().index(),
    code: model.text().index(),
    name_en: model.text(),
    name_bn: model.text(),
    input_type: model
      .enum(["text", "number", "enum", "boolean"])
      .default("text"),
    unit: model.text().nullable(),
    help_text_en: model.text().nullable(),
    help_text_bn: model.text().nullable(),
    is_required: model.boolean().default(false),
    is_filterable: model.boolean().default(true),
    sort_order: model.number().default(0),
    is_active: model.boolean().default(true),
  })
  .indexes([
    {
      on: ["category_id", "code"],
      unique: true,
      where: `"deleted_at" IS NULL`,
    },
  ])

export default CategoryAttribute
