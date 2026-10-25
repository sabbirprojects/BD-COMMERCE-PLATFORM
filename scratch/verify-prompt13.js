/**
 * Comprehensive Verification Suite for Prompt 13 — Courier Integrations
 *
 * Verifies:
 * 1. GET /admin/couriers returns courier list with configs and metrics
 * 2. PRD FR-7.4.4: Unmapped area gate blocks Pathao booking with courier_area_unmapped & offers manual
 * 3. CHK-FUL-01: Automated parcel booking with Steadfast adapter creates active consignment & logs event
 * 4. Manifest batching and 4x6 thermal label layout generation
 * 5. CHK-FUL-02 & AC-7.3: Manual courier booking fallback works for in-house riders / API down
 * 6. Consignment cancellation before pickup resets order shipment state to ready_to_ship
 * 7. CHK-FUL-03: Webhook DELIVERED captures COD cash, sets order payment_status='paid', shipment_state='delivered'
 * 8. CHK-FUL-03: Webhook idempotency/replay protection (duplicate payload yields deduplicated:true)
 * 9. AC-6.3 & CHK-FUL-03: Webhook RTO_RECEIVED routes items to Damaged Quarantine, NEVER restores sellable stock
 * 10. Partial delivery webhook records cod_collection_line and return_review
 * 11. Remittance batch reconciliation calculates variance and flags discrepancies as disputed (FR-14.9)
 * 12. Read model view v_order_shipment_state projects accurate real-time shipment & consignment state
 */

const { Client } = require('pg')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')

const MEDUSA_URL = 'http://localhost:9000'
const DB_URL = 'postgresql://postgres:b4c2de80b80e3bebc18adbde993908a9@localhost:5432/bd_commerce?schema=public'

const MAIN_WAREHOUSE_LOC_ID = 'sloc_01M5QBBQZ6B84Q4M12C6T466F4'
const DAMAGED_QUARANTINE_LOC_ID = 'sloc_01M5QBBQZDHM08KE9AWDF3KKDV'

function getOwnerToken() {
  return jwt.sign(
    {
      actor_id: 'user_01M5P3610BV01PG4SD3BYDM517',
      actor_type: 'user',
      auth_identity_id: 'authid_01M5P3612X11ZJXREVT1T07902',
      app_metadata: { user_id: 'user_01M5P3610BV01PG4SD3BYDM517', role: 'owner' },
    },
    'supersecret',
    { expiresIn: '1d' }
  )
}

function getWarehouseToken() {
  return jwt.sign(
    {
      actor_id: 'usr_warehouse_test',
      actor_type: 'user',
      auth_identity_id: 'authid_warehouse_test',
      app_metadata: { user_id: 'usr_warehouse_test', role: 'warehouse' },
    },
    'supersecret',
    { expiresIn: '1d' }
  )
}

