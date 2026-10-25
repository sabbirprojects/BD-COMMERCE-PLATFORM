import { model } from "@medusajs/framework/utils"

export const ContentPage = model.define("content_page", {
  id: model.id({ prefix: "page" }).primaryKey(),
  slug: model.text().unique(),
  page_type: model.enum(["policy", "about", "faq", "contact", "terms", "custom"]).default("custom"),
  title_en: model.text(),
  title_bn: model.text().nullable(),
  body_en: model.text().nullable(),
  body_bn: model.text().nullable(),
  excerpt_en: model.text().nullable(),
  excerpt_bn: model.text().nullable(),
  status: model.enum(["draft", "published", "unpublished"]).default("draft"),
  seo_title_en: model.text().nullable(),
  seo_title_bn: model.text().nullable(),
  seo_description_en: model.text().nullable(),
  seo_description_bn: model.text().nullable(),
  canonical_url: model.text().nullable(),
  published_version_json: model.json().nullable(),
  published_at: model.dateTime().nullable(),
  created_by: model.text().nullable(),
  updated_by: model.text().nullable(),
})

export default ContentPage
