import { MedusaService } from "@medusajs/framework/utils"
import DeliveryZone from "./models/delivery-zone"
import DeliveryZoneDistrict from "./models/delivery-zone-district"
import GeoDistrict from "./models/geo-district"
import GeoDivision from "./models/geo-division"
import GeoThana from "./models/geo-thana"
import OperationalSettings from "./models/operational-settings"
import VatSettings from "./models/vat-settings"

class BdSettingsModuleService extends MedusaService({
  OperationalSettings,
  GeoDivision,
  GeoDistrict,
  GeoThana,
  DeliveryZone,
  DeliveryZoneDistrict,
  VatSettings,
}) {}

export default BdSettingsModuleService
