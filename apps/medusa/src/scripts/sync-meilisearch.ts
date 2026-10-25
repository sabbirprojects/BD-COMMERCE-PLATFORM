/**
 * Meilisearch Full Catalog Indexing Script
 *
 * Runs full synchronization of all catalog products into Meilisearch:
 * - Creates/configures `products` index settings (searchable, filterable, sortable, synonyms)
 * - Fetches products, variants, Bengali translations, and dynamic category attributes
 * - Applies CHK-CAT-08 strict allowlist sanitization (strips all COGS, margins, supplier data)
 * - Batch uploads sanitized documents into Meilisearch
 *
 * Usage:
 *   medusa exec ./src/scripts/sync-meilisearch.ts
 */
import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { syncAllProductsToMeilisearch } from "../search/meilisearch-indexer"

export default async function syncMeilisearch({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as any
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any

  logger.info("[Meilisearch Sync] Starting full catalog indexing...")

  try {
    const result = await syncAllProductsToMeilisearch(pg)
    logger.info(
      `[Meilisearch Sync] Completed successfully! Indexed ${result.indexed} of ${result.total} total products.`
    )
  } catch (error) {
    logger.error("[Meilisearch Sync] Failed to synchronize catalog:", error)
    throw error
  }
}
