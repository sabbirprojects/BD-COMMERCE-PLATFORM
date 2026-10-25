import Medusa from '@medusajs/js-sdk'

const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  'http://localhost:9000'

const MEDUSA_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
  'pk_e03efb8523c1542172c95fe34dc90955a3389f3ee3592faa16171966d4699096'

export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: process.env.NODE_ENV === 'development',
  publishableKey: MEDUSA_PUBLISHABLE_KEY,
})

export interface StorePrice {
  id?: string
  currency_code: string
  amount: number
  price_list_id?: string | null
}

export interface StoreVariantOptionValue {
  id?: string
  value: string
  option_id?: string
}

export interface StoreVariant {
  id: string
  title: string
  sku?: string | null
  barcode?: string | null
  manage_inventory?: boolean
  allow_backorder?: boolean
  inventory_quantity?: number
  options?: StoreVariantOptionValue[]
  prices?: StorePrice[]
  calculated_price?: {
    calculated_amount: number
    original_amount: number
    currency_code: string
    is_calculated_price_price_list?: boolean
  }
}

export interface StoreOption {
  id: string
  title: string
  values?: { id: string; value: string }[]
}

export interface StoreCategory {
  id: string
  name: string
  handle: string
  description?: string | null
  parent_category_id?: string | null
  category_children?: StoreCategory[]
}

export interface StoreImage {
  id: string
  url: string
}

export interface StoreProduct {
  id: string
  title: string
  handle: string
  subtitle?: string | null
  description?: string | null
  thumbnail?: string | null
  images?: StoreImage[]
  categories?: StoreCategory[]
  options?: StoreOption[]
  variants?: StoreVariant[]
  status?: string
}

export interface ProductAttributeItem {
  code: string
  name_en: string
  name_bn: string
  input_type: 'text' | 'number' | 'enum' | 'boolean'
  unit?: string | null
  value: any
  label_en?: string | null
  label_bn?: string | null
}

export interface ProductBdBrand {
  id: string
  name_en: string
  name_bn?: string | null
  slug: string
  description_en?: string | null
  description_bn?: string | null
}

export interface ProductBdProfileData {
  is_returnable: boolean
  warranty_note_en?: string | null
  warranty_note_bn?: string | null
  origin_note_en?: string | null
  origin_note_bn?: string | null
  country_of_origin?: string | null
  is_cod_allowed: boolean
}

export interface ProductLocalizationData {
  product_id: string
  brand?: ProductBdBrand | null
  profile?: ProductBdProfileData | null
  localization?: {
    care_instructions_bn?: string | null
    origin_country_bn?: string | null
    description_excerpt_bn?: string | null
    meta_title_bn?: string | null
    meta_description_bn?: string | null
    handle_bn?: string | null
    is_reviewed?: boolean
  } | null
  translation_bn?: {
    title?: string | null
    description?: string | null
  } | null
  attributes?: ProductAttributeItem[]
}

/**
 * Fetch products from Medusa Store API.
 * Never throws on API errors; returns safe defaults.
 */
export async function getStoreProducts(params?: {
  limit?: number
  offset?: number
  category_id?: string[]
}): Promise<{ products: StoreProduct[]; count: number }> {
  try {
    const res = await sdk.store.product.list({
      limit: params?.limit ?? 20,
      offset: params?.offset ?? 0,
      category_id: params?.category_id,
      fields: '*variants,*variants.prices,*categories,*images,*options,*options.values',
    })
    return {
      products: (res.products as unknown as StoreProduct[]) || [],
      count: res.count ?? res.products?.length ?? 0,
    }
  } catch (err) {
    console.error('[Medusa Store API] Failed to list products:', err)
    return { products: [], count: 0 }
  }
}

/**
 * Fetch single product by handle from Medusa Store API.
 */
export async function getStoreProductByHandle(handle: string): Promise<StoreProduct | null> {
  try {
    const res = await sdk.store.product.list({
      handle,
      limit: 1,
      fields: '*variants,*variants.prices,*categories,*images,*options,*options.values',
    })
    return (res.products?.[0] as unknown as StoreProduct) || null
  } catch (err) {
    console.error(`[Medusa Store API] Failed to retrieve product (${handle}):`, err)
    return null
  }
}

/**
 * Fetch categories from Medusa Store API.
 */
