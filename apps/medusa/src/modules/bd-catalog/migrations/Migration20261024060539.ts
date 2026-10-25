import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261024060539 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product_variant_cost" drop constraint if exists "product_variant_cost_variant_id_unique";`);
    this.addSql(`create table if not exists "category_attribute" ("id" text not null, "category_id" text not null, "attribute_code" text not null, "name_en" text not null, "name_bn" text not null, "attribute_type" text check ("attribute_type" in ('select', 'multiselect', 'text', 'boolean')) not null default 'select', "options_json" jsonb null, "is_required" boolean not null default false, "is_filterable" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "category_attribute_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_category_attribute_category_id" ON "category_attribute" ("category_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_category_attribute_attribute_code" ON "category_attribute" ("attribute_code") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_category_attribute_deleted_at" ON "category_attribute" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "product_attribute_value" ("id" text not null, "product_id" text not null, "attribute_code" text not null, "value_en" text not null, "value_bn" text null, "raw_value" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_attribute_value_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_attribute_value_product_id" ON "product_attribute_value" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_attribute_value_attribute_code" ON "product_attribute_value" ("attribute_code") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_attribute_value_deleted_at" ON "product_attribute_value" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "product_localization" ("id" text not null, "product_id" text not null, "title_bn" text null, "subtitle_bn" text null, "description_bn" text null, "description_excerpt_bn" text null, "material_bn" text null, "care_instructions_bn" text null, "origin_country_bn" text null default 'বাংলাদেশ', "handle_bn" text null, "meta_title_bn" text null, "meta_description_bn" text null, "is_bilingual_complete" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_localization_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_localization_product_id" ON "product_localization" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_localization_deleted_at" ON "product_localization" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "product_variant_cost" ("id" text not null, "variant_id" text not null, "cogs_bdt" numeric not null default 0, "packaging_cost_bdt" numeric not null default 0, "estimated_shipping_cost_bdt" numeric not null default 0, "supplier_name" text null, "supplier_sku" text null, "minimum_margin_percent" integer not null default 20, "raw_cogs_bdt" jsonb not null default '{"value":"0","precision":20}', "raw_packaging_cost_bdt" jsonb not null default '{"value":"0","precision":20}', "raw_estimated_shipping_cost_bdt" jsonb not null default '{"value":"0","precision":20}', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_variant_cost_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_variant_cost_variant_id_unique" ON "product_variant_cost" ("variant_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_variant_cost_deleted_at" ON "product_variant_cost" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "category_attribute" cascade;`);

    this.addSql(`drop table if exists "product_attribute_value" cascade;`);

    this.addSql(`drop table if exists "product_localization" cascade;`);

    this.addSql(`drop table if exists "product_variant_cost" cascade;`);
  }

}
