import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261024060543 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "landing_page" drop constraint if exists "landing_page_slug_unique";`);
    this.addSql(`create table if not exists "landing_page" ("id" text not null, "slug" text not null, "title_en" text not null, "title_bn" text null, "is_active" boolean not null default true, "featured_product_id" text null, "checkout_mode" text check ("checkout_mode" in ('embedded', 'modal', 'redirect')) not null default 'embedded', "sections_json" jsonb not null, "theme_tokens_json" jsonb null, "seo_title" text null, "seo_description" text null, "meta_pixel_id" text null, "published_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "landing_page_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_landing_page_slug_unique" ON "landing_page" ("slug") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_landing_page_deleted_at" ON "landing_page" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "landing_page" cascade;`);
  }

}
