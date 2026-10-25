import { model } from "@medusajs/framework/utils"

export const CourierShipmentLog = model.define("courier_shipment_log", {
  id: model.id().primaryKey(),
  order_id: model.text().index(),
  courier: model.text(),
  action: model.text(),
  request_payload: model.json().nullable(),
  response_payload: model.json().nullable(),
  status_code: model.number().nullable(),
  error_message: model.text().nullable(),
})

export default CourierShipmentLog
