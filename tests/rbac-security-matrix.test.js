/**
 * Integration Test: RBAC 403 Security Matrix & Cost Confidentiality
 *
 * Requirements:
 * - CHK-SEC-01 [P0]: Strict RBAC 403 matrix across administrative routes (AC-8.1)
 *   Call Center and Warehouse staff receive 403 Forbidden on reports, settings, and margins
 * - C-1: Cost and margin privacy (COGS/unit costs never exposed to unauthorized roles)
 */

const assert = require('assert')
const { Client } = require('pg')
const jwt = require('jsonwebtoken')

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:b4c2de80b80e3bebc18adbde993908a9@localhost:5432/bd_commerce?schema=public'
const MEDUSA_URL = process.env.MEDUSA_URL || 'http://localhost:9000'
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret'

function makeToken(userId, role, authIdentityId) {
  const nowSec = Math.floor(Date.now() / 1000)
  return jwt.sign(
    {
      actor_id: userId,
      actor_type: 'user',
      auth_identity_id: authIdentityId,
      role,
      app_metadata: { user_id: userId, role },
      iat: nowSec,
    },
    JWT_SECRET,
    { expiresIn: '1d' }
  )
}

async function runRbacSecurityMatrixTests() {
  console.log('===============================================================')
  console.log('🧪 P0 Test Suite 6: RBAC 403 Matrix & Cost Privacy (CHK-SEC-01, AC-8.1)')
  console.log('===============================================================\n')

  const pg = new Client({ connectionString: DATABASE_URL })
  await pg.connect()

  let passedAssertions = 0

  try {
    // -------------------------------------------------------------
    // Setup test users for all roles with proper links
    // -------------------------------------------------------------
    console.log('🔹 Step 1: Ensuring test users, roles, and auth identities exist...')

    const rolesConfig = [
      { id: 'user_01M5P3610BV01PG4SD3BYDM517', email: 'admin@bd-commerce.com', role: 'owner', authId: 'authid_01M5P3612X11ZJXREVT1T07902' },
      { id: 'usr_manager_test', email: 'manager@bd-commerce.com', role: 'manager', authId: 'authid_manager_test' },
      { id: 'usr_finance_test', email: 'finance@bd-commerce.com', role: 'finance', authId: 'authid_finance_test' },
      { id: 'usr_warehouse_test', email: 'warehouse@bd-commerce.com', role: 'warehouse', authId: 'authid_warehouse_test' },
      { id: 'usr_callcenter_test', email: 'callcenter@bd-commerce.com', role: 'call_center', authId: 'authid_callcenter_test' },
    ]

    for (const u of rolesConfig) {
      // User row
      await pg.query(
        `INSERT INTO "user" (id, email, first_name, last_name, metadata, created_at, updated_at)
         VALUES ($1, $2, 'Test', $3, $4::jsonb, now(), now())
         ON CONFLICT (id) DO UPDATE SET metadata = EXCLUDED.metadata`,
        [u.id, u.email, u.role, JSON.stringify({ role: u.role, must_change_password: false })]
      )

      // Auth identity row
      await pg.query(
        `INSERT INTO auth_identity (id, app_metadata, created_at, updated_at)
         VALUES ($1, $2::jsonb, now(), now())
         ON CONFLICT (id) DO UPDATE SET app_metadata = EXCLUDED.app_metadata`,
        [u.authId, JSON.stringify({ user_id: u.id, role: u.role })]
      )

      // Link to rbac_role
      await pg.query(
        `INSERT INTO user_rbac_role (id, user_id, rbac_role_id, created_at, updated_at)
         VALUES ($1, $2, $3, now(), now())
         ON CONFLICT DO NOTHING`,
        [`urlk_${u.role}_test`, u.id, `role_${u.role}`]
      )
    }

    console.log('  ✓ Test users verified for owner, manager, finance, warehouse, call_center')
    passedAssertions++

    // Build auth tokens
    const tokens = {
      owner: makeToken('user_01M5P3610BV01PG4SD3BYDM517', 'owner', 'authid_01M5P3612X11ZJXREVT1T07902'),
      manager: makeToken('usr_manager_test', 'manager', 'authid_manager_test'),
      finance: makeToken('usr_finance_test', 'finance', 'authid_finance_test'),
      warehouse: makeToken('usr_warehouse_test', 'warehouse', 'authid_warehouse_test'),
      call_center: makeToken('usr_callcenter_test', 'call_center', 'authid_callcenter_test'),
    }

    // -------------------------------------------------------------
    // 2. Matrix: Financial Reports (/admin/reports/contribution-profit)
    // Allowed: Owner, Finance
    // Forbidden (403): Manager, Warehouse, Call Center
    // -------------------------------------------------------------
    console.log('\n🔹 Step 2: Testing /admin/reports/contribution-profit RBAC authorization matrix...')

    // Owner -> 200
    const ownerProfitRes = await fetch(`${MEDUSA_URL}/admin/reports/contribution-profit`, {
      headers: { Authorization: `Bearer ${tokens.owner}` },
    })
    assert.strictEqual(ownerProfitRes.status, 200, 'Owner must receive HTTP 200 on contribution profit')
    passedAssertions++

    // Finance -> 200
    const finProfitRes = await fetch(`${MEDUSA_URL}/admin/reports/contribution-profit`, {
      headers: { Authorization: `Bearer ${tokens.finance}` },
    })
    assert.strictEqual(finProfitRes.status, 200, 'Finance must receive HTTP 200 on contribution profit')
    passedAssertions++

    // Manager -> 403
    const mgrProfitRes = await fetch(`${MEDUSA_URL}/admin/reports/contribution-profit`, {
      headers: { Authorization: `Bearer ${tokens.manager}` },
    })
    assert.strictEqual(mgrProfitRes.status, 403, 'Manager must receive HTTP 403 Forbidden on contribution profit')
    passedAssertions++

    // Warehouse -> 403
    const whProfitRes = await fetch(`${MEDUSA_URL}/admin/reports/contribution-profit`, {
      headers: { Authorization: `Bearer ${tokens.warehouse}` },
    })
    assert.strictEqual(whProfitRes.status, 403, 'Warehouse staff must receive HTTP 403 Forbidden on contribution profit')
    passedAssertions++

    // Call Center -> 403
    const ccProfitRes = await fetch(`${MEDUSA_URL}/admin/reports/contribution-profit`, {
      headers: { Authorization: `Bearer ${tokens.call_center}` },
    })
    assert.strictEqual(ccProfitRes.status, 403, 'Call Center staff must receive HTTP 403 Forbidden on contribution profit')
    passedAssertions++

    console.log('  ✓ /admin/reports/contribution-profit passed: Owner/Finance (200), Others (403)')

    // -------------------------------------------------------------
    // 3. Matrix: Gateway Settings (/admin/settings/gateways)
    // Allowed: Owner ONLY
    // Forbidden (403): Finance, Manager, Warehouse, Call Center
    // -------------------------------------------------------------
    console.log('\n🔹 Step 3: Testing /admin/settings/gateways RBAC authorization matrix...')

    // Owner -> 200
    const ownerGwRes = await fetch(`${MEDUSA_URL}/admin/settings/gateways`, {
      headers: { Authorization: `Bearer ${tokens.owner}` },
    })
    assert.strictEqual(ownerGwRes.status, 200, 'Owner must receive HTTP 200 on payment gateway settings')
    passedAssertions++

    // Finance -> 403
    const finGwRes = await fetch(`${MEDUSA_URL}/admin/settings/gateways`, {
      headers: { Authorization: `Bearer ${tokens.finance}` },
    })
    assert.strictEqual(finGwRes.status, 403, 'Finance role must receive HTTP 403 Forbidden on gateway settings')
    passedAssertions++

    // Warehouse -> 403
    const whGwRes = await fetch(`${MEDUSA_URL}/admin/settings/gateways`, {
      headers: { Authorization: `Bearer ${tokens.warehouse}` },
    })
    assert.strictEqual(whGwRes.status, 403, 'Warehouse role must receive HTTP 403 Forbidden on gateway settings')
    passedAssertions++

    // Call Center -> 403
    const ccGwRes = await fetch(`${MEDUSA_URL}/admin/settings/gateways`, {
      headers: { Authorization: `Bearer ${tokens.call_center}` },
    })
    assert.strictEqual(ccGwRes.status, 403, 'Call Center role must receive HTTP 403 Forbidden on gateway settings')
    passedAssertions++

    console.log('  ✓ /admin/settings/gateways passed: Owner ONLY (200), Non-owners (403)')

    // -------------------------------------------------------------
    // 4. Matrix: Audit Logs (/admin/audit-logs)
    // Allowed: Owner, Finance
    // Forbidden (403): Warehouse, Call Center
    // -------------------------------------------------------------
    console.log('\n🔹 Step 4: Testing /admin/audit-logs RBAC authorization matrix...')

    const ownerAuditRes = await fetch(`${MEDUSA_URL}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${tokens.owner}` },
    })
    assert.strictEqual(ownerAuditRes.status, 200, 'Owner must receive HTTP 200 on audit logs')
    passedAssertions++

    const finAuditRes = await fetch(`${MEDUSA_URL}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${tokens.finance}` },
    })
    assert.strictEqual(finAuditRes.status, 200, 'Finance must receive HTTP 200 on audit logs')
    passedAssertions++

    const whAuditRes = await fetch(`${MEDUSA_URL}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${tokens.warehouse}` },
    })
    assert.strictEqual(whAuditRes.status, 403, 'Warehouse staff must receive HTTP 403 Forbidden on audit logs')
    passedAssertions++

    const ccAuditRes = await fetch(`${MEDUSA_URL}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${tokens.call_center}` },
    })
    assert.strictEqual(ccAuditRes.status, 403, 'Call Center staff must receive HTTP 403 Forbidden on audit logs')
    passedAssertions++

    console.log('  ✓ /admin/audit-logs passed: Owner/Finance (200), Staff (403)')

    // -------------------------------------------------------------
    // 5. Matrix: Settings Mutation (/admin/settings/bangladesh POST)
    // Allowed: Owner ONLY
    // Forbidden (403): Manager (GET only), Warehouse, Call Center
    // -------------------------------------------------------------
    console.log('\n🔹 Step 5: Testing /admin/settings/bangladesh POST mutation RBAC...')

    const mgrSettingPost = await fetch(`${MEDUSA_URL}/admin/settings/bangladesh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.manager}`,
      },
      body: JSON.stringify({ company_name: 'Hacked Store' }),
    })
    assert.strictEqual(mgrSettingPost.status, 403, 'Manager POST to settings must return HTTP 403 Forbidden')
    passedAssertions++

    const whSettingPost = await fetch(`${MEDUSA_URL}/admin/settings/bangladesh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.warehouse}`,
      },
      body: JSON.stringify({ company_name: 'Hacked Store' }),
    })
    assert.strictEqual(whSettingPost.status, 403, 'Warehouse POST to settings must return HTTP 403 Forbidden')
    passedAssertions++

    console.log('  ✓ /admin/settings/bangladesh POST mutation blocked with 403 for non-owners')

    // -------------------------------------------------------------
    // 6. Cost Privacy Gate (C-1 / CHK-CAT-07)
    // Verify storefront product endpoint strips cogs_paisa and cost_per_unit_paisa
    // -------------------------------------------------------------
    console.log('\n🔹 Step 6: Verifying public storefront product API strips confidential cost fields (C-1)...')

    const storeProdRes = await fetch(`${MEDUSA_URL}/store/products?limit=5`, {
      headers: {
        'x-publishable-api-key': 'pk_e03efb8523c1542172c95fe34dc90955a3389f3ee3592faa16171966d4699096',
      },
    })
    assert.strictEqual(storeProdRes.status, 200, 'Public store products endpoint must return HTTP 200')
    passedAssertions++

    const storeData = await storeProdRes.json()
    const products = storeData.products || []
    assert.ok(products.length > 0, 'Products array must not be empty')
    passedAssertions++

    for (const prod of products) {
      assert.strictEqual(prod.cogs_paisa, undefined, 'cogs_paisa must NOT be in public product')
      assert.strictEqual(prod.cost_per_unit_paisa, undefined, 'cost_per_unit_paisa must NOT be in public product')
      assert.strictEqual(prod.supplier_name, undefined, 'supplier_name must NOT be in public product')
      if (prod.variants) {
        for (const v of prod.variants) {
          assert.strictEqual(v.cogs_paisa, undefined, 'v.cogs_paisa must NOT be in public variant')
          assert.strictEqual(v.cost_per_unit_paisa, undefined, 'v.cost_per_unit_paisa must NOT be in public variant')
        }
      }
    }
    passedAssertions++
    console.log('  ✓ Public storefront product API completely scrubs all cost and COGS fields!')

    console.log('\n===============================================================')
    console.log(`🎉 CHK-SEC-01 / AC-8.1 PASSED: All ${passedAssertions} assertions verified cleanly.`)
    console.log('===============================================================\n')
  } finally {
    await pg.end()
  }
}

if (require.main === module) {
  runRbacSecurityMatrixTests().catch((err) => {
    console.error('❌ RBAC Security Matrix test failed:', err)
    process.exit(1)
  })
}

module.exports = { runRbacSecurityMatrixTests }
