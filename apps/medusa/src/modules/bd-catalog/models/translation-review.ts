import { model } from "@medusajs/framework/utils"

/**
 * Translation review governance (database.md §3.3.2).
 * Tracks machine/manual translation lifecycle for native translatable entities
 * (product, product_category, etc.). Status: draft -> reviewed -> published | failed.
 * Rule: Never auto-publish machine drafts.
 */
export const TranslationReview = model
  .define("translation_review", {
    id: model.id({ prefix: "trrev_" }).primaryKey(),
    reference: model.text(),
    reference_id: model.text(),
    locale_code: model.text().default("bn"),
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
    fields_json: model.json().nullable(),
  })
  .indexes([
    {
      on: ["reference", "reference_id", "locale_code"],
      unique: true,
      where: `"deleted_at" IS NULL`,
    },
    {
      on: ["translation_status", "updated_at"],
    },
  ])

export default TranslationReview
