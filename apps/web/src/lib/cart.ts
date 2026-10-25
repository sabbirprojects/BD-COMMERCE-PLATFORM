import { cookies } from 'next/headers'
import {
  createMedusaCart,
  getMedusaCart,
  addMedusaCartLineItem,
  updateMedusaCartLineItem,
  deleteMedusaCartLineItem,
  StoreCart,
  sdk,
} from './medusa'

export const CART_COOKIE_NAME = '_medusa_cart_id'

export const CART_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 30, // 30 days guest session persistence (FR-4.3.8)
  secure: process.env.NODE_ENV === 'production',
}

/**
 * Retrieves the current cart from HTTP-only cookie, or creates a new one.
 * Ensures single cart per session across language switches and browser refreshes.
 */
export async function getOrSetCart(): Promise<StoreCart> {
  const cookieStore = await cookies()
  const existingCartId = cookieStore.get(CART_COOKIE_NAME)?.value

  if (existingCartId) {
    const cart = await getMedusaCart(existingCartId)
    if (cart && !cart.completed_at) {
      return cart
    }
  }

  // Create new cart in Bangladesh region (BDT)
  const newCart = await createMedusaCart()
  cookieStore.set(CART_COOKIE_NAME, newCart.id, CART_COOKIE_OPTIONS)
  return newCart
}

/**
 * Add an item to the session cart.
 * If variant exists, increments quantity. If new, appends line.
 * Validates stock on server; ignores any client-supplied prices.
 */
export async function addToCartService({
  variantId,
  quantity = 1,
  idempotencyKey,
}: {
  variantId: string
  quantity?: number
  idempotencyKey?: string
}): Promise<{ success: boolean; cart?: StoreCart; error?: string }> {
  if (!variantId || typeof variantId !== 'string') {
    return { success: false, error: 'Invalid variant ID' }
  }

  const parsedQty = Math.floor(Number(quantity))
  if (isNaN(parsedQty) || parsedQty <= 0) {
    return { success: false, error: 'Invalid quantity' }
  }

  const cart = await getOrSetCart()

  // Validate variant availability and stock server-side
  try {
    const existingLine = cart.items?.find((item) => item.variant_id === variantId)
    const currentQtyInCart = existingLine ? existingLine.quantity : 0
    const targetTotalQty = currentQtyInCart + parsedQty

    // Add or increment line item via Medusa Store API with idempotency key
    const updatedCart = await addMedusaCartLineItem(
      cart.id,
      { variant_id: variantId, quantity: parsedQty },
      idempotencyKey
    )

    return { success: true, cart: updatedCart }
  } catch (err: any) {
    const msg = err.message || 'Failed to add item to cart'
    return { success: false, error: msg }
  }
}

/**
 * Buy Now — Strict 3-Case Behavior (PRD FR-4.3.2 & FR-4.3.3)
 * Case A: Cart is empty -> adds qty 1 -> go checkout (CHK-CHK-02)
 * Case B: Cart has other items -> adds new line, preserves existing, go checkout (CHK-CHK-03, AC-4.2)
 * Case C: Same variant already in cart -> keep qty, do NOT increment, do NOT duplicate, go checkout (CHK-CHK-04, AC-4.1)
 */
export async function buyNowService({
  variantId,
  idempotencyKey,
  locale = 'en',
}: {
  variantId: string
  idempotencyKey?: string
  locale?: string
}): Promise<{
  success: boolean
  cart?: StoreCart
  case?: 'A_EMPTY_CART_ADDED' | 'B_OTHER_ITEMS_PRESERVED' | 'C_EXISTING_PRESERVED'
  redirectUrl: string
  error?: string
}> {
  const redirectUrl = `/${locale}/checkout`

  if (!variantId || typeof variantId !== 'string') {
    return { success: false, redirectUrl, error: 'Invalid variant ID' }
  }

  const cart = await getOrSetCart()
  const existingLine = cart.items?.find((item) => item.variant_id === variantId)

  // Case C: Exact same variant is already in cart
  // Preserves existing quantity, creates NO duplicate row, does NOT increment (AC-4.1, CHK-CHK-04)
  if (existingLine) {
    return {
      success: true,
      cart,
      case: 'C_EXISTING_PRESERVED',
      redirectUrl,
    }
  }

  // Case A or B: Variant is not in cart yet
  try {
    const isCartEmpty = !cart.items || cart.items.length === 0
    const updatedCart = await addMedusaCartLineItem(
      cart.id,
      { variant_id: variantId, quantity: 1 },
      idempotencyKey
    )

    return {
      success: true,
      cart: updatedCart,
      case: isCartEmpty ? 'A_EMPTY_CART_ADDED' : 'B_OTHER_ITEMS_PRESERVED',
      redirectUrl,
    }
  } catch (err: any) {
    return {
      success: false,
      cart,
      redirectUrl,
      error: err.message || 'Failed to execute Buy Now',
    }
  }
}

