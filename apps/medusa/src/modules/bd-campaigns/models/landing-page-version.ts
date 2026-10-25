import { model } from "@medusajs/framework/utils"

export const LandingPageVersion = model.define("landing_page_version", {
  id: model.id({ prefix: "lpver" }).primaryKey(),
  landing_page_id: model.text(),
  version: model.number(),
  sections_json: model.json(),
  theme_tokens_json: model.json().nullable(),
  seo_title_en: model.text().nullable(),
  seo_title_bn: model.text().nullable(),
  seo_description_en: model.text().nullable(),
  seo_description_bn: model.text().nullable(),
  published_at: model.dateTime().nullable(),
  published_by: model.text().nullable(),
  is_current: model.boolean().default(false),
})

export default LandingPageVersion
