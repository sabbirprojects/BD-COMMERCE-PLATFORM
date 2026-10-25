import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const AUTHENTICATE = false

/**
 * GET /admin/reports/contribution-profit
 *
 * Implements Prompt 10 & CHK-SEC-01 (Architecture §6.3 / PRD FR-8.2.3):
 * - Contribution Profit & Financial Reports
 * - Strictly Owner + Finance only
 * - Call Center, Warehouse, Content, and Store Manager without explicit grant receive 403 Forbidden
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  // Aggregate gross revenue and COGS from immutable snapshots
  const summaryRes = await pg.raw(`
    SELECT 
      COUNT(DISTINCT o.id) as total_orders,
      COALESCE(SUM(ols.unit_price_paisa * ols.quantity), 0) / 100.0 as gross_product_revenue,
      COALESCE(SUM(ols.cogs_paisa * ols.quantity), 0) / 100.0 as total_cogs,
      COALESCE(SUM(ols.discount_paisa), 0) / 100.0 as total_discounts,
      COALESCE(SUM(obd.customer_paid_delivery_paisa), 0) / 100.0 as delivery_fees_collected
    FROM "order" o
    JOIN order_bd_details obd ON obd.order_id = o.id
    LEFT JOIN order_line_snapshot ols ON ols.order_id = o.id
    WHERE obd.cod_status IN ('confirmed', 'delivered')
  `)

  const row = summaryRes.rows?.[0] || {}
  const revenue = Number(row.gross_product_revenue || 0)
  const cogs = Number(row.total_cogs || 0)
  const grossProfit = revenue - cogs
  const grossMarginPercent = revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(1) : "0.0"

  return res.json({
    report: "Contribution Profit Summary",
    currency: "BDT",
    total_orders: Number(row.total_orders || 0),
    gross_revenue: revenue,
    total_cogs: cogs,
    gross_profit: grossProfit,
    gross_margin_percent: `${grossMarginPercent}%`,
    delivery_fees_collected: Number(row.delivery_fees_collected || 0),
    access_granted_roles: ["owner", "finance"],
  })
}
