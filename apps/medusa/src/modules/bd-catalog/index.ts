import { Module } from "@medusajs/framework/utils"
import BdCatalogModuleService from "./service"

export const BD_CATALOG_MODULE = "bd_catalog"

export default Module(BD_CATALOG_MODULE, {
  service: BdCatalogModuleService,
})
