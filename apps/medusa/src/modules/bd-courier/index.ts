import { Module } from "@medusajs/framework/utils"
import BdCourierModuleService from "./service"

export const BD_COURIER_MODULE = "bd_courier"

export default Module(BD_COURIER_MODULE, {
  service: BdCourierModuleService,
})
