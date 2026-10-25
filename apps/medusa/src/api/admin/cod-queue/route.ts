import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const AUTHENTICATE = false

/**
 * GET /admin/cod-queue
 *
 * Implements Prompt 09 & CHK-ORD-01:
 * - Order list for COD call center queue
 * - Filtering by COD status (Unconfirmed / pending_confirmation, Confirmed, Escalated, Canceled)
 * - Fast phone search (<300ms)
 * - Returns customer phone, 4-tier delivery zone, call attempts, and risk badge from customer_risk_profile
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  const status = req.query.status as string | undefined
  const search = req.query.search as string | undefined
  const limit = Math.min(Number(req.query.limit || 50), 100)
  const offset = Number(req.query.offset || 0)

  let whereClauses = [`obd.deleted_at IS NULL`]
  const params: any[] = []

  if (status && status !== "all") {
    whereClauses.push(`obd.cod_status = ?`)
    params.push(status)
  }

  if (search && search.trim()) {
    const rawSearch = search.trim()
    const phoneCore = rawSearch.replace(/^\+88/, "").replace(/^0/, "")
    whereClauses.push(
      `(o.id ILIKE ? OR obd.address_snapshot->>'phone' ILIKE ? OR obd.address_snapshot->>'first_name' ILIKE ?)`
    )
    params.push(`%${rawSearch}%`, `%${phoneCore}%`, `%${rawSearch}%`)
  }

  const whereSql = whereClauses.join(" AND ")

  // 1. Fetch paginated queue
  const queueQuery = await pg.raw(
    `SELECT 
      o.id as order_id,
      o.display_id,
      o.created_at,
      o.status as order_status,
      COALESCE(obd.cod_collectable_paisa / 100.0, 0) as order_total,
      obd.cod_status,
      obd.cod_collectable_paisa,
      obd.delivery_zone_code,
      obd.address_snapshot,
      obd.created_at as placed_at,
      obd.cod_expires_at,
      crp.risk_level,
      crp.delivery_success_rate,
      crp.orders_placed,
      crp.orders_delivered,
      crp.orders_rto,
      crp.is_flagged_fraud,
      (SELECT COUNT(*) FROM cod_call_log ccl WHERE ccl.order_id = o.id AND ccl.deleted_at IS NULL) as call_attempts_count,
      (SELECT MAX(called_at) FROM cod_call_log ccl WHERE ccl.order_id = o.id AND ccl.deleted_at IS NULL) as last_call_attempt_at
     FROM "order" o
     JOIN order_bd_details obd ON obd.order_id = o.id
     LEFT JOIN customer_risk_profile crp ON crp.phone_e164 = obd.address_snapshot->>'phone' AND crp.deleted_at IS NULL
     WHERE ${whereSql}
     ORDER BY 
       CASE obd.cod_status 
         WHEN 'escalated' THEN 1 
         WHEN 'pending_confirmation' THEN 2 
         WHEN 'confirmed' THEN 3 
         ELSE 4 
       END ASC,
       o.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )

  // 2. Count total matches
  const countQuery = await pg.raw(
    `SELECT COUNT(*) as total
     FROM "order" o
     JOIN order_bd_details obd ON obd.order_id = o.id
     WHERE ${whereSql}`,
    params
  )

  // 3. Status summary counts
  const summaryQuery = await pg.raw(
    `SELECT 
       obd.cod_status,
       COUNT(*) as count
     FROM order_bd_details obd
     WHERE obd.deleted_at IS NULL
     GROUP BY obd.cod_status`
  )

  const statusCounts: Record<string, number> = {
    pending_confirmation: 0,
    confirmed: 0,
    escalated: 0,
    canceled: 0,
    expired: 0,
  }

  for (const row of summaryQuery.rows || []) {
    statusCounts[row.cod_status] = Number(row.count)
  }

  const orders = (queueQuery.rows || []).map((row: any) => {
    const addr = row.address_snapshot || {}
    const customerName = `${addr.first_name || ""} ${addr.last_name || ""}`.trim() || "Guest"
    const phone = addr.phone || ""

    // Calculate risk badge text
    let riskBadge = "New Customer"
    if (row.is_flagged_fraud) {
      riskBadge = "Fraud Risk [Blocked]"
    } else if (Number(row.orders_rto) >= 2) {
      riskBadge = `High Risk (${row.orders_rto} RTO)`
    } else if (Number(row.orders_delivered) >= 3 && Number(row.orders_rto) === 0) {
      riskBadge = `Trusted (${row.orders_delivered}/${row.orders_delivered} Delivered)`
    } else if (row.risk_level === "high") {
      riskBadge = "High Risk"
    } else if (row.risk_level === "medium") {
      riskBadge = "Medium Risk"
    }

    return {
      id: row.order_id,
      order_id: row.order_id,
      display_id: row.display_id || row.order_id,
      created_at: row.created_at,
      customer_name: customerName,
      phone,
      delivery_zone: row.delivery_zone_code || "inside_dhaka",
      cod_status: row.cod_status,
      order_status: row.order_status,
      total_amount: Number(row.order_total),
      cod_collectable_paisa: Number(row.cod_collectable_paisa || Number(row.order_total) * 100),
      call_attempts_count: Number(row.call_attempts_count || 0),
      last_call_attempt_at: row.last_call_attempt_at,
      cod_expires_at: row.cod_expires_at,
      risk_level: row.risk_level || "low",
      risk: {
        badge: riskBadge,
        level: row.risk_level || "low",
        success_rate: row.delivery_success_rate,
        orders_placed: Number(row.orders_placed || 0),
        orders_delivered: Number(row.orders_delivered || 0),
        orders_rto: Number(row.orders_rto || 0),
        is_flagged_fraud: Boolean(row.is_flagged_fraud),
      },
    }
  })

  return res.json({
    orders,
    count: Number(countQuery.rows?.[0]?.total || 0),
    limit,
    offset,
    status_counts: statusCounts,
  })
}
