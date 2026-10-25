import { model } from "@medusajs/framework/utils"

export const OrderLineSnapshot = model.define("order_line_snapshot", {
  id: model.id().primaryKey(),
  order_id: model.text().index(),
  line_item_id: model.text().unique(),
  variant_id: model.text().index().nullable(),
  sku: model.text(),
  title: model.text(),
  variant_title: model.text(),
  quantity: model.number(),
  currency_code: model.text().default("bdt"),
  unit_price_paisa: model.bigNumber(),
  compare_at_price_paisa: model.bigNumber().nullable(),
  discount_alloc_paisa: model.bigNumber().default(0),
  tax_rate_percent: model.float().nullable(),
  tax_amount_paisa: model.bigNumber().default(0),
  tax_included_in_price: model.boolean().default(false),
  cogs_unit_paisa: model.bigNumber().default(0),
  cogs_total_paisa: model.bigNumber().default(0),
  packaging_alloc_paisa: model.bigNumber().default(0),
  supplier_name_snapshot: model.text().nullable(),
})

export default OrderLineSnapshot
