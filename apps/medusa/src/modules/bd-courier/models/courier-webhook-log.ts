import { model } from "@medusajs/framework/utils"

export const CourierWebhookLog = model.define("courier_webhook_log", {
  id: model.id().primaryKey(),
  courier: model.text(),
  event_type: model.text(),
  consignment_id: model.text().index().nullable(),
  tracking_code: model.text().index().nullable(),
  raw_payload: model.json().nullable(),
  signature_verified: model.boolean().default(false),
  processed: model.boolean().default(false),
  error_message: model.text().nullable(),
})

export default CourierWebhookLog
