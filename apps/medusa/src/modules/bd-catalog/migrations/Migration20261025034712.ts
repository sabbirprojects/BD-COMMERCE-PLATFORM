import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261025034712 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product_attribute_value" drop constraint if exists "product_attribute_value_product_id_category_attribute_id_unique";`);
    this.addSql(`alter table if exists "category_attribute" drop constraint if exists "category_attribute_category_id_code_unique";`);
    this.addSql(`alter table if exists "product_bd_profile" drop constraint if exists "product_bd_profile_product_id_unique";`);
    this.addSql(`alter table if exists "category_attribute_option" drop constraint if exists "category_attribute_option_category_attribute_id_value_code_unique";`);
    this.addSql(`create table if not exists "category_attribute_option" ("id" text not null, "category_attribute_id" text not null, "value_code" text not null, "label_en" text not null, "label_bn" text not null, "sort_order" integer not null default 0, "is_active" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "category_attribute_option_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_category_attribute_option_category_attribute_id" ON "category_attribute_option" ("category_attribute_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_category_attribute_option_deleted_at" ON "category_attribute_option" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_category_attribute_option_category_attribute_id_value_code_unique" ON "category_attribute_option" ("category_attribute_id", "value_code") WHERE "deleted_at" IS NULL AND deleted_at IS NULL;`);

    this.addSql(`create table if not exists "product_bd_profile" ("id" text not null, "product_id" text not null, "primary_category_id" text null, "is_returnable" boolean not null default true, "return_policy_id" text null, "warranty_note_en" text null, "warranty_note_bn" text null, "origin_note_en" text null, "origin_note_bn" text null, "country_of_origin" text null default 'BD', "hs_code" text null, "is_cod_allowed" boolean not null default true, "min_order_qty" integer null, "max_order_qty" integer null, "created_by" text null, "updated_by" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_bd_profile_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_bd_profile_product_id" ON "product_bd_profile" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_bd_profile_product_id_unique" ON "product_bd_profile" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_bd_profile_primary_category_id" ON "product_bd_profile" ("primary_category_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_bd_profile_deleted_at" ON "product_bd_profile" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`drop index if exists "IDX_category_attribute_attribute_code";`);
    this.addSql(`alter table if exists "category_attribute" drop column if exists "attribute_type", drop column if exists "options_json";`);

    this.addSql(`alter table if exists "category_attribute" add column if not exists "input_type" text check ("input_type" in ('text', 'number', 'enum', 'boolean')) not null default 'text', add column if not exists "unit" text null, add column if not exists "help_text_en" text null, add column if not exists "help_text_bn" text null, add column if not exists "sort_order" integer not null default 0, add column if not exists "is_active" boolean not null default true;`);
    this.addSql(`alter table if exists "category_attribute" rename column "attribute_code" to "code";`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_category_attribute_code" ON "category_attribute" ("code") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_category_attribute_category_id_code_unique" ON "category_attribute" ("category_id", "code") WHERE "deleted_at" IS NULL AND deleted_at IS NULL;`);

    this.addSql(`drop index if exists "IDX_product_attribute_value_attribute_code";`);
    this.addSql(`alter table if exists "product_attribute_value" drop column if exists "attribute_code", drop column if exists "value_en", drop column if exists "value_bn", drop column if exists "raw_value";`);

    this.addSql(`alter table if exists "product_attribute_value" add column if not exists "category_attribute_id" text not null, add column if not exists "value_text" text null, add column if not exists "value_number" numeric null, add column if not exists "value_boolean" boolean null, add column if not exists "value_code_ref" text null, add column if not exists "raw_value_number" jsonb null;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_attribute_value_category_attribute_id" ON "product_attribute_value" ("category_attribute_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_attribute_value_product_id_category_attribute_id_unique" ON "product_attribute_value" ("product_id", "category_attribute_id") WHERE "deleted_at" IS NULL AND deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_attribute_value_category_attribute_id_value_text" ON "product_attribute_value" ("category_attribute_id", "value_text") WHERE deleted_at IS NULL;`);

    this.addSql(`drop index if exists "IDX_product_variant_cost_variant_id_unique";`);
    this.addSql(`alter table if exists "product_variant_cost" drop column if exists "cogs_bdt", drop column if exists "packaging_cost_bdt", drop column if exists "estimated_shipping_cost_bdt", drop column if exists "raw_cogs_bdt", drop column if exists "raw_packaging_cost_bdt", drop column if exists "raw_estimated_shipping_cost_bdt";`);

    this.addSql(`alter table if exists "product_variant_cost" add column if not exists "currency_code" text not null default 'bdt', add column if not exists "cogs_paisa" numeric not null default 0, add column if not exists "packaging_cost_paisa" numeric not null default 0, add column if not exists "estimated_shipping_cost_paisa" numeric not null default 0, add column if not exists "effective_from" timestamptz not null, add column if not exists "effective_to" timestamptz null, add column if not exists "change_reason" text null, add column if not exists "changed_by" text null, add column if not exists "raw_cogs_paisa" jsonb not null default '{"value":"0","precision":20}', add column if not exists "raw_packaging_cost_paisa" jsonb not null default '{"value":"0","precision":20}', add column if not exists "raw_estimated_shipping_cost_paisa" jsonb not null default '{"value":"0","precision":20}';`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_variant_cost_variant_id" ON "product_variant_cost" ("variant_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_variant_cost_variant_id_effective_from" ON "product_variant_cost" ("variant_id", "effective_from") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "category_attribute_option" cascade;`);

    this.addSql(`drop table if exists "product_bd_profile" cascade;`);

    this.addSql(`drop index if exists "IDX_category_attribute_code";`);
    this.addSql(`drop index if exists "IDX_category_attribute_category_id_code_unique";`);
    this.addSql(`alter table if exists "category_attribute" drop column if exists "input_type", drop column if exists "unit", drop column if exists "help_text_en", drop column if exists "help_text_bn", drop column if exists "sort_order", drop column if exists "is_active";`);

    this.addSql(`alter table if exists "category_attribute" add column if not exists "attribute_type" text check ("attribute_type" in ('select', 'multiselect', 'text', 'boolean')) not null default 'select', add column if not exists "options_json" jsonb null;`);
    this.addSql(`alter table if exists "category_attribute" rename column "code" to "attribute_code";`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_category_attribute_attribute_code" ON "category_attribute" ("attribute_code") WHERE deleted_at IS NULL;`);

    this.addSql(`drop index if exists "IDX_product_attribute_value_category_attribute_id";`);
    this.addSql(`drop index if exists "IDX_product_attribute_value_product_id_category_attribute_id_unique";`);
    this.addSql(`drop index if exists "IDX_product_attribute_value_category_attribute_id_value_text";`);
    this.addSql(`alter table if exists "product_attribute_value" drop column if exists "value_text", drop column if exists "value_number", drop column if exists "value_boolean", drop column if exists "value_code_ref", drop column if exists "raw_value_number";`);

    this.addSql(`alter table if exists "product_attribute_value" add column if not exists "value_en" text not null, add column if not exists "value_bn" text null, add column if not exists "raw_value" text null;`);
    this.addSql(`alter table if exists "product_attribute_value" rename column "category_attribute_id" to "attribute_code";`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_attribute_value_attribute_code" ON "product_attribute_value" ("attribute_code") WHERE deleted_at IS NULL;`);

    this.addSql(`drop index if exists "IDX_product_variant_cost_variant_id";`);
    this.addSql(`drop index if exists "IDX_product_variant_cost_variant_id_effective_from";`);
    this.addSql(`alter table if exists "product_variant_cost" drop column if exists "currency_code", drop column if exists "cogs_paisa", drop column if exists "packaging_cost_paisa", drop column if exists "estimated_shipping_cost_paisa", drop column if exists "effective_from", drop column if exists "effective_to", drop column if exists "change_reason", drop column if exists "changed_by", drop column if exists "raw_cogs_paisa", drop column if exists "raw_packaging_cost_paisa", drop column if exists "raw_estimated_shipping_cost_paisa";`);

    this.addSql(`alter table if exists "product_variant_cost" add column if not exists "cogs_bdt" numeric not null default 0, add column if not exists "packaging_cost_bdt" numeric not null default 0, add column if not exists "estimated_shipping_cost_bdt" numeric not null default 0, add column if not exists "raw_cogs_bdt" jsonb not null default '{"value":"0","precision":20}', add column if not exists "raw_packaging_cost_bdt" jsonb not null default '{"value":"0","precision":20}', add column if not exists "raw_estimated_shipping_cost_bdt" jsonb not null default '{"value":"0","precision":20}';`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_variant_cost_variant_id_unique" ON "product_variant_cost" ("variant_id") WHERE deleted_at IS NULL;`);
  }

}
