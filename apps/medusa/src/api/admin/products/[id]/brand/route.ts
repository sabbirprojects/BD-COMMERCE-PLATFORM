import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BD_CATALOG_MODULE } from "../../../../../modules/bd-catalog"
import BdCatalogModuleService from "../../../../../modules/bd-catalog/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const bdCatalogService = req.scope.resolve<BdCatalogModuleService>(BD_CATALOG_MODULE)

  const productBrands = await bdCatalogService.listProductBrands({
    product_id: id,
  })

  if (!productBrands || productBrands.length === 0) {
    res.json({ brand: null })
    return
  }

  const brandId = productBrands[0].brand_id
  const brand = await bdCatalogService.retrieveBrand(brandId).catch(() => null)

  res.json({
    product_brand: productBrands[0],
    brand,
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const body = req.body as { brand_id?: string | null }
  const bdCatalogService = req.scope.resolve<BdCatalogModuleService>(BD_CATALOG_MODULE)

  const existing = await bdCatalogService.listProductBrands({
    product_id: id,
  })

  if (!body.brand_id) {
    if (existing.length > 0) {
      await bdCatalogService.deleteProductBrands(existing.map((pb) => pb.id))
    }
    res.json({ message: "Brand unlinked", brand: null })
    return
  }

  // Verify brand exists
  const brand = await bdCatalogService.retrieveBrand(body.brand_id).catch(() => null)
  if (!brand) {
    res.status(404).json({ message: `Brand with ID ${body.brand_id} not found` })
    return
  }

  let productBrand
  if (existing.length > 0) {
    const updated = await bdCatalogService.updateProductBrands({
      id: existing[0].id,
      brand_id: body.brand_id,
    })
    productBrand = updated
  } else {
    const [created] = await bdCatalogService.createProductBrands([
      {
        product_id: id,
        brand_id: body.brand_id,
      },
    ])
    productBrand = created
  }

  res.json({
    product_brand: productBrand,
    brand,
  })
}
