import { Module } from "@medusajs/framework/utils"
import BdCampaignsModuleService from "./service"

export const BD_CAMPAIGNS_MODULE = "bd_campaigns"

export default Module(BD_CAMPAIGNS_MODULE, {
  service: BdCampaignsModuleService,
})
