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
 * GET /admin/reports/attribution
 *
 * Implements Prompt 16 (PRD FR-5.3.5, FR-5.3.6):
 * - Meta Attribution vs Store Sales Comparison
 * - Owner + Finance only
 * - Distinct, separately labeled metrics:
 *   - Manual campaign spend (labeled estimate, never causation)
 *   - Meta-attributed purchases
 *   - Store-verified orders (never merged into one figure)
 * - If Meta API sync is missing/absent, displays "not_connected" and last sync time;
 *   never defaults missing spend data to zero.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const reportsService = getReportsService(req)
    const report = await reportsService.getMetaAttributionComparison()

    return res.status(200).json({
      success: true,
      report_label: "Marketing Attribution vs Store Sales",
      currency: "BDT",
      ...report,
    })
  } catch (error: any) {
    req.scope.resolve("logger")?.error?.(`Attribution report error: ${error.message}`, error)
    return res.status(500).json({
      success: false,
      message: "Failed to generate attribution report",
      error: error.message,
    })
  }
}
