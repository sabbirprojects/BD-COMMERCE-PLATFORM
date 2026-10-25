import { model } from "@medusajs/framework/utils"

export const LandingPage = model.define("landing_page", {
  id: model.id().primaryKey(),
  slug: model.text().unique(),
  title_en: model.text(),
  title_bn: model.text().nullable(),
  is_active: model.boolean().default(true),
  featured_product_id: model.text().nullable(),
  checkout_mode: model.enum(["embedded", "modal", "redirect"]).default("embedded"),
  sections_json: model.json(),
  theme_tokens_json: model.json().nullable(),
  seo_title: model.text().nullable(),
  seo_description: model.text().nullable(),
  meta_pixel_id: model.text().nullable(),
  published_at: model.dateTime().nullable(),
})

export default LandingPage
