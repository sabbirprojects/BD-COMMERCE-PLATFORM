import { MeiliSearch } from 'meilisearch'

const MEILISEARCH_HOST = process.env.NEXT_PUBLIC_MEILISEARCH_HOST || 'http://localhost:7700'
const MEILISEARCH_SEARCH_KEY =
  process.env.NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY ||
  'c6f47a388d3d9b6b5efaa2c07d9ab70a1e8a76608fa7b426f79e95e30ab0d98b'

let searchClient: MeiliSearch | null = null

export function getStorefrontSearchClient(): MeiliSearch {
  if (!searchClient) {
    searchClient = new MeiliSearch({
      host: MEILISEARCH_HOST,
      apiKey: MEILISEARCH_SEARCH_KEY,
    })
  }
  return searchClient
}

export interface StorefrontSearchHit {
  id: string
  title: string
  title_en: string
  title_bn: string
  handle: string
  sku: string
  description: string
  description_excerpt: string
  thumbnail: string | null
  status: string
  in_stock: boolean
  available_quantity: number
  price_bdt: number
  original_price_bdt: number
  category_id: string | null
  category_name: string | null
  category_handle: string | null
  tags: string[]
  popularity_score: number
  created_at: number
  [key: string]: any
}

export interface SearchProductsOptions {
  query?: string
  categoryHandle?: string
  inStockOnly?: boolean
  minPrice?: number
  maxPrice?: number
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popularity'
  dynamicFilters?: Record<string, string>
  page?: number
  pageSize?: number
  facets?: string[]
}

export interface StorefrontSearchResult {
  hits: StorefrontSearchHit[]
  totalHits: number
  totalPages: number
  page: number
  pageSize: number
  facetDistribution: Record<string, Record<string, number>>
}

/**
 * Executes a customer-facing product search with facets and filters
 * using the public search-only key.
 */
export async function searchStorefrontProducts(
  options: SearchProductsOptions = {}
): Promise<StorefrontSearchResult> {
  const {
    query = '',
    categoryHandle,
    inStockOnly,
    minPrice,
    maxPrice,
    sortBy,
    dynamicFilters = {},
    page = 1,
    pageSize = 12,
    facets = [
      'category_name',
      'category_handle',
      'in_stock',
      'attribute_fabric_type',
      'attribute_sleeve_type',
      'attribute_fit_type',
      'attribute_upper_material',
      'attribute_sole_material',
      'attribute_packaging_type',
    ],
  } = options

  const client = getStorefrontSearchClient()
  const index = client.index('products')

  // Build filter array
  const filterParts: string[] = ['status = "published"']

  if (categoryHandle) {
    filterParts.push(`category_handle = "${categoryHandle}"`)
  }

  if (inStockOnly) {
    filterParts.push('in_stock = true')
  }

  if (typeof minPrice === 'number' && minPrice > 0) {
    filterParts.push(`price_bdt >= ${minPrice}`)
  }

  if (typeof maxPrice === 'number' && maxPrice > 0) {
    filterParts.push(`price_bdt <= ${maxPrice}`)
  }

  // Dynamic attribute filters (attribute_{code} = "value")
  for (const [key, val] of Object.entries(dynamicFilters)) {
    if (val) {
      filterParts.push(`${key} = "${val}"`)
    }
  }

  // Build sort array
  const sort: string[] = []
  if (sortBy === 'price_asc') {
    sort.push('price_bdt:asc')
  } else if (sortBy === 'price_desc') {
    sort.push('price_bdt:desc')
  } else if (sortBy === 'newest') {
    sort.push('created_at:desc')
  } else if (sortBy === 'popularity') {
    sort.push('popularity_score:desc')
  }

  const offset = (Math.max(1, page) - 1) * pageSize

  const searchRes = await index.search(query, {
    filter: filterParts.length > 0 ? filterParts.join(' AND ') : undefined,
    sort: sort.length > 0 ? sort : undefined,
    facets,
    limit: pageSize,
    offset,
  })

  const totalHits = searchRes.estimatedTotalHits || 0
  const totalPages = Math.ceil(totalHits / pageSize) || 1

  return {
    hits: (searchRes.hits || []) as StorefrontSearchHit[],
    totalHits,
    totalPages,
    page,
    pageSize,
    facetDistribution: searchRes.facetDistribution || {},
  }
}
