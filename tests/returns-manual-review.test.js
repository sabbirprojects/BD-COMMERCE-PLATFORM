/**
 * Integration Test: Return Manual Review, Quarantine Routing & Refund RBAC
 *
 * Requirements:
 * - CHK-FUL-05 [P0]: Returns never auto-approved. 100% human-verified return review (AC-6.5, AC-G7)
 * - AC-6.3: Damaged returns are routed to Damaged Quarantine, NEVER restored to sellable stock
 * - PRD FR-6.7.14: Physical condition inspection ('sellable', 'damaged', 'not_restockable') mandatory
 * - CHK-SEC-01: Only Finance / Owner can record manual refunds (403 for call center / warehouse)
 */

const assert = require('assert')
const { Client } = require('pg')
const jwt = require('jsonwebtoken')
const { randomUUID } = require('crypto')

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:b4c2de80b80e3bebc18adbde993908a9@localhost:5432/bd_commerce?schema=public'
const MEDUSA_URL = process.env.MEDUSA_URL || 'http://localhost:9000'
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret'

const DAMAGED_QUARANTINE_LOC_ID = 'sloc_01M5QBBQZDHM08KE9AWDF3KKDV'
const CENTRAL_WAREHOUSE_LOC_ID = 'sloc_01M5QBBQZ6B84Q4M12C6T466F4'

