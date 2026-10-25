import { Module } from "@medusajs/framework/utils"
import BdOrdersModuleService from "./service"

export const BD_ORDERS_MODULE = "bd_orders"

export default Module(BD_ORDERS_MODULE, {
  service: BdOrdersModuleService,
})
