import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { deleteProductFromIndex } from "../lib/meilisearch"
import { syncProductToMeilisearch } from "../search/meilisearch-indexer"

/**
 * Meilisearch Product Synchronization Subscriber
 *
 * Implements Prompt 15 & Architecture §8.3 (D-4):
 * - On product.created / product.updated: fetches product with translations & category attributes,
 *   applies allowlist sanitization (CHK-CAT-08), and upserts document to Meilisearch.
 * - On product.deleted: extracts product ID directly from event payload and immediately calls
 *   DELETE /indexes/products/documents/{id} WITHOUT re-fetching from database.
 */
export default async function meilisearchProductSyncSubscriber({
  event: { name, data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const productId = data?.id
  if (!productId) {
    return
  }

  // Soft-Delete Handling (D-4): Never re-fetch from database on delete event
  if (name === "product.deleted") {
    try {
      await deleteProductFromIndex(productId)
      console.log(`[Meilisearch] Product ${productId} removed from index (no re-fetch)`)
    } catch (err) {
      console.error(`[Meilisearch] Error deleting product ${productId} from index:`, err)
    }
    return
  }

  // Product created or updated: sanitize and synchronize
  try {
    const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any
    await syncProductToMeilisearch(pg, productId)
    console.log(`[Meilisearch] Product ${productId} synchronized to index`)
  } catch (err) {
    console.error(`[Meilisearch] Error syncing product ${productId} to index:`, err)
  }
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated", "product.deleted"],
}
