import { MedusaService } from "@medusajs/framework/utils"
import CustomerIdentity from "./models/customer-identity"
import CustomerRiskProfile from "./models/customer-risk-profile"
import AddressBdDetail from "./models/address-bd-detail"
import OrderBdDetails from "./models/order-bd-details"
import OrderLineSnapshot from "./models/order-line-snapshot"
import CodCallLog from "./models/cod-call-log"
import CodCollectionLine from "./models/cod-collection-line"
import ReturnPolicy from "./models/return-policy"
import ReturnPolicyScope from "./models/return-policy-scope"
import ReturnReview from "./models/return-review"
import InvoiceTemplate from "./models/invoice-template"
import Invoice from "./models/invoice"
import SmsTemplate from "./models/sms-template"
import SmsDeliveryDetail from "./models/sms-delivery-detail"

class BdOrdersModuleService extends MedusaService({
  CustomerIdentity,
  CustomerRiskProfile,
  AddressBdDetail,
  OrderBdDetails,
  OrderLineSnapshot,
  CodCallLog,
  CodCollectionLine,
  ReturnPolicy,
  ReturnPolicyScope,
  ReturnReview,
  InvoiceTemplate,
  Invoice,
  SmsTemplate,
  SmsDeliveryDetail,
}) {}

export default BdOrdersModuleService
