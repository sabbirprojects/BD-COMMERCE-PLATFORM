import { MedusaService } from "@medusajs/framework/utils"
import AuditLog from "./models/audit-log"
import StaffProfile from "./models/staff-profile"
import WebhookEvent from "./models/webhook-event"

/**
 * One append to the audit ledger. Mirrors the audit_log columns; `record_hash`
 * is intentionally absent — see appendAuditLog.
 */
export type AuditLogEntry = {
  occurred_at: Date
  actor_id: string
  actor_type: "user" | "system" | "customer" | "integration"
  entity_type: string
  entity_id: string
  entity_label?: string | null
  action: string
  reason?: string | null
  before_redacted?: Record<string, unknown> | null
  after_redacted?: Record<string, unknown> | null
  changed_fields?: string[] | null
  correlation_id?: string | null
  request_id?: string | null
  ip_address?: string | null
  user_agent?: string | null
}

class BdAuditModuleService extends MedusaService({
  AuditLog,
  WebhookEvent,
  StaffProfile,
}) {
  /**
   * Append one entry to the hash-chained audit ledger (database.md §6.5).
   *
   * The DB trigger `trg_audit_log_chain` computes and overwrites `prev_hash`
   * and `record_hash` on every INSERT — the chain is DB-owned and no client
   * can write an invalid link. MikroORM, however, validates the required
   * `record_hash` property before the row reaches the trigger, so ORM-based
   * writes must carry a placeholder. The value assigned here never persists —
   * the trigger's canonical hash always wins.
   */
  async appendAuditLog(entry: AuditLogEntry) {
    const rows = await this.createAuditLogs({
      ...entry,
      record_hash: "pending-db-chain",
    })
    return rows[0]
  }
}

export default BdAuditModuleService
