import { Module } from "@medusajs/framework/utils"
import BdReportsModuleService from "./service"

export const BD_REPORTS_MODULE = "bd_reports"

export default Module(BD_REPORTS_MODULE, {
  service: BdReportsModuleService,
})