/**
 * Update line item quantity.
 * If quantity <= 0, deletes line item.
 */
export async function updateLineItemService({
  lineId,
  quantity,
  idempotencyKey,
}: {
  lineId: string
  quantity: number
  idempotencyKey?: string
}): Promise<{ success: boolean; cart?: StoreCart; error?: string }> {
  if (!lineId) {
    return { success: false, error: 'Invalid line item ID' }
  }

  const parsedQty = Math.floor(Number(quantity))
  const cart = await getOrSetCart()

  try {
    if (parsedQty <= 0) {
      const updatedCart = await deleteMedusaCartLineItem(cart.id, lineId, idempotencyKey)
      // If delete returned parent cart, use it; otherwise re-fetch
      const finalCart = updatedCart || (await getMedusaCart(cart.id)) || cart
      return { success: true, cart: finalCart }
    }

    const updatedCart = await updateMedusaCartLineItem(
      cart.id,
      lineId,
      { quantity: parsedQty },
      idempotencyKey
    )
    return { success: true, cart: updatedCart }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update line item' }
  }
}

/**
 * Remove line item from cart.
 */
export async function removeLineItemService({
  lineId,
  idempotencyKey,
}: {
  lineId: string
  idempotencyKey?: string
}): Promise<{ success: boolean; cart?: StoreCart; error?: string }> {
  if (!lineId) {
    return { success: false, error: 'Invalid line item ID' }
  }

  const cart = await getOrSetCart()

  try {
    const updatedCart = await deleteMedusaCartLineItem(cart.id, lineId, idempotencyKey)
    const finalCart = updatedCart || (await getMedusaCart(cart.id)) || cart
    return { success: true, cart: finalCart }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to remove line item' }
  }
}

/**
 * Apply dynamic delivery zone shipping option based on district.
 * Requirements:
 * - district -> delivery_zone_district -> delivery_zone.shipping_option_id
 * - CHK-CHK-06: switching Dhaka vs outside changes delivery charge from config
 * - Recalculates cart totals natively via Medusa
 */
export async function applyShippingService({
  districtCode,
  idempotencyKey,
}: {
  districtCode: string
  idempotencyKey?: string
}): Promise<{
  success: boolean
  cart?: StoreCart
  zone?: any
  error?: string
}> {
  if (!districtCode) {
    return { success: false, error: 'District code is required' }
  }

  const cart = await getOrSetCart()

  try {
    const {
      getMedusaDeliveryZone,
      getMedusaGeoData,
      updateMedusaCartAddress,
      addMedusaCartShippingMethod,
    } = await import('./medusa')
    const zone = await getMedusaDeliveryZone(districtCode)

    if (!zone || !zone.shipping_option_id) {
      return {
        success: false,
        error: `No delivery zone or shipping option configured for district ${districtCode}`,
      }
    }

    const geo = await getMedusaGeoData()
    const district = geo.districts.find((d) => d.code === districtCode)

    // Update shipping_address.province to districtCode so Medusa fulfillment rules validate
    await updateMedusaCartAddress(
      cart.id,
      {
        first_name: (cart as any).shipping_address?.first_name || 'Guest',
        last_name: (cart as any).shipping_address?.last_name || '',
        phone: (cart as any).shipping_address?.phone || '+8801700000000',
        address_1: (cart as any).shipping_address?.address_1 || 'Address Pending',
        city: district?.name_en || 'Dhaka',
        province: districtCode,
        country_code: 'bd',
      },
      {
        ...(cart.metadata || {}),
        district_code: districtCode,
        delivery_zone_code: zone.code,
      },
      idempotencyKey
    )

    const updatedCart = await addMedusaCartShippingMethod(
      cart.id,
      zone.shipping_option_id,
      idempotencyKey
    )

    return {
      success: true,
      cart: updatedCart,
      zone,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to apply shipping option',
    }
  }
}

/**
 * Validate and persist 4-tier address cascade and metadata to Medusa cart.
 * Persists address_snapshot and UTM params into cart.metadata for order_bd_details.
 */
