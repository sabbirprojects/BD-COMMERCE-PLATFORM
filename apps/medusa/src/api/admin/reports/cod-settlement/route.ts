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
 * GET /admin/reports/cod-settlement
 *
 * Implements Prompt 16 (database.md §4.6, §8.11, PRD FR-14.9):
 * - COD Settlement & Remittance Reconciliation Report
 * - Strictly Owner + Finance only (enforced via requireBdRoles middleware)
 * - Returns delivery_collected_bdt and courier_cost_bdt as two separate figures
 * - Shows collectable, collected, remitted, courier fees, cod fees, and variance
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const reportsService = getReportsService(req)

    const {
      courier_code,
      settlement_status,
      from,
      to,
      limit = "50",
      offset = "0",
    } = req.query as Record<string, string | undefined>

    const report = await reportsService.getCodSettlementReport({
      courier_code,
      settlement_status,
      from,
      to,
      limit: Math.min(Math.max(Number(limit) || 50, 1), 200),
      offset: Math.max(Number(offset) || 0, 0),
    })

    return res.status(200).json({
      success: true,
      report_label: "COD Settlement & Remittance Reconciliation",
      currency: "BDT",
      summary: report.summary,
      settlements: report.settlements,
      total_count: report.total_count,
    })
  } catch (error: any) {
    req.scope.resolve("logger")?.error?.(`COD settlement report error: ${error.message}`, error)
    return res.status(500).json({
      success: false,
      message: "Failed to generate COD settlement report",
      error: error.message,
    })
  }
}
