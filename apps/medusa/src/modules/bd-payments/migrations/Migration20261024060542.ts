import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261024060542 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "payment_transaction" ("id" text not null, "order_id" text null, "payment_session_id" text null, "provider_id" text check ("provider_id" in ('pp_cod', 'pp_bkash', 'pp_nagad')) not null, "transaction_type" text check ("transaction_type" in ('authorization', 'capture', 'refund', 'status_query')) not null, "amount_bdt" numeric not null, "currency_code" text not null default 'bdt', "gateway_transaction_id" text null, "gateway_status" text not null, "gateway_response_json" jsonb null, "is_verified_server_to_server" boolean not null default false, "raw_amount_bdt" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "payment_transaction_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_transaction_order_id" ON "payment_transaction" ("order_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_transaction_payment_session_id" ON "payment_transaction" ("payment_session_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_transaction_gateway_transaction_id" ON "payment_transaction" ("gateway_transaction_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_transaction_deleted_at" ON "payment_transaction" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "payment_webhook_log" ("id" text not null, "provider" text not null, "endpoint" text not null, "http_method" text not null, "headers_json" jsonb null, "payload_json" jsonb null, "ip_address" text null, "signature_valid" boolean not null default false, "verification_result" text null, "processed" boolean not null default false, "error_message" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "payment_webhook_log_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_webhook_log_deleted_at" ON "payment_webhook_log" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "payment_transaction" cascade;`);

    this.addSql(`drop table if exists "payment_webhook_log" cascade;`);
  }

}
