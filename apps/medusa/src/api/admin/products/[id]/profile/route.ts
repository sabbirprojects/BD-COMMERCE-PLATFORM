import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BD_CATALOG_MODULE } from "../../../../../modules/bd-catalog"
import BdCatalogModuleService from "../../../../../modules/bd-catalog/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const bdCatalogService = req.scope.resolve<BdCatalogModuleService>(BD_CATALOG_MODULE)

  const profiles = await bdCatalogService.listProductBdProfiles({ product_id: id })
  const profile = profiles?.[0] || null

  res.json({ profile })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const body = req.body as {
    primary_category_id?: string | null
    is_returnable?: boolean
    return_policy_id?: string | null
    warranty_note_en?: string | null
    warranty_note_bn?: string | null
    origin_note_en?: string | null
    origin_note_bn?: string | null
    country_of_origin?: string | null
    hs_code?: string | null
    is_cod_allowed?: boolean
    min_order_qty?: number | null
    max_order_qty?: number | null
  }

  const bdCatalogService = req.scope.resolve<BdCatalogModuleService>(BD_CATALOG_MODULE)

  const existing = await bdCatalogService.listProductBdProfiles({ product_id: id })
  const actorId = (req as any).user?.id || (req as any).auth_context?.actor_id || "admin"

  let profile: any
  if (existing && existing.length > 0) {
    profile = await bdCatalogService.updateProductBdProfiles({
      id: existing[0].id,
      primary_category_id: body.primary_category_id !== undefined ? body.primary_category_id : existing[0].primary_category_id,
      is_returnable: body.is_returnable !== undefined ? body.is_returnable : existing[0].is_returnable,
      return_policy_id: body.return_policy_id !== undefined ? body.return_policy_id : existing[0].return_policy_id,
      warranty_note_en: body.warranty_note_en !== undefined ? body.warranty_note_en : existing[0].warranty_note_en,
      warranty_note_bn: body.warranty_note_bn !== undefined ? body.warranty_note_bn : existing[0].warranty_note_bn,
      origin_note_en: body.origin_note_en !== undefined ? body.origin_note_en : existing[0].origin_note_en,
      origin_note_bn: body.origin_note_bn !== undefined ? body.origin_note_bn : existing[0].origin_note_bn,
      country_of_origin: body.country_of_origin !== undefined ? body.country_of_origin : existing[0].country_of_origin,
      hs_code: body.hs_code !== undefined ? body.hs_code : existing[0].hs_code,
      is_cod_allowed: body.is_cod_allowed !== undefined ? body.is_cod_allowed : existing[0].is_cod_allowed,
      min_order_qty: body.min_order_qty !== undefined ? body.min_order_qty : existing[0].min_order_qty,
      max_order_qty: body.max_order_qty !== undefined ? body.max_order_qty : existing[0].max_order_qty,
      updated_by: actorId,
    })
  } else {
    const [created] = await bdCatalogService.createProductBdProfiles([
      {
        product_id: id,
        primary_category_id: body.primary_category_id || null,
        is_returnable: body.is_returnable ?? true,
        return_policy_id: body.return_policy_id || null,
        warranty_note_en: body.warranty_note_en || null,
        warranty_note_bn: body.warranty_note_bn || null,
        origin_note_en: body.origin_note_en || null,
        origin_note_bn: body.origin_note_bn || null,
        country_of_origin: body.country_of_origin || "BD",
        hs_code: body.hs_code || null,
        is_cod_allowed: body.is_cod_allowed ?? true,
        min_order_qty: body.min_order_qty || null,
        max_order_qty: body.max_order_qty || null,
        created_by: actorId,
        updated_by: actorId,
      },
    ])
    profile = created
  }

  res.json({ profile })
}
