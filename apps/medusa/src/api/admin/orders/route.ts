import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /admin/orders
 *
 * Implements Prompt 12: Orders list with BD filters:
 * - Filter by COD status, payment status, shipment state, delivery zone
 * - Search by phone number or order ID
 * - Returns 4 independent status dimensions:
 *   1. order_status (native order.status)
 *   2. payment_status (paid | unpaid | refunded | partially_refunded)
 *   3. shipment_state (pending_confirmation | ready_to_ship | dispatched | delivered | rto_initiated | rto_received)
 *   4. return_status (pending_manual_review | approved | rejected | received_evaluating | completed | null)
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  const {
    cod_status,
    payment_status,
    shipment_state,
    delivery_zone,
    search,
    limit = 20,
    offset = 0,
  } = req.query as Record<string, string>

  let baseQuery = `
    FROM "order" o
    JOIN order_bd_details obd ON obd.order_id = o.id
    LEFT JOIN return_review rr ON rr.order_id = o.id AND rr.deleted_at IS NULL
    LEFT JOIN customer_risk_profile crp ON (crp.phone_e164 = (obd.address_snapshot->>'phone') OR crp.phone_e164 = ('+88' || (obd.address_snapshot->>'phone')))
    WHERE obd.deleted_at IS NULL
  `

  const bindings: any[] = []

  if (cod_status) {
    baseQuery += ` AND obd.cod_status = ?`
    bindings.push(cod_status)
  }

  if (shipment_state) {
    baseQuery += ` AND obd.shipment_state = ?`
    bindings.push(shipment_state)
  }

  if (delivery_zone) {
    baseQuery += ` AND obd.delivery_zone_code = ?`
    bindings.push(delivery_zone)
  }

  if (search) {
    baseQuery += ` AND (
      o.id ILIKE ? OR 
      CAST(o.display_id AS TEXT) ILIKE ? OR 
      obd.address_snapshot->>'phone' ILIKE ? OR
      obd.address_snapshot->>'first_name' ILIKE ? OR
      obd.source_reference ILIKE ?
    )`
    const term = `%${search.trim()}%`
    bindings.push(term, term, term, term, term)
  }

  // Count total matching
  const countRes = await pg.raw(`SELECT count(*) as total ${baseQuery}`, bindings)
  const total = Number(countRes.rows?.[0]?.total || 0)

  // Fetch paginated rows
  const query = `
    SELECT 
      o.id as order_id,
      o.display_id,
      o.status as order_status,
      o.currency_code,
      o.created_at,
      obd.id as bd_details_id,
      obd.payment_method_code,
      obd.cod_status,
      obd.shipment_state,
      obd.delivery_zone_code,
      obd.division_code,
      obd.district_code,
      obd.thana_code,
      obd.address_snapshot,
      obd.cod_collectable_paisa,
      obd.customer_paid_delivery_paisa,
      (SELECT count(*) FROM cod_call_log ccl WHERE ccl.order_id = o.id AND ccl.deleted_at IS NULL) as call_attempts_count,
      (SELECT MAX(called_at) FROM cod_call_log ccl WHERE ccl.order_id = o.id AND ccl.deleted_at IS NULL) as last_call_attempt_at,
      obd.source_reference,
      obd.courier_provider,
      obd.courier_tracking_code,
      rr.status as return_status,
      rr.id as return_review_id,
      rr.refund_status as return_refund_status,
      COALESCE(crp.risk_level, 'low') as risk_level,
      COALESCE(crp.orders_rto, 0) as rto_count
    ${baseQuery}
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `

  bindings.push(Number(limit), Number(offset))
  const ordersRes = await pg.raw(query, bindings)

  const items = (ordersRes.rows || []).map((row: any) => {
    // Derive payment_status independently
    let paymentStatus = "unpaid"
    if (row.payment_method_code !== "cod" || row.shipment_state === "delivered") {
      paymentStatus = "paid"
    }
    if (row.return_refund_status === "paid") {
      paymentStatus = "refunded"
    }

    return {
      id: row.order_id,
      display_id: row.display_id || row.order_id,
      created_at: row.created_at,
      currency_code: row.currency_code || "bdt",
      // 4 Independent Statuses
      statuses: {
        order_status: row.order_status,
        payment_status: paymentStatus,
        shipment_state: row.shipment_state,
        return_status: row.return_status || null,
      },
      cod: {
        status: row.cod_status,
        collectable_bdt: Number(row.cod_collectable_paisa || 0) / 100,
        call_attempts: row.call_attempts_count || 0,
        last_call_at: row.last_call_attempt_at || null,
      },
      delivery: {
        zone_code: row.delivery_zone_code,
        delivery_charge_bdt: Number(row.customer_paid_delivery_paisa || 0) / 100,
        address: row.address_snapshot || {},
        courier_provider: row.courier_provider || null,
        tracking_code: row.courier_tracking_code || null,
      },
      customer: {
        name: `${row.address_snapshot?.first_name || ""} ${row.address_snapshot?.last_name || ""}`.trim(),
        phone: row.address_snapshot?.phone || "",
        risk_level: row.risk_level,
        rto_count: row.rto_count,
      },
      payment_method: row.payment_method_code,
      source_reference: row.source_reference,
    }
  })

  return res.json({
    success: true,
    orders: items,
    count: total,
    limit: Number(limit),
    offset: Number(offset),
  })
}
