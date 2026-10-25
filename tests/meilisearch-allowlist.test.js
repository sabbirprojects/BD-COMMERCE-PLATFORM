/**
 * Integration Test: Meilisearch Search Allowlist & COGS Stripping
 *
 * Requirements:
 * - CHK-CAT-08 [P0]: Meilisearch allowlist stripping confidential COGS/margins
 * - C-1: Cost and margin privacy across search engine indices
 * - Architecture §19 / database.md §1.6
 */

const assert = require('assert')
const path = require('path')

const {
  SEARCH_PUBLIC_FIELDS,
  EXCLUDED_FIELDS,
  EXCLUDED_PATTERNS,
  isFieldAllowed,
  sanitizeSearchDocument,
} = require('../apps/medusa/.medusa/server/src/search/allowlist.js')

const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || 'http://localhost:7700'
const MEILI_MASTER_KEY =
  process.env.MEILI_MASTER_KEY ||
  'cce7abcbac8634457875c50ace74e4f672aa38a60dc378b83512e901015afb1b'

function recursivelyCheckForbiddenKeys(obj, pathPrefix = '') {
  const violations = []
  if (!obj || typeof obj !== 'object') return violations

  if (Array.isArray(obj)) {
    obj.forEach((item, idx) => {
      violations.push(...recursivelyCheckForbiddenKeys(item, `${pathPrefix}[${idx}]`))
    })
    return violations
  }

  for (const [key, value] of Object.entries(obj)) {
    const fullPath = pathPrefix ? `${pathPrefix}.${key}` : key

    // Check against forbidden exclusions
    if (EXCLUDED_FIELDS.includes(key)) {
      violations.push(`Explicit forbidden field found at ${fullPath}`)
    }
    for (const pattern of EXCLUDED_PATTERNS) {
      if (pattern.test(key)) {
        violations.push(`Forbidden pattern '${pattern}' matched field at ${fullPath}`)
      }
    }

    if (value && typeof value === 'object') {
      violations.push(...recursivelyCheckForbiddenKeys(value, fullPath))
    }
  }

  return violations
}

async function runMeilisearchAllowlistTests() {
  console.log('===============================================================')
  console.log('🧪 P0 Test Suite 3: Meilisearch Allowlist & Confidential Scrubbing (CHK-CAT-08)')
  console.log('===============================================================\n')

  let passedAssertions = 0

  // 1. Unit Tests for Allowlist Rules
  console.log('🔹 Step 1: Testing allowlist filter functions...')

  assert.strictEqual(isFieldAllowed('cogs_paisa'), false, 'cogs_paisa must be rejected')
  passedAssertions++
  assert.strictEqual(isFieldAllowed('cost_per_unit_paisa'), false, 'cost_per_unit_paisa must be rejected')
  passedAssertions++
  assert.strictEqual(isFieldAllowed('packaging_cost_paisa'), false, 'packaging_cost_paisa must be rejected')
  passedAssertions++
  assert.strictEqual(isFieldAllowed('supplier_name'), false, 'supplier_name must be rejected')
  passedAssertions++
  assert.strictEqual(isFieldAllowed('margin'), false, 'margin must be rejected')
  passedAssertions++
  assert.strictEqual(isFieldAllowed('minimum_margin_percent'), false, 'minimum_margin_percent must be rejected')
  passedAssertions++
  assert.strictEqual(isFieldAllowed('custom_cost_paisa'), false, '*_paisa pattern must be rejected')
  passedAssertions++
  assert.strictEqual(isFieldAllowed('title_bn'), true, 'title_bn must be allowed')
  passedAssertions++
  assert.strictEqual(isFieldAllowed('price_bdt'), true, 'price_bdt must be allowed')
  passedAssertions++
  assert.strictEqual(isFieldAllowed('available_quantity'), true, 'available_quantity must be allowed')
  passedAssertions++

  console.log(`  ✓ Passed ${passedAssertions} field rule assertions`)

  // 2. Unit Test for sanitizeSearchDocument
  console.log('\n🔹 Step 2: Testing deep document sanitizer...')
  const rawTestDoc = {
    id: 'prod_test_001',
    title: 'Silk Panjabi',
    price_bdt: 2500,
    cogs_paisa: 120000,
    cost_per_unit_paisa: 110000,
    supplier_name: 'Confidential Mills Ltd',
    margin: 45.5,
    variants: [
      {
        id: 'var_test_001',
        title: 'Size 40',
        cogs_paisa: 120000,
        supplier_sku: 'SUPP-40-PANJ',
        in_stock: true,
      },
    ],
  }

  const sanitized = sanitizeSearchDocument(rawTestDoc)
  assert.strictEqual(sanitized.id, 'prod_test_001')
  assert.strictEqual(sanitized.price_bdt, 2500)
  assert.strictEqual(sanitized.cogs_paisa, undefined, 'cogs_paisa must be stripped')
  assert.strictEqual(sanitized.cost_per_unit_paisa, undefined, 'cost_per_unit_paisa must be stripped')
  assert.strictEqual(sanitized.supplier_name, undefined, 'supplier_name must be stripped')
  assert.strictEqual(sanitized.margin, undefined, 'margin must be stripped')
  assert.strictEqual(sanitized.variants[0].cogs_paisa, undefined, 'nested cogs_paisa must be stripped')
  assert.strictEqual(sanitized.variants[0].supplier_sku, undefined, 'nested supplier_sku must be stripped')
  assert.strictEqual(sanitized.variants[0].in_stock, true)
  passedAssertions += 9
  console.log('  ✓ Deep document sanitization verified')

  // 3. Live Meilisearch Document Scan
  console.log('\n🔹 Step 3: Scanning live Meilisearch instance for confidential data leaks...')
  const fetchUrl = `${MEILISEARCH_HOST}/indexes/products/documents?limit=100`
  const res = await fetch(fetchUrl, {
    headers: {
      Authorization: `Bearer ${MEILI_MASTER_KEY}`,
    },
  })

  if (!res.ok) {
    throw new Error(`Failed to query Meilisearch (HTTP ${res.status}): ${await res.text()}`)
  }

  const data = await res.json()
  const documents = data.results || []
  console.log(`  Found ${documents.length} live documents in Meilisearch products index.`)

  assert.ok(documents.length > 0, 'Meilisearch products index must contain indexed catalog documents')
  passedAssertions++

  let totalKeysInspected = 0
  for (const doc of documents) {
    const violations = recursivelyCheckForbiddenKeys(doc)
    if (violations.length > 0) {
      throw new Error(`Confidential data leak detected in product ${doc.id}:\n${violations.join('\n')}`)
    }
    totalKeysInspected += Object.keys(doc).length
  }

  passedAssertions++
  console.log(`  ✓ Inspected ${totalKeysInspected} keys across ${documents.length} documents. Zero confidential leaks found!`)

  console.log('\n===============================================================')
  console.log(`🎉 CHK-CAT-08 / C-1 PASSED: All ${passedAssertions} assertions verified cleanly.`)
  console.log('===============================================================\n')
}

if (require.main === module) {
  runMeilisearchAllowlistTests().catch((err) => {
    console.error('❌ Meilisearch allowlist test failed:', err)
    process.exit(1)
  })
}

module.exports = { runMeilisearchAllowlistTests }
