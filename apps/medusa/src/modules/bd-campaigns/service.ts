import { MedusaService } from "@medusajs/framework/utils"
import LandingPage from "./models/landing-page"
import LandingPageVersion from "./models/landing-page-version"
import LandingPageOffer from "./models/landing-page-offer"
import AdCampaign from "./models/ad-campaign"
import AdConversionEvent from "./models/ad-conversion-event"
import HomepageSection from "./models/homepage-section"
import ContentPage from "./models/content-page"
import MediaAsset from "./models/media-asset"

class BdCampaignsModuleService extends MedusaService({
  LandingPage,
  LandingPageVersion,
  LandingPageOffer,
  AdCampaign,
  AdConversionEvent,
  HomepageSection,
  ContentPage,
  MediaAsset,
}) {}

export default BdCampaignsModuleService
