import { model } from "@medusajs/framework/utils"

/**
 * Product Bangladesh commercial profile (database.md §3.3.3).
 * 1:1 linked to Medusa native Product.
 * Holds primary category, returnability override, and warranty/origin notes.
 */
export const ProductBdProfile = model.define("product_bd_profile", {
  id: model.id({ prefix: "bdprod_" }).primaryKey(),
  product_id: model.text().index().unique(),
  primary_category_id: model.text().index().nullable(),
  is_returnable: model.boolean().default(true),
  return_policy_id: model.text().nullable(),
  warranty_note_en: model.text().nullable(),
  warranty_note_bn: model.text().nullable(),
  origin_note_en: model.text().nullable(),
  origin_note_bn: model.text().nullable(),
  country_of_origin: model.text().default("BD").nullable(),
  hs_code: model.text().nullable(),
  is_cod_allowed: model.boolean().default(true),
  min_order_qty: model.number().nullable(),
  max_order_qty: model.number().nullable(),
  created_by: model.text().nullable(),
  updated_by: model.text().nullable(),
})

export default ProductBdProfile
