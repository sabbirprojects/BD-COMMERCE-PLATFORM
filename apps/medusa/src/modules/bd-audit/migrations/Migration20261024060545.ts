import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261024060545 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "staff_role_permission" drop constraint if exists "staff_role_permission_user_id_unique";`);
    this.addSql(`create table if not exists "audit_log" ("id" text not null, "actor_id" text not null, "actor_role" text check ("actor_role" in ('owner', 'manager', 'staff', 'call_center', 'warehouse', 'finance', 'system')) not null, "actor_email" text null, "entity_type" text check ("entity_type" in ('product', 'variant_price', 'variant_cogs', 'inventory', 'order', 'return_refund', 'courier_consignment', 'staff_user', 'settings', 'content_page', 'auth_security')) not null, "entity_id" text not null, "action" text check ("action" in ('create', 'update', 'delete', 'status_transition', 'refund_recorded', 'restocked', 'quarantined', 'consignment_booked', 'consignment_canceled', 'failed_login', 'account_lockout', 'password_reset')) not null, "old_value" jsonb null, "new_value" jsonb null, "ip_address" text null, "stated_reason" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "audit_log_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_audit_log_actor_id" ON "audit_log" ("actor_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_audit_log_entity_type" ON "audit_log" ("entity_type") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_audit_log_entity_id" ON "audit_log" ("entity_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_audit_log_action" ON "audit_log" ("action") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_audit_log_deleted_at" ON "audit_log" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "staff_role_permission" ("id" text not null, "user_id" text not null, "role" text check ("role" in ('owner', 'manager', 'staff', 'call_center', 'warehouse', 'finance')) not null default 'staff', "can_view_cogs" boolean not null default false, "can_confirm_cod" boolean not null default false, "can_book_courier" boolean not null default false, "can_process_refund" boolean not null default false, "can_manage_content" boolean not null default false, "can_view_audit_logs" boolean not null default false, "must_change_password" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "staff_role_permission_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_staff_role_permission_user_id_unique" ON "staff_role_permission" ("user_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_staff_role_permission_deleted_at" ON "staff_role_permission" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "audit_log" cascade;`);

    this.addSql(`drop table if exists "staff_role_permission" cascade;`);
  }

}
