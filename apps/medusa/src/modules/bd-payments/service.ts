import { MedusaService } from "@medusajs/framework/utils"
import PaymentProviderConfig from "./models/payment-provider-config"
import PaymentAttempt from "./models/payment-attempt"
import RefundLedger from "./models/refund-ledger"

class BdPaymentsModuleService extends MedusaService({
  PaymentProviderConfig,
  PaymentAttempt,
  RefundLedger,
}) {}

export default BdPaymentsModuleService
