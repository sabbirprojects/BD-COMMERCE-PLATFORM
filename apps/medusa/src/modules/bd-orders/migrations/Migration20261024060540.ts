import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261024060540 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "order_bd_details" drop constraint if exists "order_bd_details_order_id_unique";`);
    this.addSql(`alter table if exists "customer_risk_profile" drop constraint if exists "customer_risk_profile_phone_number_unique";`);
    this.addSql(`create table if not exists "customer_risk_profile" ("id" text not null, "phone_number" text not null, "customer_name" text null, "total_orders_placed" integer not null default 0, "total_orders_delivered" integer not null default 0, "total_rto_orders" integer not null default 0, "total_canceled_orders" integer not null default 0, "delivery_success_rate" real not null default 0, "is_flagged_fraud" boolean not null default false, "flag_reason" text null, "notes" text null, "last_order_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "customer_risk_profile_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_customer_risk_profile_phone_number_unique" ON "customer_risk_profile" ("phone_number") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_customer_risk_profile_deleted_at" ON "customer_risk_profile" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "order_bd_details" ("id" text not null, "order_id" text not null, "division" text not null, "district" text not null, "thana" text not null, "area_street" text not null, "delivery_zone" text check ("delivery_zone" in ('inside_dhaka', 'dhaka_suburbs', 'outside_dhaka')) not null, "cod_status" text check ("cod_status" in ('not_applicable', 'unconfirmed', 'confirmed', 'escalated', 'canceled')) not null default 'unconfirmed', "call_attempts_count" integer not null default 0, "last_call_attempt_at" timestamptz null, "cod_confirmed_by" text null, "cod_notes" text null, "shipment_state" text check ("shipment_state" in ('pending_confirmation', 'ready_to_ship', 'dispatched', 'in_transit', 'out_for_delivery', 'delivery_failed', 'rto_initiated', 'rto_received', 'delivered')) not null default 'pending_confirmation', "courier_provider" text check ("courier_provider" in ('steadfast', 'pathao', 'redx', 'manual')) null, "courier_consignment_id" text null, "courier_tracking_code" text null, "customer_paid_delivery" numeric not null default 0, "courier_cost_to_business" numeric not null default 0, "cod_remittance_received" numeric not null default 0, "cod_settlement_status" text check ("cod_settlement_status" in ('pending', 'partially_remitted', 'settled', 'disputed')) not null default 'pending', "cogs_total" numeric not null default 0, "utm_source" text null, "utm_medium" text null, "utm_campaign" text null, "landing_page_slug" text null, "raw_customer_paid_delivery" jsonb not null default '{"value":"0","precision":20}', "raw_courier_cost_to_business" jsonb not null default '{"value":"0","precision":20}', "raw_cod_remittance_received" jsonb not null default '{"value":"0","precision":20}', "raw_cogs_total" jsonb not null default '{"value":"0","precision":20}', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "order_bd_details_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_order_bd_details_order_id_unique" ON "order_bd_details" ("order_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_order_bd_details_courier_tracking_code" ON "order_bd_details" ("courier_tracking_code") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_order_bd_details_deleted_at" ON "order_bd_details" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "order_return_request" ("id" text not null, "order_id" text not null, "status" text check ("status" in ('none', 'pending_manual_review', 'approved', 'rejected', 'info_requested', 'item_received_evaluating', 'completed')) not null default 'pending_manual_review', "reason" text not null, "return_courier_name" text null, "return_tracking_code" text null, "item_condition" text check ("item_condition" in ('uninspected', 'sellable', 'damaged', 'not_restockable')) not null default 'uninspected', "refund_method" text check ("refund_method" in ('bkash', 'nagad', 'bank', 'store_credit')) not null default 'bkash', "refund_target_account" text not null, "refund_amount_bdt" numeric not null default 0, "refund_trx_id" text null, "reviewed_by" text null, "reviewed_at" timestamptz null, "raw_refund_amount_bdt" jsonb not null default '{"value":"0","precision":20}', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "order_return_request_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_order_return_request_order_id" ON "order_return_request" ("order_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_order_return_request_deleted_at" ON "order_return_request" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "customer_risk_profile" cascade;`);

    this.addSql(`drop table if exists "order_bd_details" cascade;`);

    this.addSql(`drop table if exists "order_return_request" cascade;`);
  }

}
