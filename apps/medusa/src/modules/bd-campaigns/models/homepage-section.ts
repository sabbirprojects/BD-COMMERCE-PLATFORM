import { model } from "@medusajs/framework/utils"

export const HomepageSection = model.define("homepage_section", {
  id: model.id({ prefix: "hsec" }).primaryKey(),
  section_type: model.text(),
  title_en: model.text().nullable(),
  title_bn: model.text().nullable(),
  subtitle_en: model.text().nullable(),
  subtitle_bn: model.text().nullable(),
  config_json: model.json(),
  sort_order: model.number().default(0),
  is_active: model.boolean().default(true),
  starts_at: model.dateTime().nullable(),
  ends_at: model.dateTime().nullable(),
  published_at: model.dateTime().nullable(),
  published_version_json: model.json().nullable(),
  created_by: model.text().nullable(),
  updated_by: model.text().nullable(),
})

export default HomepageSection
