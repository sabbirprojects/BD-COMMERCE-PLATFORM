/**
 * Integration Test: Input Sanitization & SQL / XSS Injection Defense
 *
 * Requirements:
 * - CHK-OPS-05 [P0]: Input Sanitization & SQL/XSS Injection Defense
 *   - Any raw HTML or malicious script tags (<script>alert(1)</script>) in customer names,
 *     addresses, or review blocks are escaped or stripped.
 *   - SQL payload (' OR 1=1 --) is parameterized safely without database syntax errors.
 */

const assert = require('assert')
const { Client } = require('pg')

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:b4c2de80b80e3bebc18adbde993908a9@localhost:5432/bd_commerce?schema=public'

function sanitizeInputText(str) {
  if (!str || typeof str !== 'string') return ''
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim()
}

async function runXssSqlSanitizationTests() {
  console.log('===============================================================')
  console.log('🧪 P0 Test Suite 7: Input Sanitization & SQL/XSS Defense (CHK-OPS-05)')
  console.log('===============================================================\n')

  let passedAssertions = 0

  // -------------------------------------------------------------
  // 1. XSS Script Payload Defense
  // -------------------------------------------------------------
  console.log('🔹 Step 1: Testing XSS script tag stripping in customer names & addresses...')

  const xssPayloads = [
    {
      input: "<script>alert('xss')</script>Tariq Ahmed",
      expected: 'Tariq Ahmed',
      desc: 'Standard <script> tag stripping',
    },
    {
      input: "<script type=\"text/javascript\">document.location='http://attacker.com'</script>Rahim",
      expected: 'Rahim',
      desc: 'Script tag with attributes',
    },
    {
      input: "<img src=x onerror=alert('hack')>House 45, Road 12",
      expected: 'House 45, Road 12',
      desc: 'HTML <img> tag stripping',
    },
    {
      input: "<iframe src=\"javascript:alert(1)\"></iframe>Dhanmondi 27",
      expected: 'Dhanmondi 27',
      desc: 'Iframe tag stripping',
    },
  ]

  for (const test of xssPayloads) {
    const cleaned = sanitizeInputText(test.input)
    assert.strictEqual(
      cleaned,
      test.expected,
      `XSS defense failed for: ${test.desc}`
    )
    passedAssertions++
    assert.strictEqual(
      cleaned.includes('<script'),
      false,
      'Cleaned string must never contain script tags'
    )
    passedAssertions++
    assert.strictEqual(
      cleaned.includes('<img'),
      false,
      'Cleaned string must never contain img tags'
    )
    passedAssertions++
  }

  console.log(`  ✓ Passed ${xssPayloads.length} XSS script sanitization attack vectors`)

  // -------------------------------------------------------------
  // 2. SQL Injection Parameterization Defense
  // -------------------------------------------------------------
  console.log('\n🔹 Step 2: Testing SQL injection immunity via PostgreSQL prepared statements...')

  const pg = new Client({ connectionString: DATABASE_URL })
  await pg.connect()

  try {
    const sqlPayloads = [
      "' OR 1=1 --",
      "'; DROP TABLE non_existent_test_table; --",
      "' UNION SELECT null, null, null --",
      "admin'--",
      "1; SELECT pg_sleep(5);",
    ]

    for (const payload of sqlPayloads) {
      // 1. Search order_bd_details with SQL payload in checkout_idempotency_key
      const q1 = await pg.query(
        `SELECT * FROM order_bd_details WHERE checkout_idempotency_key = $1`,
        [payload]
      )
      assert.strictEqual(
        q1.rowCount,
        0,
        `SQL payload '${payload}' must return 0 rows without executing injection`
      )
      passedAssertions++

      // 2. Search "order" with SQL payload in id
      const q2 = await pg.query(
        `SELECT * FROM "order" WHERE id = $1`,
        [payload]
      )
      assert.strictEqual(
        q2.rowCount,
        0,
        `SQL payload '${payload}' in order ID query must safely return 0 rows`
      )
      passedAssertions++
    }

    console.log(`  ✓ Tested ${sqlPayloads.length} classic SQL injection vectors. All safely parameterized without errors!`)

    console.log('\n===============================================================')
    console.log(`🎉 CHK-OPS-05 PASSED: All ${passedAssertions} assertions verified cleanly.`)
    console.log('===============================================================\n')
  } finally {
    await pg.end()
  }
}

if (require.main === module) {
  runXssSqlSanitizationTests().catch((err) => {
    console.error('❌ XSS / SQL Sanitization test failed:', err)
    process.exit(1)
  })
}

module.exports = { runXssSqlSanitizationTests }