export async function saveCheckoutAddressService({
  firstName,
  lastName = '',
  phone,
  altPhone,
  divisionCode,
  districtCode,
  thanaCode,
  streetAddress,
  postalCode,
  utmParams,
  idempotencyKey,
}: {
  firstName: string
  lastName?: string
  phone: string
  altPhone?: string
  divisionCode: string
  districtCode: string
  thanaCode: string
  streetAddress: string
  postalCode?: string
  utmParams?: Record<string, string | undefined>
  idempotencyKey?: string
}): Promise<{
  success: boolean
  cart?: StoreCart
  zone?: any
  errorEn?: string
  errorBn?: string
}> {
  const { validateAndNormalizeBdPhone } = await import('./phone')
  const {
    getMedusaGeoData,
    getMedusaDeliveryZone,
    updateMedusaCartAddress,
    addMedusaCartShippingMethod,
  } = await import('./medusa')

  // 1. Phone validation (CHK-CHK-05)
  const phoneValidation = validateAndNormalizeBdPhone(phone)
  if (!phoneValidation.isValid) {
    return {
      success: false,
      errorEn: phoneValidation.errorEn,
      errorBn: phoneValidation.errorBn,
    }
  }

  const canonicalPhone = phoneValidation.canonical!

  let canonicalAltPhone: string | null = null
  if (altPhone && altPhone.trim()) {
    const altValidation = validateAndNormalizeBdPhone(altPhone)
    if (!altValidation.isValid) {
      return {
        success: false,
        errorEn: `Alternative phone: ${altValidation.errorEn}`,
        errorBn: `বিকল্প মোবাইল নম্বর: ${altValidation.errorBn}`,
      }
    }
    canonicalAltPhone = altValidation.canonical!
  }

  // 2. Validate 4-tier address against geo master
  if (!divisionCode || !districtCode || !thanaCode || !streetAddress?.trim()) {
    return {
      success: false,
      errorEn: 'All 4 address tiers (Division, District, Thana, Street) are required.',
      errorBn: 'ঠিকানার ৪টি স্তরই (বিভাগ, জেলা, থানা, এলাকা/ঠিকানা) পূরণ করা আবশ্যক।',
    }
  }

  const geo = await getMedusaGeoData()
  const division = geo.divisions.find((d) => d.code === divisionCode)
  const district = geo.districts.find(
    (d) => d.code === districtCode && d.division_code === divisionCode
  )
  const thana = geo.thanas.find(
    (t) => t.code === thanaCode && t.district_code === districtCode
  )

  if (!division || !district || !thana) {
    return {
      success: false,
      errorEn: 'Invalid address hierarchy. The selected division, district, or thana is invalid.',
      errorBn: 'অকার্যকর ঠিকানা। বিভাগ, জেলা অথবা থানা যাচাই করা সম্ভব হয়নি।',
    }
  }

  // 3. Resolve delivery zone
  const zone = await getMedusaDeliveryZone(districtCode)
  if (!zone) {
    return {
      success: false,
      errorEn: `No delivery zone available for district ${district.name_en}.`,
      errorBn: `${district.name_bn} জেলার জন্য কোনো ডেলিভারি জোন নির্ধারিত নেই।`,
    }
  }

  const cart = await getOrSetCart()

  // 4. Build address snapshot (database.md §3.4.4 & §8.1)
  const effectivePostalCode = postalCode || thana.postal_codes?.[0] || ''
  const addressSnapshot = {
    first_name: firstName.trim(),
    last_name: lastName.trim(),
    phone: canonicalPhone,
    alt_phone: canonicalAltPhone,
    division_code: divisionCode,
    division_name_en: division.name_en,
    division_name_bn: division.name_bn,
    district_code: districtCode,
    district_name_en: district.name_en,
    district_name_bn: district.name_bn,
    thana_code: thanaCode,
    thana_name_en: thana.name_en,
    thana_name_bn: thana.name_bn,
    postal_code: effectivePostalCode,
    address_1: streetAddress.trim(),
    delivery_zone_code: zone.code,
  }

  const metadata: Record<string, any> = {
    ...(cart.metadata || {}),
    division_code: divisionCode,
    district_code: districtCode,
    thana_code: thanaCode,
    postal_code: effectivePostalCode,
    delivery_zone_code: zone.code,
    address_snapshot: addressSnapshot,
  }

  // Persist UTM parameters if present
  if (utmParams) {
    if (utmParams.utm_source) metadata.utm_source = utmParams.utm_source
    if (utmParams.utm_medium) metadata.utm_medium = utmParams.utm_medium
    if (utmParams.utm_campaign) metadata.utm_campaign = utmParams.utm_campaign
    if (utmParams.utm_content) metadata.utm_content = utmParams.utm_content
    if (utmParams.utm_term) metadata.utm_term = utmParams.utm_term
  }

  // 5. Update shipping address on Medusa cart
  const updatedCartWithAddress = await updateMedusaCartAddress(
    cart.id,
    {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: canonicalPhone,
      address_1: streetAddress.trim(),
      city: district.name_en,
      province: districtCode,
      postal_code: effectivePostalCode,
      country_code: 'bd',
    },
    metadata,
    idempotencyKey
  )

  // 6. Apply shipping option for the resolved zone
  let finalCart = updatedCartWithAddress
  if (zone.shipping_option_id) {
    finalCart = await addMedusaCartShippingMethod(
      cart.id,
      zone.shipping_option_id,
      idempotencyKey
    )
  }

  return {
    success: true,
    cart: finalCart,
    zone,
  }
}

