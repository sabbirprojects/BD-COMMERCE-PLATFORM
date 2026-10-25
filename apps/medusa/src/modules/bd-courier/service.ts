import { MedusaService } from "@medusajs/framework/utils"
import Courier from "./models/courier"
import CourierAreaMap from "./models/courier-area-map"
import CourierAreaAlias from "./models/courier-area-alias"
import CourierConsignment from "./models/courier-consignment"
import CourierEvent from "./models/courier-event"
import CourierRemittanceBatch from "./models/courier-remittance-batch"
import CourierRemittanceLine from "./models/courier-remittance-line"
import CourierShipmentLog from "./models/courier-shipment-log"
import CourierWebhookLog from "./models/courier-webhook-log"

class BdCourierModuleService extends MedusaService({
  Courier,
  CourierAreaMap,
  CourierAreaAlias,
  CourierConsignment,
  CourierEvent,
  CourierRemittanceBatch,
  CourierRemittanceLine,
  CourierShipmentLog,
  CourierWebhookLog,
}) {}

export default BdCourierModuleService
