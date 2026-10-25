import { model } from "@medusajs/framework/utils"

/**
 * Effective-dated product variant cost (database.md §3.3.6).
 * Strictly Owner/Finance restricted.
 * Stored in integer paisa fields (cogs_paisa, packaging_cost_paisa, estimated_shipping_cost_paisa).
 */
export const ProductVariantCost = model
  .define("product_variant_cost", {
    id: model.id({ prefix: "varcost_" }).primaryKey(),
    variant_id: model.text().index(),
    currency_code: model.text().default("bdt"),
    cogs_paisa: model.bigNumber().default(0),
    packaging_cost_paisa: model.bigNumber().default(0),
    estimated_shipping_cost_paisa: model.bigNumber().default(0),
    supplier_name: model.text().nullable(),
    supplier_sku: model.text().nullable(),
    minimum_margin_percent: model.number().default(20),
    effective_from: model.dateTime(),
    effective_to: model.dateTime().nullable(),
    change_reason: model.text().nullable(),
    changed_by: model.text().nullable(),
  })
  .indexes([
    {
      on: ["variant_id", "effective_from"],
    },
  ])

export default ProductVariantCost
