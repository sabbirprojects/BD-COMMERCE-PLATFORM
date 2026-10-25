import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID } from "crypto"
import { validateAndNormalizeBdPhone } from "../../../lib/phone"
import { sendSmsNotification } from "../../../lib/sms"

/**
 * GET /admin/manual-order
 * Phone-first risk profile lookup (Architecture §15.3).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const rawPhone = (req.query.phone as string | undefined)?.trim()

  if (!rawPhone) {
    return res.status(400).json({ success: false, error: "Phone number required" })
  }

  const phoneVal = validateAndNormalizeBdPhone(rawPhone)
  if (!phoneVal.isValid) {
    return res.status(400).json({
      success: false,
      error: phoneVal.errorEn,
      error_bn: phoneVal.errorBn,
    })
  }

  const canonical = phoneVal.canonical!
  const profileRes = await pg.raw(
    `SELECT * FROM customer_risk_profile WHERE phone_e164 = ? LIMIT 1`,
    [canonical]
  )
  const profile = profileRes.rows?.[0]

  const ordersCountRes = await pg.raw(
    `SELECT 
      count(*) as total_orders,
      count(*) FILTER (WHERE shipment_state = 'delivered') as delivered_orders,
      count(*) FILTER (WHERE shipment_state IN ('rto_initiated', 'rto_received')) as rto_orders
     FROM order_bd_details
     WHERE address_snapshot->>'phone' = ? AND deleted_at IS NULL`,
    [canonical]
  )
  const counts = ordersCountRes.rows?.[0] || {}

  const total = Number(counts.total_orders || 0)
  const rto = Number(counts.rto_orders || 0)
  let riskTier = profile?.risk_level || "low"

  if (rto >= 2) {
    riskTier = "high_risk"
  } else if (rto === 1) {
    riskTier = "medium"
  }

  return res.json({
    success: true,
    phone: canonical,
    risk_tier: riskTier,
    total_orders: total,
    rto_orders: rto,
    delivered_orders: Number(counts.delivered_orders || 0),
    warning: rto > 0 ? `Customer has ${rto} previous RTO order(s)` : null,
  })
}

/**
 * POST /admin/manual-order
 * Phone-first manual order creation (CHK-ORD-04, Architecture §15.3).
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const user = (req as any).user || { id: "user_admin", role: "owner" }

  const {
    phone,
    first_name = "Phone Customer",
    last_name = "",
    street_address,
    division_code = "BD-DHK",
    district_code = "BD-DHK-DHA",
    thana_code = "BD-DHK-DHA-SAV",
    items,
    payment_method = "cod",
    cod_status = "confirmed",
    source_reference,
  } = req.body as any

  if (!phone || !street_address || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: phone, street_address, and items are required",
    })
  }

  const phoneVal = validateAndNormalizeBdPhone(phone)
  if (!phoneVal.isValid) {
    return res.status(400).json({
      success: false,
      error: phoneVal.errorEn,
      error_bn: phoneVal.errorBn,
    })
  }
  const canonicalPhone = phoneVal.canonical!

  // 1. Resolve delivery zone & rate
  let deliveryZoneCode = "inside_dhaka"
  let deliveryChargePaisa = 6000 // ৳60

  if (district_code === "BD-DHK-DHA") {
    deliveryZoneCode = "inside_dhaka"
    deliveryChargePaisa = 6000
  } else if (["BD-DHK-GAZ", "BD-DHK-NAR"].includes(district_code)) {
    deliveryZoneCode = "dhaka_suburbs"
    deliveryChargePaisa = 10000 // ৳100
  } else {
    deliveryZoneCode = "outside_dhaka"
    deliveryChargePaisa = 13000 // ৳130
  }

  // 2. Validate live stock and calculate item totals (FR-6.3.2)
  let subtotalPaisa = 0
  const validatedLines: any[] = []

  for (const it of items) {
    const variantRes = await pg.raw(
      `SELECT pv.id, pv.sku, pv.title as variant_title, p.title as product_title,
              p.id as product_id,
              COALESCE(il.stocked_quantity - il.reserved_quantity, 0) as available_qty,
              c.cogs_paisa, c.packaging_cost_paisa, c.supplier_name
       FROM product_variant pv
       JOIN product p ON p.id = pv.product_id
       LEFT JOIN product_variant_cost c ON c.variant_id = pv.id AND c.deleted_at IS NULL
       LEFT JOIN product_variant_inventory_item pvii ON pvii.variant_id = pv.id
       LEFT JOIN inventory_level il ON il.inventory_item_id = pvii.inventory_item_id
       WHERE pv.id = ? AND pv.deleted_at IS NULL
       LIMIT 1`,
      [it.variant_id]
    )

    const row = variantRes.rows?.[0]
    if (!row) {
      return res.status(400).json({
        success: false,
        error: `Variant ${it.variant_id} not found`,
      })
    }

    const qty = Number(it.quantity || 1)
    if (Number(row.available_qty) < qty) {
      return res.status(400).json({
        success: false,
        error: `Insufficient stock for ${row.product_title} (${row.sku}). Available: ${row.available_qty}`,
      })
    }

    // Fetch price in BDT
    const priceRes = await pg.raw(
      `SELECT amount FROM price WHERE price_set_id IN (
        SELECT price_set_id FROM product_variant_price_set WHERE variant_id = ?
      ) AND currency_code = 'bdt' LIMIT 1`,
      [it.variant_id]
    )
    const unitPricePaisa = priceRes.rows?.[0] ? Math.round(Number(priceRes.rows[0].amount) * 100) : 250000
    const cogsUnitPaisa = row.cogs_paisa ? Number(row.cogs_paisa) : 0
    const cogsTotalPaisa = cogsUnitPaisa * qty

    subtotalPaisa += unitPricePaisa * qty

    validatedLines.push({
      variant_id: row.id,
      sku: row.sku || "SKU-MANUAL",
      product_title: row.product_title,
      variant_title: row.variant_title || "Default",
      quantity: qty,
      unit_price_paisa: unitPricePaisa,
      cogs_unit_paisa: cogsUnitPaisa,
      cogs_total_paisa: cogsTotalPaisa,
      packaging_cost_paisa: row.packaging_cost_paisa || 0,
      supplier_name: row.supplier_name,
    })
  }

  const totalPaisa = subtotalPaisa + deliveryChargePaisa
  const orderId = `order_${randomUUID().replace(/-/g, "").slice(0, 24)}`

  // 3. Insert native Order
  await pg.raw(
    `INSERT INTO "order" (
      id, version, status, currency_code, created_at, updated_at
    ) VALUES (
      ?, 1, 'pending', 'bdt', now(), now()
    )`,
    [orderId]
  )

  // 4. Insert write-once immutable order_line_snapshot (CHK-ORD-03)
  for (const line of validatedLines) {
    const snapId = `olsnap_${randomUUID().replace(/-/g, "").slice(0, 24)}`
    await pg.raw(
      `INSERT INTO order_line_snapshot (
        id, order_id, line_item_id, variant_id, sku, title, variant_title,
        quantity, currency_code, unit_price_paisa, raw_unit_price_paisa,
        compare_at_price_paisa, discount_alloc_paisa, tax_rate_percent,
        tax_amount_paisa, tax_included_in_price, cogs_unit_paisa, raw_cogs_unit_paisa,
        cogs_total_paisa, raw_cogs_total_paisa, packaging_alloc_paisa,
        supplier_name_snapshot, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, 'bdt', ?, ?,
        NULL, 0, 0,
        0, false, ?, ?,
        ?, ?, ?,
        ?, now(), now()
      )`,
      [
        snapId,
        orderId,
        `oli_${randomUUID().replace(/-/g, "").slice(0, 24)}`,
        line.variant_id,
        line.sku,
        line.product_title,
        line.variant_title,
        line.quantity,
        line.unit_price_paisa,
        JSON.stringify({ value: String(line.unit_price_paisa), precision: 20 }),
        line.cogs_unit_paisa,
        JSON.stringify({ value: String(line.cogs_unit_paisa), precision: 20 }),
        line.cogs_total_paisa,
        JSON.stringify({ value: String(line.cogs_total_paisa), precision: 20 }),
        line.packaging_cost_paisa,
        line.supplier_name,
      ]
    )

    // Decrement stocked inventory atomically
    await pg.raw(
      `UPDATE inventory_level il
       SET stocked_quantity = stocked_quantity - ?, updated_at = now()
       FROM product_variant_inventory_item pvii
       WHERE pvii.inventory_item_id = il.inventory_item_id AND pvii.variant_id = ?`,
      [line.quantity, line.variant_id]
    )
  }

  // 5. Insert order_bd_details with manual order flags
  const obdId = `obd_${randomUUID().replace(/-/g, "").slice(0, 24)}`
  const addressSnapshot = {
    first_name,
    last_name,
    phone: canonicalPhone,
    street_address,
    division_code,
    district_code,
    thana_code,
    source: "manual_entry",
    created_by: user.id,
  }

  await pg.raw(
    `INSERT INTO order_bd_details (
      id, order_id, payment_method_code, cod_status, delivery_zone_code,
      division_code, district_code, thana_code, address_snapshot,
      cod_collectable_paisa, customer_paid_delivery_paisa,
      source_reference, shipment_state,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?,
      ?, ?,
      now(), now()
    )`,
    [
      obdId,
      orderId,
      payment_method,
      payment_method === "cod" ? cod_status : "not_applicable",
      deliveryZoneCode,
      division_code,
      district_code,
      thana_code,
      JSON.stringify(addressSnapshot),
      payment_method === "cod" ? totalPaisa : 0,
      deliveryChargePaisa,
      source_reference || `manual_${Date.now()}`,
      cod_status === "confirmed" ? "ready_to_ship" : "pending_confirmation",
    ]
  )

  // 6. Record in audit_log
  await pg.raw(
    `INSERT INTO audit_log (
      id, occurred_at, actor_id, actor_type, actor_role,
      entity_type, entity_id, action, reason, after_redacted, record_hash
    ) VALUES (
      ?, now(), ?, 'user', ?,
      'order', ?, 'manual_order_created', 'Staff created phone/manual order', ?, 'pending-db-chain'
    )`,
    [
      `aud_${randomUUID().replace(/-/g, "").slice(0, 24)}`,
      user.id,
      user.role || "owner",
      orderId,
      JSON.stringify({ total_bdt: totalPaisa / 100, phone: canonicalPhone, items_count: validatedLines.length }),
    ]
  )

  // 7. Non-blocking SMS dispatch (FR-11.6.3)
  sendSmsNotification({
    orderId,
    eventType: "order.placed",
    phone: canonicalPhone,
    data: { order_no: orderId, amount: totalPaisa / 100 },
    pg,
  }).catch(() => {})

  return res.status(201).json({
    success: true,
    order_id: orderId,
    is_manual_order: true,
    total_bdt: totalPaisa / 100,
    delivery_zone: deliveryZoneCode,
    cod_status: payment_method === "cod" ? cod_status : "not_applicable",
    shipment_state: cod_status === "confirmed" ? "ready_to_ship" : "pending_confirmation",
    message: "Manual order created successfully with immutable snapshots and inventory decremented.",
  })
}