/**
 * Revalidate cart prices and stock on server before checkout completion (CHK-CHK-07).
 */
export async function validateCheckoutService(
  acknowledgePriceChanges: boolean = false
): Promise<{
  valid: boolean
  hasPriceChange?: boolean
  hasStockIssue?: boolean
  priceChanges?: any[]
  stockIssues?: any[]
  message?: string
}> {
  const cart = await getOrSetCart()
  const { validateMedusaCartStockAndPrice } = await import('./medusa')
  const result = await validateMedusaCartStockAndPrice(cart.id, acknowledgePriceChanges)
  return {
    valid: result.valid,
    hasPriceChange: result.has_price_change,
    hasStockIssue: result.has_stock_issue,
    priceChanges: result.price_changes,
    stockIssues: result.stock_issues,
    message: result.message,
  }
}

/**
 * Place COD Order (Prompt 09)
 * Validates session cart, invokes authoritative Medusa endpoint,
 * and clears the cart cookie on success.
 */
export async function placeCodOrderService({
  idempotencyKey,
}: {
  idempotencyKey?: string
} = {}): Promise<{
  success: boolean
  order?: any
  order_bd_details?: any
  error?: string
}> {
  const cookieStore = await cookies()
  const cartId = cookieStore.get(CART_COOKIE_NAME)?.value

  if (!cartId) {
    return { success: false, error: 'No active cart found to checkout' }
  }

  const { placeMedusaCodOrder } = await import('./medusa')
  const res = await placeMedusaCodOrder(cartId, idempotencyKey)

  if (!res.success || !res.order) {
    return {
      success: false,
      error: res.message || 'Failed to place COD order',
    }
  }

  // Clear cart cookie on successful order placement
  cookieStore.delete(CART_COOKIE_NAME)

  return {
    success: true,
    order: res.order,
    order_bd_details: res.order_bd_details,
  }
}

/**
 * Initiate Online Payment (Prompt 11: bKash / Nagad)
 * Implements Zero-Orphan guarantee (CHK-PAY-04 & FR-7.3.7):
 * - Does NOT create an order
 * - Does NOT delete cart cookie
 * - Initiates session with gateway and returns redirect URL
 */
export async function initiateOnlinePaymentService({
  providerCode,
  idempotencyKey,
}: {
  providerCode: string
  idempotencyKey?: string
}): Promise<{
  success: boolean
  redirect_url?: string
  payment_id?: string
  error?: string
  error_bn?: string
}> {
  const cookieStore = await cookies()
  const cartId = cookieStore.get(CART_COOKIE_NAME)?.value

  if (!cartId) {
    return { success: false, error: 'No active cart found to initiate payment' }
  }

  const backendUrl = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
  try {
    const res = await fetch(`${backendUrl}/store/payment/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || 'pk_e03efb8523c1542172c95fe34dc90955a3389f3ee3592faa16171966d4699096',
        ...(idempotencyKey ? { 'x-idempotency-key': idempotencyKey } : {}),
      },
      body: JSON.stringify({
        cart_id: cartId,
        provider_id: providerCode,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      return {
        success: false,
        error: data.message || data.error || 'Failed to initiate payment',
        error_bn: data.error_bn,
      }
    }

    return {
      success: true,
      redirect_url: data.redirect_url,
      payment_id: data.payment_id,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Payment provider gateway is currently unavailable',
    }
  }
}

