import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261024060543 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "landing_page" (
        "id" text NOT NULL,
        "slug" text NOT NULL,
        "title_en" text NOT NULL,
        "title_bn" text NULL,
        "status" text CHECK ("status" IN ('draft', 'published', 'unpublished')) NOT NULL DEFAULT 'draft',
        "ad_campaign_id" text NULL,
        "checkout_mode" text CHECK ("checkout_mode" IN ('embedded', 'modal', 'redirect')) NOT NULL DEFAULT 'embedded',
        "default_locale" text NOT NULL DEFAULT 'bn',
        "canonical_url" text NULL,
        "seo_title_en" text NULL,
        "seo_title_bn" text NULL,
        "seo_description_en" text NULL,
        "seo_description_bn" text NULL,
        "sections_json" jsonb NOT NULL DEFAULT '[]',
        "theme_tokens_json" jsonb NULL,
        "published_version_id" text NULL,
        "starts_at" timestamptz NULL,
        "ends_at" timestamptz NULL,
        "published_at" timestamptz NULL,
        "created_by" text NULL,
        "updated_by" text NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "landing_page_pkey" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_landing_page_slug_unique" ON "landing_page" ("slug") WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS "IDX_landing_page_status_pub" ON "landing_page" ("status", "published_at" DESC) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS "IDX_landing_page_window" ON "landing_page" ("starts_at", "ends_at") WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS "IDX_landing_page_ad_camp" ON "landing_page" ("ad_campaign_id") WHERE deleted_at IS NULL;

      CREATE TABLE IF NOT EXISTS "landing_page_version" (
        "id" text NOT NULL,
        "landing_page_id" text NOT NULL,
        "version" integer NOT NULL,
        "sections_json" jsonb NOT NULL,
        "theme_tokens_json" jsonb NULL,
        "seo_title_en" text NULL,
        "seo_title_bn" text NULL,
        "seo_description_en" text NULL,
        "seo_description_bn" text NULL,
        "published_at" timestamptz NULL,
        "published_by" text NULL,
        "is_current" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "landing_page_version_pkey" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_lpver_unique_ver" ON "landing_page_version" ("landing_page_id", "version") WHERE deleted_at IS NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_lpver_current" ON "landing_page_version" ("landing_page_id") WHERE is_current = true AND deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS "IDX_lpver_page_id" ON "landing_page_version" ("landing_page_id") WHERE deleted_at IS NULL;

      CREATE TABLE IF NOT EXISTS "landing_page_offer" (
        "id" text NOT NULL,
        "landing_page_id" text NOT NULL,
        "variant_id" text NOT NULL,
        "promotion_id" text NULL,
        "offer_price_paisa" bigint NULL,
        "raw_offer_price_paisa" jsonb NULL,
        "bundle_qty" integer NOT NULL DEFAULT 1,
        "label_en" text NULL,
        "label_bn" text NULL,
        "starts_at" timestamptz NULL,
        "ends_at" timestamptz NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "max_orders" integer NULL,
        "sort_order" integer NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "landing_page_offer_pkey" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_lpoffer_unique_variant" ON "landing_page_offer" ("landing_page_id", "variant_id") WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS "IDX_lpoffer_page_id" ON "landing_page_offer" ("landing_page_id") WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS "IDX_lpoffer_variant_id" ON "landing_page_offer" ("variant_id") WHERE deleted_at IS NULL;

      CREATE TABLE IF NOT EXISTS "ad_campaign" (
        "id" text NOT NULL,
        "name" text NOT NULL,
        "platform" text CHECK ("platform" IN ('meta', 'google', 'tiktok', 'other')) NOT NULL DEFAULT 'meta',
        "external_campaign_id" text NULL,
        "landing_page_id" text NULL,
        "promotion_campaign_id" text NULL,
        "utm_source" text NULL,
        "utm_medium" text NULL,
        "utm_campaign" text NULL,
        "utm_content" text NULL,
        "utm_term" text NULL,
        "starts_at" timestamptz NULL,
        "ends_at" timestamptz NULL,
        "status" text CHECK ("status" IN ('draft', 'active', 'paused', 'ended')) NOT NULL DEFAULT 'draft',
        "daily_budget_paisa" bigint NULL,
        "raw_daily_budget_paisa" jsonb NULL,
        "total_spend_paisa" bigint NOT NULL DEFAULT 0,
        "raw_total_spend_paisa" jsonb NOT NULL DEFAULT '{"value":"0","precision":20}',
        "spend_updated_at" timestamptz NULL,
        "created_by" text NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "ad_campaign_pkey" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_adcamp_ext_id" ON "ad_campaign" ("platform", "external_campaign_id") WHERE external_campaign_id IS NOT NULL AND deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS "IDX_adcamp_landing_page" ON "ad_campaign" ("landing_page_id") WHERE deleted_at IS NULL;

      CREATE TABLE IF NOT EXISTS "ad_conversion_event" (
        "id" text NOT NULL,
        "order_id" text NOT NULL,
        "ad_campaign_id" text NULL,
        "event_name" text NOT NULL,
        "event_id" text NOT NULL,
        "platform" text NOT NULL DEFAULT 'meta',
        "payload_hash" text NOT NULL,
        "sent_at" timestamptz NULL,
        "status" text CHECK ("status" IN ('pending', 'sent', 'failed', 'skipped')) NOT NULL DEFAULT 'pending',
        "error_redacted" text NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "ad_conversion_event_pkey" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_adevt_event_id" ON "ad_conversion_event" ("event_id") WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS "IDX_adevt_order_event" ON "ad_conversion_event" ("order_id", "event_name") WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS "IDX_adevt_campaign" ON "ad_conversion_event" ("ad_campaign_id") WHERE deleted_at IS NULL;

      CREATE TABLE IF NOT EXISTS "homepage_section" (
        "id" text NOT NULL,
        "section_type" text NOT NULL,
        "title_en" text NULL,
        "title_bn" text NULL,
        "subtitle_en" text NULL,
        "subtitle_bn" text NULL,
        "config_json" jsonb NOT NULL,
        "sort_order" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "starts_at" timestamptz NULL,
        "ends_at" timestamptz NULL,
        "published_at" timestamptz NULL,
        "published_version_json" jsonb NULL,
        "created_by" text NULL,
        "updated_by" text NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "homepage_section_pkey" PRIMARY KEY ("id")
      );
      CREATE INDEX IF NOT EXISTS "IDX_hsec_active_sort" ON "homepage_section" ("is_active", "sort_order") WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS "IDX_hsec_window" ON "homepage_section" ("starts_at", "ends_at") WHERE deleted_at IS NULL;

      CREATE TABLE IF NOT EXISTS "content_page" (
        "id" text NOT NULL,
        "slug" text NOT NULL,
        "page_type" text CHECK ("page_type" IN ('policy', 'about', 'faq', 'contact', 'terms', 'custom')) NOT NULL DEFAULT 'custom',
        "title_en" text NOT NULL,
        "title_bn" text NULL,
        "body_en" text NULL,
        "body_bn" text NULL,
        "excerpt_en" text NULL,
        "excerpt_bn" text NULL,
        "status" text CHECK ("status" IN ('draft', 'published', 'unpublished')) NOT NULL DEFAULT 'draft',
        "seo_title_en" text NULL,
        "seo_title_bn" text NULL,
        "seo_description_en" text NULL,
        "seo_description_bn" text NULL,
        "canonical_url" text NULL,
        "published_version_json" jsonb NULL,
        "published_at" timestamptz NULL,
        "created_by" text NULL,
        "updated_by" text NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "content_page_pkey" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_content_page_slug" ON "content_page" ("slug") WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS "IDX_content_page_status_pub" ON "content_page" ("status", "published_at" DESC) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS "IDX_content_page_type" ON "content_page" ("page_type", "status") WHERE deleted_at IS NULL;

      CREATE TABLE IF NOT EXISTS "media_asset" (
        "id" text NOT NULL,
        "bucket" text NOT NULL,
        "key" text NOT NULL,
        "mime" text NOT NULL,
        "size_bytes" integer NOT NULL,
        "width" integer NULL,
        "height" integer NULL,
        "checksum_sha256" text NOT NULL,
        "alt_text_en" text NULL,
        "alt_text_bn" text NULL,
        "source" text CHECK ("source" IN ('product', 'landing_page', 'content_page', 'invoice', 'brand')) NOT NULL DEFAULT 'landing_page',
        "ref_count" integer NOT NULL DEFAULT 0,
        "is_orphan" boolean NOT NULL DEFAULT false,
        "uploaded_by" text NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "media_asset_pkey" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_media_bucket_key" ON "media_asset" ("bucket", "key") WHERE deleted_at IS NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_media_checksum_size" ON "media_asset" ("checksum_sha256", "size_bytes") WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS "IDX_media_orphan" ON "media_asset" ("is_orphan", "created_at") WHERE deleted_at IS NULL;
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`
      drop table if exists "media_asset" cascade;
      drop table if exists "content_page" cascade;
      drop table if exists "homepage_section" cascade;
      drop table if exists "ad_conversion_event" cascade;
      drop table if exists "ad_campaign" cascade;
      drop table if exists "landing_page_offer" cascade;
      drop table if exists "landing_page_version" cascade;
      drop table if exists "landing_page" cascade;
    `);
  }
}
