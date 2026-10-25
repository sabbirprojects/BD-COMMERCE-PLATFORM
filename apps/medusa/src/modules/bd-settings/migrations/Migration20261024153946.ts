import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261024153946 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "vat_settings" drop constraint if exists "vat_settings_is_current_unique";`);
    this.addSql(`alter table if exists "operational_settings" drop constraint if exists "operational_settings_meta_pixel_id_unique";`);
    this.addSql(`alter table if exists "geo_thana" drop constraint if exists "geo_thana_bbs_code_unique";`);
    this.addSql(`alter table if exists "geo_division" drop constraint if exists "geo_division_bbs_code_unique";`);
    this.addSql(`alter table if exists "geo_district" drop constraint if exists "geo_district_bbs_code_unique";`);
    this.addSql(`alter table if exists "delivery_zone_district" drop constraint if exists "delivery_zone_district_delivery_zone_code_district_code_unique";`);
    this.addSql(`alter table if exists "delivery_zone_district" drop constraint if exists "delivery_zone_district_district_code_unique";`);
    this.addSql(`alter table if exists "delivery_zone" drop constraint if exists "delivery_zone_shipping_option_id_unique";`);
    this.addSql(`alter table if exists "delivery_zone" drop constraint if exists "delivery_zone_code_unique";`);
    this.addSql(`create table if not exists "delivery_zone" ("id" text not null, "code" text not null, "name_en" text not null, "name_bn" text not null, "shipping_option_id" text null, "service_zone_id" text null, "cod_enabled" boolean not null default true, "cod_handling_fee_paisa" numeric not null default 0, "min_order_paisa" numeric not null default 0, "max_weight_grams" integer null, "delivery_days_min" integer null, "delivery_days_max" integer null, "priority" integer not null default 0, "is_active" boolean not null default true, "metadata" jsonb null, "raw_cod_handling_fee_paisa" jsonb not null default '{"value":"0","precision":20}', "raw_min_order_paisa" jsonb not null default '{"value":"0","precision":20}', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "delivery_zone_pkey" primary key ("id"), constraint CK_dz_paisa_integer_nonnegative check ("cod_handling_fee_paisa" = trunc("cod_handling_fee_paisa") AND "cod_handling_fee_paisa" >= 0 AND "min_order_paisa" = trunc("min_order_paisa") AND "min_order_paisa" >= 0));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_delivery_zone_code_unique" ON "delivery_zone" ("code") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_delivery_zone_deleted_at" ON "delivery_zone" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_delivery_zone_shipping_option_id_unique" ON "delivery_zone" ("shipping_option_id") WHERE "shipping_option_id" IS NOT NULL AND deleted_at IS NULL;`);

    this.addSql(`create table if not exists "delivery_zone_district" ("id" text not null, "delivery_zone_code" text not null, "district_code" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "delivery_zone_district_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_delivery_zone_district_district_code_unique" ON "delivery_zone_district" ("district_code") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_delivery_zone_district_deleted_at" ON "delivery_zone_district" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_delivery_zone_district_delivery_zone_code_district_code_unique" ON "delivery_zone_district" ("delivery_zone_code", "district_code") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "geo_district" ("code" text not null, "division_code" text not null, "name_en" text not null, "name_bn" text not null, "bbs_code" text null, "is_active" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "geo_district_pkey" primary key ("code"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_geo_district_deleted_at" ON "geo_district" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_geo_district_division_code" ON "geo_district" ("division_code") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_geo_district_bbs_code_unique" ON "geo_district" ("bbs_code") WHERE "bbs_code" IS NOT NULL AND deleted_at IS NULL;`);

    this.addSql(`create table if not exists "geo_division" ("code" text not null, "name_en" text not null, "name_bn" text not null, "bbs_code" text null, "sort_order" integer not null default 0, "is_active" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "geo_division_pkey" primary key ("code"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_geo_division_deleted_at" ON "geo_division" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_geo_division_bbs_code_unique" ON "geo_division" ("bbs_code") WHERE "bbs_code" IS NOT NULL AND deleted_at IS NULL;`);

    this.addSql(`create table if not exists "geo_thana" ("code" text not null, "district_code" text not null, "name_en" text not null, "name_bn" text not null, "bbs_code" text null, "postal_codes" text[] null, "is_city_corporation" boolean not null default false, "is_active" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "geo_thana_pkey" primary key ("code"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_geo_thana_deleted_at" ON "geo_thana" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_geo_thana_district_code_name_en" ON "geo_thana" ("district_code", "name_en") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_geo_thana_bbs_code_unique" ON "geo_thana" ("bbs_code") WHERE "bbs_code" IS NOT NULL AND deleted_at IS NULL;`);

    this.addSql(`create table if not exists "operational_settings" ("id" text not null, "cod_expiry_hours" integer not null default 48, "cod_max_call_attempts" integer not null default 3, "sms_sender_id" text null, "sms_rate_limit_per_order_event" integer not null default 3, "meta_pixel_id" text null, "meta_capi_enabled" boolean not null default false, "meta_capi_secret_ref" text null, "meta_test_event_code" text null, "ga4_measurement_id" text null, "support_phone" text null, "support_email" text null, "default_locale" text check ("default_locale" in ('en', 'bn')) not null default 'en', "currency_display_locale" text not null default 'bn-BD', "invoice_terms_en" text null, "invoice_terms_bn" text null, "cod_advance_required_above_paisa" numeric null, "retention_webhook_days" integer not null default 90, "retention_sms_days" integer not null default 180, "retention_risk_months" integer not null default 24, "retention_audit_years" integer not null default 6, "updated_by" text null, "raw_cod_advance_required_above_paisa" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "operational_settings_pkey" primary key ("id"), constraint CK_opset_singleton check ("id" = 'global'), constraint CK_opset_positive_integers check ("cod_expiry_hours" > 0 AND "cod_max_call_attempts" > 0 AND "sms_rate_limit_per_order_event" > 0), constraint CK_opset_cod_advance_paisa_integer check ("cod_advance_required_above_paisa" IS NULL OR ("cod_advance_required_above_paisa" = trunc("cod_advance_required_above_paisa") AND "cod_advance_required_above_paisa" >= 0)));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_operational_settings_deleted_at" ON "operational_settings" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_operational_settings_meta_pixel_id_unique" ON "operational_settings" ("meta_pixel_id") WHERE "meta_pixel_id" IS NOT NULL AND deleted_at IS NULL;`);

    this.addSql(`create table if not exists "vat_settings" ("id" text not null, "is_current" boolean not null default false, "is_vat_enabled" boolean not null default false, "registration_number" text null, "registration_status" text check ("registration_status" in ('unverified', 'verified')) not null default 'unverified', "prices_include_vat" boolean not null default false, "tax_region_id" text null, "tax_rate_id" text null, "legal_note_en" text null, "legal_note_bn" text null, "effective_from" timestamptz null, "effective_to" timestamptz null, "created_by" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "vat_settings_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vat_settings_deleted_at" ON "vat_settings" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_vat_settings_is_current_unique" ON "vat_settings" ("is_current") WHERE "is_current" = true AND deleted_at IS NULL;`);

    this.addSql(`drop table if exists "delivery_zone_config" cascade;`);

    this.addSql(`drop table if exists "vat_config" cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`create table if not exists "delivery_zone_config" ("id" text not null, "zone_code" text check ("zone_code" in ('inside_dhaka', 'dhaka_suburbs', 'outside_dhaka')) not null, "name_en" text not null, "name_bn" text not null, "flat_rate_bdt" numeric not null default 6000, "free_shipping_threshold_bdt" numeric not null default 200000, "delivery_days_min" integer not null default 1, "delivery_days_max" integer not null default 3, "is_active" boolean not null default true, "coverage_districts_json" jsonb null, "raw_flat_rate_bdt" jsonb not null default '{"value":"6000","precision":20}', "raw_free_shipping_threshold_bdt" jsonb not null default '{"value":"200000","precision":20}', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "delivery_zone_config_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_delivery_zone_config_zone_code_unique" ON "delivery_zone_config" ("zone_code") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_delivery_zone_config_deleted_at" ON "delivery_zone_config" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "vat_config" ("id" text not null, "vat_enabled" boolean not null default false, "vat_rate_percent" real not null default 0, "vat_registration_number" text null, "vat_display_on_invoice" boolean not null default false, "prices_include_vat" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "vat_config_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vat_config_deleted_at" ON "vat_config" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`drop table if exists "delivery_zone" cascade;`);

    this.addSql(`drop table if exists "delivery_zone_district" cascade;`);

    this.addSql(`drop table if exists "geo_district" cascade;`);

    this.addSql(`drop table if exists "geo_division" cascade;`);

    this.addSql(`drop table if exists "geo_thana" cascade;`);

    this.addSql(`drop table if exists "operational_settings" cascade;`);

    this.addSql(`drop table if exists "vat_settings" cascade;`);
  }

}
