import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { GET as getContributionProfit } from "../contribution-profit/route"

export const AUTHENTICATE = false

/**
 * GET /admin/reports/profit
 *
 * Alias for /admin/reports/contribution-profit.
 * Enforces AC-G5: report is labeled Contribution Profit / Estimated Contribution Profit,
 * never "Net Profit".
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  return getContributionProfit(req, res)
}
