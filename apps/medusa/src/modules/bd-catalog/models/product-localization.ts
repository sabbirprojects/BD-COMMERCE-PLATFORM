import { model } from "@medusajs/framework/utils"

/**
 * Product Bangladesh editorial localization (database.md §3.3.1).
 * Native product.title, subtitle, description, material are translatable
 * and live in the native translation module. This table holds BN-only
 * editorial content only (care instructions, origin, excerpt, SEO meta, BN handle).
 */
export const ProductLocalization = model
  .define("product_localization", {
    id: model.id({ prefix: "bdploc_" }).primaryKey(),
    product_id: model.text().unique().index(),
    description_excerpt_bn: model.text().nullable(),
    care_instructions_bn: model.text().nullable(),
    origin_country_bn: model.text().default("বাংলাদেশ").nullable(),
    handle_bn: model.text().nullable(),
    meta_title_bn: model.text().nullable(),
    meta_description_bn: model.text().nullable(),
    translation_source: model
      .enum(["manual", "machine"])
      .default("manual"),
    translation_status: model
      .enum(["draft", "reviewed", "published", "failed"])
      .default("draft"),
    source_hash: model.text().nullable(),
    reviewed_by: model.text().nullable(),
    reviewed_at: model.dateTime().nullable(),
    failure_reason: model.text().nullable(),
    is_bilingual_complete: model.boolean().default(false),
  })
  .indexes([
    {
      on: ["handle_bn"],
      unique: true,
      where: `"handle_bn" IS NOT NULL AND "deleted_at" IS NULL`,
    },
  ])

export default ProductLocalization