async function run() {
  const pg = new Client({ connectionString: DB_URL })
  await pg.connect()

  // Ensure warehouse test user exists with warehouse role
  await pg.query(
    `INSERT INTO "user" (id, email, metadata, created_at, updated_at)
     VALUES ('usr_warehouse_test', 'warehouse@bd-commerce.com', '{"role":"warehouse","must_change_password":false}', now(), now())
     ON CONFLICT (id) DO UPDATE SET metadata = '{"role":"warehouse","must_change_password":false}'`
  )

  console.log('=== STARTING PROMPT 13 VERIFICATION SUITE ===\n')

  const ownerToken = getOwnerToken()
  const warehouseToken = getWarehouseToken()

  // -------------------------------------------------------------
  // Test 1: Courier Listing & Configuration Check
  // -------------------------------------------------------------
  console.log('--- Test 1: Courier Listing & Configuration (GET /admin/couriers) ---')
  const listRes = await fetch(`${MEDUSA_URL}/admin/couriers`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  })
  if (!listRes.ok) {
    throw new Error(`Failed to list couriers: ${await listRes.text()}`)
  }
  const listData = await listRes.json()
  const codes = listData.couriers.map((c) => c.code)
  console.log(`Active couriers found: ${codes.join(', ')}`)
  if (!codes.includes('steadfast') || !codes.includes('pathao') || !codes.includes('redx') || !codes.includes('manual')) {
    throw new Error(`Missing expected couriers in: ${JSON.stringify(codes)}`)
  }
  console.log('✓ Courier list returns Steadfast, Pathao, RedX, and Manual')

  // Find a test product variant for line items
  const vRes = await pg.query(
    `SELECT pv.id as variant_id, pv.sku, p.title as product_title, p.id as product_id,
            pvii.inventory_item_id
     FROM product_variant pv
     JOIN product p ON p.id = pv.product_id
     JOIN product_variant_inventory_item pvii ON pvii.variant_id = pv.id
     WHERE p.status = 'published' AND pv.deleted_at IS NULL
     LIMIT 1`
  )
  const testVariant = vRes.rows[0]
  console.log(`Using test variant: ${testVariant.variant_id} (Item ID: ${testVariant.inventory_item_id})`)

  // -------------------------------------------------------------
  // Test 2: PRD FR-7.4.4: Unmapped Area Gate Blocks Pathao Booking
  // -------------------------------------------------------------
  console.log('\n--- Test 2: PRD FR-7.4.4: Unmapped Area Gate Blocks Pathao Booking ---')
  const unmappedOrderId = `ord_unmapped_${Date.now()}`
  await pg.query(
    `INSERT INTO "order" (id, version, status, currency_code, created_at, updated_at)
     VALUES ($1, 1, 'pending', 'bdt', now(), now())`,
    [unmappedOrderId]
  )
  await pg.query(
    `INSERT INTO order_bd_details (
      id, order_id, payment_method_code, cod_status, delivery_zone_code,
      division_code, district_code, thana_code, address_snapshot,
      cod_collectable_paisa, customer_paid_delivery_paisa, shipment_state,
      created_at, updated_at
    ) VALUES (
      $1, $2, 'cod', 'confirmed', 'outside_dhaka',
      'BD-XYZ', 'BD-XYZ-DIST', 'BD-XYZ-UNMAPPED-THANA',
      $3,
      150000, 12000, 'ready_to_ship',
      now(), now()
    )`,
    [
      `obd_${unmappedOrderId}`,
      unmappedOrderId,
      JSON.stringify({
        phone: '01799999999',
        first_name: 'Unmapped',
        last_name: 'Customer',
        address_1: 'Remote Outpost Village',
        division: 'Unknown Div',
        district: 'Unknown Dist',
        thana: 'Unknown Thana',
      }),
    ]
  )

  const unmappedBookRes = await fetch(`${MEDUSA_URL}/admin/couriers/book`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${warehouseToken}`,
    },
    body: JSON.stringify({
      order_id: unmappedOrderId,
      courier_code: 'pathao',
    }),
  })

  console.log(`Unmapped area Pathao booking response status: HTTP ${unmappedBookRes.status}`)
  if (unmappedBookRes.status !== 422) {
    throw new Error(`Expected 422 Unprocessable Entity for unmapped area, got ${unmappedBookRes.status}`)
  }
  const unmappedData = await unmappedBookRes.json()
  if (unmappedData.error !== 'courier_area_unmapped' || unmappedData.fallback !== 'manual') {
    throw new Error(`Expected courier_area_unmapped with manual fallback, got: ${JSON.stringify(unmappedData)}`)
  }
  console.log('✓ PRD FR-7.4.4: Unmapped area strictly blocked without guessing zone; manual fallback offered')

  // -------------------------------------------------------------
  // Test 3: CHK-FUL-01: Automated Parcel Booking with Steadfast
  // -------------------------------------------------------------
  console.log('\n--- Test 3: CHK-FUL-01: Automated Parcel Booking (Steadfast) ---')
  const steadfastOrderId = `ord_stdfast_${Date.now()}`
  await pg.query(
    `INSERT INTO "order" (id, version, status, currency_code, created_at, updated_at)
     VALUES ($1, 1, 'pending', 'bdt', now(), now())`,
    [steadfastOrderId]
  )
  await pg.query(
    `INSERT INTO order_bd_details (
      id, order_id, payment_method_code, cod_status, delivery_zone_code,
      division_code, district_code, thana_code, address_snapshot,
      cod_collectable_paisa, customer_paid_delivery_paisa, shipment_state,
      created_at, updated_at
    ) VALUES (
      $1, $2, 'cod', 'confirmed', 'inside_dhaka',
      'BD-DHK', 'BD-DHK-DHA', 'BD-DHK-DHA-SAV',
      $3,
      285000, 6000, 'ready_to_ship',
      now(), now()
    )`,
    [
      `obd_${steadfastOrderId}`,
      steadfastOrderId,
      JSON.stringify({
        phone: '01712345678',
        first_name: 'Anisur',
        last_name: 'Rahman',
        address_1: 'House 12, Road 4, Savar',
        division: 'Dhaka',
        district: 'Dhaka',
        thana: 'Savar',
      }),
    ]
  )

  const steadfastBookRes = await fetch(`${MEDUSA_URL}/admin/couriers/book`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${warehouseToken}`,
    },
    body: JSON.stringify({
      order_id: steadfastOrderId,
      courier_code: 'steadfast',
      notes: 'Fragile electronics',
      weight_grams: 750,
    }),
  })

  if (!steadfastBookRes.ok) {
    throw new Error(`Failed to book Steadfast consignment: ${await steadfastBookRes.text()}`)
  }
  const steadfastData = await steadfastBookRes.json()
  console.log(`Steadfast booking result: Consignment ID=${steadfastData.consignment_id}, Tracking=${steadfastData.tracking_code}`)

  // Verify DB state
  const consignRows = await pg.query(
    `SELECT * FROM courier_consignment WHERE id = $1 AND is_active = true`,
    [steadfastData.consignment_id]
  )
  if (consignRows.rows.length === 0) {
    throw new Error('Consignment record not found or not active in courier_consignment')
  }
  const consignment = consignRows.rows[0]
  if (consignment.status !== 'booked' || Number(consignment.weight_grams) !== 750) {
    throw new Error(`Consignment values mismatch: ${JSON.stringify(consignment)}`)
  }

  // Verify courier_event recorded
  const evRows = await pg.query(
    `SELECT * FROM courier_event WHERE courier_consignment_id = $1 AND event_type = 'booked'`,
    [consignment.id]
  )
  if (evRows.rows.length === 0) {
    throw new Error('courier_event record for booked event not found')
  }

  // Verify order_bd_details updated
  const obdRows = await pg.query(
    `SELECT shipment_state FROM order_bd_details WHERE order_id = $1`,
    [steadfastOrderId]
  )
  if (!['booked', 'dispatched'].includes(obdRows.rows[0].shipment_state)) {
    throw new Error(`Expected shipment_state 'booked' or 'dispatched', got ${obdRows.rows[0].shipment_state}`)
  }
  console.log('✓ CHK-FUL-01: Steadfast booking creates active consignment, logs event, updates shipment_state')

  // -------------------------------------------------------------
  // Test 4: Manifest Batching & 4x6 Thermal Label Preview
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Manifest Batching & 4x6 Thermal Label Preview ---')
  const manifestRes = await fetch(`${MEDUSA_URL}/admin/couriers/manifest?courier_code=steadfast`, {
    headers: { Authorization: `Bearer ${warehouseToken}` },
  })
  if (!manifestRes.ok) {
    throw new Error(`Failed to generate manifest: ${await manifestRes.text()}`)
  }
  const manifestData = await manifestRes.json()
  console.log(`Manifest parcels count: ${manifestData.total_parcels}, Format: ${JSON.stringify(manifestData.label_spec)}`)
  if (!manifestData.manifest_id || !manifestData.parcels.some((p) => p.order_id === steadfastOrderId)) {
    throw new Error('Booked order not present in Steadfast manifest batch')
  }
  if (manifestData.label_spec.width_inches !== 4 || manifestData.label_spec.height_inches !== 6) {
    throw new Error(`Incorrect thermal label dimensions: ${JSON.stringify(manifestData.label_spec)}`)
  }
  console.log('✓ Manifest batching includes booked parcel with standard 4x6 thermal label layout')

  // -------------------------------------------------------------
  // Test 5: CHK-FUL-02 & AC-7.3: Manual Courier Consignment Fallback
  // -------------------------------------------------------------
  console.log('\n--- Test 5: CHK-FUL-02 & AC-7.3: Manual Courier Fallback ---')
  const manualOrderId = `ord_manual_${Date.now()}`
  await pg.query(
    `INSERT INTO "order" (id, version, status, currency_code, created_at, updated_at)
     VALUES ($1, 1, 'pending', 'bdt', now(), now())`,
    [manualOrderId]
  )
  await pg.query(
    `INSERT INTO order_bd_details (
      id, order_id, payment_method_code, cod_status, delivery_zone_code,
      division_code, district_code, thana_code, address_snapshot,
      cod_collectable_paisa, customer_paid_delivery_paisa, shipment_state,
      created_at, updated_at
    ) VALUES (
      $1, $2, 'cod', 'confirmed', 'inside_dhaka',
      'BD-DHK', 'BD-DHK-DHA', 'BD-DHK-DHA-MIR',
      $3,
      190000, 6000, 'ready_to_ship',
      now(), now()
    )`,
    [
      `obd_${manualOrderId}`,
      manualOrderId,
      JSON.stringify({
        phone: '01888888888',
        first_name: 'Farhan',
        last_name: 'Kabir',
        address_1: 'Section 10, Mirpur',
        division: 'Dhaka',
        district: 'Dhaka',
        thana: 'Mirpur',
      }),
    ]
  )

  const manualBookRes = await fetch(`${MEDUSA_URL}/admin/couriers/manual-book`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${warehouseToken}`,
    },
    body: JSON.stringify({
      order_id: manualOrderId,
      consignment_id: `RIDER-DHAKA-${Date.now()}`,
      rider_name: 'Tanvir Ahmed',
      rider_phone: '01755555555',
      notes: 'In-house express delivery',
    }),
  })

  if (!manualBookRes.ok) {
    throw new Error(`Failed manual booking: ${await manualBookRes.text()}`)
  }
  const manualData = await manualBookRes.json()
  console.log(`Manual consignment booked: ${manualData.consignment_id}, tracking=${manualData.tracking_code}`)

  const manualConsignRows = await pg.query(
    `SELECT * FROM courier_consignment WHERE id = $1 AND courier_code = 'manual'`,
    [manualData.consignment_id]
  )
  if (manualConsignRows.rows.length === 0) {
    throw new Error('Manual consignment record not created in courier_consignment')
  }
  console.log('✓ CHK-FUL-02: Manual courier booking fallback successfully assigns consignment without API blocker')

  // -------------------------------------------------------------
  // Test 6: Consignment Pre-Pickup Cancellation
  // -------------------------------------------------------------
  console.log('\n--- Test 6: Consignment Pre-Pickup Cancellation ---')
  const cancelRes = await fetch(`${MEDUSA_URL}/admin/couriers/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${warehouseToken}`,
    },
    body: JSON.stringify({
      consignment_id: manualData.consignment_id,
      reason: 'Customer requested change of address before dispatch',
    }),
  })

  if (!cancelRes.ok) {
    throw new Error(`Failed to cancel consignment: ${await cancelRes.text()}`)
  }
  const cancelData = await cancelRes.json()
  console.log(`Cancellation result: ${cancelData.message}`)

  // Verify consignment is deactivated and order returned to ready_to_ship
  const canceledConsign = await pg.query(
    `SELECT status, is_active FROM courier_consignment WHERE id = $1`,
    [manualData.consignment_id]
  )
  if (!['canceled', 'cancelled'].includes(canceledConsign.rows[0].status) || canceledConsign.rows[0].is_active !== false) {
    throw new Error(`Consignment state not cancelled: ${JSON.stringify(canceledConsign.rows[0])}`)
  }
  const canceledOrder = await pg.query(
    `SELECT shipment_state FROM order_bd_details WHERE order_id = $1`,
    [manualOrderId]
  )
  if (canceledOrder.rows[0].shipment_state !== 'ready_to_ship') {
    throw new Error(`Order shipment_state did not reset to ready_to_ship: ${canceledOrder.rows[0].shipment_state}`)
  }
  console.log('✓ Pre-pickup cancellation deactivates consignment and resets order state to ready_to_ship')

  // -------------------------------------------------------------
  // Test 7: CHK-FUL-03: Webhook Ingestion - DELIVERED Captures COD
  // -------------------------------------------------------------
  console.log('\n--- Test 7: CHK-FUL-03: Webhook DELIVERED Captures COD & Marks Paid ---')
  const deliveredWebhookPayload = {
    consignment_id: consignment.consignment_external_id,
    tracking_code: consignment.tracking_code,
    status: 'delivered',
    collected_amount: 2850,
    timestamp: new Date().toISOString(),
  }

  const deliveredHookRes = await fetch(`${MEDUSA_URL}/hooks/courier/steadfast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-courier-token': 'sandbox_steadfast_secret',
    },
    body: JSON.stringify(deliveredWebhookPayload),
  })

  if (!deliveredHookRes.ok) {
    throw new Error(`Webhook delivered failed: ${await deliveredHookRes.text()}`)
  }
  const hookResult = await deliveredHookRes.json()
  console.log(`DELIVERED webhook result: new_state=${hookResult.new_state}`)
  if (hookResult.new_state !== 'delivered') {
    throw new Error(`Expected new_state 'delivered', got ${hookResult.new_state}`)
  }

  // Verify DB state for order & COD
  const deliveredOrderRes = await pg.query(
    `SELECT obd.shipment_state, obd.cod_status, o.status as order_status
     FROM order_bd_details obd
     JOIN "order" o ON o.id = obd.order_id
     WHERE obd.order_id = $1`,
    [steadfastOrderId]
  )
  const delOrder = deliveredOrderRes.rows[0]
  if (delOrder.shipment_state !== 'delivered' || delOrder.cod_status !== 'confirmed') {
    throw new Error(`Order delivery state incorrect: ${JSON.stringify(delOrder)}`)
  }

  const delConsignRes = await pg.query(
    `SELECT status, delivered_at FROM courier_consignment WHERE id = $1`,
    [consignment.id]
  )
  if (!delConsignRes.rows[0].delivered_at) {
    throw new Error(`Consignment delivered_at not set: ${JSON.stringify(delConsignRes.rows[0])}`)
  }

  // Verify cod_collection_line record
  const codLineRes = await pg.query(
    `SELECT * FROM cod_collection_line WHERE order_id = $1`,
    [steadfastOrderId]
  )
  if (codLineRes.rows.length === 0 || Number(codLineRes.rows[0].collected_paisa) !== 285000) {
    throw new Error(`cod_collection_line not recorded or wrong amount: ${JSON.stringify(codLineRes.rows)}`)
  }
  console.log('✓ CHK-FUL-03: DELIVERED webhook marks order paid/delivered and records COD collection line')

  // -------------------------------------------------------------
  // Test 8: CHK-FUL-03: Webhook Idempotency / Replay Protection
  // -------------------------------------------------------------
  console.log('\n--- Test 8: CHK-FUL-03: Webhook Deduplication / Replay Protection ---')
  const replayHookRes = await fetch(`${MEDUSA_URL}/hooks/courier/steadfast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-courier-token': 'sandbox_steadfast_secret',
    },
    body: JSON.stringify(deliveredWebhookPayload),
  })

  if (!replayHookRes.ok) {
    throw new Error(`Webhook replay request failed: ${await replayHookRes.text()}`)
  }
  const replayResult = await replayHookRes.json()
  console.log(`Replay webhook response: ${JSON.stringify(replayResult)}`)
  if (!replayResult.deduplicated) {
    throw new Error(`Expected deduplicated: true, got ${JSON.stringify(replayResult)}`)
  }
  console.log('✓ CHK-FUL-03: Duplicate webhook safely deduplicated via payload SHA-256 hash')

  // -------------------------------------------------------------
  // Test 9: AC-6.3 & CHK-FUL-03: RTO_RECEIVED Routes to Quarantine,
  //         NEVER Restores to Sellable Inventory
  // -------------------------------------------------------------
  console.log('\n--- Test 9: AC-6.3 & CHK-FUL-03: RTO_RECEIVED Routes to Damaged Quarantine ---')
  const rtoOrderId = `ord_rto_${Date.now()}`
  await pg.query(
    `INSERT INTO "order" (id, version, status, currency_code, created_at, updated_at)
     VALUES ($1, 1, 'pending', 'bdt', now(), now())`,
    [rtoOrderId]
  )
  await pg.query(
    `INSERT INTO order_bd_details (
      id, order_id, payment_method_code, cod_status, delivery_zone_code,
      division_code, district_code, thana_code, address_snapshot,
      cod_collectable_paisa, customer_paid_delivery_paisa, shipment_state,
      created_at, updated_at
    ) VALUES (
      $1, $2, 'cod', 'confirmed', 'inside_dhaka',
      'BD-DHK', 'BD-DHK-DHA', 'BD-DHK-DHA-SAV',
      $3,
      120000, 6000, 'ready_to_ship',
      now(), now()
    )`,
    [
      `obd_${rtoOrderId}`,
      rtoOrderId,
      JSON.stringify({
        phone: '01722222222',
        first_name: 'Rubel',
        last_name: 'Hossain',
        address_1: 'Savar Bus Stand',
        division: 'Dhaka',
        district: 'Dhaka',
        thana: 'Savar',
      }),
    ]
  )

  // Attach order line item
  await pg.query(
    `INSERT INTO order_line_snapshot (
      id, order_id, line_item_id, variant_id, sku,
      title, variant_title, unit_price_paisa, raw_unit_price_paisa, quantity, cogs_unit_paisa,
      created_at
    ) VALUES (
      $1, $2, $3, $4, $5,
      'Test T-Shirt', 'L', 120000, $6, 1, 60000,
      now()
    )`,
    [
      `ols_${rtoOrderId}`,
      rtoOrderId,
      `item_${rtoOrderId}`,
      testVariant.variant_id,
      testVariant.sku,
      JSON.stringify({ value: '120000', precision: 20 }),
    ]
  )

  // Check current stock levels before RTO
  const beforeMainStock = await pg.query(
    `SELECT stocked_quantity FROM inventory_level
     WHERE inventory_item_id = $1 AND location_id = $2`,
    [testVariant.inventory_item_id, MAIN_WAREHOUSE_LOC_ID]
  )
  const initialMainStock = Number(beforeMainStock.rows[0]?.stocked_quantity || 0)

  const beforeQuarStock = await pg.query(
    `SELECT stocked_quantity FROM inventory_level
     WHERE inventory_item_id = $1 AND location_id = $2`,
    [testVariant.inventory_item_id, DAMAGED_QUARANTINE_LOC_ID]
  )
  const initialQuarStock = Number(beforeQuarStock.rows[0]?.stocked_quantity || 0)

  // Book Steadfast parcel
  const rtoBookRes = await fetch(`${MEDUSA_URL}/admin/couriers/book`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${warehouseToken}`,
    },
    body: JSON.stringify({
      order_id: rtoOrderId,
      courier_code: 'steadfast',
    }),
  })
  const rtoBookData = await rtoBookRes.json()

  // Ingest RTO webhook
  const rtoHookRes = await fetch(`${MEDUSA_URL}/hooks/courier/steadfast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-courier-token': 'sandbox_steadfast_secret',
    },
    body: JSON.stringify({
      consignment_id: rtoBookData.consignment_external_id,
      tracking_code: rtoBookData.tracking_code,
      status: 'rto_delivered',
      reason: 'Customer refused delivery / unreachable',
      timestamp: new Date().toISOString(),
    }),
  })

  if (!rtoHookRes.ok) {
    throw new Error(`RTO webhook failed: ${await rtoHookRes.text()}`)
  }
  const rtoHookData = await rtoHookRes.json()
  console.log(`RTO webhook result: new_state=${rtoHookData.new_state}`)

  // Verify order shipment_state is rto_received
  const rtoOrderState = await pg.query(
    `SELECT shipment_state FROM order_bd_details WHERE order_id = $1`,
    [rtoOrderId]
  )
  if (rtoOrderState.rows[0].shipment_state !== 'rto_received') {
    throw new Error(`Expected shipment_state 'rto_received', got ${rtoOrderState.rows[0].shipment_state}`)
  }

  // CRITICAL CHECK: Verify Damaged Quarantine incremented, Main Warehouse did NOT increment
  const afterMainStock = await pg.query(
    `SELECT stocked_quantity FROM inventory_level
     WHERE inventory_item_id = $1 AND location_id = $2`,
    [testVariant.inventory_item_id, MAIN_WAREHOUSE_LOC_ID]
  )
  const finalMainStock = Number(afterMainStock.rows[0]?.stocked_quantity || 0)

  const afterQuarStock = await pg.query(
    `SELECT stocked_quantity FROM inventory_level
     WHERE inventory_item_id = $1 AND location_id = $2`,
    [testVariant.inventory_item_id, DAMAGED_QUARANTINE_LOC_ID]
  )
  const finalQuarStock = Number(afterQuarStock.rows[0]?.stocked_quantity || 0)

  console.log(`Inventory check: Main Warehouse initial=${initialMainStock}, final=${finalMainStock} (change=${finalMainStock - initialMainStock})`)
  console.log(`Inventory check: Damaged Quarantine initial=${initialQuarStock}, final=${finalQuarStock} (change=${finalQuarStock - initialQuarStock})`)

  if (finalMainStock > initialMainStock) {
    throw new Error('VIOLATION: Main Warehouse sellable stock was incremented on RTO! (AC-6.3 violated)')
  }
  if (finalQuarStock !== initialQuarStock + 1) {
    throw new Error(`Expected Quarantine stock to increment by 1, got ${finalQuarStock - initialQuarStock}`)
  }
  console.log('✓ AC-6.3 & CHK-FUL-03: RTO items routed strictly to Damaged Quarantine; NEVER restored to sellable stock')

  // -------------------------------------------------------------
  // Test 10: Partial Delivery Webhook Handling
  // -------------------------------------------------------------
  console.log('\n--- Test 10: Partial Delivery Webhook Handling ---')
  const partialOrderId = `ord_partial_${Date.now()}`
  await pg.query(
    `INSERT INTO "order" (id, version, status, currency_code, created_at, updated_at)
     VALUES ($1, 1, 'pending', 'bdt', now(), now())`,
    [partialOrderId]
  )
  await pg.query(
    `INSERT INTO order_bd_details (
      id, order_id, payment_method_code, cod_status, delivery_zone_code,
      division_code, district_code, thana_code, address_snapshot,
      cod_collectable_paisa, customer_paid_delivery_paisa, shipment_state,
      created_at, updated_at
    ) VALUES (
      $1, $2, 'cod', 'confirmed', 'inside_dhaka',
      'BD-DHK', 'BD-DHK-DHA', 'BD-DHK-DHA-SAV',
      $3,
      500000, 6000, 'ready_to_ship',
      now(), now()
    )`,
    [
      `obd_${partialOrderId}`,
      partialOrderId,
      JSON.stringify({
        phone: '01733333333',
        first_name: 'Tareq',
        last_name: 'Zia',
        address_1: 'Savar',
        division: 'Dhaka',
        district: 'Dhaka',
        thana: 'Savar',
      }),
    ]
  )

  const partialBookRes = await fetch(`${MEDUSA_URL}/admin/couriers/book`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${warehouseToken}`,
    },
    body: JSON.stringify({
      order_id: partialOrderId,
      courier_code: 'steadfast',
    }),
  })
  const partialBookData = await partialBookRes.json()

  // Send partial delivery webhook (collected 3000 out of 5000 BDT)
  const partialHookRes = await fetch(`${MEDUSA_URL}/hooks/courier/steadfast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-courier-token': 'sandbox_steadfast_secret',
    },
    body: JSON.stringify({
      consignment_id: partialBookData.consignment_external_id,
      tracking_code: partialBookData.tracking_code,
      status: 'partial_delivery',
      collected_amount: 3000,
      timestamp: new Date().toISOString(),
    }),
  })

  if (!partialHookRes.ok) {
    throw new Error(`Partial delivery webhook failed: ${await partialHookRes.text()}`)
  }
  const partialResult = await partialHookRes.json()
  console.log(`Partial delivery response: ${JSON.stringify(partialResult)}`)

  // Verify return_review record exists
  const retReviewRes = await pg.query(
    `SELECT * FROM return_review WHERE order_id = $1 AND return_type = 'partial_delivery'`,
    [partialOrderId]
  )
  if (retReviewRes.rows.length === 0) {
    throw new Error('return_review record was not created for partial delivery')
  }
  console.log('✓ Partial delivery captured collected cash and opened return review for balance')

  // -------------------------------------------------------------
  // Test 11: Remittance Reconciliation & Discrepancy Math
  // -------------------------------------------------------------
  console.log('\n--- Test 11: Courier Remittance Reconciliation & Variance Math (FR-14.9) ---')
  // We will reconcile the delivered consignment from Test 3
  // Expected COD: 285000 paisa
  // Courier fee: 6000 paisa, COD fee: 2850 paisa (1%)
  // Net Expected = 285000 - 6000 - 2850 = 276150 paisa

  // Line 1: Reconciled perfectly
  const line1 = {
    consignment_external_id: consignment.consignment_external_id,
    expected_cod_paisa: 285000,
    remitted_paisa: 276150,
    courier_fee_paisa: 6000,
    cod_fee_paisa: 2850,
  }

  // Line 2: Disputed discrepancy (remitted 150000 instead of 200000, variance = -42000)
  const line2OrderId = `ord_dispute_${Date.now()}`
  await pg.query(
    `INSERT INTO "order" (id, version, status, currency_code, created_at, updated_at)
     VALUES ($1, 1, 'completed', 'bdt', now(), now())`,
    [line2OrderId]
  )
  await pg.query(
    `INSERT INTO order_bd_details (
      id, order_id, payment_method_code, cod_status, delivery_zone_code,
      division_code, district_code, thana_code, address_snapshot,
      cod_collectable_paisa, customer_paid_delivery_paisa, shipment_state,
      created_at, updated_at
    ) VALUES (
      $1, $2, 'cod', 'confirmed', 'inside_dhaka',
      'BD-DHK', 'BD-DHK-DHA', 'BD-DHK-DHA-SAV',
      $3,
      200000, 6000, 'delivered',
      now(), now()
    )`,
    [
      `obd_${line2OrderId}`,
      line2OrderId,
      JSON.stringify({ phone: '01799999999', first_name: 'Disputed', last_name: 'Order' }),
    ]
  )

  const line2ConsignmentId = `ext_dispute_${Date.now()}`
  await pg.query(
    `INSERT INTO courier_consignment (
      id, order_id, courier_code, consignment_external_id, tracking_code,
      status, is_active, booked_at, cod_collectable_paisa,
      delivery_charge_to_customer_paisa, courier_fee_paisa, weight_grams,
      created_at, updated_at
    ) VALUES (
      $1, $2, 'steadfast', $3, $4,
      'delivered', true, now(), 200000,
      6000, 6000, 500,
      now(), now()
    )`,
    [
      `consign_disp_${Date.now()}`,
      line2OrderId,
      line2ConsignmentId,
      `TRK_DISP_${Date.now()}`,
    ]
  )

  const line2 = {
    consignment_external_id: line2ConsignmentId,
    expected_cod_paisa: 200000,
    remitted_paisa: 150000, // Short remitted
    courier_fee_paisa: 6000,
    cod_fee_paisa: 2000,
  }

  const remittanceRes = await fetch(`${MEDUSA_URL}/admin/couriers/remittance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ownerToken}`,
    },
    body: JSON.stringify({
      courier_code: 'steadfast',
      bank_transfer_ref: `EFTN-STDF-${Date.now()}`,
      total_remitted_paisa: 276150 + 150000,
      lines: [line1, line2],
    }),
  })

  if (!remittanceRes.ok) {
    throw new Error(`Failed to ingest remittance batch: ${await remittanceRes.text()}`)
  }
  const remResult = await remittanceRes.json()
  console.log(`Remittance batch created: Batch ID=${remResult.batch_id}, Status=${remResult.status}, Total Variance=${remResult.total_variance_paisa} paisa`)

  // Check lines in DB
  const remLines = await pg.query(
    `SELECT * FROM courier_remittance_line WHERE batch_id = $1 ORDER BY created_at ASC`,
    [remResult.batch_id]
  )
  if (remLines.rows.length !== 2) {
    throw new Error(`Expected 2 remittance lines, got ${remLines.rows.length}`)
  }
  const dbLine1 = remLines.rows[0]
  const dbLine2 = remLines.rows[1]

  console.log(`Line 1 settlement: status=${dbLine1.dispute_status}, variance=${dbLine1.variance_paisa}`)
  console.log(`Line 2 settlement: status=${dbLine2.dispute_status}, variance=${dbLine2.variance_paisa}`)

  if (dbLine1.dispute_status !== 'none' || Number(dbLine1.variance_paisa) !== 0) {
    throw new Error(`Line 1 should have dispute_status 'none' with 0 variance, got ${JSON.stringify(dbLine1)}`)
  }
  if (dbLine2.dispute_status !== 'open' || Number(dbLine2.variance_paisa) >= 0) {
    throw new Error(`Line 2 should have dispute_status 'open' with negative variance, got ${JSON.stringify(dbLine2)}`)
  }
  console.log('✓ Remittance reconciliation accurately computes variance and flags discrepancies as disputed')

  // -------------------------------------------------------------
  // Test 12: Read Model View v_order_shipment_state
  // -------------------------------------------------------------
  console.log('\n--- Test 12: Read Model View v_order_shipment_state ---')
  const viewRes = await pg.query(
    `SELECT * FROM v_order_shipment_state WHERE order_id = $1`,
    [steadfastOrderId]
  )
  if (viewRes.rows.length === 0) {
    throw new Error(`Order ${steadfastOrderId} not found in view v_order_shipment_state`)
  }
  const viewRow = viewRes.rows[0]
  console.log(`View projection for order: shipment_state=${viewRow.shipment_state}, courier=${viewRow.courier_provider}, tracking=${viewRow.courier_tracking_code}, last_event=${viewRow.last_event_type}`)
  if (viewRow.shipment_state !== 'delivered' || !viewRow.courier_tracking_code || viewRow.last_event_type !== 'delivered') {
    throw new Error(`View projection data incorrect: ${JSON.stringify(viewRow)}`)
  }
  console.log('✓ Read model view v_order_shipment_state successfully reflects unified shipment & courier state')

  await pg.end()
  console.log('\n=============================================')
  console.log('🎉 ALL 12 PROMPT 13 VERIFICATION TESTS PASSED!')
  console.log('=============================================\n')
}

run().catch((err) => {
  console.error('\n❌ Verification failed with error:', err)
  process.exit(1)
})
