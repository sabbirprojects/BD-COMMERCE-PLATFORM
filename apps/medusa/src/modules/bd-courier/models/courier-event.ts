import { model } from "@medusajs/framework/utils"

export const CourierEvent = model.define("courier_event", {
  id: model.id().primaryKey(),
  order_id: model.text().index(),
  courier_consignment_id: model.text().index(),
  event_type: model.text(),
  courier_status_raw: model.text().nullable(),
  reason_code: model.text().nullable(),
  occurred_at: model.dateTime(),
  received_at: model.dateTime(),
  source: model.text().default("webhook"),
  payload_redacted: model.json().nullable(),
  payload_sha256: model.text().index(),
  webhook_event_id: model.text().nullable(),
})

export default CourierEvent
