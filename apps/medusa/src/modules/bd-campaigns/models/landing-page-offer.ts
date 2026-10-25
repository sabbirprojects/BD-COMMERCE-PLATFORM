import { model } from "@medusajs/framework/utils"

export const LandingPageOffer = model.define("landing_page_offer", {
  id: model.id({ prefix: "lpoffer" }).primaryKey(),
  landing_page_id: model.text(),
  variant_id: model.text(),
  promotion_id: model.text().nullable(),
  offer_price_paisa: model.bigNumber().nullable(),
  bundle_qty: model.number().default(1),
  label_en: model.text().nullable(),
  label_bn: model.text().nullable(),
  starts_at: model.dateTime().nullable(),
  ends_at: model.dateTime().nullable(),
  is_active: model.boolean().default(true),
  max_orders: model.number().nullable(),
  sort_order: model.number().default(0),
})

export default LandingPageOffer
