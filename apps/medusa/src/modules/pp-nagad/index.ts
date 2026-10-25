import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import NagadPaymentProviderService from "./service"

export default ModuleProvider(Modules.PAYMENT, {
  services: [NagadPaymentProviderService],
})
