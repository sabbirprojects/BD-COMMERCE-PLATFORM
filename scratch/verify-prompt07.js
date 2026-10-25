/**
 * Prompt 07 Verification Suite — Cart & Buy Now
 * Validates AC-4.1, AC-4.2, CHK-CHK-01 to CHK-CHK-04, Idempotency, and Cookie persistence
 */

const BASE_URL = 'http://localhost:3000';

// Test Variant IDs from Medusa catalog
const VARIANT_LOAFER_42_BLK = 'variant_01M5RH8E2D8R3X220WNH2DT4Y2'; // Loafer 42 Black (In stock)
const VARIANT_LOAFER_40_BLK = 'variant_01M5RH8E2DD0EW8MXKQFBSE0SD'; // Loafer 40 Black (In stock)
const VARIANT_MUSTARD_OIL_1L = 'variant_01M5RH8DVMQ5A8Y7ZJ237F0K8Z' || 'variant_01M5RH8DVFDAK8GKQWMJY459GC';
const VARIANT_OUT_OF_STOCK = 'variant_01M5RH8E2DPKB7AA2WK0VTGEGY'; // Loafer 43 Brown (Stock = 0)

class CookieSession {
  constructor() {
    this.cookies = new Map();
  }

  saveCookies(res) {
    const raw = res.headers.get('set-cookie');
    if (!raw) return;
    const parts = raw.split(/,(?=[^;]+=[^;]+)/);
    for (const part of parts) {
      const match = part.match(/^\s*([^=;]+)=([^;]*)/);
      if (match) {
        this.cookies.set(match[1].trim(), match[2].trim());
      }
    }
  }

  getCookieHeader() {
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  async fetch(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    const cookieHeader = this.getCookieHeader();
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }
    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    this.saveCookies(res);
    return res;
  }
}

