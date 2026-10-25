import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261024060541 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "courier_shipment_log" ("id" text not null, "order_id" text not null, "courier" text not null, "action" text not null, "request_payload" jsonb null, "response_payload" jsonb null, "status_code" integer null, "error_message" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "courier_shipment_log_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_courier_shipment_log_order_id" ON "courier_shipment_log" ("order_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_courier_shipment_log_deleted_at" ON "courier_shipment_log" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "courier_webhook_log" ("id" text not null, "courier" text not null, "event_type" text not null, "consignment_id" text null, "tracking_code" text null, "raw_payload" jsonb null, "signature_verified" boolean not null default false, "processed" boolean not null default false, "error_message" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "courier_webhook_log_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_courier_webhook_log_consignment_id" ON "courier_webhook_log" ("consignment_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_courier_webhook_log_tracking_code" ON "courier_webhook_log" ("tracking_code") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_courier_webhook_log_deleted_at" ON "courier_webhook_log" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "courier_shipment_log" cascade;`);

    this.addSql(`drop table if exists "courier_webhook_log" cascade;`);
  }

}
