import { model } from "@medusajs/framework/utils"

/**
 * Product-level attribute values (database.md §3.3.5).
 * Associates a product with a category attribute value.
 * Exactly one value column is populated based on the attribute input_type.
 */
export const ProductAttributeValue = model
  .define("product_attribute_value", {
    id: model.id({ prefix: "pattrval_" }).primaryKey(),
    product_id: model.text().index(),
    category_attribute_id: model.text().index(),
    value_text: model.text().nullable(),
    value_number: model.bigNumber().nullable(),
    value_boolean: model.boolean().nullable(),
    value_code_ref: model.text().nullable(),
  })
  .indexes([
    {
      on: ["product_id", "category_attribute_id"],
      unique: true,
      where: `"deleted_at" IS NULL`,
    },
    {
      on: ["category_attribute_id", "value_text"],
    },
  ])

export default ProductAttributeValue
