import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { BD_REPORTS_MODULE } from "../../../../modules/bd-reports"
import BdReportsModuleService from "../../../../modules/bd-reports/service"

export const AUTHENTICATE = false

function getReportsService(req: MedusaRequest): BdReportsModuleService {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  try {
    const service: BdReportsModuleService = req.scope.resolve(BD_REPORTS_MODULE)
    if (service) {
      service.setPgConnection(pg)
      return service
    }
  } catch {}
  return new BdReportsModuleService({ __pg_connection__: pg })
}

/**
 * GET /admin/reports/contribution-profit
 *
 * Implements Prompt 16 (PRD §14, AC-14.1, AC-14.2, AC-G5, FR-14.9):
 * - Contribution Profit Report based on view v_contribution_profit
 * - Strictly Owner + Finance only (enforced via requireBdRoles middleware)
 * - Returns delivery_collected_bdt and courier_cost_bdt as two separate figures
 * - Identifies missing cost inputs (Null ≠ 0) and labels report as "Estimated Contribution Profit"
 * - The word "Net Profit" is strictly forbidden (AC-G5)
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const reportsService = getReportsService(req)

    const {
      from,
      to,
      campaign_id,
      utm_source,
      limit = "50",
      offset = "0",
    } = req.query as Record<string, string | undefined>

    const report = await reportsService.getContributionProfitReport({
      from,
      to,
      campaign_id,
      utm_source,
      limit: Math.min(Math.max(Number(limit) || 50, 1), 200),
      offset: Math.max(Number(offset) || 0, 0),
    })

    return res.status(200).json({
      success: true,
      report_label: report.summary.report_label,
      currency: report.summary.currency,
      summary: report.summary,
      orders: report.orders,
      total_orders_count: report.total_orders_count,
    })
  } catch (error: any) {
    req.scope.resolve("logger")?.error?.(`Contribution profit report error: ${error.message}`, error)
    return res.status(500).json({
      success: false,
      message: "Failed to generate contribution profit report",
      error: error.message,
    })
  }
}
