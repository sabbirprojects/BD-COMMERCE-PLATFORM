import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { toMajor } from "../../../../../../lib/money"
import { BD_CATALOG_MODULE } from "../../../../../../modules/bd-catalog"
import BdCatalogModuleService from "../../../../../../modules/bd-catalog/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const bdCatalogService = req.scope.resolve<BdCatalogModuleService>(BD_CATALOG_MODULE)

  // 1. Get variants for product
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "variants.id", "variants.title", "variants.sku"],
    filters: { id },
  })

  const variants = products?.[0]?.variants || []
  const variantIds = variants.map((v: any) => v.id)

  if (variantIds.length === 0) {
    res.json({ costs: [] })
    return
  }

  // 2. Fetch open costs for variants
  const openCosts = await bdCatalogService.listProductVariantCosts({
    variant_id: variantIds,
    effective_to: null,
  })

  const costByVariantId = new Map<string, any>()
  for (const c of openCosts as any[]) {
    costByVariantId.set(c.variant_id, c)
  }

  const result = variants.map((v: any) => {
    const cost = costByVariantId.get(v.id)
    return {
      variant_id: v.id,
      title: v.title,
      sku: v.sku,
      cost: cost
        ? {
            id: cost.id,
            currency_code: cost.currency_code,
            cogs_paisa: cost.cogs_paisa,
            cogs_bdt: toMajor(cost.cogs_paisa || 0),
            packaging_cost_paisa: cost.packaging_cost_paisa,
            packaging_cost_bdt: toMajor(cost.packaging_cost_paisa || 0),
            estimated_shipping_cost_paisa: cost.estimated_shipping_cost_paisa,
            estimated_shipping_cost_bdt: toMajor(cost.estimated_shipping_cost_paisa || 0),
            supplier_name: cost.supplier_name,
            supplier_sku: cost.supplier_sku,
            minimum_margin_percent: cost.minimum_margin_percent,
            effective_from: cost.effective_from,
            change_reason: cost.change_reason,
          }
        : null,
    }
  })

  res.json({ costs: result })
}
