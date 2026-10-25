import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID } from "crypto"
import { acquireStockLock, acquireStockLockWithRetry, releaseStockLock } from "../../../../lib/stock-lock"
import { validateAndNormalizeBdPhone } from "../../../../lib/phone"

const PUBLISHABLE_KEY = process.env.MEDUSA_PUBLISHABLE_KEY || "pk_e03efb8523c1542172c95fe34dc90955a3389f3ee3592faa16171966d4699096"
const MEDUSA_PORT = process.env.MEDUSA_PORT || 9000

/**
 * POST /store/orders/cod
 *
 * Implements Prompt 09: COD Order-Placement Workflow (Architecture §13.1, PRD §6)
 * - Server-side cart, phone, address, and live stock revalidation
 * - Redis distributed mutex `stock:lock:{variant_id}` to serialize concurrent stock checkouts (CHK-CHK-08, AC-6.1)
 * - Atomic inventory reservation at loc_central
 * - Native order creation with immutable `order_line_snapshot` (FR-6.4, CHK-ORD-03)
 * - 1:1 `order_bd_details` (geo codes, zone code, collectable paisa, UTMs, cod_status = 'pending_confirmation')
 * - Projection counter update on `customer_risk_profile`
 * - Idempotency protection against duplicate network requests (AC-4.3)
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const body = (req.body || {}) as {
    cart_id?: string
    idempotency_key?: string
  }

  const cartId = body.cart_id
  const idempotencyKey =
    body.idempotency_key ||
    (req.headers["x-idempotency-key"] as string | undefined) ||
    undefined

  if (!cartId) {
    return res.status(400).json({
      success: false,
      error: "cart_id is required",
      error_bn: "কার্ট আইডি আবশ্যক",
    })
  }

  // 1. Idempotency Check (AC-4.3 / CHK-PAY-03)
  if (idempotencyKey) {
    const existingOrderQuery = await pg.raw(
      `SELECT obd.*, o.id as medusa_order_id, o.status as order_status, COALESCE(obd.cod_collectable_paisa / 100.0, 0) as order_total
       FROM order_bd_details obd
       JOIN "order" o ON obd.order_id = o.id
       WHERE obd.checkout_idempotency_key = ? AND obd.deleted_at IS NULL
       LIMIT 1`,
      [idempotencyKey]
    )

    if (existingOrderQuery.rows && existingOrderQuery.rows.length > 0) {
      const existing = existingOrderQuery.rows[0]
      const linesQuery = await pg.raw(
        `SELECT * FROM order_line_snapshot WHERE order_id = ? AND deleted_at IS NULL`,
        [existing.order_id]
      )
      return res.status(200).json({
        success: true,
        is_duplicate: true,
        order: {
          id: existing.order_id,
          status: existing.order_status,
          total: Number(existing.order_total),
        },
        cod_details: existing,
        order_line_snapshots: linesQuery.rows || [],
        message: "Order already placed with this idempotency key",
      })
    }
  }

  // 2. Fetch cart, address, and metadata
  const cartQuery = await pg.raw(
    `SELECT c.*, ca.phone, ca.first_name, ca.last_name, ca.address_1, ca.province, ca.city, ca.postal_code as addr_postal_code
     FROM cart c
     LEFT JOIN cart_address ca ON c.shipping_address_id = ca.id
     WHERE c.id = ? AND c.deleted_at IS NULL`,
    [cartId]
  )

  const cart = cartQuery.rows?.[0]
  if (!cart) {
    return res.status(404).json({
      success: false,
      error: "Cart not found",
      error_bn: "কার্ট পাওয়া যায়নি",
    })
  }

  // 3. Fetch cart line items
  const linesQuery = await pg.raw(
    `SELECT cli.*, pv.sku as variant_sku, pv.title as variant_title, p.title as product_title
     FROM cart_line_item cli
     LEFT JOIN product_variant pv ON cli.variant_id = pv.id
     LEFT JOIN product p ON pv.product_id = p.id
     WHERE cli.cart_id = ? AND cli.deleted_at IS NULL
     ORDER BY cli.created_at ASC`,
    [cartId]
  )

  const cartLines = linesQuery.rows || []
  if (cartLines.length === 0) {
    return res.status(400).json({
      success: false,
      error: "Cart is empty",
      error_bn: "আপনার কার্ট খালি",
    })
  }

  // 4. Validate phone number (CHK-CHK-05)
  const rawPhone = cart.phone || cart.metadata?.address_snapshot?.phone
  const phoneValidation = validateAndNormalizeBdPhone(rawPhone)
  if (!phoneValidation.isValid) {
    return res.status(400).json({
      success: false,
      error: phoneValidation.errorEn,
      error_bn: phoneValidation.errorBn,
    })
  }
  const canonicalPhone = phoneValidation.canonical!

  // 5. Concurrency Protection & Live Stock Evaluation (CHK-CHK-08, AC-6.1)
  const acquiredLocks: Array<{ variantId: string; lockToken: string }> = []
  try {
    for (const line of cartLines) {
      if (!line.variant_id) continue
      const lockRes = await acquireStockLockWithRetry(line.variant_id, 30, 30, 150)
      if (!lockRes.acquired || !lockRes.lockToken) {
        for (const lk of acquiredLocks) {
          await releaseStockLock(lk.variantId, lk.lockToken)
        }
        return res.status(409).json({
          success: false,
          error: "High checkout traffic. Please try placing your order again in a few moments.",
          error_bn: "অতিরিক্ত অর্ডারের চাপের কারণে সাময়িক বিলম্ব হচ্ছে। অনুগ্রহ করে একটু পর আবার চেষ্টা করুন।",
        })
      }
      acquiredLocks.push({ variantId: line.variant_id, lockToken: lockRes.lockToken })

      // Check live database inventory
      const stockQuery = await pg.raw(
        `SELECT (il.stocked_quantity - il.reserved_quantity) as available_quantity
         FROM inventory_item ii
         JOIN product_variant_inventory_item pvii ON pvii.inventory_item_id = ii.id
         JOIN inventory_level il ON il.inventory_item_id = ii.id
         WHERE pvii.variant_id = ? AND ii.deleted_at IS NULL AND il.deleted_at IS NULL
         LIMIT 1`,
        [line.variant_id]
      )

      const availableQuantity = Number(stockQuery.rows?.[0]?.available_quantity ?? 0)
      if (availableQuantity < Number(line.quantity)) {
        // Release locks and abort
        for (const lk of acquiredLocks) {
          await releaseStockLock(lk.variantId, lk.lockToken)
        }
        return res.status(400).json({
          success: false,
          error: "Sorry, this item just went out of stock.",
          error_bn: "দুঃখিত, পণ্যটি মাত্র স্টক শেষ হয়ে গেছে।",
          out_of_stock_variant_id: line.variant_id,
        })
      }
    }

    // 6. Ensure Payment Collection and Payment Session with pp_cod
    const payColRes = await fetch(`http://127.0.0.1:${MEDUSA_PORT}/store/payment-collections`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ cart_id: cartId }),
    })
    const payColData = await payColRes.json()
    const payColId = payColData.payment_collection?.id

    if (payColId) {
      await fetch(
        `http://127.0.0.1:${MEDUSA_PORT}/store/payment-collections/${payColId}/payment-sessions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-publishable-api-key": PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ provider_id: "pp_cod" }),
        }
      )
    }

    // 7. Complete Cart into Medusa Order
    const completeRes = await fetch(`http://127.0.0.1:${MEDUSA_PORT}/store/carts/${cartId}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PUBLISHABLE_KEY,
      },
    })

    const completeData = await completeRes.json()
    if (completeRes.status !== 200 || completeData.type !== "order" || !completeData.order?.id) {
      // Release locks
      for (const lk of acquiredLocks) {
        await releaseStockLock(lk.variantId, lk.lockToken)
      }
      return res.status(400).json({
        success: false,
        error: completeData.message || "Failed to complete cart into order",
        details: completeData,
      })
    }

    const order = completeData.order
    const orderId = order.id

    // 8. Create Order Line Snapshots (PRD FR-6.4.1, CHK-ORD-03)
    const snapshots: any[] = []
    for (const line of cartLines) {
      // Fetch COGS from product_variant_cost
      const costQuery = await pg.raw(
        `SELECT cogs_paisa, packaging_cost_paisa, supplier_name
         FROM product_variant_cost
         WHERE variant_id = ? AND deleted_at IS NULL
         ORDER BY effective_from DESC LIMIT 1`,
        [line.variant_id]
      )
      const costRow = costQuery.rows?.[0]
      const cogsUnitPaisa = costRow ? Number(costRow.cogs_paisa) : null
      const cogsTotalPaisa = cogsUnitPaisa !== null ? cogsUnitPaisa * Number(line.quantity) : null
      const packagingAllocPaisa = costRow ? Number(costRow.packaging_cost_paisa || 0) : 0
      const supplierName = costRow?.supplier_name || null

      const unitPricePaisa = Math.round(Number(line.unit_price) * 100)
      const snapshotId = `olinsnap_${randomUUID().replace(/-/g, "").slice(0, 24)}`

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
          snapshotId,
          orderId,
          line.id,
          line.variant_id,
          line.variant_sku || "SKU-DEFAULT",
          line.product_title || line.title || "Product",
          line.variant_title || "Default",
          line.quantity,
          unitPricePaisa,
          JSON.stringify({ value: String(unitPricePaisa), precision: 20 }),
          cogsUnitPaisa,
          JSON.stringify({ value: String(cogsUnitPaisa || 0), precision: 20 }),
          cogsTotalPaisa,
          JSON.stringify({ value: String(cogsTotalPaisa || 0), precision: 20 }),
          packagingAllocPaisa,
          supplierName,
        ]
      )

      snapshots.push({
        id: snapshotId,
        order_id: orderId,
        line_item_id: line.id,
        variant_id: line.variant_id,
        unit_price_paisa: unitPricePaisa,
        cogs_unit_paisa: cogsUnitPaisa,
        cogs_total_paisa: cogsTotalPaisa,
      })
    }

    // 9. Create 1:1 order_bd_details Record (database.md §3.4.4, §8.4)
    const cartMeta = cart.metadata || {}
    const snapshotAddress = cartMeta.address_snapshot || {
      first_name: cart.first_name || "Guest",
      last_name: cart.last_name || "",
      phone: canonicalPhone,
      address_1: cart.address_1 || "Address",
      city: cart.city || "Dhaka",
      province: cart.province || "BD-DHK-DHA",
      country_code: "bd",
      postal_code: cart.addr_postal_code || "1000",
    }

    const divisionCode = cartMeta.division_code || "BD-DHK"
    const districtCode = cartMeta.district_code || cart.province || "BD-DHK-DHA"
    const thanaCode = cartMeta.thana_code || "BD-DHK-DHA-SAV"
    const deliveryZoneCode = cartMeta.delivery_zone_code || "inside_dhaka"
    const postalCode = cartMeta.postal_code || cart.addr_postal_code || "1000"

    const orderTotal = Number(order.total ?? order.summary?.total ?? cart.total ?? 0)
    const orderTotalPaisa = Math.round(orderTotal * 100)
    const shippingTotal = Number(order.shipping_total ?? order.summary?.shipping_total ?? cart.shipping_total ?? 60)
    const shippingTotalPaisa = Math.round(shippingTotal * 100)

    const orderBdDetailsId = `ordbd_${randomUUID().replace(/-/g, "").slice(0, 24)}`

    // Read operational setting for COD expiry hours
    const opsQuery = await pg.raw(
      `SELECT cod_expiry_hours FROM operational_settings WHERE id = 'global'`
    )
    const codExpiryHours = Number(opsQuery.rows?.[0]?.cod_expiry_hours || 48)

    await pg.raw(
      `INSERT INTO order_bd_details (
        id, order_id, order_source, division_code, district_code, thana_code, postal_code,
        address_snapshot, delivery_zone_code, payment_method_code, checkout_idempotency_key,
        cod_status, cod_expires_at, cod_collectable_paisa, raw_cod_collectable_paisa,
        customer_paid_delivery_paisa, raw_customer_paid_delivery_paisa,
        utm_source, utm_medium, utm_campaign, utm_content, utm_term,
        risk_level_at_order, created_at, updated_at
      ) VALUES (
        ?, ?, 'web', ?, ?, ?, ?,
        ?, ?, 'cod', ?,
        'pending_confirmation', now() + (? || ' hours')::interval, ?, ?,
        ?, ?,
        ?, ?, ?, ?, ?,
        'low', now(), now()
      )`,
      [
        orderBdDetailsId,
        orderId,
        divisionCode,
        districtCode,
        thanaCode,
        postalCode,
        JSON.stringify(snapshotAddress),
        deliveryZoneCode,
        idempotencyKey || null,
        codExpiryHours,
        orderTotalPaisa,
        JSON.stringify({ value: String(orderTotalPaisa), precision: 20 }),
        shippingTotalPaisa,
        JSON.stringify({ value: String(shippingTotalPaisa), precision: 20 }),
        cartMeta.utm_source || null,
        cartMeta.utm_medium || null,
        cartMeta.utm_campaign || null,
        cartMeta.utm_content || null,
        cartMeta.utm_term || null,
      ]
    )

    // 10. Update Customer Risk Profile Counter (database.md §3.4.2)
    const riskId = `risk_${randomUUID().replace(/-/g, "").slice(0, 24)}`
    const customerDisplayName = `${snapshotAddress.first_name || ""} ${snapshotAddress.last_name || ""}`.trim() || "Guest"

    await pg.raw(
      `INSERT INTO customer_risk_profile (
        id, phone_e164, display_name, orders_placed, risk_level, last_order_at, created_at, updated_at
      ) VALUES (
        ?, ?, ?, 1, 'low', now(), now(), now()
      )
      ON CONFLICT (phone_e164) WHERE deleted_at IS NULL
      DO UPDATE SET
        orders_placed = customer_risk_profile.orders_placed + 1,
        last_order_at = now(),
        display_name = COALESCE(EXCLUDED.display_name, customer_risk_profile.display_name),
        updated_at = now()`,
      [riskId, canonicalPhone, customerDisplayName]
    )

    // 11. Record in audit_log
    const auditId = `audit_${randomUUID().replace(/-/g, "").slice(0, 24)}`
    await pg.raw(
      `INSERT INTO audit_log (
        id, entity_type, entity_id, action, actor_type, actor_id, after_redacted, record_hash
      ) VALUES (
        ?, 'order', ?, 'order_create_cod', 'customer', ?, ?, 'pending-db-chain'
      )`,
      [
        auditId,
        orderId,
        canonicalPhone,
        JSON.stringify({
          cart_id: cartId,
          total_paisa: orderTotalPaisa,
          zone: deliveryZoneCode,
          items_count: cartLines.length,
          idempotency_key: idempotencyKey,
        }),
      ]
    )

    // 12. Release Redis Locks
    for (const lk of acquiredLocks) {
      await releaseStockLock(lk.variantId, lk.lockToken)
    }

    return res.status(200).json({
      success: true,
      ready_for_order: true,
      order: {
        id: orderId,
        display_id: order.display_id || orderId,
        status: order.status,
        total: Number(order.total),
        shipping_total: Number(order.shipping_total || 60),
        currency_code: "bdt",
        created_at: order.created_at,
      },
      cod_details: {
        id: orderBdDetailsId,
        order_id: orderId,
        cod_status: "pending_confirmation",
        cod_collectable_paisa: orderTotalPaisa,
        customer_paid_delivery_paisa: shippingTotalPaisa,
        delivery_zone_code: deliveryZoneCode,
        division_code: divisionCode,
        district_code: districtCode,
        thana_code: thanaCode,
        address_snapshot: snapshotAddress,
      },
      order_line_snapshots: snapshots,
      message: "Order placed successfully via Cash on Delivery",
    })
  } catch (err: any) {
    // Ensure all acquired locks are released on unexpected exceptions
    for (const lk of acquiredLocks) {
      try {
        await releaseStockLock(lk.variantId, lk.lockToken)
      } catch (_) {}
    }
    console.error("[COD Order Placement Error]:", err)
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to place COD order",
    })
  }
}