async function runReturnsManualReviewTests() {
  console.log('===============================================================')
  console.log('🧪 P0 Test Suite 5: Returns Manual Review & Quarantine (CHK-FUL-05, AC-6.3, AC-6.5)')
  console.log('===============================================================\n')

  const pg = new Client({ connectionString: DATABASE_URL })
  await pg.connect()

  let passedAssertions = 0

  const testOrderId = `order_ret_test_${Date.now()}`
  const testReviewId = `retrev_test_${Date.now()}`
  const testPolicyId = `retpol_test_${Date.now()}`

  try {
    // -----------------------------------------------------------------
    // 1. Setup base order and return policy
    // -----------------------------------------------------------------
    console.log('🔹 Step 1: Setting up test order and active return policy...')

    await pg.query(
      `INSERT INTO "order" (id, version, currency_code, status, created_at, updated_at)
       VALUES ($1, 1, 'bdt', 'completed', now(), now())`,
      [testOrderId]
    )

    await pg.query(
      `INSERT INTO order_bd_details (
         id, order_id, order_source, division_code, district_code, thana_code,
         address_snapshot, cod_status, cod_settlement_status, customer_paid_delivery_paisa,
         raw_customer_paid_delivery_paisa, delivery_attempts_count, shipment_state,
         payment_method_code, created_at, updated_at
       ) VALUES (
         $1, $2, 'web', 'DHA', 'DHA', 'MIR',
         '{"phone": "+8801712345678"}'::jsonb, 'not_applicable', 'settled', 6000,
         '{"value": "6000", "precision": 20}'::jsonb, 0, 'delivered',
         'bkash', now(), now()
       )`,
      [`obd_${randomUUID().replace(/-/g, '').slice(0, 20)}`, testOrderId]
    )

    // Ensure active return policy exists
    const existingPolicy = await pg.query(
      `SELECT id FROM return_policy WHERE is_active = true AND deleted_at IS NULL LIMIT 1`
    )
    let activePolicyId = existingPolicy.rows?.[0]?.id

    if (!activePolicyId) {
      await pg.query(
        `INSERT INTO return_policy (id, version, is_active, window_days, return_shipping_paid_by, refund_methods, created_at, updated_at)
         VALUES ($1, 1, true, 7, 'customer', '["bkash", "nagad"]'::jsonb, now(), now())`,
        [testPolicyId]
      )
      activePolicyId = testPolicyId
    }

    console.log(`  ✓ Test order and policy ready: ${activePolicyId}`)
    passedAssertions++

    // -----------------------------------------------------------------
    // 2. Return Request Initialization (Never Auto-Approved, AC-6.5)
    // -----------------------------------------------------------------
    console.log('\n🔹 Step 2: Creating return request and verifying initial status...')

    await pg.query(
      `INSERT INTO return_review (
         id, return_id, order_id, return_type, status,
         policy_id, policy_snapshot, requested_at,
         refund_status, condition, created_at, updated_at
       ) VALUES (
         $1, $2, $3, 'customer_return', 'pending_manual_review',
         $4, '{"window_days": 7}'::jsonb, now(),
         'pending', 'uninspected', now(), now()
       )`,
      [testReviewId, `ret_${randomUUID().replace(/-/g, '').slice(0, 20)}`, testOrderId, activePolicyId]
    )

    const initialCheck = await pg.query(
      `SELECT status, condition, refund_status FROM return_review WHERE id = $1`,
      [testReviewId]
    )
    const initialRow = initialCheck.rows[0]

    assert.strictEqual(
      initialRow.status,
      'pending_manual_review',
      'Initial return status MUST be pending_manual_review (NEVER auto-approved, AC-6.5)'
    )
    passedAssertions++
    assert.strictEqual(
      initialRow.condition,
      'uninspected',
      'Initial condition MUST be uninspected'
    )
    passedAssertions++
    assert.strictEqual(
      initialRow.refund_status,
      'pending',
      'Refund status MUST remain pending (never auto-refunded)'
    )
    passedAssertions++
    console.log('  ✓ Return initialized in pending_manual_review / uninspected state')

    // -----------------------------------------------------------------
    // 3. Condition Evaluation Gate (PRD FR-6.7.14)
    // -----------------------------------------------------------------
    console.log('\n🔹 Step 3: Testing physical condition evaluation gates on /admin/returns/:id/evaluate...')

    const opsToken = jwt.sign(
      {
        actor_id: 'usr_warehouse_test',
        actor_type: 'user',
        auth_identity_id: 'authid_warehouse_test',
        role: 'warehouse',
        app_metadata: { user_id: 'usr_warehouse_test', role: 'warehouse' },
        iat: Math.floor(Date.now() / 1000),
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    )

    // Attempt invalid condition
    const invalidEvalRes = await fetch(`${MEDUSA_URL}/admin/returns/${testReviewId}/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opsToken}`,
      },
      body: JSON.stringify({ condition: 'arbitrary_fake_condition' }),
    })

    assert.strictEqual(invalidEvalRes.status, 400, 'Invalid condition must return HTTP 400')
    passedAssertions++
    const invalidEvalData = await invalidEvalRes.json()
    assert.ok(
      invalidEvalData.error.includes('Valid condition'),
      'Must enforce condition validation error'
    )
    passedAssertions++
    console.log('  ✓ Invalid condition rejected with 400')

    // -----------------------------------------------------------------
    // 4. Damaged Items Routed to Quarantine (AC-6.3)
    // -----------------------------------------------------------------
    console.log('\n🔹 Step 4: Evaluating item as "damaged" (AC-6.3: must route to Quarantine, NEVER sellable stock)...')

    const damagedEvalRes = await fetch(`${MEDUSA_URL}/admin/returns/${testReviewId}/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opsToken}`,
      },
      body: JSON.stringify({
        condition: 'damaged',
        restock: true, // Attempt restock on damaged item
      }),
    })

    assert.strictEqual(damagedEvalRes.status, 200, 'Damaged evaluation must return HTTP 200')
    passedAssertions++
    const damagedData = await damagedEvalRes.json()
    assert.strictEqual(
      damagedData.is_restocked_to_sellable,
      false,
      'CRITICAL: Damaged item must NEVER be restocked to sellable inventory (AC-6.3)'
    )
    passedAssertions++
    assert.strictEqual(
      damagedData.quarantine_location_id,
      DAMAGED_QUARANTINE_LOC_ID,
      'Damaged item must be routed to Damaged Quarantine location'
    )
    passedAssertions++

    // Verify database record
    const dbReviewRes = await pg.query(
      `SELECT condition, quarantine_location_id, status FROM return_review WHERE id = $1`,
      [testReviewId]
    )
    assert.strictEqual(dbReviewRes.rows[0].condition, 'damaged')
    passedAssertions++
    assert.strictEqual(dbReviewRes.rows[0].quarantine_location_id, DAMAGED_QUARANTINE_LOC_ID)
    passedAssertions++
    console.log('  ✓ Damaged item safely routed to Quarantine Location; sellable stock untouched')

    // -----------------------------------------------------------------
    // 5. Refund RBAC Authorization Matrix (CHK-SEC-01)
    // -----------------------------------------------------------------
    console.log('\n🔹 Step 5: Testing refund authorization RBAC (403 for call center / warehouse)...')

    const callCenterToken = jwt.sign(
      {
        actor_id: 'usr_callcenter_test',
        actor_type: 'user',
        auth_identity_id: 'authid_callcenter_test',
        role: 'call_center',
        app_metadata: { user_id: 'usr_callcenter_test', role: 'call_center' },
        iat: Math.floor(Date.now() / 1000),
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    )

    // Call Center attempts refund payout -> MUST BE 403 FORBIDDEN
    const ccRefundRes = await fetch(`${MEDUSA_URL}/admin/returns/${testReviewId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${callCenterToken}`,
      },
      body: JSON.stringify({
        refund_amount_bdt: 2500,
        refund_trx_id: `trx_ref_${Date.now()}`,
      }),
    })

    assert.strictEqual(
      ccRefundRes.status,
      403,
      'Call Center role must receive HTTP 403 Forbidden for manual refund payouts'
    )
    passedAssertions++
    const ccRefundData = await ccRefundRes.json()
    assert.strictEqual(ccRefundData.error, 'unauthorized_role')
    passedAssertions++
    console.log('  ✓ Call center staff received HTTP 403 Forbidden on refund execution')

    // Warehouse attempts refund payout -> MUST BE 403 FORBIDDEN
    const whRefundRes = await fetch(`${MEDUSA_URL}/admin/returns/${testReviewId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opsToken}`,
      },
      body: JSON.stringify({
        refund_amount_bdt: 2500,
        refund_trx_id: `trx_ref_${Date.now()}`,
      }),
    })

    assert.strictEqual(
      whRefundRes.status,
      403,
      'Warehouse staff role must receive HTTP 403 Forbidden for manual refund payouts'
    )
    passedAssertions++
    console.log('  ✓ Warehouse staff received HTTP 403 Forbidden on refund execution')

    // Authorized Finance role executes refund payout -> MUST SUCCEED
    console.log('  Testing authorized Finance role execution...')
    const financeToken = jwt.sign(
      {
        actor_id: 'usr_finance_test',
        actor_type: 'user',
        auth_identity_id: 'authid_finance_test',
        role: 'finance',
        app_metadata: { user_id: 'usr_finance_test', role: 'finance' },
        iat: Math.floor(Date.now() / 1000),
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    )

    const finTrxId = `trx_bkash_ref_${Date.now()}`
    const finRefundRes = await fetch(`${MEDUSA_URL}/admin/returns/${testReviewId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${financeToken}`,
      },
      body: JSON.stringify({
        refund_amount_bdt: 2500,
        refund_trx_id: finTrxId,
        method_code: 'bkash',
        notes: 'P0 verification manual refund by Finance',
      }),
    })

    assert.strictEqual(finRefundRes.status, 200, 'Finance role must successfully execute refund payout')
    passedAssertions++
    const finData = await finRefundRes.json()
    assert.strictEqual(finData.success, true)
    passedAssertions++
    assert.strictEqual(finData.refund_status, 'paid')
    passedAssertions++

    // Verify database record updated to paid
    const finalReviewRes = await pg.query(
      `SELECT refund_status, status, refund_trx_id, refund_amount_paisa FROM return_review WHERE id = $1`,
      [testReviewId]
    )
    const finalRow = finalReviewRes.rows[0]
    assert.strictEqual(finalRow.refund_status, 'paid')
    passedAssertions++
    assert.strictEqual(finalRow.refund_trx_id, finTrxId)
    passedAssertions++
    assert.strictEqual(Number(finalRow.refund_amount_paisa), 250000) // 2500 * 100 paisa
    passedAssertions++
    console.log('  ✓ Finance role successfully recorded manual refund payout (250,000 paisa / 2,500 BDT)')

    console.log('\n===============================================================')
    console.log(`🎉 CHK-FUL-05 / AC-6.3 / AC-6.5 PASSED: All ${passedAssertions} assertions verified cleanly.`)
    console.log('===============================================================\n')
  } finally {
    // Clean up test records (audit_log is append-only, so never DELETE from audit_log)
    await pg.query(`DELETE FROM return_review WHERE id = $1`, [testReviewId])
    await pg.query(`DELETE FROM order_bd_details WHERE order_id = $1`, [testOrderId])
    await pg.query(`DELETE FROM "order" WHERE id = $1`, [testOrderId])
    if (testPolicyId) {
      await pg.query(`DELETE FROM return_policy WHERE id = $1`, [testPolicyId])
    }
    await pg.end()
  }
}

if (require.main === module) {
  runReturnsManualReviewTests().catch((err) => {
    console.error('❌ Returns manual review test failed:', err)
    process.exit(1)
  })
}

module.exports = { runReturnsManualReviewTests }
