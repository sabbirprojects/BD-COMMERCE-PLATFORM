import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { toPaisa, toMajor } from "../../../../../../../lib/money"
import { BD_CATALOG_MODULE } from "../../../../../../../modules/bd-catalog"
import BdCatalogModuleService from "../../../../../../../modules/bd-catalog/service"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { variant_id } = req.params
  const body = req.body as {
    cogs_bdt?: number | string
    cogs_paisa?: number
    packaging_cost_bdt?: number | string
    packaging_cost_paisa?: number
    estimated_shipping_cost_bdt?: number | string
    estimated_shipping_cost_paisa?: number
    supplier_name?: string | null
    supplier_sku?: string | null
    minimum_margin_percent?: number
    change_reason?: string | null
  }

  const bdCatalogService = req.scope.resolve<BdCatalogModuleService>(BD_CATALOG_MODULE)
  const actorId = (req as any).user?.id || (req as any).auth_context?.actor_id || "admin"

  // Convert BDT amounts to integer paisa via canonical money boundary
  const cogsPaisa = body.cogs_paisa !== undefined
    ? Number(body.cogs_paisa)
    : body.cogs_bdt !== undefined
      ? toPaisa(body.cogs_bdt)
      : 0

  const packagingPaisa = body.packaging_cost_paisa !== undefined
    ? Number(body.packaging_cost_paisa)
    : body.packaging_cost_bdt !== undefined
      ? toPaisa(body.packaging_cost_bdt)
      : 0

  const estimatedShippingPaisa = body.estimated_shipping_cost_paisa !== undefined
    ? Number(body.estimated_shipping_cost_paisa)
    : body.estimated_shipping_cost_bdt !== undefined
      ? toPaisa(body.estimated_shipping_cost_bdt)
      : 0

  // 1. Close existing open cost records for this variant
  const existingOpen = await bdCatalogService.listProductVariantCosts({
    variant_id,
    effective_to: null,
  })

  const now = new Date()
  for (const c of existingOpen as any[]) {
    await bdCatalogService.updateProductVariantCosts({
      id: c.id,
      effective_to: now,
    })
  }

  // 2. Insert new open effective-dated cost record
  const [created] = await bdCatalogService.createProductVariantCosts([
    {
      variant_id,
      currency_code: "bdt",
      cogs_paisa: cogsPaisa,
      packaging_cost_paisa: packagingPaisa,
      estimated_shipping_cost_paisa: estimatedShippingPaisa,
      supplier_name: body.supplier_name || null,
      supplier_sku: body.supplier_sku || null,
      minimum_margin_percent: body.minimum_margin_percent ?? 20,
      effective_from: now,
      effective_to: null,
      change_reason: body.change_reason || null,
      changed_by: actorId,
    },
  ])

  res.status(201).json({
    cost: {
      id: created.id,
      variant_id: created.variant_id,
      cogs_paisa: created.cogs_paisa,
      cogs_bdt: toMajor(created.cogs_paisa || 0),
      packaging_cost_paisa: created.packaging_cost_paisa,
      packaging_cost_bdt: toMajor(created.packaging_cost_paisa || 0),
      estimated_shipping_cost_paisa: created.estimated_shipping_cost_paisa,
      supplier_name: created.supplier_name,
      supplier_sku: created.supplier_sku,
      minimum_margin_percent: created.minimum_margin_percent,
      effective_from: created.effective_from,
      change_reason: created.change_reason,
    },
  })
}
