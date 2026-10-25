import { model } from "@medusajs/framework/utils"

export const AdCampaign = model.define("ad_campaign", {
  id: model.id({ prefix: "adcamp" }).primaryKey(),
  name: model.text(),
  platform: model.enum(["meta", "google", "tiktok", "other"]).default("meta"),
  external_campaign_id: model.text().nullable(),
  landing_page_id: model.text().nullable(),
  promotion_campaign_id: model.text().nullable(),
  utm_source: model.text().nullable(),
  utm_medium: model.text().nullable(),
  utm_campaign: model.text().nullable(),
  utm_content: model.text().nullable(),
  utm_term: model.text().nullable(),
  starts_at: model.dateTime().nullable(),
  ends_at: model.dateTime().nullable(),
  status: model.enum(["draft", "active", "paused", "ended"]).default("draft"),
  daily_budget_paisa: model.bigNumber().nullable(),
  total_spend_paisa: model.bigNumber().default(0),
  spend_updated_at: model.dateTime().nullable(),
  created_by: model.text().nullable(),
})

export default AdCampaign
