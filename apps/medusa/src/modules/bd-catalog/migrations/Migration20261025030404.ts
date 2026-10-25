import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261025030404 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product_localization" drop constraint if exists "product_localization_handle_bn_unique";`);
    this.addSql(`alter table if exists "product_localization" drop constraint if exists "product_localization_product_id_unique";`);
    this.addSql(`alter table if exists "translation_review" drop constraint if exists "translation_review_reference_reference_id_locale_code_unique";`);
    this.addSql(`alter table if exists "product_brand" drop constraint if exists "product_brand_product_id_unique";`);
    this.addSql(`alter table if exists "brand" drop constraint if exists "brand_slug_unique";`);
    this.addSql(`create table if not exists "brand" ("id" text not null, "slug" text not null, "name_en" text not null, "name_bn" text null, "logo_key" text null, "description_en" text null, "description_bn" text null, "is_active" boolean not null default true, "sort_order" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "brand_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_brand_slug_unique" ON "brand" ("slug") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_brand_deleted_at" ON "brand" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "product_brand" ("id" text not null, "product_id" text not null, "brand_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_brand_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_brand_product_id_unique" ON "product_brand" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_brand_brand_id" ON "product_brand" ("brand_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_brand_deleted_at" ON "product_brand" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "translation_review" ("id" text not null, "reference" text not null, "reference_id" text not null, "locale_code" text not null default 'bn', "translation_source" text check ("translation_source" in ('manual', 'machine')) not null default 'manual', "translation_status" text check ("translation_status" in ('draft', 'reviewed', 'published', 'failed')) not null default 'draft', "source_hash" text null, "reviewed_by" text null, "reviewed_at" timestamptz null, "failure_reason" text null, "fields_json" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "translation_review_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_translation_review_deleted_at" ON "translation_review" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_translation_review_reference_reference_id_locale_code_unique" ON "translation_review" ("reference", "reference_id", "locale_code") WHERE "deleted_at" IS NULL AND deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_translation_review_translation_status_updated_at" ON "translation_review" ("translation_status", "updated_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "product_localization" drop column if exists "title_bn", drop column if exists "subtitle_bn", drop column if exists "description_bn", drop column if exists "material_bn";`);

    this.addSql(`alter table if exists "product_localization" add column if not exists "translation_source" text check ("translation_source" in ('manual', 'machine')) not null default 'manual', add column if not exists "translation_status" text check ("translation_status" in ('draft', 'reviewed', 'published', 'failed')) not null default 'draft', add column if not exists "source_hash" text null, add column if not exists "reviewed_by" text null, add column if not exists "reviewed_at" timestamptz null, add column if not exists "failure_reason" text null;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_localization_product_id_unique" ON "product_localization" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_localization_handle_bn_unique" ON "product_localization" ("handle_bn") WHERE "handle_bn" IS NOT NULL AND "deleted_at" IS NULL AND deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "brand" cascade;`);

    this.addSql(`drop table if exists "product_brand" cascade;`);

    this.addSql(`drop table if exists "translation_review" cascade;`);

    this.addSql(`drop index if exists "IDX_product_localization_product_id_unique";`);
    this.addSql(`drop index if exists "IDX_product_localization_handle_bn_unique";`);
    this.addSql(`alter table if exists "product_localization" drop column if exists "translation_source", drop column if exists "translation_status", drop column if exists "source_hash", drop column if exists "reviewed_by", drop column if exists "reviewed_at", drop column if exists "failure_reason";`);

    this.addSql(`alter table if exists "product_localization" add column if not exists "title_bn" text null, add column if not exists "subtitle_bn" text null, add column if not exists "description_bn" text null, add column if not exists "material_bn" text null;`);
  }

}
