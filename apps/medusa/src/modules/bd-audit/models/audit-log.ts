import { model } from "@medusajs/framework/utils"

/**
 * Append-only, hash-chained audit ledger (database.md §3.12.1, §6.5).
 *
 * Immutability is enforced at the database level:
 * - `trg_audit_log_immutable` rejects UPDATE / DELETE (installed by migration);
 * - `ck_audit_log_not_deleted` CHECK forbids soft deletes;
 * - `trg_audit_log_chain` computes `prev_hash` / `record_hash` on INSERT.
 *
 * `record_hash` is DB-computed (PostgreSQL `sha256`), so no client can write
 * an invalid chain link.
 */
export const AuditLog = model
  .define("audit_log", {
    id: model.id({ prefix: "aud_" }).primaryKey(),
    seq: model.autoincrement().unique(),
    occurred_at: model.dateTime().index(),
    actor_id: model.text().index(),
    actor_type: model.enum(["user", "system", "customer", "integration"]),
    actor_role: model.text().nullable(),
    actor_email: model.text().nullable(),
    impersonated_by: model.text().nullable(),
    entity_type: model.text().index(),
    entity_id: model.text().index(),
    entity_label: model.text().nullable(),
    action: model.text().index(),
    reason: model.text().nullable(),
    before_redacted: model.json().nullable(),
    after_redacted: model.json().nullable(),
    changed_fields: model.array().nullable(),
    correlation_id: model.text().index().nullable(),
    request_id: model.text().nullable(),
    ip_address: model.text().nullable(),
    user_agent: model.text().nullable(),
    prev_hash: model.text().nullable(),
    record_hash: model.text(),
  })
  .indexes([
    // Audit entity timeline (IDX_audit_entity_time).
    { on: ["entity_type", "entity_id", "occurred_at"] },
    // Audit actor timeline (IDX_audit_actor_time).
    { on: ["actor_id", "occurred_at"] },
  ])
  .checks([
    {
      name: "ck_audit_log_not_deleted",
      expression: `"deleted_at" IS NULL`,
    },
  ])

export default AuditLog
