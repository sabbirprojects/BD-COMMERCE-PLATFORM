import { model } from "@medusajs/framework/utils"

export const LandingPage = model.define("landing_page", {
  id: model.id({ prefix: "lp" }).primaryKey(),
  slug: model.text().unique(),
  title_en: model.text(),
  title_bn: model.text().nullable(),
  status: model.enum(["draft", "published", "unpublished"]).default("draft"),
  ad_campaign_id: model.text().nullable(),
  checkout_mode: model.enum(["embedded", "modal", "redirect"]).default("embedded"),
  default_locale: model.text().default("bn"),
  canonical_url: model.text().nullable(),
  seo_title_en: model.text().nullable(),
  seo_title_bn: model.text().nullable(),
  seo_description_en: model.text().nullable(),
  seo_description_bn: model.text().nullable(),
  sections_json: model.json(),
  theme_tokens_json: model.json().nullable(),
  published_version_id: model.text().nullable(),
  starts_at: model.dateTime().nullable(),
  ends_at: model.dateTime().nullable(),
  published_at: model.dateTime().nullable(),
  created_by: model.text().nullable(),
  updated_by: model.text().nullable(),
})

export default LandingPage
