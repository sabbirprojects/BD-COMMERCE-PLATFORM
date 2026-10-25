import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import jwt from "jsonwebtoken"

function getUserFromReq(req: MedusaRequest) {
  const authHeader = req.headers["authorization"] || ""
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7)
    const decoded = jwt.decode(token) as any
    if (decoded) {
      return {
        id: decoded.actor_id || decoded.app_metadata?.user_id || "user_staff",
        role: decoded.app_metadata?.role || decoded.role || "operations",
      }
    }
  }
  const authContext = (req as any).auth_context
  if (authContext) {
    return {
      id: authContext.actor_id || "user_staff",
      role: authContext.app_metadata?.role || "operations",
    }
  }
  return (req as any).user || { id: "user_admin", role: "owner" }
}

/**
 * GET /admin/couriers
 *
 * Lists all registered couriers with status, capabilities, and active configuration.
 * PRD FR-7.4.1 & FR-7.4.6.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  const couriersRes = await pg.raw(`
    SELECT 
      c.*,
      (SELECT count(*) FROM courier_consignment cc WHERE cc.courier_code = c.code AND cc.deleted_at IS NULL) as total_consignments,
      (SELECT count(*) FROM courier_consignment cc WHERE cc.courier_code = c.code AND cc.status = 'delivered' AND cc.deleted_at IS NULL) as delivered_consignments,
      (SELECT count(*) FROM courier_consignment cc WHERE cc.courier_code = c.code AND cc.status IN ('rto_initiated', 'rto_received') AND cc.deleted_at IS NULL) as rto_consignments
    FROM courier c
    WHERE c.deleted_at IS NULL
    ORDER BY c.sort_order ASC
  `)

  return res.json({
    success: true,
    couriers: couriersRes.rows || [],
  })
}
