import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import BdAuditModuleService from "../../../modules/bd-audit/service"
import { BD_AUDIT_MODULE } from "../../../modules/bd-audit"

/**
 * Opt out of the framework's global /admin authenticate middleware so the
 * requireBdRoles guard owns authentication end-to-end and can map every
 * auth failure to 403 (Prompt 02 DONE WHEN). The guard itself calls the
 * same framework `authenticate("user", ["session", "bearer"])` — no auth
 * path is skipped.
 */
export const AUTHENTICATE = false

const MAX_LIMIT = 100

/**
 * GET /admin/audit-logs — read-only, paginated audit trail for the Admin
 * "Audit Logs" screen (Prompt 02 scope item 5, FR-12.2). Append-only at the
 * database level (trg_audit_log_immutable) — this route has no write
 * handlers on purpose. Access is restricted to Owner/Finance by the
 * requireBdRoles middleware registered in src/api/middlewares.ts.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const limitRaw = Number(req.query.limit ?? 20)
  const offsetRaw = Number(req.query.offset ?? 0)
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0
      ? Math.min(Math.trunc(limitRaw), MAX_LIMIT)
      : 20
  const offset =
    Number.isFinite(offsetRaw) && offsetRaw >= 0 ? Math.trunc(offsetRaw) : 0

  const entityType =
    typeof req.query.entity_type === "string" && req.query.entity_type.length
      ? req.query.entity_type
      : undefined

  const service = req.scope.resolve<BdAuditModuleService>(BD_AUDIT_MODULE)

  const [logs, count] = await service.listAndCountAuditLogs(
    entityType ? { entity_type: entityType } : {},
    {
      take: limit,
      skip: offset,
      order: { seq: "DESC" },
    }
  )

  res.json({ logs, count, limit, offset })
}