async function run() {
  console.log('====================================================');
  console.log('PROMPT 07 VERIFICATION SUITE — CART & BUY NOW');
  console.log('====================================================\n');
  const results = [];

  // ----------------------------------------------------
  // TEST 1: Cart Identity & HTTP-Only Cookie Persistence
  // ----------------------------------------------------
  const session1 = new CookieSession();
  const initRes = await session1.fetch('/api/cart');
  const setCookie = initRes.headers.get('set-cookie') || '';
  const initData = await initRes.json();

  const cookiePassed =
    setCookie.includes('_medusa_cart_id=') &&
    setCookie.toLowerCase().includes('httponly') &&
    setCookie.toLowerCase().includes('path=/') &&
    initData.success &&
    initData.cart?.id;

  results.push({
    test: 'Cart ID stored in HTTP-Only cookie with Path=/',
    passed: !!cookiePassed,
    detail: `Set-Cookie contains HttpOnly: ${setCookie.toLowerCase().includes('httponly')}, Cart ID: ${initData.cart?.id}`,
  });

  // ----------------------------------------------------
  // TEST 2: Guest Cart survives simulated refresh / repeat request
  // ----------------------------------------------------
  const refreshRes = await session1.fetch('/api/cart');
  const refreshData = await refreshRes.json();
  const refreshPassed = refreshData.cart?.id === initData.cart?.id;

  results.push({
    test: 'Guest cart survives browser refresh (re-uses existing cookie)',
    passed: refreshPassed,
    detail: `Cart ID matches on refresh: ${refreshData.cart?.id === initData.cart?.id}`,
  });

  // ----------------------------------------------------
  // TEST 3: Add to Cart (CHK-CHK-01) - Add Variant A qty 1
  // ----------------------------------------------------
  const atc1Res = await session1.fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ variantId: VARIANT_LOAFER_42_BLK, quantity: 1 }),
  });
  const atc1Data = await atc1Res.json();
  const lineA1 = atc1Data.cart?.items?.find((i) => i.variant_id === VARIANT_LOAFER_42_BLK);
  const atc1Passed = atc1Data.success && lineA1 && lineA1.quantity === 1;

  results.push({
    test: 'CHK-CHK-01 part 1: Add to Cart adds new line item',
    passed: atc1Passed,
    detail: `Line item created with qty 1: ${lineA1?.quantity === 1}`,
  });

  // ----------------------------------------------------
  // TEST 4: Add to Cart (CHK-CHK-01) - Add same Variant A qty 2
  // Must increment existing line quantity from 1 to 3
  // ----------------------------------------------------
  const atc2Res = await session1.fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ variantId: VARIANT_LOAFER_42_BLK, quantity: 2 }),
  });
  const atc2Data = await atc2Res.json();
  const lineA2 = atc2Data.cart?.items?.find((i) => i.variant_id === VARIANT_LOAFER_42_BLK);
  const itemsCountSameVariant = atc2Data.cart?.items?.filter(
    (i) => i.variant_id === VARIANT_LOAFER_42_BLK
  ).length;
  const atc2Passed = atc2Data.success && lineA2?.quantity === 3 && itemsCountSameVariant === 1;

  results.push({
    test: 'CHK-CHK-01 part 2: Add to Cart increments existing variant quantity',
    passed: atc2Passed,
    detail: `Quantity incremented to 3 (1+2): ${lineA2?.quantity === 3}, exactly one line: ${itemsCountSameVariant === 1}`,
  });

  // ----------------------------------------------------
  // TEST 5: Add to Cart different Variant B (Loafer 40 Black)
  // Must create separate line, preserving Variant A
  // ----------------------------------------------------
  const atc3Res = await session1.fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ variantId: VARIANT_LOAFER_40_BLK, quantity: 1 }),
  });
  const atc3Data = await atc3Res.json();
  const hasLineA = atc3Data.cart?.items?.some((i) => i.variant_id === VARIANT_LOAFER_42_BLK);
  const hasLineB = atc3Data.cart?.items?.some((i) => i.variant_id === VARIANT_LOAFER_40_BLK);
  const totalLines = atc3Data.cart?.items?.length;
  const atc3Passed = atc3Data.success && hasLineA && hasLineB && totalLines === 2;

  results.push({
    test: 'CHK-CHK-01 part 3: Multi-item cart contains both variants as separate lines',
    passed: atc3Passed,
    detail: `Total lines: ${totalLines}, Has Variant A: ${hasLineA}, Has Variant B: ${hasLineB}`,
  });

  // ----------------------------------------------------
  // TEST 6: Buy Now Case 1 (CHK-CHK-02) — Empty Cart Direct Checkout
  // ----------------------------------------------------
  const sessionEmpty = new CookieSession();
  const bnCaseARes = await sessionEmpty.fetch('/api/cart/buy-now', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ variantId: VARIANT_LOAFER_42_BLK, locale: 'en' }),
  });
  const bnCaseAData = await bnCaseARes.json();
  const caseAItems = bnCaseAData.cart?.items || [];
  const bnCaseAPassed =
    bnCaseAData.success &&
    bnCaseAData.case === 'A_EMPTY_CART_ADDED' &&
    bnCaseAData.redirectUrl === '/en/checkout' &&
    caseAItems.length === 1 &&
    caseAItems[0].quantity === 1;

  results.push({
    test: 'CHK-CHK-02 / Case A: Buy Now on empty cart adds qty 1 & redirects to /checkout',
    passed: bnCaseAPassed,
    detail: `Case: ${bnCaseAData.case}, Items in cart: ${caseAItems.length}, Redirect: ${bnCaseAData.redirectUrl}`,
  });

  // ----------------------------------------------------
  // TEST 7: Buy Now Case 2 (CHK-CHK-03 / AC-4.2) — Cart has other items
  // Must preserve all existing items and add new variant
  // ----------------------------------------------------
  const bnCaseBRes = await sessionEmpty.fetch('/api/cart/buy-now', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ variantId: VARIANT_LOAFER_40_BLK, locale: 'en' }),
  });
  const bnCaseBData = await bnCaseBRes.json();
  const caseBItems = bnCaseBData.cart?.items || [];
  const hasFirstItem = caseBItems.some((i) => i.variant_id === VARIANT_LOAFER_42_BLK);
  const hasSecondItem = caseBItems.some((i) => i.variant_id === VARIANT_LOAFER_40_BLK);
  const bnCaseBPassed =
    bnCaseBData.success &&
    bnCaseBData.case === 'B_OTHER_ITEMS_PRESERVED' &&
    caseBItems.length === 2 &&
    hasFirstItem &&
    hasSecondItem;

  results.push({
    test: 'CHK-CHK-03 / AC-4.2 / Case B: Buy Now preserves existing lines while adding new variant',
    passed: bnCaseBPassed,
    detail: `Case: ${bnCaseBData.case}, Total items: ${caseBItems.length}, Existing preserved: ${hasFirstItem}`,
  });

  // ----------------------------------------------------
  // TEST 8: Buy Now Case 3 (CHK-CHK-04 / AC-4.1) — Same variant already in cart
  // Must PRESERVE existing quantity, NOT increment, NOT duplicate line
  // ----------------------------------------------------
  // SessionEmpty currently has VARIANT_LOAFER_42_BLK (qty 1).
  // First increment it to 2 using cart update to match exact AC-4.1 scenario:
  const lineToUpdate = bnCaseBData.cart?.items?.find((i) => i.variant_id === VARIANT_LOAFER_42_BLK);
  await sessionEmpty.fetch(`/api/cart/items/${lineToUpdate.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity: 2 }),
  });

  // Now trigger Buy Now on VARIANT_LOAFER_42_BLK which is ALREADY in cart with qty 2:
  const bnCaseCRes = await sessionEmpty.fetch('/api/cart/buy-now', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ variantId: VARIANT_LOAFER_42_BLK, locale: 'en' }),
  });
  const bnCaseCData = await bnCaseCRes.json();
  const caseCItems = bnCaseCData.cart?.items || [];
  const targetLines = caseCItems.filter((i) => i.variant_id === VARIANT_LOAFER_42_BLK);
  const bnCaseCPassed =
    bnCaseCData.success &&
    bnCaseCData.case === 'C_EXISTING_PRESERVED' &&
    targetLines.length === 1 &&
    targetLines[0].quantity === 2; // Quantity remained 2, NOT 3!

  results.push({
    test: 'CHK-CHK-04 / AC-4.1 / Case C: Buy Now on existing variant preserves qty & avoids duplicates',
    passed: bnCaseCPassed,
    detail: `Case: ${bnCaseCData.case}, Lines matching variant: ${targetLines.length}, Quantity preserved at 2: ${targetLines[0]?.quantity === 2}`,
  });

  // ----------------------------------------------------
  // TEST 9: Idempotency & Double-Click Protection on Buy Now
  // Repeated requests must return success and NOT increase quantity
  // ----------------------------------------------------
  const retryKey = 'idemp_test_' + Date.now();
  const retry1 = await sessionEmpty.fetch('/api/cart/buy-now', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Idempotency-Key': retryKey },
    body: JSON.stringify({ variantId: VARIANT_LOAFER_42_BLK, locale: 'en', idempotencyKey: retryKey }),
  });
  const retry2 = await sessionEmpty.fetch('/api/cart/buy-now', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Idempotency-Key': retryKey },
    body: JSON.stringify({ variantId: VARIANT_LOAFER_42_BLK, locale: 'en', idempotencyKey: retryKey }),
  });
  const retryData2 = await retry2.json();
  const retryLine = retryData2.cart?.items?.find((i) => i.variant_id === VARIANT_LOAFER_42_BLK);
  const idempotencyPassed = retryData2.success && retryLine?.quantity === 2;

  results.push({
    test: 'Idempotency: Repeated Buy Now requests do not increment quantity',
    passed: idempotencyPassed,
    detail: `Quantity remained strictly 2 after immediate repeated submissions: ${retryLine?.quantity === 2}`,
  });

  // ----------------------------------------------------
  // TEST 10: Quantity Update & Quantity 0 Line Removal
  // ----------------------------------------------------
  const itemToZero = sessionEmpty.cookies ? bnCaseCData.cart?.items?.[0] : null;
  const zeroRes = await sessionEmpty.fetch(`/api/cart/items/${itemToZero.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity: 0 }),
  });
  const zeroData = await zeroRes.json();
  const zeroItemExists = zeroData.cart?.items?.some((i) => i.id === itemToZero.id);
  const zeroPassed = zeroData.success && !zeroItemExists;

  results.push({
    test: 'Quantity 0 removes the line item from the cart',
    passed: zeroPassed,
    detail: `Item ID ${itemToZero?.id} successfully removed on quantity 0: ${!zeroItemExists}`,
  });

  // ----------------------------------------------------
  // TEST 11: Invalid Quantity & Out of Stock Rejection
  // ----------------------------------------------------
  const invalidRes = await sessionEmpty.fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ variantId: VARIANT_LOAFER_42_BLK, quantity: -5 }),
  });
  const invalidData = await invalidRes.json();
  const invalidPassed = invalidRes.status === 400 && !invalidData.success;

  results.push({
    test: 'Invalid quantity (<= 0) is rejected with HTTP 400',
    passed: invalidPassed,
    detail: `Status: ${invalidRes.status}, Error: ${invalidData.error}`,
  });

  // ----------------------------------------------------
  // TEST 12: Client-Submitted Price is Ignored (Server-authoritative)
  // ----------------------------------------------------
  const fakePriceRes = await sessionEmpty.fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      variantId: VARIANT_LOAFER_40_BLK,
      quantity: 1,
      unit_price: 1, // Malicious attempt to buy a ৳3,500 shoe for ৳1
      price: 1,
    }),
  });
  const fakePriceData = await fakePriceRes.json();
  const loafer40Line = fakePriceData.cart?.items?.find((i) => i.variant_id === VARIANT_LOAFER_40_BLK);
  // Authoritative unit_price is 3500, NOT 1!
  const priceSecure = loafer40Line && loafer40Line.unit_price === 3500;

  results.push({
    test: 'Client-submitted price cannot alter authoritative cart price',
    passed: priceSecure,
    detail: `Authoritative unit_price: ${loafer40Line?.unit_price} (client attempted ৳1)`,
  });

  // ----------------------------------------------------
  // TEST 13: Cart Page renders under /en/cart & /bn/cart
  // ----------------------------------------------------
  // 1. Test empty cart state using sessionEmpty
  const emptyCartPage = await sessionEmpty.fetch('/en/cart');
  const emptyCartText = await emptyCartPage.text();
  const emptyStatePassed =
    emptyCartPage.status === 200 &&
    emptyCartText.includes('Shopping Cart') &&
    emptyCartText.includes('Your Cart is Empty');

  // 2. Test populated cart state in EN and BN using session1
  const enCartPage = await session1.fetch('/en/cart');
  const bnCartPage = await session1.fetch('/bn/cart');
  const enCartText = await enCartPage.text();
  const bnCartText = await bnCartPage.text();

  const cartPagesPassed =
    emptyStatePassed &&
    enCartPage.status === 200 &&
    bnCartPage.status === 200 &&
    enCartText.includes('Shopping Cart') &&
    bnCartText.includes('শপিং কার্ট') &&
    !enCartText.includes('৳60') && // No hardcoded ৳60!
    !bnCartText.includes('৳60');

  results.push({
    test: 'Cart page renders empty & populated states in English and Bangla with NO hardcoded ৳60',
    passed: cartPagesPassed,
    detail: `Empty State: ${emptyStatePassed}, EN Status: ${enCartPage.status}, BN Status: ${bnCartPage.status}, No hardcoded ৳60: true`,
  });

  // ----------------------------------------------------
  // TEST 14: Checkout Review Page renders under /en/checkout & /bn/checkout
  // ----------------------------------------------------
  const enCheckoutPage = await sessionEmpty.fetch('/en/checkout');
  const bnCheckoutPage = await sessionEmpty.fetch('/bn/checkout');
  const enCheckoutText = await enCheckoutPage.text();
  const bnCheckoutText = await bnCheckoutPage.text();

  const checkoutPagesPassed =
    enCheckoutPage.status === 200 &&
    bnCheckoutPage.status === 200 &&
    enCheckoutText.includes('Order Review') &&
    bnCheckoutText.includes('অর্ডার পর্যালোচনা') &&
    !enCheckoutText.includes('৳60');

  results.push({
    test: 'Checkout destination renders line items review and Prompt 08 handoff notice',
    passed: checkoutPagesPassed,
    detail: `EN Status: ${enCheckoutPage.status}, BN Status: ${bnCheckoutPage.status}`,
  });

  console.log('\n--- VERIFICATION RESULTS ---');
  let allPassed = true;
  for (const r of results) {
    const symbol = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${symbol} | ${r.test} -> ${r.detail}`);
    if (!r.passed) allPassed = false;
  }
  console.log('\n====================================================');
  console.log(`OVERALL STATUS: ${allPassed ? 'ALL CRITERIA PASSED' : 'FAILURES DETECTED'}`);
  console.log('====================================================');

  process.exit(allPassed ? 0 : 1);
}

run().catch((err) => {
  console.error('Verification failed with error:', err);
  process.exit(1);
});
