import BdCatalogModule from "../modules/bd-catalog"
import ProductModule from "@medusajs/medusa/product"
import { defineLink } from "@medusajs/framework/utils"

export default defineLink(
  ProductModule.linkable.productVariant,
  BdCatalogModule.linkable.productVariantCost
)
