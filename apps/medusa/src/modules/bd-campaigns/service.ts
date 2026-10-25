import { MedusaService } from "@medusajs/framework/utils"
import LandingPage from "./models/landing-page"

class BdCampaignsModuleService extends MedusaService({
  LandingPage,
}) {}

export default BdCampaignsModuleService
