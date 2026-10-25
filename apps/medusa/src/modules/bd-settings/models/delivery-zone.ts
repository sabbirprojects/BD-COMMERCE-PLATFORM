import { model } from "@medusajs/framework/utils"

/**
 * Delivery zone profile (database.md §3.8.3).
 * The **rate** lives in a native `shipping_option` price set referenced by
 * `shipping_option_id`; this table owns geographic coverage and COD policy
 * only — it never stores a fee amount other than the integer-paisa COD
 * handling fee.
 */
export const DeliveryZone = model
  .define("delivery_zone", {
    id: model.id({ prefix: "zone_" }).primaryKey(),
    code: model.text().unique(),
    name_en: model.text(),
    name_bn: model.text(),
    shipping_option_id: model.text().nullable(),
    service_zone_id: model.text().nullable(),
    cod_enabled: model.boolean().default(true),
    cod_handling_fee_paisa: model.bigNumber().default(0),
    min_order_paisa: model.bigNumber().default(0),
    max_weight_grams: model.number().nullable(),
    delivery_days_min: model.number().nullable(),
    delivery_days_max: model.number().nullable(),
    priority: model.number().default(0),
    is_active: model.boolean().default(true),
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      on: ["shipping_option_id"],
      unique: true,
      where: `"shipping_option_id" IS NOT NULL`,
    },
  ])
  .checks([
    {
      name: "CK_dz_paisa_integer_nonnegative",
      expression: `"cod_handling_fee_paisa" = trunc("cod_handling_fee_paisa") AND "cod_handling_fee_paisa" >= 0 AND "min_order_paisa" = trunc("min_order_paisa") AND "min_order_paisa" >= 0`,
    },
  ])

export default DeliveryZone
