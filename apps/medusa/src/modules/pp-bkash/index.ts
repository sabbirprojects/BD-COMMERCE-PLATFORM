import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import BkashPaymentProviderService from "./service"

export default ModuleProvider(Modules.PAYMENT, {
  services: [BkashPaymentProviderService],
})
