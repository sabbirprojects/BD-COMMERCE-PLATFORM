import { MedusaService } from "@medusajs/framework/utils"
import Brand from "./models/brand"
import CategoryAttribute from "./models/category-attribute"
import CategoryAttributeOption from "./models/category-attribute-option"
import ProductAttributeValue from "./models/product-attribute-value"
import ProductBdProfile from "./models/product-bd-profile"
import ProductBrand from "./models/product-brand"
import ProductLocalization from "./models/product-localization"
import ProductVariantCost from "./models/product-variant-cost"
import TranslationReview from "./models/translation-review"

class BdCatalogModuleService extends MedusaService({
  Brand,
  ProductBrand,
  ProductLocalization,
  TranslationReview,
  ProductBdProfile,
  CategoryAttribute,
  CategoryAttributeOption,
  ProductAttributeValue,
  ProductVariantCost,
}) {}

export default BdCatalogModuleService
