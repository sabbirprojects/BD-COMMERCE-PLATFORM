/**
 * Integration Test: Idempotent Order Completion & Payment Webhook Replay Defense
 *
 * Requirements:
 * - CHK-PAY-03 [P0]: Replaying payment webhook 3x with identical trx_id returns 200 OK
 *   without duplicate orders or duplicate capture entries (AC-7.2, AC-G8)
 * - AC-4.3: Checkout idempotency key prevents duplicate orders on network retry
 */

const assert = require('assert')
const { Client } = require('pg')
const { randomUUID } = require('crypto')

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:b4c2de80b80e3bebc18adbde993908a9@localhost:5432/bd_commerce?schema=public'
const MEDUSA_URL = process.env.MEDUSA_URL || 'http://localhost:9000'

async function runIdempotencyWebhookTests() {
  console.log('===============================================================')
  console.log('🧪 P0 Test Suite 2: Idempotent Webhook & Order Replay Defense (CHK-PAY-03, AC-7.2)')
  console.log('===============================================================\n')

  const pg = new Client({ connectionString: DATABASE_URL })
  await pg.connect()

  let passedAssertions = 0

  const testOrderId = `order_test_idem_${Date.now()}`
  const testTrxId = `trx_bkash_replay_${Date.now()}`
  const testAttemptId = `payatt_test_${Date.now()}`
  const testIdempotencyKey = `idem_key_checkout_${Date.now()}`

  try {
    // -------------------------------------------------------------
    // Setup test order and initial payment attempt in database
    // -------------------------------------------------------------
    console.log('🔹 Step 1: Setting up base test order and payment attempt...')

    // Insert minimal native order
    await pg.query(
      `INSERT INTO "order" (id, version, currency_code, status, created_at, updated_at)
       VALUES ($1, 1, 'bdt', 'pending', now(), now())`,
      [testOrderId]
    )

    // Insert order_bd_details with checkout_idempotency_key
    await pg.query(
      `INSERT INTO order_bd_details (
         id, order_id, order_source, division_code, district_code, thana_code,
         address_snapshot, cod_status, cod_settlement_status, customer_paid_delivery_paisa,
         raw_customer_paid_delivery_paisa, delivery_attempts_count, shipment_state,
         checkout_idempotency_key, cod_collectable_paisa, payment_method_code, created_at, updated_at
       ) VALUES (
         $1, $2, 'web', 'DHA', 'DHA', 'MIR',
         $3::jsonb, 'not_applicable', 'pending', 6000,
         '{"value": "6000", "precision": 20}'::jsonb, 0, 'confirmed',
         $4, 150000, 'bkash', now(), now()
       )`,
      [
        `obd_${randomUUID().replace(/-/g, '').slice(0, 20)}`,
        testOrderId,
        JSON.stringify({ phone: '+8801712345678', street: 'Road 1' }),
        testIdempotencyKey,
      ]
    )

    // Insert payment_attempt representing initial processed payment
    await pg.query(
      `INSERT INTO payment_attempt (
         id, order_id, provider_code, attempt_type, amount_paisa, currency_code,
         gateway_status, gateway_transaction_id, initiated_at, completed_at, created_at, updated_at
       ) VALUES (
         $1, $2, 'bkash', 'callback', 150000, 'bdt', 'captured', $3, now(), now(), now(), now()
       )`,
      [testAttemptId, testOrderId, testTrxId]
    )

    console.log(`  ✓ Created test order ${testOrderId} with trx_id: ${testTrxId}`)
    passedAssertions++

    // -------------------------------------------------------------
    // Replay Payment Callback 3 Times (CHK-PAY-03, AC-7.2)
    // -------------------------------------------------------------
    console.log('\n🔹 Step 2: Simulating 3 consecutive webhook delivery attempts with identical trx_id...')

    const webhookPayload = {
      payment_id: 'pay_test_replay_001',
      status: 'success',
      trx_id: testTrxId,
      amount: 1500,
      currency: 'BDT',
    }

    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`  Replay attempt #${attempt}...`)
      const res = await fetch(`${MEDUSA_URL}/hooks/bkash/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
      })

      assert.strictEqual(
        res.status,
        200,
        `Attempt #${attempt} must return HTTP 200 OK. Got: ${res.status}`
      )
      passedAssertions++

      const data = await res.json()
      assert.strictEqual(
        data.already_processed,
        true,
        `Attempt #${attempt} must identify payment as already processed (idempotent)`
      )
      passedAssertions++
      assert.strictEqual(
        data.order_id,
        testOrderId,
        `Attempt #${attempt} must reference the exact existing order ID`
      )
      passedAssertions++
      assert.strictEqual(
        data.payment_status,
        'captured',
        `Attempt #${attempt} must report payment_status captured`
      )
      passedAssertions++
    }

    // -------------------------------------------------------------
    // Database Verification: No Duplicate Orders or Captures
    // -------------------------------------------------------------
    console.log('\n🔹 Step 3: Verifying database state integrity after 3 webhook replays...')

    const attemptCountRes = await pg.query(
      `SELECT count(*) as total FROM payment_attempt WHERE gateway_transaction_id = $1`,
      [testTrxId]
    )
    const totalAttempts = parseInt(attemptCountRes.rows[0].total, 10)
    console.log(`  Payment attempt records with trx_id ${testTrxId}: ${totalAttempts}`)
    assert.strictEqual(
      totalAttempts,
      1,
      `Expected exactly 1 payment_attempt record, found: ${totalAttempts}`
    )
    passedAssertions++

    const orderCountRes = await pg.query(
      `SELECT count(*) as total FROM "order" WHERE id = $1`,
      [testOrderId]
    )
    const totalOrders = parseInt(orderCountRes.rows[0].total, 10)
    assert.strictEqual(
      totalOrders,
      1,
      `Expected exactly 1 order record, found: ${totalOrders}`
    )
    passedAssertions++

    // -------------------------------------------------------------
    // Checkout Idempotency Key Replay (AC-4.3)
    // -------------------------------------------------------------
    console.log('\n🔹 Step 4: Testing checkout idempotency key collision defense on /store/orders/cod...')

    const codRes = await fetch(`${MEDUSA_URL}/store/orders/cod`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': 'pk_e03efb8523c1542172c95fe34dc90955a3389f3ee3592faa16171966d4699096',
        'x-idempotency-key': testIdempotencyKey,
      },
      body: JSON.stringify({
        cart_id: 'cart_dummy_idempotent_test',
        idempotency_key: testIdempotencyKey,
      }),
    })

    assert.strictEqual(codRes.status, 200, 'Replayed checkout request must return HTTP 200 OK')
    passedAssertions++

    const codData = await codRes.json()
    assert.strictEqual(
      codData.is_duplicate,
      true,
      'Response must indicate is_duplicate: true'
    )
    passedAssertions++
    assert.strictEqual(
      codData.order?.id,
      testOrderId,
      'Duplicate response must return existing order ID'
    )
    passedAssertions++

    console.log(`  ✓ Idempotent checkout correctly resolved existing order without creating duplicate!`)

    console.log('\n===============================================================')
    console.log(`🎉 CHK-PAY-03 / AC-7.2 PASSED: All ${passedAssertions} assertions verified cleanly.`)
    console.log('===============================================================\n')
  } finally {
    // Clean up test rows
    await pg.query(`DELETE FROM payment_attempt WHERE id = $1`, [testAttemptId])
    await pg.query(`DELETE FROM order_bd_details WHERE order_id = $1`, [testOrderId])
    await pg.query(`DELETE FROM "order" WHERE id = $1`, [testOrderId])
    await pg.end()
  }
}

if (require.main === module) {
  runIdempotencyWebhookTests().catch((err) => {
    console.error('❌ Idempotency webhook test failed:', err)
    process.exit(1)
  })
}

module.exports = { runIdempotencyWebhookTests }