export async function getStoreCategories(): Promise<StoreCategory[]> {
  try {
    const res = await sdk.store.category.list({
      limit: 50,
      fields: '*category_children',
    })
    return (res.product_categories as unknown as StoreCategory[]) || []
  } catch (err) {
    console.error('[Medusa Store API] Failed to list categories:', err)
    return []
  }
}

/**
 * Fetch single category by handle from Medusa Store API.
 */
export async function getStoreCategoryByHandle(handle: string): Promise<StoreCategory | null> {
  try {
    const res = await sdk.store.category.list({
      handle,
      limit: 1,
    })
    return (res.product_categories?.[0] as unknown as StoreCategory) || null
  } catch (err) {
    console.error(`[Medusa Store API] Failed to retrieve category (${handle}):`, err)
    return null
  }
}

/**
 * Fetch customer-facing Bangladesh product localization and category attributes.
 * Calls: GET /store/products/:id/localization
 * Never exposes COGS, supplier info, or internal margins.
 */
export async function getStoreProductLocalization(
  productId: string
): Promise<ProductLocalizationData | null> {
  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/store/products/${productId}/localization`, {
      headers: {
        'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY,
      },
      next: { revalidate: 30 },
    })

    if (!res.ok) {
      if (res.status === 404) return null
      console.warn(`[Localization API] HTTP ${res.status} for product ${productId}`)
      return null
    }

    return (await res.json()) as ProductLocalizationData
  } catch (err) {
    console.error(`[Localization API] Fetch failed for product ${productId}:`, err)
    return null
  }
}

/**
 * Extracts BDT regular and sale prices from a variant.
 */
export function getVariantPricing(variant?: StoreVariant | null): {
  price: number
  salePrice: number | null
  hasSale: boolean
  discountPercent: number
} {
  if (!variant?.prices || variant.prices.length === 0) {
    return { price: 0, salePrice: null, hasSale: false, discountPercent: 0 }
  }

  // Find BDT prices
  const bdtPrices = variant.prices.filter(
    (p) => p.currency_code?.toLowerCase() === 'bdt'
  )

  if (bdtPrices.length === 0) {
    const defaultPrice = variant.prices[0]?.amount || 0
    return { price: defaultPrice, salePrice: null, hasSale: false, discountPercent: 0 }
  }

  // Check if calculated_price has sale info
  if (variant.calculated_price) {
    const calc = variant.calculated_price.calculated_amount
    const orig = variant.calculated_price.original_amount
    if (orig && calc && orig > calc) {
      const discount = Math.round(((orig - calc) / orig) * 100)
      return {
        price: orig,
        salePrice: calc,
        hasSale: true,
        discountPercent: discount,
      }
    }
  }

  // Fallback: check price_list_id (sale price list vs base price)
  const basePriceObj = bdtPrices.find((p) => !p.price_list_id) || bdtPrices[0]
  const salePriceObj = bdtPrices.find((p) => !!p.price_list_id)

  const regularPrice = basePriceObj?.amount || 0
  const salePrice = salePriceObj?.amount || null

  if (salePrice && salePrice < regularPrice) {
    const discount = Math.round(((regularPrice - salePrice) / regularPrice) * 100)
    return {
      price: regularPrice,
      salePrice,
      hasSale: true,
      discountPercent: discount,
    }
  }

  return {
    price: regularPrice,
    salePrice: null,
    hasSale: false,
    discountPercent: 0,
  }
}

export interface StoreCartLineItem {
  id: string
  title: string
  subtitle?: string | null
  thumbnail?: string | null
  quantity: number
  unit_price: number
  compare_at_unit_price?: number | null
  variant_id: string
  product_id?: string
  product_title?: string
  product_handle?: string
  variant_sku?: string | null
  variant_title?: string | null
  total?: number
  subtotal?: number
  product?: {
    id: string
    title?: string
    thumbnail?: string | null
    handle?: string
  }
}

export interface StoreCart {
  id: string
  currency_code: string
  region_id?: string
  items: StoreCartLineItem[]
  total: number
  subtotal: number
  item_total: number
  item_subtotal: number
  shipping_total?: number
  tax_total?: number
  discount_total?: number
  completed_at?: string | null
  metadata?: Record<string, any> | null
}

export async function createMedusaCart(
  regionId: string = 'reg_01M5P357HTK2C9VK295D0K8BZ0'
): Promise<StoreCart> {
  const res = await sdk.store.cart.create({ region_id: regionId })
  return res.cart as unknown as StoreCart
}

export async function getMedusaCart(cartId: string): Promise<StoreCart | null> {
  try {
    const res = await sdk.store.cart.retrieve(cartId)
    if (res.cart?.completed_at) return null
    return res.cart as unknown as StoreCart
  } catch {
    return null
  }
}

export async function addMedusaCartLineItem(
  cartId: string,
  input: { variant_id: string; quantity: number },
  idempotencyKey?: string
): Promise<StoreCart> {
  const headers = idempotencyKey ? { 'x-idempotency-key': idempotencyKey } : undefined
  const res = await sdk.store.cart.createLineItem(cartId, input, {}, headers)
  return res.cart as unknown as StoreCart
}

export async function updateMedusaCartLineItem(
  cartId: string,
  lineId: string,
  input: { quantity: number },
  idempotencyKey?: string
): Promise<StoreCart> {
  const headers = idempotencyKey ? { 'x-idempotency-key': idempotencyKey } : undefined
  const res = await sdk.store.cart.updateLineItem(cartId, lineId, input, {}, headers)
  return res.cart as unknown as StoreCart
}

export async function deleteMedusaCartLineItem(
  cartId: string,
  lineId: string,
  idempotencyKey?: string
): Promise<StoreCart | null> {
  const headers = idempotencyKey ? { 'x-idempotency-key': idempotencyKey } : undefined
  const res = await sdk.store.cart.deleteLineItem(cartId, lineId, {}, headers)
  return (res.parent as unknown as StoreCart) || null
}

export interface GeoDivision {
  code: string
  name_en: string
  name_bn: string
  sort_order: number
}

export interface GeoDistrict {
  code: string
  division_code: string
  name_en: string
  name_bn: string
}

export interface GeoThana {
  code: string
  district_code: string
  name_en: string
  name_bn: string
  postal_codes?: string[] | null
}

export interface GeoDataResponse {
  divisions: GeoDivision[]
  districts: GeoDistrict[]
  thanas: GeoThana[]
}

export interface GeoDeliveryZone {
  code: string
  name_en: string
  name_bn: string
  shipping_option_id: string
  amount: number
  currency_code: string
  cod_enabled: boolean
  delivery_days_min?: number | null
  delivery_days_max?: number | null
  cod_handling_fee_paisa?: number
}

export interface CartPriceChange {
  line_id: string
  variant_id: string
  title: string
  old_unit_price: number
  new_unit_price: number
}

export interface CartStockIssue {
  line_id: string
  variant_id: string
  title: string
  requested_quantity: number
  available_quantity: number
  is_out_of_stock: boolean
}

export interface CartValidationResult {
  valid: boolean
  message?: string
  empty_cart?: boolean
  has_price_change?: boolean
  has_stock_issue?: boolean
  price_changes?: CartPriceChange[]
  stock_issues?: CartStockIssue[]
}

/**
 * Fetch Bangladesh administrative geography data from Medusa Store API.
 */
export async function getMedusaGeoData(
  divisionCode?: string,
  districtCode?: string
): Promise<GeoDataResponse> {
  try {
    const params = new URLSearchParams()
    if (divisionCode) params.set('division_code', divisionCode)
    if (districtCode) params.set('district_code', districtCode)

    const url = `${MEDUSA_BACKEND_URL}/store/geo${params.toString() ? `?${params.toString()}` : ''}`
    const res = await fetch(url, {
      headers: {
        'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY,
      },
      next: { revalidate: 3600 }, // Cached for 1 hour
    })

    if (!res.ok) {
      throw new Error(`Geo fetch failed with status ${res.status}`)
    }
    const data = await res.json()
    return {
      divisions: data.divisions || [],
      districts: data.districts || [],
      thanas: data.thanas || [],
    }
  } catch (err) {
    console.error('[Medusa Store API] Failed to fetch geo data:', err)
    return { divisions: [], districts: [], thanas: [] }
  }
}

/**
 * Resolve delivery zone and shipping option for a district code from Medusa Store API.
 */
export async function getMedusaDeliveryZone(
  districtCode: string
): Promise<GeoDeliveryZone | null> {
  try {
    const url = `${MEDUSA_BACKEND_URL}/store/geo/zone?district_code=${encodeURIComponent(districtCode)}`
    const res = await fetch(url, {
      headers: {
        'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY,
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      return null
    }

    const data = await res.json()
    return data.delivery_zone || null
  } catch (err) {
    console.error(`[Medusa Store API] Failed to resolve zone for district ${districtCode}:`, err)
    return null
  }
}

/**
 * Update cart shipping address and metadata on Medusa cart.
 */
export async function updateMedusaCartAddress(
  cartId: string,
  shippingAddress: {
    first_name: string
    last_name?: string
    phone: string
    address_1: string
    city?: string
    province?: string
    postal_code?: string
    country_code?: string
  },
  metadata?: Record<string, any>,
  idempotencyKey?: string
): Promise<StoreCart> {
  const headers = idempotencyKey ? { 'x-idempotency-key': idempotencyKey } : undefined
  const payload: any = {
    shipping_address: {
      ...shippingAddress,
      country_code: 'bd',
    },
  }
  if (metadata) {
    payload.metadata = metadata
  }

  const res = await sdk.store.cart.update(cartId, payload, {}, headers)
  return res.cart as unknown as StoreCart
}

/**
 * Apply a native shipping option to Medusa cart and recalculate totals.
 */
export async function addMedusaCartShippingMethod(
  cartId: string,
  optionId: string,
  idempotencyKey?: string
): Promise<StoreCart> {
  const headers = idempotencyKey ? { 'x-idempotency-key': idempotencyKey } : undefined
  const res = await sdk.store.cart.addShippingMethod(
    cartId,
    { option_id: optionId },
    {},
    headers
  )
  return res.cart as unknown as StoreCart
}

/**
 * Validate cart price and stock integrity against authoritative Medusa backend.
 * Calls POST /store/carts/:id/validate
 */
export async function validateMedusaCartStockAndPrice(
  cartId: string,
  acknowledgePriceChanges: boolean = false
): Promise<CartValidationResult> {
  try {
    const url = `${MEDUSA_BACKEND_URL}/store/carts/${cartId}/validate`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ acknowledge_price_changes: acknowledgePriceChanges }),
      cache: 'no-store',
    })

    if (!res.ok) {
      return { valid: false, message: `Validation endpoint returned ${res.status}` }
    }

    return await res.json()
  } catch (err) {
    console.error(`[Medusa Store API] Failed to validate cart ${cartId}:`, err)
    return { valid: false, message: 'Failed to communicate with validation service' }
  }
}

/**
 * Place COD Order (Prompt 09)
 * Authoritatively calls Medusa POST /store/orders/cod
 */
export async function placeMedusaCodOrder(
  cartId: string,
  idempotencyKey?: string
): Promise<{ success: boolean; order?: any; order_bd_details?: any; message?: string }> {
  try {
    const url = `${MEDUSA_BACKEND_URL}/store/orders/cod`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY,
        ...(idempotencyKey ? { 'x-idempotency-key': idempotencyKey } : {}),
      },
      body: JSON.stringify({ cart_id: cartId }),
      cache: 'no-store',
    })

    const data = await res.json()
    if (!res.ok) {
      return {
        success: false,
        message: data.message || `Order placement failed with status ${res.status}`,
      }
    }

    return {
      success: true,
      order: data.order,
      order_bd_details: data.order_bd_details,
    }
  } catch (err: any) {
    console.error('[Medusa Store API] Failed to place COD order:', err)
    return { success: false, message: err.message || 'Failed to communicate with order service' }
  }
}

/**
 * Guest Order Tracking Stub (Prompt 09)
 * Authoritatively calls Medusa GET /store/orders/track
 */
export async function trackMedusaOrder(
  orderId: string,
  phone: string
): Promise<{ success: boolean; order?: any; message?: string }> {
  try {
    const url = `${MEDUSA_BACKEND_URL}/store/orders/track?order_id=${encodeURIComponent(
      orderId
    )}&phone=${encodeURIComponent(phone)}`
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY,
      },
      cache: 'no-store',
    })

    const data = await res.json()
    if (!res.ok) {
      return {
        success: false,
        message: data.message || `Order tracking failed with status ${res.status}`,
      }
    }

    return {
      success: true,
      order: data.order,
    }
  } catch (err: any) {
    console.error('[Medusa Store API] Failed to track order:', err)
    return { success: false, message: err.message || 'Failed to communicate with tracking service' }
  }
}

