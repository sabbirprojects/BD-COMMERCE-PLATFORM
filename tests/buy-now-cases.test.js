/**
 * Integration Test: Buy Now 3 Canonical Cases
 *
 * Requirements:
 * - CHK-CHK-02 [P0]: Case A: Cart is empty -> adds variant (qty 1) -> redirects to /checkout
 * - CHK-CHK-03 [P0]: Case B: Cart has other items -> preserves existing items, adds variant -> redirects to /checkout (AC-4.2)
 * - CHK-CHK-04 [P0]: Case C: Same variant already in cart -> preserves quantity, NO duplicate line, NO increment -> redirects to /checkout (AC-4.1)
 */

const assert = require('assert')

const STORE_URL = process.env.STORE_URL || 'http://localhost:3000'

const VARIANT_A = 'variant_01M5RH8DJ0ZZAGSM2ABFHABDJB' // M / White (2500 BDT)
const VARIANT_B = 'variant_01M5RH8DJ0YP65605EAAB5M339' // L / White (2500 BDT)

async function runBuyNowCasesTests() {
  console.log('===============================================================')
  console.log('🧪 P0 Test Suite 4: Buy Now 3 Canonical Cases (CHK-CHK-02, 03, 04, AC-4.1, 4.2)')
  console.log('===============================================================\n')

  let passedAssertions = 0
  let cookieHeader = ''

  // Helper to maintain cookies across requests
  async function callBuyNow(variantId, locale = 'bn') {
    const headers = { 'Content-Type': 'application/json' }
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader
    }

    const res = await fetch(`${STORE_URL}/api/cart/buy-now`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ variantId, locale }),
    })

    const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie') || '']
    for (const sc of setCookies) {
      const match = sc.match(/(_medusa_cart_id=[^;]+)/)
      if (match) {
        cookieHeader = match[1]
      }
    }

    const data = await res.json()
    return { status: res.status, data }
  }

  // -----------------------------------------------------------------
  // Case A: Cart is empty -> adds qty 1 -> go checkout (CHK-CHK-02)
  // -----------------------------------------------------------------
  console.log('🔹 Case A: Testing Buy Now with empty cart (CHK-CHK-02)...')
  cookieHeader = '' // Ensure empty cart

  const resA = await callBuyNow(VARIANT_A, 'bn')
  assert.strictEqual(resA.status, 200, 'Case A must return HTTP 200 OK')
  passedAssertions++
  assert.strictEqual(resA.data.success, true, 'Case A success must be true')
  passedAssertions++
  assert.strictEqual(resA.data.case, 'A_EMPTY_CART_ADDED', 'Case A must report A_EMPTY_CART_ADDED')
  passedAssertions++
  assert.strictEqual(resA.data.redirectUrl, '/bn/checkout', 'Case A must redirect to checkout')
  passedAssertions++
  assert.strictEqual(resA.data.cart?.items?.length, 1, 'Cart must contain exactly 1 item')
  passedAssertions++
  assert.strictEqual(resA.data.cart?.items?.[0]?.variant_id, VARIANT_A)
  passedAssertions++
  assert.strictEqual(resA.data.cart?.items?.[0]?.quantity, 1, 'Added item quantity must be 1')
  passedAssertions++
  console.log('  ✓ Case A verified: empty cart populated with variant and directed to checkout')

  // -----------------------------------------------------------------
  // Case B: Cart has other items -> preserves existing, adds new line (CHK-CHK-03, AC-4.2)
  // -----------------------------------------------------------------
  console.log('\n🔹 Case B: Testing Buy Now with existing cart containing other items (CHK-CHK-03, AC-4.2)...')

  const resB = await callBuyNow(VARIANT_B, 'bn')
  assert.strictEqual(resB.status, 200, 'Case B must return HTTP 200 OK')
  passedAssertions++
  assert.strictEqual(resB.data.success, true, 'Case B success must be true')
  passedAssertions++
  assert.strictEqual(resB.data.case, 'B_OTHER_ITEMS_PRESERVED', 'Case B must report B_OTHER_ITEMS_PRESERVED')
  passedAssertions++
  assert.strictEqual(resB.data.redirectUrl, '/bn/checkout', 'Case B must redirect to checkout')
  passedAssertions++
  assert.strictEqual(resB.data.cart?.items?.length, 2, 'Cart must now contain exactly 2 items')
  passedAssertions++

  // Verify both items are preserved
  const itemA = resB.data.cart?.items?.find((i) => i.variant_id === VARIANT_A)
  const itemB = resB.data.cart?.items?.find((i) => i.variant_id === VARIANT_B)
  assert.ok(itemA, 'Variant A must be preserved in cart')
  passedAssertions++
  assert.ok(itemB, 'Variant B must be added to cart')
  passedAssertions++
  assert.strictEqual(itemA.quantity, 1, 'Variant A quantity must remain 1')
  passedAssertions++
  assert.strictEqual(itemB.quantity, 1, 'Variant B quantity must be 1')
  passedAssertions++
  console.log('  ✓ Case B verified: original cart contents preserved alongside new Buy Now item')

  // -----------------------------------------------------------------
  // Case C: Same variant already in cart -> keep qty, NO increment, NO duplicate (CHK-CHK-04, AC-4.1)
  // -----------------------------------------------------------------
  console.log('\n🔹 Case C: Testing Buy Now when same variant is already in cart (CHK-CHK-04, AC-4.1)...')

  const resC = await callBuyNow(VARIANT_A, 'bn')
  assert.strictEqual(resC.status, 200, 'Case C must return HTTP 200 OK')
  passedAssertions++
  assert.strictEqual(resC.data.success, true, 'Case C success must be true')
  passedAssertions++
  assert.strictEqual(resC.data.case, 'C_EXISTING_PRESERVED', 'Case C must report C_EXISTING_PRESERVED')
  passedAssertions++
  assert.strictEqual(resC.data.redirectUrl, '/bn/checkout', 'Case C must redirect to checkout')
  passedAssertions++
  assert.strictEqual(resC.data.cart?.items?.length, 2, 'Cart must still contain 2 items (no duplicate line!)')
  passedAssertions++

  const itemAAfter = resC.data.cart?.items?.find((i) => i.variant_id === VARIANT_A)
  assert.strictEqual(itemAAfter.quantity, 1, 'Variant A quantity must NOT be incremented (stays at 1)')
  passedAssertions++
  console.log('  ✓ Case C verified: exact existing quantity preserved without duplication or increment')

  console.log('\n===============================================================')
  console.log(`🎉 CHK-CHK-02 / 03 / 04 PASSED: All ${passedAssertions} assertions verified cleanly.`)
  console.log('===============================================================\n')
}

if (require.main === module) {
  runBuyNowCasesTests().catch((err) => {
    console.error('❌ Buy Now test failed:', err)
    process.exit(1)
  })
}

module.exports = { runBuyNowCasesTests }
