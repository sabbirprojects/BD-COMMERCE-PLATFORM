/**
 * Meilisearch Allowlist & Confidential Exclusion Constants
 *
 * Enforces CHK-CAT-08: Strict sanitization of product records indexed in Meilisearch
 * to prevent leaking Cost of Goods Sold (COGS), supplier info, and internal margins.
 *
 * Referenced by:
 * - Prompt 05 (Search Allowlist definition)
 * - Prompt 15 (Meilisearch full catalog sync)
 */

export const SEARCH_PUBLIC_FIELDS = [
  "id",
  "title",
  "title_en",
  "title_bn",
  "handle",
  "sku",
  "subtitle",
  "description",
  "description_excerpt",
  "thumbnail",
  "images",
  "status",
  "in_stock",
  "available_quantity",
  "sales_channels",
  "sales_channel_ids",
  "category_id",
  "category_name",
  "category_handle",
  "categories",
  "tags",
  "labels",
  "brand",
  "brand_name",
  "options",
  "option_values",
  "variants",
  "price",
  "price_bdt",
  "sale_price_bdt",
  "original_price_bdt",
  "currency_code",
  "attributes",
  "popularity_score",
  "created_at",
  "updated_at",
] as const

export const EXCLUDED_FIELDS = [
  "cogs_paisa",
  "cogs_unit_paisa",
  "cogs_unit_bdt",
  "cogs_bdt",
  "cogs_total",
  "cost_price",
  "cost_per_unit_paisa",
  "packaging_cost_paisa",
  "estimated_shipping_cost_paisa",
  "supplier_name",
  "supplier_sku",
  "supplier_info",
  "minimum_margin_percent",
  "gross_margin",
  "margin",
  "refund_account",
  "refund_target_account",
  "change_reason",
  "changed_by",
  "origin_note_private",
  "internal_notes",
] as const

export const EXCLUDED_PATTERNS = [
  /^cogs/i,
  /^cost_/i,
  /^supplier/i,
  /^margin/i,
  /_paisa$/i,
] as const

/**
 * Validates whether a field key is permitted in a public search document.
 */
export function isFieldAllowed(key: string): boolean {
  if (EXCLUDED_FIELDS.includes(key as any)) {
    return false
  }
  for (const pattern of EXCLUDED_PATTERNS) {
    if (pattern.test(key)) {
      return false
    }
  }
  return true
}

/**
 * Deeply strips all confidential fields (COGS, margins, supplier data)
 * from a document before it is sent to Meilisearch or a public endpoint.
 */
export function sanitizeSearchDocument<T extends Record<string, any>>(doc: T): Partial<T> {
  if (!doc || typeof doc !== "object") {
    return doc
  }

  if (Array.isArray(doc)) {
    return doc.map((item) => sanitizeSearchDocument(item)) as unknown as Partial<T>
  }

  const clean: Record<string, any> = {}
  for (const [key, value] of Object.entries(doc)) {
    if (!isFieldAllowed(key)) {
      continue
    }

    if (value && typeof value === "object") {
      clean[key] = sanitizeSearchDocument(value)
    } else {
      clean[key] = value
    }
  }

  return clean as Partial<T>
}
