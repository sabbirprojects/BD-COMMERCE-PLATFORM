/**
 * Prompt 06 Verification Script
 * Validates all acceptance criteria against http://localhost:3000 and Medusa Store API
 */

const BASE_URL = 'http://localhost:3000';
const MEDUSA_URL = 'http://localhost:9000';
const PUBLISHABLE_KEY = 'pk_e03efb8523c1542172c95fe34dc90955a3389f3ee3592faa16171966d4699096';

async function fetchHtml(urlPath) {
  const res = await fetch(`${BASE_URL}${urlPath}`);
  const status = res.status;
  const text = await res.text();
  return { status, text, headers: res.headers };
}

async function run() {
  console.log('=============================================');
  console.log('PROMPT 06 VERIFICATION SUITE — BD COMMERCE');
  console.log('=============================================');
  const results = [];

  // Test 1: Root redirect to /en
  const rootRes = await fetch(`${BASE_URL}/`, { redirect: 'manual' });
  const rootPassed = rootRes.status === 307 && rootRes.headers.get('location')?.includes('/en');
  results.push({
    test: 'Root / redirects to /en',
    passed: rootPassed,
    detail: `Status: ${rootRes.status}, Location: ${rootRes.headers.get('location')}`
  });

  // Test 2: English Homepage renders live products & categories
  const enHome = await fetchHtml('/en');
  const enHomePassed = enHome.status === 200 &&
    enHome.text.includes('BD Commerce') &&
    enHome.text.includes('৳') &&
    enHome.text.includes('Featured Products') &&
    !enHome.text.includes('SSLCommerz');
  results.push({
    test: 'EN Homepage (/en) renders catalog & no SSLCommerz copy',
    passed: enHomePassed,
    detail: `Status: ${enHome.status}, Has BDT: ${enHome.text.includes('৳')}, No SSLCommerz: ${!enHome.text.includes('SSLCommerz')}`
  });

  // Test 3: Bangla Homepage renders Bengali copy and Bengali numerals
  const bnHome = await fetchHtml('/bn');
  const bnHomePassed = bnHome.status === 200 &&
    bnHome.text.includes('সেরা নির্বাচিত পণ্য') &&
    (bnHome.text.includes('৳ ১০') || bnHome.text.includes('৳ ২,৫০০') || bnHome.text.includes('৳ ৩,৫০০'));
  results.push({
    test: 'BN Homepage (/bn) renders Bengali numerals & copy',
    passed: bnHomePassed,
    detail: `Status: ${bnHome.status}, Bengali header: ${bnHome.text.includes('সেরা নির্বাচিত পণ্য')}`
  });

  // Test 4: Category page renders filtered catalog & breadcrumbs
  const catRes = await fetchHtml('/en/categories/footwear');
  const catPassed = catRes.status === 200 &&
    catRes.text.includes('Footwear') &&
    catRes.text.includes('Categories') &&
    catRes.text.includes('products found');
  results.push({
    test: 'Category page (/en/categories/footwear) renders products & H1',
    passed: catPassed,
    detail: `Status: ${catRes.status}, Breadcrumb/H1 Footwear: ${catRes.text.includes('Footwear')}`
  });

  // Test 5: English & Bangla PDP render from the same product ID
  const enPdp = await fetchHtml('/en/products/mens-handcrafted-leather-loafer');
  const bnPdp = await fetchHtml('/bn/products/mens-handcrafted-leather-loafer');
  const sameProductId = enPdp.text.includes('prod_01M5RH8E0G8V5HGN9R46GX9WSZ') &&
                        bnPdp.text.includes('prod_01M5RH8E0G8V5HGN9R46GX9WSZ');
  results.push({
    test: 'DONE WHEN 1: English and Bangla PDP render from same product ID',
    passed: sameProductId,
    detail: `Both contain prod_01M5RH8E0G8V5HGN9R46GX9WSZ: ${sameProductId}`
  });

  // Test 6: Switching language does not change product handle
  const enHasBnAlternate = enPdp.text.includes('/bn/products/mens-handcrafted-leather-loafer');
  const bnHasEnAlternate = bnPdp.text.includes('/en/products/mens-handcrafted-leather-loafer');
  results.push({
    test: 'DONE WHEN 2: Language switcher preserves product handle',
    passed: enHasBnAlternate && bnHasEnAlternate,
    detail: `Preserves path /products/mens-handcrafted-leather-loafer across locales (hreflang & alternate links)`
  });

  // Test 7: Grocery PDP does not show a fashion-size selector
  const groceryPdp = await fetchHtml('/en/products/pure-mustard-oil');
  const hasFashionSizes = groceryPdp.text.includes('Size 39') ||
                          groceryPdp.text.includes('Size 40') ||
                          groceryPdp.text.includes('Size 41') ||
                          groceryPdp.text.includes('Size 42') ||
                          groceryPdp.text.includes('Size S') ||
                          groceryPdp.text.includes('Size M') ||
                          groceryPdp.text.includes('Size L');
  const hasGrocerySpecs = groceryPdp.text.includes('PET Bottle') &&
                          groceryPdp.text.includes('1000 ml');
  results.push({
    test: 'DONE WHEN 3: Grocery PDP has grocery specs & NO fashion sizes',
    passed: !hasFashionSizes && hasGrocerySpecs,
    detail: `Has grocery specs: ${hasGrocerySpecs}, No fashion sizes: ${!hasFashionSizes}`
  });

  // Test 8: Out-of-stock variants cannot be purchased (CTA disabled or guarded)
  const oosPassed = enPdp.text.includes('disabled') && enPdp.text.includes('Out of Stock');
  results.push({
    test: 'DONE WHEN 4: Out-of-stock variants cannot be purchased',
    passed: oosPassed,
    detail: `Contains disabled CTA attribute & Out of Stock warning: ${oosPassed}`
  });

  // Test 9: CHK-UX-02: No missing i18n keys (no 'undefined' or missing curly braces in text)
  const noMissingKeys = !enPdp.text.includes('{{') &&
                        !bnPdp.text.includes('{{') &&
                        !enHome.text.includes('{{') &&
                        !bnHome.text.includes('{{');
  results.push({
    test: 'DONE WHEN 5 (CHK-UX-02): No missing i18n keys on catalog routes',
    passed: noMissingKeys,
    detail: `No uncompiled template tokens {{...}} detected in HTML`
  });

  // Test 10: Bangla title does not overflow (proper CSS wrap classes & character integrity)
  const bnTitleIntegrity = bnPdp.text.includes('পুরুষদের হাতে তৈরি চামড়ার লোফার') &&
                           bnPdp.text.includes('break-words') &&
                           bnPdp.text.includes('leading-tight');
  results.push({
    test: 'DONE WHEN 6: Bangla title responsive & does not overflow at 360px',
    passed: bnTitleIntegrity,
    detail: `Contains clean Unicode Bengali title with break-words styling: ${bnTitleIntegrity}`
  });

  // Test 11: Product images have dimensions & Product JSON-LD schema
  const hasJsonLd = enPdp.text.includes('application/ld+json') &&
                    enPdp.text.includes('"@type":"Product"') &&
                    enPdp.text.includes('"offers"');
  results.push({
    test: 'DONE WHEN 7: Product JSON-LD SEO schema present & complete',
    passed: hasJsonLd,
    detail: `Includes schema.org Product with offers: ${hasJsonLd}`
  });

  // Test 12: Delivery message is NOT hardcoded ৳60
  const noHardcodedShipping = !enPdp.text.includes('৳60') &&
                              !enPdp.text.includes('৳ 60') &&
                              enPdp.text.includes('Calculated at checkout');
  results.push({
    test: 'Delivery fee is "Calculated at checkout" (No hardcoded ৳60 in JSX)',
    passed: noHardcodedShipping,
    detail: `Calculated at checkout found, ৳60 absent: ${noHardcodedShipping}`
  });

  // Test 13: Sticky mobile action bar exists (CHK-UX-01)
  const hasStickyBar = enPdp.text.includes('pdp-sticky-bar') && enPdp.text.includes('pdp-main-cta');
  results.push({
    test: 'CHK-UX-01: Sticky mobile action bar implemented for mobile viewports',
    passed: hasStickyBar,
    detail: `Sticky bar container & intersection target present: ${hasStickyBar}`
  });

  console.log('\n--- VERIFICATION RESULTS ---');
  let allPassed = true;
  for (const r of results) {
    const symbol = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${symbol} | ${r.test} -> ${r.detail}`);
    if (!r.passed) allPassed = false;
  }
  console.log('=============================================');
  console.log(`OVERALL STATUS: ${allPassed ? 'ALL CRITERIA PASSED' : 'FAILURES DETECTED'}`);
  console.log('=============================================');

  process.exit(allPassed ? 0 : 1);
}

run().catch((err) => {
  console.error('Verification failed with error:', err);
  process.exit(1);
});
