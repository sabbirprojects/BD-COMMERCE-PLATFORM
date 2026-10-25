import { model } from "@medusajs/framework/utils"

export const Invoice = model.define("invoice", {
  id: model.id().primaryKey(),
  order_id: model.text().unique(),
  invoice_number: model.text().unique(),
  fiscal_year: model.text(),
  serial: model.bigNumber(),
  template_id: model.text(),
  template_version: model.number().default(1),
  s3_key: model.text().nullable(),
  snapshot_sha256: model.text().unique(),
  vat_snapshot_json: model.json().nullable(),
  totals_snapshot_json: model.json(),
  total_paisa: model.bigNumber().default(0),
  vat_amount_paisa: model.bigNumber().default(0),
  issued_at: model.dateTime(),
  issued_by: model.text().nullable(),
  voided_at: model.dateTime().nullable(),
  voided_by: model.text().nullable(),
  void_reason: model.text().nullable(),
})

export default Invoice
