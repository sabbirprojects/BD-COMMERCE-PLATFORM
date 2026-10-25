import { model } from "@medusajs/framework/utils"

export const CourierConsignment = model.define("courier_consignment", {
  id: model.id().primaryKey(),
  order_id: model.text().index(),
  fulfillment_id: model.text().nullable(),
  courier_code: model.text().index(),
  consignment_external_id: model.text().index().nullable(),
  tracking_code: model.text().index().nullable(),
  status: model.text().default("booked"),
  is_active: model.boolean().default(true),
  booked_at: model.dateTime(),
  picked_up_at: model.dateTime().nullable(),
  delivered_at: model.dateTime().nullable(),
  canceled_at: model.dateTime().nullable(),
  cancel_reason: model.text().nullable(),
  rebooked_from_id: model.text().nullable(),
  cod_collectable_paisa: model.bigNumber().default(0),
  delivery_charge_to_customer_paisa: model.bigNumber().default(0),
  courier_fee_paisa: model.bigNumber().nullable(),
  weight_grams: model.number().nullable(),
  label_url: model.text().nullable(),
  booking_request_id: model.text().nullable(),
  metadata: model.json().nullable(),
})

export default CourierConsignment
