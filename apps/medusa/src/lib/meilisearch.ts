import { MeiliSearch } from "meilisearch"

const DEFAULT_HOST = "http://localhost:7700"
const DEFAULT_MASTER_KEY = "cce7abcbac8634457875c50ace74e4f672aa38a60dc378b83512e901015afb1b"

export const PRODUCTS_INDEX_NAME = "products"

/**
 * Searchable attributes in order of weight per architecture.md §8.1:
 * title_en (10), title_bn (9), sku (8), category_name (7), tags (5), description_excerpt (3)
 */
export const SEARCHABLE_ATTRIBUTES = [
  "title_en",
  "title_bn",
  "sku",
  "category_name",
  "tags",
  "description_excerpt",
]

/**
 * Filterable attributes per architecture.md §8.1 and PRD §4.1
 */
export const FILTERABLE_ATTRIBUTES = [
  "id",
  "category_id",
  "category_handle",
  "category_name",
  "status",
  "in_stock",
  "price_bdt",
  "tags",
  "brand",
  "attribute_fabric",
  "attribute_fabric_type",
  "attribute_sleeve_type",
  "attribute_fit_type",
  "attribute_upper_material",
  "attribute_sole_material",
  "attribute_closure_type",
  "attribute_shoe_weight_grams",
  "attribute_is_water_resistant",
  "attribute_packaging_type",
  "attribute_net_weight_grams",
  "attribute_organic_certified",
  "attribute_color",
  "attribute_size",
  "attribute_material",
  "attribute_pattern",
]

/**
 * Sortable attributes per architecture.md §8.1
 */
export const SORTABLE_ATTRIBUTES = ["price_bdt", "created_at", "popularity_score"]

/**
 * Bengali phonetic & Banglish bidirectional synonyms per Scope 5
 */
export const BANGLA_SYNONYMS: Record<string, string[]> = {
  punjabi: ["panjabi", "পাঞ্জাবি"],
  panjabi: ["punjabi", "পাঞ্জাবি"],
  "পাঞ্জাবি": ["punjabi", "panjabi"],
  sharee: ["saree", "শাড়ি"],
  saree: ["sharee", "শাড়ি"],
  "শাড়ি": ["sharee", "saree"],
  lungi: ["লুঙ্গি"],
  "লুঙ্গি": ["lungi"],
  tshirt: ["t-shirt", "টিশার্ট"],
  "t-shirt": ["tshirt", "টিশার্ট"],
  "টিশার্ট": ["tshirt", "t-shirt"],
  shoes: ["shoe", "জুতা", "লোফার", "loafer"],
  shoe: ["shoes", "জুতা", "লোফার", "loafer"],
  "জুতা": ["shoes", "shoe", "লোফার", "loafer"],
  loafer: ["loafers", "লোফার", "জুতা", "shoes"],
  "লোফার": ["loafer", "জুতা", "shoes"],
  "mustard oil": ["sorishar tel", "সরিষার তেল"],
  "sorishar tel": ["mustard oil", "সরিষার তেল"],
  "সরিষার তেল": ["mustard oil", "sorishar tel"],
  khalis: ["khanti", "খাঁটি"],
  khanti: ["khalis", "খাঁটি"],
  "খাঁটি": ["khalis", "khanti"],
  kurti: ["কুর্তি"],
  "কুর্তি": ["kurti"],
  cotton: ["সুতি"],
  "সুতি": ["cotton"],
  leather: ["চামড়া"],
  "চামড়া": ["leather"],
}

let clientInstance: MeiliSearch | null = null

export function getMeilisearchClient(): MeiliSearch {
  if (!clientInstance) {
    const host = process.env.MEILISEARCH_HOST || DEFAULT_HOST
    const apiKey = process.env.MEILI_MASTER_KEY || DEFAULT_MASTER_KEY
    clientInstance = new MeiliSearch({ host, apiKey })
  }
  return clientInstance
}

export function getProductsIndex() {
  const client = getMeilisearchClient()
  return client.index(PRODUCTS_INDEX_NAME)
}

/**
 * Configure Meilisearch products index settings:
 * searchable attributes, filterable attributes, sortable attributes, and synonyms.
 */
export async function setupProductsIndex(): Promise<void> {
  const client = getMeilisearchClient()

  // Ensure index exists
  try {
    await client.getIndex(PRODUCTS_INDEX_NAME)
  } catch {
    const createRes = await client.createIndex(PRODUCTS_INDEX_NAME, { primaryKey: "id" })
    await client.waitForTask(createRes.taskUid)
  }

  const index = client.index(PRODUCTS_INDEX_NAME)

  // Configure settings
  const taskSearchable = await index.updateSearchableAttributes(SEARCHABLE_ATTRIBUTES)
  await client.waitForTask(taskSearchable.taskUid)

  const taskFilterable = await index.updateFilterableAttributes(FILTERABLE_ATTRIBUTES)
  await client.waitForTask(taskFilterable.taskUid)

  const taskSortable = await index.updateSortableAttributes(SORTABLE_ATTRIBUTES)
  await client.waitForTask(taskSortable.taskUid)

  const taskSynonyms = await index.updateSynonyms(BANGLA_SYNONYMS)
  await client.waitForTask(taskSynonyms.taskUid)
}

/**
 * Soft delete handler (D-4 / architecture §8.3):
 * Deletes document by ID directly from index without re-fetching from database.
 */
export async function deleteProductFromIndex(productId: string): Promise<void> {
  const index = getProductsIndex()
  const task = await index.deleteDocument(productId)
  const client = getMeilisearchClient()
  await client.waitForTask(task.taskUid)
}

/**
 * Index sanitized documents into Meilisearch
 */
export async function indexProductDocuments(docs: Record<string, any>[]): Promise<void> {
  if (!docs || docs.length === 0) return
  const index = getProductsIndex()
  const task = await index.addDocuments(docs, { primaryKey: "id" })
  const client = getMeilisearchClient()
  await client.waitForTask(task.taskUid)
}
