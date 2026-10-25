import { model } from "@medusajs/framework/utils"

export const SmsDeliveryDetail = model.define("sms_delivery_detail", {
  id: model.id().primaryKey(),
  notification_id: model.text().nullable(),
  order_id: model.text().index().nullable(),
  event_type: model.text(),
  template_key: model.text().nullable(),
  recipient_masked: model.text(),
  recipient_hash: model.text(),
  attempt_no: model.number().default(1),
  provider_code: model.text().nullable(),
  status: model.text().default("pending"), // pending | sent | delivered | failed
  error_code: model.text().nullable(),
  error_message_redacted: model.text().nullable(),
  sent_at: model.dateTime().nullable(),
  delivered_at: model.dateTime().nullable(),
  cost_paisa: model.bigNumber().nullable(),
  rate_limit_bucket: model.text().nullable(),
})

export default SmsDeliveryDetail
