import { model } from "@medusajs/framework/utils"

/**
 * Product-to-Brand binding (database.md §3.3.4).
 * Enforces 1 brand per product at the database level via unique product_id.
 */
export const ProductBrand = model.define("product_brand", {
  id: model.id({ prefix: "prodbrand_" }).primaryKey(),
  product_id: model.text().unique(),
  brand_id: model.text().index(),
})

export default ProductBrand
