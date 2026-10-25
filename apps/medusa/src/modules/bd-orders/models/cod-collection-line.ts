import { model } from "@medusajs/framework/utils"

export const CodCollectionLine = model.define("cod_collection_line", {
  id: model.id().primaryKey(),
  order_id: model.text().index(),
  courier_consignment_id: model.text().index().nullable(),
  line_item_id: model.text().index().nullable(),
  reported_delivered_qty: model.number().default(0),
  reported_rejected_qty: model.number().default(0),
  reported_damaged_qty: model.number().default(0),
  collected_paisa: model.bigNumber().default(0),
  reason_code: model.text().nullable(),
  source: model.enum(["courier_webhook", "courier_manifest", "manual_entry"]),
  recorded_by: model.text().nullable(),
})

export default CodCollectionLine
