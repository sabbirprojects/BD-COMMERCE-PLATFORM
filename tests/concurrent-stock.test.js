/**
 * Integration Test: Concurrent Stock Locking & Overselling Prevention
 *
 * Requirements:
 * - CHK-CHK-08 [P0]: Concurrent stock race conditions prevented via Redis mutex + DB row locks
 * - AC-6.1: Zero overselling. Simultaneous checkouts for the last unit cannot both succeed
 * - Available stock must never drop below 0
 */

const assert = require('assert')
const Redis = require('ioredis')
const { Client } = require('pg')
const { randomUUID } = require('crypto')

const REDIS_URL =
  process.env.REDIS_URL ||
  'redis://:6ea11ee5036bf8069b51791418df497f7cc9502254c67b94@localhost:6379'
const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:b4c2de80b80e3bebc18adbde993908a9@localhost:5432/bd_commerce?schema=public'

const {
  acquireStockLock,
  acquireStockLockWithRetry,
  releaseStockLock,
} = require('../apps/medusa/.medusa/server/src/lib/stock-lock.js')

async function runConcurrentStockTests() {
  console.log('===============================================================')
  console.log('🧪 P0 Test Suite 1: Concurrent Stock Locking & Race Defense (CHK-CHK-08, AC-6.1)')
  console.log('===============================================================\n')

  const redis = new Redis(REDIS_URL)
  const pg = new Client({ connectionString: DATABASE_URL })
  await pg.connect()

  let passedAssertions = 0

  try {
    // -------------------------------------------------------------
    // 1. Redis Distributed Mutex Tests
    // -------------------------------------------------------------
    console.log('🔹 Step 1: Testing Redis Distributed Mutex (acquire / conflict / release)...')
    const testVariantId = `var_concurrency_test_${Date.now()}`

    // Thread A acquires lock
    const lockA = await acquireStockLock(testVariantId, 10, redis)
    assert.strictEqual(lockA.acquired, true, 'Thread A must acquire the lock')
    assert.ok(lockA.lockToken, 'Lock A must have a unique token')
    passedAssertions += 2

    // Thread B attempts to acquire the same lock concurrently -> MUST FAIL
    const lockB = await acquireStockLock(testVariantId, 10, redis)
    assert.strictEqual(lockB.acquired, false, 'Thread B must be rejected while lock is held by Thread A')
    assert.strictEqual(lockB.lockToken, null)
    passedAssertions += 2

    // Invalid token cannot release Thread A's lock
    const releaseFake = await releaseStockLock(testVariantId, 'wrong-token-1234', redis)
    assert.strictEqual(releaseFake, false, 'Invalid token must NOT release lock')
    passedAssertions++

    // Lock must still be held
    const lockBRetry = await acquireStockLock(testVariantId, 10, redis)
    assert.strictEqual(lockBRetry.acquired, false, 'Lock must still be held after invalid release attempt')
    passedAssertions++

    // Thread A releases with proper token
    const releaseSuccess = await releaseStockLock(testVariantId, lockA.lockToken, redis)
    assert.strictEqual(releaseSuccess, true, 'Thread A must cleanly release lock')
    passedAssertions++

    // Thread B can now acquire the lock immediately
    const lockBAfterRelease = await acquireStockLock(testVariantId, 10, redis)
    assert.strictEqual(lockBAfterRelease.acquired, true, 'Thread B must acquire lock after release')
    passedAssertions++
    await releaseStockLock(testVariantId, lockBAfterRelease.lockToken, redis)

    console.log(`  ✓ Passed ${passedAssertions} Redis distributed mutex assertions`)

    // -------------------------------------------------------------
    // 2. Database Concurrent Stock Contention & Negative Stock Defense
    // -------------------------------------------------------------
    console.log('\n🔹 Step 2: Testing PostgreSQL atomic decrement with exactly 1 unit available...')

    const testInventoryItemId = `iitem_test_${randomUUID().replace(/-/g, '').slice(0, 16)}`
    const testLevelId = `ilevel_test_${randomUUID().replace(/-/g, '').slice(0, 16)}`
    const testLocationId = 'sloc_01M5QBBQZ6B84Q4M12C6T466F4' // Central Warehouse

    // Insert throwaway inventory item with exactly 1 unit stocked and 0 reserved
    await pg.query(
      `INSERT INTO inventory_item (id, sku, title, created_at, updated_at)
       VALUES ($1, $2, 'Concurrency Test Item', now(), now())`,
      [testInventoryItemId, `SKU-TEST-${Date.now()}`]
    )

    await pg.query(
      `INSERT INTO inventory_level (id, inventory_item_id, location_id, stocked_quantity, reserved_quantity, created_at, updated_at)
       VALUES ($1, $2, $3, 1, 0, now(), now())`,
      [testLevelId, testInventoryItemId, testLocationId]
    )

    // Execute 2 simultaneous checkout attempts racing for this 1 unit
    // Atomic update query pattern used in order processing:
    const atomicReservationSql = `
      UPDATE inventory_level
      SET reserved_quantity = reserved_quantity + 1,
          updated_at = now()
      WHERE inventory_item_id = $1
        AND location_id = $2
        AND (stocked_quantity - reserved_quantity) >= 1
      RETURNING id, stocked_quantity, reserved_quantity;
    `

    console.log('  Firing 2 simultaneous checkout reservation queries for 1 unit of stock...')
    const [resultA, resultB] = await Promise.all([
      pg.query(atomicReservationSql, [testInventoryItemId, testLocationId]),
      pg.query(atomicReservationSql, [testInventoryItemId, testLocationId]),
    ])

    const rowsA = resultA.rowCount || 0
    const rowsB = resultB.rowCount || 0

    console.log(`  Reservation Thread 1 updated: ${rowsA} row(s)`)
    console.log(`  Reservation Thread 2 updated: ${rowsB} row(s)`)

    // Exactly 1 must have succeeded (1 row updated) and the other must have failed (0 rows updated)
    assert.strictEqual(
      rowsA + rowsB,
      1,
      `Exactly 1 of the concurrent reservations must succeed. Got Thread 1: ${rowsA}, Thread 2: ${rowsB}`
    )
    passedAssertions++

    // Verify remaining live inventory in the database:
    const finalCheck = await pg.query(
      `SELECT stocked_quantity, reserved_quantity, (stocked_quantity - reserved_quantity) as available_quantity
       FROM inventory_level WHERE id = $1`,
      [testLevelId]
    )

    const finalRow = finalCheck.rows[0]
    const available = Number(finalRow.available_quantity)
    const stocked = Number(finalRow.stocked_quantity)
    const reserved = Number(finalRow.reserved_quantity)

    console.log(`  Final Inventory -> Stocked: ${stocked}, Reserved: ${reserved}, Available: ${available}`)

    assert.strictEqual(stocked, 1, 'Stocked quantity must remain 1')
    passedAssertions++
    assert.strictEqual(reserved, 1, 'Reserved quantity must be exactly 1')
    passedAssertions++
    assert.strictEqual(available, 0, 'Available quantity must be exactly 0 (never negative!)')
    passedAssertions++
    assert.ok(available >= 0, 'CRITICAL: Stock overselling occurred! available_quantity cannot be negative')
    passedAssertions++

    // Clean up test inventory rows
    await pg.query(`DELETE FROM inventory_level WHERE id = $1`, [testLevelId])
    await pg.query(`DELETE FROM inventory_item WHERE id = $1`, [testInventoryItemId])
    console.log('  ✓ Cleaned up throwaway test records')

    console.log('\n===============================================================')
    console.log(`🎉 CHK-CHK-08 / AC-6.1 PASSED: All ${passedAssertions} assertions verified cleanly.`)
    console.log('===============================================================\n')
  } finally {
    await redis.quit()
    await pg.end()
  }
}

if (require.main === module) {
  runConcurrentStockTests().catch((err) => {
    console.error('❌ Concurrent stock test failed:', err)
    process.exit(1)
  })
}

module.exports = { runConcurrentStockTests }
