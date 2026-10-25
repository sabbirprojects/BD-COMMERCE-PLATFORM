import { model } from "@medusajs/framework/utils"

export const SmsTemplate = model.define("sms_template", {
  id: model.id().primaryKey(),
  template_key: model.text(),
  event_type: model.text().index(),
  locale: model.text(), // bn | en
  body_template: model.text(),
  provider_template_id: model.text().nullable(),
  version: model.number().default(1),
  is_active: model.boolean().default(true),
  updated_by: model.text().nullable(),
})

export default SmsTemplate
