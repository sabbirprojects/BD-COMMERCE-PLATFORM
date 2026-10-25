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
 * GET /admin/reports/dashboard
 *
 * Implements Prompt 16 (Scope 6):
 * - Operational Dashboard Overview:
 *   - Today's sales overview (orders, delivered, net sales, delivery collected vs courier cost)
 *   - Low stock summary
 *   - Pending COD confirmation count and oldest timestamp
 *   - Pending return reviews count and oldest timestamp
 * - Strictly real metrics from PostgreSQL, no fake charts.
 * - Access: Owner, Manager, Finance (enforced by requireBdRoles middleware).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const reportsService = getReportsService(req)
    const overview = await reportsService.getDashboardOverview()

    return res.status(200).json({
      success: true,
      currency: "BDT",
      ...overview,
    })
  } catch (error: any) {
    req.scope.resolve("logger")?.error?.(`Dashboard overview error: ${error.message}`, error)
    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard overview",
      error: error.message,
    })
  }
}
