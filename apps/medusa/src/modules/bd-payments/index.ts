import { Module } from "@medusajs/framework/utils"
import BdPaymentsModuleService from "./service"

export const BD_PAYMENTS_MODULE = "bd_payments"

export default Module(BD_PAYMENTS_MODULE, {
  service: BdPaymentsModuleService,
})
