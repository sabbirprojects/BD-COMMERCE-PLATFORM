import { model } from "@medusajs/framework/utils"

export const CourierRemittanceLine = model.define("courier_remittance_line", {
  id: model.id().primaryKey(),
  batch_id: model.text().index(),
  order_id: model.text().index(),
  consignment_id: model.text().nullable(),
  expected_paisa: model.bigNumber().default(0),
  courier_fee_paisa: model.bigNumber().default(0),
  cod_fee_paisa: model.bigNumber().default(0),
  remitted_paisa: model.bigNumber().default(0),
  variance_paisa: model.bigNumber().default(0),
  variance_reason_code: model.text().nullable(),
  dispute_status: model.text().default("none"),
  resolved_by: model.text().nullable(),
  resolved_at: model.dateTime().nullable(),
})

export default CourierRemittanceLine
