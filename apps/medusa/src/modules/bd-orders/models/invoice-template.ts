import { model } from "@medusajs/framework/utils"

export const InvoiceTemplate = model.define("invoice_template", {
  id: model.id().primaryKey(),
  name: model.text(),
  version: model.number().default(1),
  is_active: model.boolean().default(false),
  logo_asset_key: model.text().nullable(),
  header_text_en: model.text().nullable(),
  header_text_bn: model.text().nullable(),
  footer_text_en: model.text().nullable(),
  footer_text_bn: model.text().nullable(),
  terms_en: model.text().nullable(),
  terms_bn: model.text().nullable(),
  paper_size: model.text().default("A4"),
  show_vat: model.boolean().default(false),
  published_at: model.dateTime().nullable(),
  created_by: model.text().nullable(),
})

export default InvoiceTemplate
