import { model } from "@medusajs/framework/utils"

export const MediaAsset = model.define("media_asset", {
  id: model.id({ prefix: "media" }).primaryKey(),
  bucket: model.text(),
  key: model.text(),
  mime: model.text(),
  size_bytes: model.number(),
  width: model.number().nullable(),
  height: model.number().nullable(),
  checksum_sha256: model.text(),
  alt_text_en: model.text().nullable(),
  alt_text_bn: model.text().nullable(),
  source: model.enum(["product", "landing_page", "content_page", "invoice", "brand"]).default("landing_page"),
  ref_count: model.number().default(0),
  is_orphan: model.boolean().default(false),
  uploaded_by: model.text().nullable(),
})

export default MediaAsset
