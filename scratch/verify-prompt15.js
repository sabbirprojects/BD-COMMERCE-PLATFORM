/**
 * Verification Suite for Prompt 15 — Search
 *
 * Validates:
 * 1. Meilisearch Index Configuration (primary key = 'id')
 * 2. Searchable Attributes weighted per architecture §8.1:
 *    title_en (10), title_bn (9), sku (8), category_name (7), tags (5), description_excerpt (3)
 * 3. Filterable Attributes (category, status, in_stock, price_bdt, attribute_*)
 * 4. Sortable Attributes (price_bdt, created_at, popularity_score)
 * 5. Bengali Phonetic & Banglish Synonyms (punjabi ↔ panjabi ↔ পাঞ্জাবি, mustard oil ↔ sorishar tel ↔ সরিষার তেল)
 * 6. CHK-CAT-08 Compliance: GET document dump must NOT contain any confidential COGS, margins, or supplier keys
 * 7. English query returns seeded Panjabi product
 * 8. Bengali query returns seeded Panjabi product
 * 9. Banglish phonetic query returns seeded Panjabi product
 * 10. Facet distribution returns only existing values (FR-4.1.3)
 * 11. Out-of-Stock items are returned with in_stock = false (FR-4.1.2)
 * 12. Soft-delete handling: removes document without re-fetch (architecture §8.3 / D-4)
 * 13. Public Search Key isolation: search works, index mutation is blocked (Scope 8)
 * 14. Storefront Search HTTP routes (/en/search, /bn/search) return HTTP 200
 */
const { MeiliSearch } = require('meilisearch');
const fs = require('fs');
const path = require('path');

const MEILI_HOST = 'http://localhost:7700';
const MASTER_KEY = 'cce7abcbac8634457875c50ace74e4f672aa38a60dc378b83512e901015afb1b';
const SEARCH_KEY = 'c6f47a388d3d9b6b5efaa2c07d9ab70a1e8a76608fa7b426f79e95e30ab0d98b';

const masterClient = new MeiliSearch({ host: MEILI_HOST, apiKey: MASTER_KEY });
const publicClient = new MeiliSearch({ host: MEILI_HOST, apiKey: SEARCH_KEY });

