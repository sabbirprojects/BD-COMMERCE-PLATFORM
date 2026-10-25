import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261024060544 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "delivery_zone_config" drop constraint if exists "delivery_zone_config_zone_code_unique";`);
    this.addSql(`create table if not exists "delivery_zone_config" ("id" text not null, "zone_code" text check ("zone_code" in ('inside_dhaka', 'dhaka_suburbs', 'outside_dhaka')) not null, "name_en" text not null, "name_bn" text not null, "flat_rate_bdt" numeric not null default 6000, "free_shipping_threshold_bdt" numeric not null default 200000, "delivery_days_min" integer not null default 1, "delivery_days_max" integer not null default 3, "is_active" boolean not null default true, "coverage_districts_json" jsonb null, "raw_flat_rate_bdt" jsonb not null default '{"value":"6000","precision":20}', "raw_free_shipping_threshold_bdt" jsonb not null default '{"value":"200000","precision":20}', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "delivery_zone_config_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_delivery_zone_config_zone_code_unique" ON "delivery_zone_config" ("zone_code") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_delivery_zone_config_deleted_at" ON "delivery_zone_config" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "vat_config" ("id" text not null, "vat_enabled" boolean not null default false, "vat_rate_percent" real not null default 0, "vat_registration_number" text null, "vat_display_on_invoice" boolean not null default false, "prices_include_vat" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "vat_config_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vat_config_deleted_at" ON "vat_config" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "delivery_zone_config" cascade;`);

    this.addSql(`drop table if exists "vat_config" cascade;`);
  }

}
