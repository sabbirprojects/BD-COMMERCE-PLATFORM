import { model } from "@medusajs/framework/utils"

export const CourierRemittanceBatch = model.define("courier_remittance_batch", {
  id: model.id().primaryKey(),
  courier_code: model.text().index(),
  batch_ref: model.text().index(),
  period_start: model.dateTime(),
  period_end: model.dateTime(),
  gross_collected_paisa: model.bigNumber().default(0),
  courier_fee_paisa: model.bigNumber().default(0),
  cod_fee_paisa: model.bigNumber().default(0),
  adjustment_paisa: model.bigNumber().default(0),
  net_remitted_paisa: model.bigNumber().default(0),
  received_at: model.dateTime().nullable(),
  bank_ref: model.text().nullable(),
  status: model.text().default("pending"),
  reconciled_by: model.text().nullable(),
  reconciled_at: model.dateTime().nullable(),
  notes: model.text().nullable(),
})

export default CourierRemittanceBatch
