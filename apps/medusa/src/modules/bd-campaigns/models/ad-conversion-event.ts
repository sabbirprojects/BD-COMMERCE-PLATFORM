import { model } from "@medusajs/framework/utils"

export const AdConversionEvent = model.define("ad_conversion_event", {
  id: model.id({ prefix: "adevt" }).primaryKey(),
  order_id: model.text(),
  ad_campaign_id: model.text().nullable(),
  event_name: model.text(),
  event_id: model.text().unique(),
  platform: model.text(),
  payload_hash: model.text(),
  sent_at: model.dateTime().nullable(),
  status: model.enum(["pending", "sent", "failed", "skipped"]).default("pending"),
  error_redacted: model.text().nullable(),
})

export default AdConversionEvent
