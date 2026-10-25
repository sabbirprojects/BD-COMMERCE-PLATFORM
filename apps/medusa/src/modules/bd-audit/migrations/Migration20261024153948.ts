import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261024153948 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "audit_log" drop constraint if exists "audit_log_seq_unique";`);
    this.addSql(`alter table if exists "webhook_event" drop constraint if exists "webhook_event_source_payload_sha256_unique";`);
    this.addSql(`alter table if exists "webhook_event" drop constraint if exists "webhook_event_source_external_event_id_unique";`);
    this.addSql(`alter table if exists "staff_profile" drop constraint if exists "staff_profile_employee_code_unique";`);
    this.addSql(`alter table if exists "staff_profile" drop constraint if exists "staff_profile_user_id_unique";`);
    this.addSql(`create table if not exists "staff_profile" ("id" text not null, "user_id" text not null, "employee_code" text null, "display_name" text not null, "phone_e164" text null, "department" text null, "designation" text null, "joined_at" timestamptz null, "is_active" boolean not null default true, "notes" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "staff_profile_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_staff_profile_user_id_unique" ON "staff_profile" ("user_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_staff_profile_deleted_at" ON "staff_profile" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_staff_profile_employee_code_unique" ON "staff_profile" ("employee_code") WHERE "employee_code" IS NOT NULL AND deleted_at IS NULL;`);

    this.addSql(`create table if not exists "webhook_event" ("id" text not null, "source" text not null, "event_type" text null, "external_event_id" text null, "payment_provider_code" text null, "courier_code" text null, "order_id" text null, "payment_attempt_id" text null, "courier_consignment_id" text null, "http_method" text not null, "endpoint" text not null, "ip_address" text null, "headers_redacted" jsonb not null, "payload_redacted" jsonb null, "payload_sha256" text not null, "signature_valid" boolean not null default false, "signature_algorithm" text null, "verification_status" text check ("verification_status" in ('pending', 'verified', 'failed', 'skipped')) not null, "processing_status" text check ("processing_status" in ('received', 'processing', 'processed', 'ignored', 'failed')) not null, "attempts" integer not null default 0, "processed_at" timestamptz null, "error_code" text null, "error_message_redacted" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "webhook_event_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_webhook_event_order_id" ON "webhook_event" ("order_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_webhook_event_payment_attempt_id" ON "webhook_event" ("payment_attempt_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_webhook_event_courier_consignment_id" ON "webhook_event" ("courier_consignment_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_webhook_event_deleted_at" ON "webhook_event" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_webhook_event_source_external_event_id_unique" ON "webhook_event" ("source", "external_event_id") WHERE "external_event_id" IS NOT NULL AND deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_webhook_event_source_payload_sha256_unique" ON "webhook_event" ("source", "payload_sha256") WHERE "external_event_id" IS NULL AND deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_webhook_event_processing_status_created_at" ON "webhook_event" ("processing_status", "created_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_webhook_event_source_created_at" ON "webhook_event" ("source", "created_at") WHERE deleted_at IS NULL;`);

    this.addSql(`drop table if exists "staff_role_permission" cascade;`);

    this.addSql(`alter table if exists "audit_log" drop constraint if exists "audit_log_actor_role_check";`);
    this.addSql(`alter table if exists "audit_log" drop constraint if exists "audit_log_entity_type_check";`);
    this.addSql(`alter table if exists "audit_log" drop constraint if exists "audit_log_action_check";`);

    this.addSql(`alter table if exists "audit_log" drop column if exists "old_value", drop column if exists "new_value";`);

    this.addSql(`alter table if exists "audit_log" add column if not exists "seq" serial, add column if not exists "occurred_at" timestamptz not null, add column if not exists "actor_type" text check ("actor_type" in ('user', 'system', 'customer', 'integration')) not null, add column if not exists "entity_label" text null, add column if not exists "impersonated_by" text null, add column if not exists "before_redacted" jsonb null, add column if not exists "after_redacted" jsonb null, add column if not exists "changed_fields" text[] null, add column if not exists "correlation_id" text null, add column if not exists "request_id" text null, add column if not exists "user_agent" text null, add column if not exists "prev_hash" text null, add column if not exists "record_hash" text not null;`);
    this.addSql(`alter table if exists "audit_log" alter column "actor_role" type text using ("actor_role"::text);`);
    this.addSql(`alter table if exists "audit_log" alter column "actor_role" drop not null;`);
    this.addSql(`alter table if exists "audit_log" alter column "entity_type" type text using ("entity_type"::text);`);
    this.addSql(`alter table if exists "audit_log" alter column "action" type text using ("action"::text);`);
    this.addSql(`alter table if exists "audit_log" rename column "stated_reason" to "reason";`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_audit_log_seq_unique" ON "audit_log" ("seq") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_audit_log_occurred_at" ON "audit_log" ("occurred_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_audit_log_correlation_id" ON "audit_log" ("correlation_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_audit_log_entity_type_entity_id_occurred_at" ON "audit_log" ("entity_type", "entity_id", "occurred_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_audit_log_actor_id_occurred_at" ON "audit_log" ("actor_id", "occurred_at") WHERE deleted_at IS NULL;`);
    this.addSql(`alter table if exists "audit_log" add constraint ck_audit_log_not_deleted check("deleted_at" IS NULL);`);

    // ---- Append-only + hash-chain guards (database.md §6.5) -----------------
    // DML has no defaultNow() in 2.22, so the business-time default is raw SQL.
    this.addSql(`alter table if exists "audit_log" alter column "occurred_at" set default now();`);

    this.addSql(`CREATE OR REPLACE FUNCTION bd_reject_audit_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only (attempted %)', TG_OP;
END;
$$ LANGUAGE plpgsql;`);

    this.addSql(`CREATE TRIGGER trg_audit_log_immutable
  BEFORE UPDATE OR DELETE ON "audit_log"
  FOR EACH ROW EXECUTE FUNCTION bd_reject_audit_mutation();`);

    // record_hash = sha256(prev_hash | seq | occurred_at | actor_id | entity_type
    //                     | entity_id | action | canonical(before) | canonical(after))
    // canonical = to_jsonb (sorted keys, no whitespace). The advisory lock
    // serialises concurrent appends so prev_hash stays unique per link.
    this.addSql(`CREATE OR REPLACE FUNCTION bd_audit_chain() RETURNS trigger AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('audit_log_chain'));
  NEW.prev_hash := (SELECT record_hash FROM "audit_log" ORDER BY seq DESC LIMIT 1);
  NEW.record_hash := encode(sha256(convert_to(
    coalesce(NEW.prev_hash, '') || '|' || NEW.seq::text || '|' || NEW.occurred_at::text || '|' ||
    coalesce(NEW.actor_id, '') || '|' || coalesce(NEW.entity_type, '') || '|' ||
    coalesce(NEW.entity_id, '') || '|' || coalesce(NEW.action, '') || '|' ||
    coalesce(to_jsonb(NEW.before_redacted)::text, 'null') || '|' ||
    coalesce(to_jsonb(NEW.after_redacted)::text, 'null'),
    'UTF8')), 'hex');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;`);

    this.addSql(`CREATE TRIGGER trg_audit_log_chain
  BEFORE INSERT ON "audit_log"
  FOR EACH ROW EXECUTE FUNCTION bd_audit_chain();`);

    // Time-scan index (database.md §5.3 IDX_audit_brin).
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_audit_brin" ON "audit_log" USING BRIN ("occurred_at");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop trigger if exists trg_audit_log_chain on "audit_log";`);
    this.addSql(`drop function if exists bd_audit_chain();`);
    this.addSql(`drop trigger if exists trg_audit_log_immutable on "audit_log";`);
    this.addSql(`drop function if exists bd_reject_audit_mutation();`);
    this.addSql(`drop index if exists "IDX_audit_brin";`);
    this.addSql(`alter table if exists "audit_log" alter column "occurred_at" drop default;`);

    this.addSql(`create table if not exists "staff_role_permission" ("id" text not null, "user_id" text not null, "role" text check ("role" in ('owner', 'manager', 'staff', 'call_center', 'warehouse', 'finance')) not null default 'staff', "can_view_cogs" boolean not null default false, "can_confirm_cod" boolean not null default false, "can_book_courier" boolean not null default false, "can_process_refund" boolean not null default false, "can_manage_content" boolean not null default false, "can_view_audit_logs" boolean not null default false, "must_change_password" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "staff_role_permission_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_staff_role_permission_user_id_unique" ON "staff_role_permission" ("user_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_staff_role_permission_deleted_at" ON "staff_role_permission" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`drop table if exists "staff_profile" cascade;`);

    this.addSql(`drop table if exists "webhook_event" cascade;`);

    this.addSql(`drop index if exists "IDX_audit_log_seq_unique";`);
    this.addSql(`drop index if exists "IDX_audit_log_occurred_at";`);
    this.addSql(`drop index if exists "IDX_audit_log_correlation_id";`);
    this.addSql(`drop index if exists "IDX_audit_log_entity_type_entity_id_occurred_at";`);
    this.addSql(`drop index if exists "IDX_audit_log_actor_id_occurred_at";`);
    this.addSql(`alter table if exists "audit_log" drop constraint if exists ck_audit_log_not_deleted;`);
    this.addSql(`alter table if exists "audit_log" drop column if exists "seq", drop column if exists "occurred_at", drop column if exists "actor_type", drop column if exists "entity_label", drop column if exists "impersonated_by", drop column if exists "before_redacted", drop column if exists "after_redacted", drop column if exists "changed_fields", drop column if exists "correlation_id", drop column if exists "request_id", drop column if exists "user_agent", drop column if exists "prev_hash", drop column if exists "record_hash";`);

    this.addSql(`alter table if exists "audit_log" add column if not exists "old_value" jsonb null, add column if not exists "new_value" jsonb null;`);
    this.addSql(`alter table if exists "audit_log" alter column "actor_role" type text using ("actor_role"::text);`);
    this.addSql(`alter table if exists "audit_log" alter column "actor_role" set not null;`);
    this.addSql(`alter table if exists "audit_log" add constraint "audit_log_actor_role_check" check("actor_role" in ('owner', 'manager', 'staff', 'call_center', 'warehouse', 'finance', 'system'));`);
    this.addSql(`alter table if exists "audit_log" add constraint "audit_log_entity_type_check" check("entity_type" in ('product', 'variant_price', 'variant_cogs', 'inventory', 'order', 'return_refund', 'courier_consignment', 'staff_user', 'settings', 'content_page', 'auth_security'));`);
    this.addSql(`alter table if exists "audit_log" add constraint "audit_log_action_check" check("action" in ('create', 'update', 'delete', 'status_transition', 'refund_recorded', 'restocked', 'quarantined', 'consignment_booked', 'consignment_canceled', 'failed_login', 'account_lockout', 'password_reset'));`);
    this.addSql(`alter table if exists "audit_log" rename column "reason" to "stated_reason";`);
  }

}