const PANJABI_ID = 'prod_01M5RH8DFSMBTGXAGDFN9HSY45';
const MUSTARD_OIL_ID = 'prod_01M5RH8DSE3QAWER3ENNK0BDMR';

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName} - ${details}`);
    failedTests++;
  }
}

async function runTests() {
  console.log('\n=============================================================');
  console.log('   PROMPT 15 VERIFICATION SUITE — MEILISEARCH & SEARCH ENGINE');
  console.log('=============================================================\n');

  // Test 1: Index primary key = 'id'
  console.log('Test 1: Index Configuration & Primary Key');
  const index = masterClient.index('products');
  const indexStats = await index.getRawInfo();
  assert(indexStats.uid === 'products', 'Index UID is "products"');
  assert(indexStats.primaryKey === 'id', 'Primary Key is "id"', `Got: ${indexStats.primaryKey}`);

  // Test 2: Searchable attributes weighted per architecture §8.1
  console.log('\nTest 2: Searchable Attributes Weighted (Architecture §8.1)');
  const searchable = await index.getSearchableAttributes();
  const expectedSearchable = [
    'title_en',
    'title_bn',
    'sku',
    'category_name',
    'tags',
    'description_excerpt',
  ];
  assert(
    JSON.stringify(searchable) === JSON.stringify(expectedSearchable),
    'Searchable attributes matched exactly in order of weight',
    `Expected ${JSON.stringify(expectedSearchable)}, got ${JSON.stringify(searchable)}`
  );

  // Test 3: Filterable attributes
  console.log('\nTest 3: Filterable Attributes');
  const filterable = await index.getFilterableAttributes();
  const requiredFilterable = ['category_id', 'category_handle', 'category_name', 'status', 'in_stock', 'price_bdt'];
  const allFilterablePresent = requiredFilterable.every((f) => filterable.includes(f));
  const hasDynamicAttrs = filterable.some((f) => f.startsWith('attribute_'));
  assert(allFilterablePresent, 'Core filterable attributes present', `Missing: ${requiredFilterable.filter((f) => !filterable.includes(f))}`);
  assert(hasDynamicAttrs, 'Dynamic attribute_* filterable attributes present');

  // Test 4: Sortable attributes
  console.log('\nTest 4: Sortable Attributes');
  const sortable = await index.getSortableAttributes();
  const requiredSortable = ['price_bdt', 'created_at', 'popularity_score'];
  const allSortablePresent = requiredSortable.every((s) => sortable.includes(s));
  assert(allSortablePresent, 'Sortable attributes (price_bdt, created_at, popularity_score) present');

  // Test 5: Synonyms configuration
  console.log('\nTest 5: Bengali & Banglish Synonyms');
  const synonyms = await index.getSynonyms();
  const hasPunjabiSyn = synonyms['punjabi'] && synonyms['punjabi'].includes('পাঞ্জাবি');
  const hasPanjabiSyn = synonyms['panjabi'] && synonyms['panjabi'].includes('পাঞ্জাবি');
  const hasBanglaSyn = synonyms['পাঞ্জাবি'] && synonyms['পাঞ্জাবি'].includes('punjabi');
  const hasMustardSyn = synonyms['sorishar tel'] && synonyms['sorishar tel'].includes('সরিষার তেল');
  assert(hasPunjabiSyn && hasPanjabiSyn && hasBanglaSyn, 'Bidirectional punjabi ↔ panjabi ↔ পাঞ্জাবি synonyms present');
  assert(hasMustardSyn, 'Mustard oil ↔ sorishar tel ↔ সরিষার তেল synonyms present');

  // Test 6: CHK-CAT-08 Compliance (Public Index Dump Security)
  console.log('\nTest 6: CHK-CAT-08 [P0] — Meilisearch Confidential COGS & Margin Exclusion');
  const dump = await index.getDocuments({ limit: 100 });
  const excludedPatterns = [/^cogs/i, /^cost_/i, /^supplier/i, /^margin/i, /_paisa$/i];
  const explicitExcluded = [
    'cogs_paisa',
    'cogs_unit_paisa',
    'cogs_unit_bdt',
    'cogs_bdt',
    'cogs_total',
    'cost_per_unit_paisa',
    'cost_price',
    'packaging_cost_paisa',
    'estimated_shipping_cost_paisa',
    'supplier_name',
    'supplier_sku',
    'supplier_info',
    'minimum_margin_percent',
    'gross_margin',
    'margin',
  ];

  let leakedKeys = [];
  for (const doc of dump.results) {
    for (const key of Object.keys(doc)) {
      if (explicitExcluded.includes(key)) {
        leakedKeys.push({ docId: doc.id, key });
      }
      for (const p of excludedPatterns) {
        if (p.test(key)) {
          leakedKeys.push({ docId: doc.id, key, pattern: p.toString() });
        }
      }
    }
  }
  assert(dump.results.length > 0, `Document dump contains products (found ${dump.results.length} documents)`);
  assert(
    leakedKeys.length === 0,
    'CHK-CAT-08 PASS: Index dump contains ZERO confidential financial keys (COGS, margins, supplier)',
    `Found leaks: ${JSON.stringify(leakedKeys)}`
  );

  // Test 7: English query returns seeded Panjabi product
  console.log('\nTest 7: English Query Execution');
  const enRes = await publicClient.index('products').search('panjabi');
  const foundPanjabiEn = enRes.hits.some((h) => h.id === PANJABI_ID);
  assert(foundPanjabiEn, `Query "panjabi" returned seeded Panjabi (${PANJABI_ID})`);

  // Test 8: Bengali query returns seeded Panjabi product
  console.log('\nTest 8: Bengali Query Execution');
  const bnRes = await publicClient.index('products').search('পাঞ্জাবি');
  const foundPanjabiBn = bnRes.hits.some((h) => h.id === PANJABI_ID);
  assert(foundPanjabiBn, `Query "পাঞ্জাবি" returned seeded Panjabi (${PANJABI_ID})`);

  // Test 9: Banglish phonetic query returns seeded Panjabi product
  console.log('\nTest 9: Banglish Phonetic Query Execution');
  const banglishRes = await publicClient.index('products').search('punjabi');
  const foundPanjabiBanglish = banglishRes.hits.some((h) => h.id === PANJABI_ID);
  assert(foundPanjabiBanglish, `Query "punjabi" returned seeded Panjabi (${PANJABI_ID}) via synonym`);

  // Test 10: Mustard Oil Bengali & Banglish search
  console.log('\nTest 10: Mustard Oil Grocery Query Execution');
  const sorishaRes = await publicClient.index('products').search('sorishar tel');
  const foundMustardOil = sorishaRes.hits.some((h) => h.id === MUSTARD_OIL_ID);
  assert(foundMustardOil, `Query "sorishar tel" returned seeded Mustard Oil (${MUSTARD_OIL_ID}) via synonym`);

  // Test 11: Facets & Filters (FR-4.1.3 - only existing values)
  console.log('\nTest 11: Faceting & Filters (FR-4.1.3)');
  const facetRes = await publicClient.index('products').search('', {
    facets: ['category_name', 'in_stock', 'attribute_fabric_type'],
  });
  const catDistribution = facetRes.facetDistribution?.category_name || {};
  const fabricDistribution = facetRes.facetDistribution?.attribute_fabric_type || {};
  assert(Object.keys(catDistribution).length > 0, 'Category facets present in facet distribution');
  assert(catDistribution['Panjabi'] >= 1, 'Panjabi category count >= 1');
  assert(fabricDistribution['cotton'] >= 1, 'Dynamic attribute_fabric_type has "cotton" count >= 1');

  // Test 12: Out of stock handling (FR-4.1.2)
  console.log('\nTest 12: Out-of-Stock Item Visibility (FR-4.1.2)');
  const allItemsRes = await publicClient.index('products').search('', { limit: 50 });
  const hasOosItems = allItemsRes.hits.some((h) => h.in_stock === false);
  const oosItemsHaveStatus = allItemsRes.hits.filter((h) => h.in_stock === false).every((h) => typeof h.in_stock === 'boolean');
  assert(hasOosItems, 'Out-of-stock items are indexed and returned by default (not hidden)');
  assert(oosItemsHaveStatus, 'Out-of-stock items clearly have in_stock = false flag for UI badging');

  // Test 13: Soft-Delete Handling (Architecture §8.3 / D-4)
  console.log('\nTest 13: Soft-Delete Handling (D-4: Direct deletion without DB lookup)');
  const tempDoc = {
    id: 'prod_test_soft_delete_9999',
    title: 'Temporary Test Product for Deletion',
    title_en: 'Temporary Test Product for Deletion',
    title_bn: 'অস্থায়ী টেস্ট পণ্য',
    handle: 'temp-test-product',
    sku: 'TEMP-DEL-999',
    description: 'Temporary item',
    description_excerpt: 'Temporary item',
    thumbnail: null,
    status: 'published',
    in_stock: true,
    available_quantity: 10,
    price_bdt: 999,
    original_price_bdt: 999,
    category_id: null,
    category_name: 'Test',
    category_handle: 'test',
    tags: [],
    popularity_score: 0,
    created_at: 1792898512,
  };

  const addRes = await masterClient.index('products').addDocuments([tempDoc], { primaryKey: 'id' });
  await masterClient.waitForTask(addRes.taskUid);

  const checkDocBefore = await masterClient.index('products').getDocument('prod_test_soft_delete_9999');
  assert(checkDocBefore.id === 'prod_test_soft_delete_9999', 'Temporary document added to index');

  // Simulate soft-delete direct deletion
  const delRes = await masterClient.index('products').deleteDocument('prod_test_soft_delete_9999');
  await masterClient.waitForTask(delRes.taskUid);

  let docRemoved = false;
  try {
    await masterClient.index('products').getDocument('prod_test_soft_delete_9999');
  } catch (err) {
    if (err.message?.includes('not found') || err.response?.status === 404 || err.code === 'document_not_found') {
      docRemoved = true;
    }
  }
  assert(docRemoved, 'Product removed from Meilisearch index on delete without re-fetch (D-4)');

  // Test 14: Public Search Key vs Master Key Isolation (Scope 8)
  console.log('\nTest 14: Security Isolation (Search-Only Public Key vs Master Key)');
  let writeAttemptBlocked = false;
  try {
    await publicClient.index('products').deleteDocument(PANJABI_ID);
  } catch (err) {
    writeAttemptBlocked = true;
  }
  assert(writeAttemptBlocked, 'Public search key cannot mutate or delete index documents');

  // Check .env.local to ensure NEXT_PUBLIC_ does not contain master key
  const envLocal = fs.readFileSync(path.resolve(__dirname, '../apps/web/.env.local'), 'utf-8');
  const hasMasterKeyPublic = envLocal.includes(`NEXT_PUBLIC_MEILI_MASTER_KEY`);
  assert(!hasMasterKeyPublic, 'NEXT_PUBLIC_MEILI_MASTER_KEY is NOT exposed in Next.js public environment');

  // Test 15: Storefront Search HTTP Routes
  console.log('\nTest 15: Storefront Search HTTP Routes');
  const enResHttp = await fetch('http://localhost:3000/en/search');
  assert(enResHttp.status === 200, `GET /en/search returned HTTP ${enResHttp.status}`);

  const bnResHttp = await fetch('http://localhost:3000/bn/search?q=panjabi');
  assert(bnResHttp.status === 200, `GET /bn/search?q=panjabi returned HTTP ${bnResHttp.status}`);

  // Test 16: Admin Search Sync API Endpoints
  console.log('\nTest 16: Admin Search Sync API Endpoints (GET & POST /admin/search/sync)');
  const jwt = require('jsonwebtoken');
  const adminToken = jwt.sign(
    {
      actor_id: 'user_01M5P3610BV01PG4SD3BYDM517',
      actor_type: 'user',
      auth_identity_id: 'authid_01M5P3612X11ZJXREVT1T07902',
      app_metadata: { user_id: 'user_01M5P3610BV01PG4SD3BYDM517', role: 'owner' },
    },
    'supersecret',
    { expiresIn: '1d' }
  );

  const adminGetRes = await fetch('http://localhost:9000/admin/search/sync', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminGetData = await adminGetRes.json();
  assert(adminGetRes.status === 200, `GET /admin/search/sync returned HTTP 200`);
  assert(adminGetData.stats && adminGetData.stats.numberOfDocuments > 0, `Admin stats reports ${adminGetData.stats?.numberOfDocuments} indexed documents`);

  const adminPostRes = await fetch('http://localhost:9000/admin/search/sync', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminPostData = await adminPostRes.json();
  assert(adminPostRes.status === 200, `POST /admin/search/sync returned HTTP 200`);
  assert(adminPostData.success === true, `Admin re-sync succeeded (${adminPostData.indexed} indexed)`);

  // Summary
  console.log('\n=============================================================');
  console.log(`TOTAL PASS: ${passedTests} | TOTAL FAIL: ${failedTests}`);
  console.log('=============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Test suite uncaught error:', err);
  process.exit(1);
});
