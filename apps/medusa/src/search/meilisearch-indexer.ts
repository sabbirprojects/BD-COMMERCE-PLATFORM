import { sanitizeSearchDocument } from "./allowlist"
import {
  deleteProductFromIndex,
  indexProductDocuments,
  setupProductsIndex,
} from "../lib/meilisearch"

export interface SearchProductDocument {
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

/**
 * Builds a sanitized, customer-facing search document for Meilisearch.
 * Strictly strips confidential COGS, margins, and supplier data (CHK-CAT-08).
 */
export async function buildProductSearchDocument(
  pg: any,
  productId: string
): Promise<SearchProductDocument | null> {
  // 1. Fetch core product
  const prodRes = await pg.raw(
    `SELECT id, title, handle, description, thumbnail, status, created_at, deleted_at 
     FROM product 
     WHERE id = ? LIMIT 1`,
    [productId]
  )
  const product = prodRes.rows?.[0]
  if (!product || product.deleted_at) {
    return null
  }

  // 2. Fetch Bengali translations from core translation and bd_catalog product_localization
  let titleBn = product.title
  let excerptBn = ""

  try {
    const trRes = await pg.raw(
      `SELECT translations 
       FROM translation 
       WHERE reference_id = ? AND reference = 'product' AND locale_code = 'bn' AND deleted_at IS NULL 
       LIMIT 1`,
      [productId]
    )
    if (trRes.rows?.[0]?.translations?.title) {
      titleBn = trRes.rows[0].translations.title
    }
  } catch {
    // Translation table lookup optional
  }

  try {
    const plRes = await pg.raw(
      `SELECT description_excerpt_bn, meta_title_bn 
       FROM product_localization 
       WHERE product_id = ? AND deleted_at IS NULL 
       LIMIT 1`,
      [productId]
    )
    if (plRes.rows?.[0]) {
      const pl = plRes.rows[0]
      if (pl.meta_title_bn && !titleBn) {
        titleBn = pl.meta_title_bn
      }
      if (pl.description_excerpt_bn) {
        excerptBn = pl.description_excerpt_bn
      }
    }
  } catch {
    // Product localization lookup optional
  }

  // 3. Fetch Category
  let categoryId: string | null = null
  let categoryName: string | null = null
  let categoryHandle: string | null = null

  try {
    const catRes = await pg.raw(
      `SELECT pc.id, pc.name, pc.handle 
       FROM product_category pc 
       JOIN product_category_product pcp ON pc.id = pcp.product_category_id 
       WHERE pcp.product_id = ? AND pc.deleted_at IS NULL 
       LIMIT 1`,
      [productId]
    )
    if (catRes.rows?.[0]) {
      categoryId = catRes.rows[0].id
      categoryName = catRes.rows[0].name
      categoryHandle = catRes.rows[0].handle
    }
  } catch {
    // Category lookup optional
  }

  // 4. Fetch Dynamic Attributes (GAP-16)
  const dynamicAttributes: Record<string, any> = {}
  try {
    const attrRes = await pg.raw(
      `SELECT ca.code, ca.input_type, pav.value_text, pav.value_number, pav.value_boolean 
       FROM product_attribute_value pav 
       JOIN category_attribute ca ON pav.category_attribute_id = ca.id 
       WHERE pav.product_id = ? AND pav.deleted_at IS NULL`,
      [productId]
    )
    for (const attr of attrRes.rows || []) {
      const key = `attribute_${attr.code}`
      if (attr.value_text !== null && attr.value_text !== undefined) {
        dynamicAttributes[key] = attr.value_text
      } else if (attr.value_number !== null && attr.value_number !== undefined) {
        dynamicAttributes[key] = Number(attr.value_number)
      } else if (attr.value_boolean !== null && attr.value_boolean !== undefined) {
        dynamicAttributes[key] = Boolean(attr.value_boolean)
      }
    }
  } catch {
    // Attributes lookup optional
  }

  // 5. Fetch Variants, SKUs, and Prices
  let lowestPriceBdt = 0
  let primarySku = ""
  const skus: string[] = []
  const variantIds: string[] = []

  try {
    const varRes = await pg.raw(
      `SELECT pv.id as variant_id, pv.title, pv.sku, p.amount 
       FROM product_variant pv 
       LEFT JOIN product_variant_price_set pvps ON pv.id = pvps.variant_id 
       LEFT JOIN price_set ps ON pvps.price_set_id = ps.id 
       LEFT JOIN price p ON ps.id = p.price_set_id AND (p.currency_code = 'bdt' OR p.currency_code IS NULL) 
       WHERE pv.product_id = ? AND pv.deleted_at IS NULL`,
      [productId]
    )

    let foundPrice = false
    for (const v of varRes.rows || []) {
      variantIds.push(v.variant_id)
      if (v.sku) {
        skus.push(v.sku)
        if (!primarySku) primarySku = v.sku
      }
      if (v.amount !== null && v.amount !== undefined) {
        const amt = Number(v.amount)
        if (!foundPrice || amt < lowestPriceBdt) {
          lowestPriceBdt = amt
          foundPrice = true
        }
      }
    }
  } catch {
    // Variants lookup optional
  }

  // 6. Fetch Inventory Quantities
  let totalAvailable = 0
  if (variantIds.length > 0) {
    try {
      const invRes = await pg.raw(
        `SELECT pvii.variant_id, 
                COALESCE(il.stocked_quantity, 0) as stocked_quantity, 
                COALESCE(il.reserved_quantity, 0) as reserved_quantity 
         FROM product_variant_inventory_item pvii 
         JOIN inventory_level il ON pvii.inventory_item_id = il.inventory_item_id 
         WHERE pvii.variant_id = ANY(?)`,
        [variantIds]
      )
      for (const inv of invRes.rows || []) {
        const available = Math.max(0, Number(inv.stocked_quantity) - Number(inv.reserved_quantity))
        totalAvailable += available
      }
    } catch {
      totalAvailable = 0
    }
  }

  const inStock = totalAvailable > 0

  // 7. Fetch Tags
  const tags: string[] = []
  try {
    const tagRes = await pg.raw(
      `SELECT pt.value 
       FROM product_tag pt 
       JOIN product_tags ptp ON pt.id = ptp.product_tag_id 
       WHERE ptp.product_id = ? AND pt.deleted_at IS NULL`,
      [productId]
    )
    for (const t of tagRes.rows || []) {
      if (t.value) tags.push(t.value)
    }
  } catch {
    // Tag lookup optional
  }

  const descExcerpt = excerptBn || (product.description ? product.description.slice(0, 200) : "")

  // Build customer-facing document
  const rawDocument: Record<string, any> = {
    id: product.id,
    title: product.title,
    title_en: product.title,
    title_bn: titleBn,
    handle: product.handle,
    sku: skus.length > 0 ? skus.join(", ") : primarySku,
    description: product.description || "",
    description_excerpt: descExcerpt,
    thumbnail: product.thumbnail || null,
    status: product.status,
    in_stock: inStock,
    available_quantity: totalAvailable,
    price_bdt: lowestPriceBdt,
    original_price_bdt: lowestPriceBdt,
    category_id: categoryId,
    category_name: categoryName,
    category_handle: categoryHandle,
    tags,
    popularity_score: 0,
    created_at: product.created_at ? Math.floor(new Date(product.created_at).getTime() / 1000) : 0,
    ...dynamicAttributes,
  }

  // Pass through strict sanitizeSearchDocument to ensure CHK-CAT-08 compliance
  return sanitizeSearchDocument(rawDocument) as SearchProductDocument
}

/**
 * Synchronize a single product to Meilisearch by product ID.
 * If product is soft-deleted or non-existent, deletes it from index.
 */
export async function syncProductToMeilisearch(pg: any, productId: string): Promise<void> {
  const doc = await buildProductSearchDocument(pg, productId)
  if (!doc) {
    await deleteProductFromIndex(productId)
    return
  }
  await indexProductDocuments([doc])
}

/**
 * Full catalog synchronization to Meilisearch.
 */
export async function syncAllProductsToMeilisearch(pg: any): Promise<{ total: number; indexed: number }> {
  await setupProductsIndex()

  const prodsRes = await pg.raw(`SELECT id FROM product WHERE deleted_at IS NULL ORDER BY created_at ASC`)
  const products = prodsRes.rows || []

  const docs: SearchProductDocument[] = []
  for (const p of products) {
    const doc = await buildProductSearchDocument(pg, p.id)
    if (doc) {
      docs.push(doc)
    }
  }

  if (docs.length > 0) {
    await indexProductDocuments(docs)
  }

  return { total: products.length, indexed: docs.length }
}
