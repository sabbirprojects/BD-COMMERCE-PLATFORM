import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { getProductsIndex } from "../../../../lib/meilisearch"
import { syncAllProductsToMeilisearch } from "../../../../search/meilisearch-indexer"

/**
 * POST /admin/search/sync
 * Triggers a full catalog sync to Meilisearch with allowlist sanitization.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any
    const result = await syncAllProductsToMeilisearch(pg)

    return res.status(200).json({
      success: true,
      message: "Catalog synchronized to Meilisearch successfully",
      total: result.total,
      indexed: result.indexed,
    })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to synchronize catalog to Meilisearch",
    })
  }
}

/**
 * GET /admin/search/sync
 * Returns stats and status of the Meilisearch products index.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const index = getProductsIndex()
    const stats = await index.getStats()
    const settings = await index.getSettings()

    return res.status(200).json({
      success: true,
      index: "products",
      stats,
      settings: {
        searchableAttributes: settings.searchableAttributes,
        filterableAttributes: settings.filterableAttributes,
        sortableAttributes: settings.sortableAttributes,
        synonymsCount: Object.keys(settings.synonyms || {}).length,
      },
    })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to retrieve Meilisearch index status",
    })
  }
}
