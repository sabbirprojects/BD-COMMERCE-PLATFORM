import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BD_CATALOG_MODULE } from "../../../modules/bd-catalog"
import BdCatalogModuleService from "../../../modules/bd-catalog/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const bdCatalogService = req.scope.resolve<BdCatalogModuleService>(BD_CATALOG_MODULE)

  const filters: Record<string, any> = {}
  if (req.query.is_active !== undefined) {
    filters.is_active = req.query.is_active === "true"
  }

  const brands = await bdCatalogService.listBrands(filters, {
    order: { sort_order: "ASC", name_en: "ASC" },
  })

  res.json({ brands })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const bdCatalogService = req.scope.resolve<BdCatalogModuleService>(BD_CATALOG_MODULE)
  const body = req.body as {
    name_en?: string
    name_bn?: string
    slug?: string
    logo_key?: string
    logo_url?: string
    description_en?: string
    description_bn?: string
    is_active?: boolean
    sort_order?: number
  }

  if (!body.name_en || typeof body.name_en !== "string") {
    res.status(400).json({
      message: "name_en is required and must be a string",
    })
    return
  }

  const slug =
    body.slug && typeof body.slug === "string"
      ? body.slug
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      : body.name_en
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")

  const [brand] = await bdCatalogService.createBrands([
    {
      name_en: body.name_en.trim(),
      name_bn: body.name_bn?.trim() || null,
      slug,
      logo_key: body.logo_key || body.logo_url || null,
      description_en: body.description_en || null,
      description_bn: body.description_bn || null,
      is_active: body.is_active ?? true,
      sort_order: body.sort_order ?? 0,
    },
  ])

  res.status(201).json({ brand })
}
