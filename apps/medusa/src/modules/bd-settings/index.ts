import { Module } from "@medusajs/framework/utils"
import BdSettingsModuleService from "./service"

export const BD_SETTINGS_MODULE = "bd_settings"

export default Module(BD_SETTINGS_MODULE, {
  service: BdSettingsModuleService,
})
