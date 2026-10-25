# Database Design Review
## Bangladesh Single-Vendor E-commerce Platform (MedusaJS v2)

**Review Type:** Advisory design review — no source document modified  
**Review Date:** 2026-10-24  
**Reviewer Scope:** Database schema, relations, indexing, Medusa-native alignment, security, Bangladesh business rules  
**Verdict:** 🔴 **NOT migration-ready.** The documented schema is internally inconsistent and materially incomplete. Fix P0 items before writing any migration beyond the current scaffold.

---

## 0. Scope, Method & Evidence

### 0.1 Target file clarification

The request refers to `database.md`. **No `database.md` exists in this repository.** The authoritative database document is:

- `docs/data-models.md` — “Data Model Specification v1.0 — Authoritative”

This review treats `docs/data-models.md` as the database document and cross-checks it against:

- `docs/dfd.md` — v2.0 (data stores, flows, status enums)
- `docs/architecture.md` — v2.0 (module ownership, DML outline, Redis, security)
- `prd.md` — v2 (functional + Bangladesh business rules)
- Actual scaffold: `apps/medusa/src/modules/**/models/*.ts`, `migrations/*.ts`, `links/*.ts`
- Installed Medusa packages under `node_modules/@medusajs/*` (v2.22.0 line) to verify native enums/models

### 0.2 Method

1. Extracted every entity, field, enum, unique constraint, index and link from `data-models.md`.
2. Built an entity coverage matrix across all four documents.
3. Compared each custom model against Medusa v2 native modules to find duplication/forking.
4. Validated operational query paths (COD queue, courier manifest, returns queue, settlement, audit viewer, search sync) against available indexes.
5. Checked PRD business rules for missing tables/fields (returns policy, partial COD, RTO, VAT, campaign windows, geo data).
6. Checked security/privacy rules (immutability, secrets, PII, retention).

### 0.3 Severity legend

| Level | Meaning |
|---|---|
| 🔴 Critical | Blocks migration/launch, causes data corruption, payment/stock loss, or security exposure |
| 🟠 High | Will cause operational defects or rework within Phase 1 |
| 🟡 Medium | Design debt / inconsistency; fix before scale |
| 🔵 Low | Naming/documentation hygiene |

### 0.4 Summary counts

| Category | Findings | Critical | High | Medium |
|---|---:|---:|---:|---:|
| Missing entities | 18 | 7 | 10 | 1 |
| Missing fields in existing entities | 14 | 4 | 5 | 5 |
| Wrong relations / cardinality | 12 | 4 | 6 | 2 |
| Duplicate data / conflicting sources | 11 | 3 | 5 | 3 |
| Indexing & constraints | 12 | 2 | 6 | 4 |
| Medusa-native conflicts | 13 | 6 | 6 | 1 |
| Data security / privacy | 11 | 5 | 4 | 2 |
| Bangladesh business-rule gaps | 16 | 5 | 9 | 2 |
| **Total** | **107** | **36** | **51** | **20** |

> The high count is expected: the three design documents currently describe **three different schemas** (see §2). Most findings collapse once one canonical schema is chosen.

---

## 1. Executive Summary

### সংক্ষেপে (Bangla)

এই ডকুমেন্ট সেট এখনই মাইগ্রেশন করার মতো অবস্থায় নেই। সবচেয়ে বড় সমস্যা তিনটি:

1. **তিনটি ডকুমেন্টে তিন রকম স্কিমা** — `data-models.md`, `architecture.md`, `dfd.md` একই টেবিলের ভিন্ন ভিন্ন সেট দেখাচ্ছে। যেমন `order_return_request`, `sms_log`, `homepage_section`, `content_page`, `invoice_template`, `bd_settings` ডেটাবেস ডকে নেই, কিন্তু বাকি দুই ডকে আছে।
2. **Medusa native ফিচার ডুপ্লিকেট** — native `Return`/`ReturnItem`/`OrderTransaction`, `translation`, `rbac`, `tax`, `fulfillment` থাকা সত্ত্বেও সমান্তরাল custom মডেল বানানো হচ্ছে। এতে দুইটা source of truth তৈরি হবে।
3. **Bangladesh business rule-এর ভিত্তি ডেটা নেই** — Division/District/Thana master table, Pathao city/zone mapping, courier remittance batch, return policy config, partial delivery quantity, campaign start/end, COD collectable amount — এসবের কোনো টেবিল/ফিল্ড নেই।

তাছাড়া টাকার একক (paisa vs Medusa major unit), `order.status = 'unfulfillable_stockout'` (invalid native enum), audit log-এর “immutable” দাবি (soft delete আছে), এবং webhook/refund PII security ঝুঁকি আছে।

### 1.1 Top 12 blockers (P0)

| # | Blocker | Why it blocks |
|---|---|---|
| 1 | `order_return_request` is referenced by DFD/architecture/code but **has no entity spec in the DB doc** | Returns cannot be implemented or reviewed from the spec |
| 2 | `sms_log`, `homepage_section`, `content_page`, `invoice_template`, `bd_settings`, `vat_config` missing from DB doc | Phase 1 PRD features have no persistence contract |
| 3 | Money unit contradiction: DB doc mandates **paisa integer everywhere**, Medusa core stores **major-unit decimal** | 100× price/tax/total errors if implemented literally |
| 4 | `order.status = "unfulfillable_stockout"` is **not a valid Medusa `OrderStatus`** | Requires forking core enum or the stockout flow fails |
| 5 | Custom `order_return_request`/refund fields duplicate native `Return`, `ReturnItem`, `OrderTransaction` | Two return/refund ledgers; reporting and reconciliation diverge |
| 6 | No geo master (`division`/`district`/`thana`) or courier area mapping | 4-tier address validation and Pathao `city_id`/`zone_id` cannot be implemented data-driven |
| 7 | No `courier_remittance`/settlement batch entity | COD 3-way reconciliation (PRD FR-14.9) is impossible at payout level |
| 8 | No `refund` ledger independent of returns | Stockout refunds, delivery-fee refunds, goodwill refunds have nowhere to go |
| 9 | No per-line COGS/discount/VAT snapshot | PRD FR-6.4.1 requires line-level snapshot; only `cogs_total` exists |
| 10 | `delivery_zone`, `courier_provider`, `payment provider`, `refund_method` are closed enums | PRD says zones/providers/methods are configurable and extendable; each addition needs a migration |
| 11 | `audit_log` has `updated_at`/`deleted_at` and no DB immutability guard | “Immutable audit trail” is false at the database level |
| 12 | Webhook/app logs store raw headers and gateway payloads | Secret/PII leakage; violates PRD FR-12.3/FR-12.8.3 |

### 1.2 What is good

- Module isolation via Medusa Module Links is the right direction.
- 4-status separation (order/payment/shipment/return) is correct and should be kept.
- Paisa thinking for custom financial tables is good — it just needs a clear boundary with Medusa core.
- Audit, COGS privacy, and zero-trust webhook intent are correct.
- COD risk profiling by phone is a real Bangladesh need; it only needs normalization and a customer link.

---

## 2. The Three-Schema Drift (Headline Finding)

### 2.1 Evidence

`data-models.md` §2 defines 13 custom entities:

```
product_localization, category_attribute, product_attribute_value,
product_variant_cost, delivery_zone_config, customer_risk_profile,
order_bd_details, courier_shipment_log, payment_transaction,
payment_webhook_log, landing_page, staff_role_permission, audit_log
```

`architecture.md` §12.1 defines a **different** 13:

```
product_localization, category_attribute, product_attribute_value,
order_bd_details, customer_risk_profile, order_return_request,
landing_page, homepage_section, content_page, invoice_template,
audit_log, sms_log, bd_settings
```

`dfd.md` §1.2 (D2) matches architecture, while **also** using `order_return_request`, `homepage_section`, `content_page`, `invoice_template`, `sms_log`, `bd_settings` in flows.

Actual scaffold adds yet another set: `courier_webhook_log`, `vat_config`, and does **not** implement `bd_settings`, `sms_log`, `homepage_section`, `content_page`, `invoice_template`.

### 2.2 Entity coverage matrix

Legend: ✅ present · ⚠️ referenced but not specified · ❌ absent · 🧩 code exists

| Entity | data-models.md | dfd.md | architecture.md | prd.md | code |
|---|:---:|:---:|:---:|:---:|:---:|
| `product_localization` | ✅ | ✅ | ✅ | ✅ (FR-10.3) | 🧩 |
| `category_attribute` | ✅ | ✅ | ✅ | ✅ (FR-3.1) | 🧩 |
| `product_attribute_value` | ✅ | ✅ | ✅ | ✅ | 🧩 |
| `product_variant_cost` | ✅ | ✅ (COGS) | ✅ (COGS) | ✅ (FR-14.3) | 🧩 |
| `delivery_zone_config` | ✅ | ⚠️ (`bd_settings`) | ⚠️ (`bd_settings`) | ✅ (FR-7.4.3) | 🧩 |
| `vat_config` | ❌ | ❌ | ⚠️ (`bd_settings`) | ✅ (FR-11.4) | 🧩 |
| `bd_settings` | ❌ | ✅ | ✅ | ✅ | ❌ |
| `order_bd_details` | ✅ | ✅ | ✅ | ✅ | 🧩 |
| `customer_risk_profile` | ✅ | ✅ | ✅ | ✅ (FR-6.6) | 🧩 |
| `order_return_request` | ⚠️ (link only) | ✅ | ✅ | ✅ (FR-6.7) | 🧩 |
| `return_policy` / config | ❌ | ❌ | ❌ | ✅ (FR-6.7.1) | ❌ |
| `courier_shipment_log` | ✅ | ⚠️ (audit) | ❌ | ❌ | 🧩 |
| `courier_webhook_log` | ❌ | ❌ | ❌ | ❌ | 🧩 |
| `payment_transaction` | ✅ | ✅ | ✅ | ✅ | 🧩 |
| `payment_webhook_log` | ✅ | ⚠️ (callback) | ⚠️ (callback) | ✅ (FR-7.3.5) | 🧩 |
| `landing_page` | ✅ | ✅ | ✅ | ✅ (FR-5.1) | 🧩 |
| `landing_page_offer` | ❌ | ❌ | ❌ | ✅ (FR-5.2.2) | ❌ |
| `campaign` | ❌ | ❌ | ❌ | ✅ (FR-5.3.3) | ❌ |
| `homepage_section` | ❌ | ✅ | ✅ | ✅ (FR-9.1) | ❌ |
| `content_page` | ❌ | ✅ | ✅ | ✅ (FR-9.5) | ❌ |
| `invoice_template` | ❌ | ✅ | ✅ | ✅ (FR-11.7.2) | ❌ |
| `invoice` (generated record) | ❌ | ⚠️ (S3 only) | ⚠️ (S3 only) | ✅ (FR-11.7.1) | ❌ |
| `sms_log` | ❌ | ✅ | ✅ | ✅ (FR-11.6.1) | ❌ |
| `staff_role_permission` | ✅ | ⚠️ (RBAC) | ✅ | ✅ (FR-8.2) | 🧩 |
| `audit_log` | ✅ | ✅ | ✅ | ✅ (FR-12.2) | 🧩 |
| Geo master (`division/district/thana`) | ❌ | ⚠️ (validation only) | ⚠️ (validation only) | ✅ (FR-11.2) | ❌ |
| Pathao/Steadfast area map | ❌ | ❌ | ❌ | ✅ (FR-11.2) | ❌ |
| Refund ledger | ❌ | ⚠️ (return request) | ⚠️ (return request) | ✅ (FR-6.7.16) | ❌ |
| Courier remittance batch | ❌ | ❌ | ⚠️ (per-order only) | ✅ (FR-14.9) | ❌ |
| Brand | ❌ | ⚠️ (filter) | ⚠️ (filter) | ✅ (FR-3.1.3) | ❌ |
| Category localization | ❌ | ⚠️ (BN category) | ❌ | ✅ (FR-10.3.2) | ❌ |
| Customer BD address | ❌ | ⚠️ (order only) | ⚠️ (order only) | ✅ (FR-4.4) | ❌ |
| COD call log | ❌ | ⚠️ (counter only) | ⚠️ (counter only) | ✅ (FR-6.6.2) | ❌ |
| Order line cost snapshot | ❌ | ⚠️ (`cogs_total`) | ⚠️ (`cogs_total`) | ✅ (FR-6.4.1) | ❌ |

### 2.3 Consequence

- A developer cannot know whether zone rates live in `delivery_zone_config` or `bd_settings`.
- `dfd.md` queries `bd_settings` for zone rates, but code has `delivery_zone_config`.
- `architecture.md` says `bd_settings` owns VAT, but code has `vat_config`.
- `data-models.md` claims “Nine Core Domain Specifications” but silently omits the return entity it links to.

**Recommendation:** Declare **one** canonical table list (this review suggests keeping normalized `delivery_zone_config` + `vat_config`, and adding a small `bd_settings` for operational thresholds), then update all four docs to use exactly that list. Do not keep `bd_settings` as both a mega-table and normalized tables.

---

## 3. Missing Entities

### 3.1 Critical

#### DB-M-01 🔴 `order_return_request` is not specified in the DB document

**Evidence**
- `data-models.md` §3 links `OrderModule.linkable.order` → `BdOrdersModule.linkable.orderReturnRequest` but never defines the model.
- `architecture.md` §4.2 and §12.1 define it; `dfd.md` §4.4 uses it heavily; code implements it.
- Fields only discoverable from code/DFD: `return_courier_name`, `return_tracking_code`, `refund_target_account`, `refund_trx_id`, `reviewed_by`, `reviewed_at`.

**Impact:** The DB doc is not authoritative. Return workflow, refund recording and customer tracking cannot be reviewed or migrated from the spec.

**Fix:** Add a full entity spec. Also decide whether this is a parallel entity or an **approval extension** of Medusa’s native `Return` (see DB-N-03).

---

#### DB-M-02 🔴 `sms_log` is missing from the DB document

**Evidence**
- `architecture.md` §4.2 (`bd-sms` owns `sms_log`), §11.3; `dfd.md` D2 + DF-31.
- `data-models.md` never mentions SMS or a `bd-sms` module (module list §1.2 omits `bd-sms`, `bd-content`, `bd-invoices`, `bd-reports`).

**Impact:** PRD FR-11.6.1 requires delivery log + manual resend. No persistence contract.
**Fix:** Add `sms_log` with `order_id`, `event_type`, `template_key`, `recipient_phone_masked`, `provider`, `provider_message_id`, `status`, `attempt_count`, `request_payload_redacted`, `response_payload_redacted`, `error_message`, `sent_at`, `delivered_at`, plus `(order_id, event_type, created_at)` index and a unique provider message id.

---

#### DB-M-03 🔴 `bd_settings` is missing, and conflicts with normalized settings tables

**Evidence**
- `architecture.md` §4.2: `bd-settings` owns `bd_settings` (zones, free shipping, SMS keys, Meta Pixel, bKash/Nagad creds, design tokens, `cod_expiry_hours`).
- `architecture.md` §7.2/§10.2 and `dfd.md` P2.0/P4.7 read `bd_settings`.
- `data-models.md` only has `DeliveryZoneConfig`; code has `delivery_zone_config` + `vat_config`, no `bd_settings`.

**Impact:** `cron.cod-expiry-check` has no config table; zone lookup source is ambiguous; secrets may end up in a JSON blob.
**Fix:** Split settings:
- `delivery_zone_config` (normalized)
- `vat_config` (versioned)
- `operational_settings` (singleton: `cod_expiry_hours`, `free_shipping_threshold`, `sms_sender_id`, `meta_pixel_id`, `invoice_terms`, etc.)
- Secrets **not** in DB (see DB-S-04).

---

#### DB-M-04 🔴 `homepage_section` and `content_page` are missing

**Evidence:** `architecture.md` §4.2/§12.1, `dfd.md` D2/P8.0, PRD FR-9.1/FR-9.5.
**Impact:** CMS, draft/preview/publish/rollback, bilingual policy pages have no tables.
**Fix:**
- `homepage_section`: `id`, `section_type`, `title_en`, `title_bn`, `config_json`, `sort_order`, `is_active`, `starts_at`, `ends_at`, `published_at`, `published_version_json`, `created_by`, `updated_by`.
- `content_page`: `id`, `slug` (unique), `page_type`, `title_en`, `title_bn`, `body_en`, `body_bn`, `status` (`draft|published|unpublished`), `published_version_json`, `seo_*`, `published_at`, `created_by`, `updated_by`.
- Or use Medusa translation module for the `_bn` columns (see DB-N-02).

---

#### DB-M-05 🔴 `invoice_template` and generated `invoice` records are missing

**Evidence:** `architecture.md` §4.2/§12.1/§17; `dfd.md` DF-35; PRD FR-11.7.1–11.7.3.
**Impact:** No immutable invoice record; S3 object key is untracked; cannot prove which snapshot/version generated an invoice.
**Fix:**
- `invoice_template`: `id`, `name`, `version`, `is_active`, `logo_asset_key`, `header_en/bn`, `footer_en/bn`, `terms_en/bn`, `created_by`, `published_at`.
- `invoice`: `id`, `order_id` (unique), `invoice_number` (unique), `template_id`, `template_version`, `s3_key`, `snapshot_hash`, `vat_snapshot_json`, `total_paisa`, `generated_at`, `generated_by`, `voided_at`, `void_reason`.

---

#### DB-M-06 🔴 Geo master data and courier area mapping are missing

**Evidence**
- PRD FR-11.2 requires 8 divisions → 64 districts → thana and says Division is essential for Pathao `city_id`/`zone_id`.
- `dfd.md` validates these in application code (`CustomerAddress4Tier`) and stores free text in `order_bd_details`.
- No table in any doc; `DeliveryZoneConfig.coverage_districts_json` is a JSON list, not a mapping.

**Impact:** Address validation, delivery-zone resolution and courier API payloads become hardcoded app logic. Spelling variants (`Chattogram`/`Chittagong`, `Barishal`/`Barisal`) break matching.
**Fix:**
- `geo_division(code PK, name_en, name_bn, bbs_code)`
- `geo_district(code PK, division_code FK, name_en, name_bn, bbs_code)`
- `geo_thana(code PK, district_code FK, name_en, name_bn, bbs_code, is_city_corporation)`
- `courier_area_map(courier_code, thana_code, courier_city_id, courier_zone_id, UNIQUE(courier_code, thana_code))`
- `delivery_zone_district(zone_id, district_code, UNIQUE(district_code))` instead of JSON.

---

#### DB-M-07 🔴 Refund ledger is missing (refunds are not only returns)

**Evidence**
- PRD FR-6.7.16 (COD RTO has no refund; prepaid refunds follow policy), GAP-01 stockout refund, partial delivery variance, delivery-fee refunds.
- `order_return_request.refund_*` only covers return-linked refunds.
- `PaymentTransaction.transaction_type = "refund"` exists but has no `refund_of_transaction_id`, no return link, no approval trail.

**Impact:** Stockout/goodwill/delivery-fee refunds have no record; finance cannot reconcile refunds that are not returns; duplicate refund possible.
**Fix:** Add `refund`:
`id`, `order_id`, `return_id?`, `payment_transaction_id?`, `amount_paisa`, `currency`, `method`, `target_account_encrypted`, `trx_id`, `status` (`pending_approval|approved|paid|failed|voided`), `reason_code`, `approved_by`, `approved_at`, `paid_at`, `recorded_by`, `audit_log_id`.
Make `refund.trx_id` unique per method (partial unique index).

---

### 3.2 High

| ID | Missing entity | Evidence | Fix |
|---|---|---|---|
| DB-M-08 🟠 | `courier_remittance` / payout batch | PRD FR-14.9, architecture §12 settlement | `courier_remittance_batch(id, courier, batch_ref, period_start, period_end, gross_collected, courier_fee, cod_fee, net_remitted, received_at, bank_ref, status)` + `courier_remittance_line(batch_id, order_id, amount, variance)` |
| DB-M-09 🟠 | `return_policy` + product/category returnability | PRD FR-6.7.1–6.7.3 | `return_policy` versioned config + `return_policy_scope(policy_id, category_id?, product_id?)` + `product.is_returnable` |
| DB-M-10 🟠 | `campaign` + `landing_page_offer` | PRD FR-5.2.4/FR-5.2.5/FR-5.3.3 | `campaign(id, name, meta_campaign_id, starts_at, ends_at, status)`; `landing_page_offer(landing_page_id, variant_id, offer_price_paisa, bundle_qty, promotion_id, starts_at, ends_at)` |
| DB-M-11 🟠 | `cod_call_log` | DFD Level 2.2 (attempt 1/2/3), PRD FR-6.6.2 | Per-attempt rows: `order_id`, `attempt_no`, `outcome`, `agent_id`, `notes`, `called_at`, `next_followup_at` |
| DB-M-12 🟠 | `order_line_cost` / line snapshot | PRD FR-6.4.1, FR-14.3 | Per-line snapshot: `order_line_item_id`, `cogs_unit_paisa`, `packaging_unit_paisa`, `discount_alloc_paisa`, `tax_rate`, `tax_amount_paisa`, `supplier_id`, `snapshot_json` |
| DB-M-13 🟠 | `customer_address_bd` | PRD §1.3 registered saved addresses | `customer_id`, `label`, `division_code`, `district_code`, `thana_code`, `area_street`, `postal_code`, `phone_e164`, `alt_phone_e164`, `is_default` |
| DB-M-14 🟠 | `brand` (or explicit decision to use collection/metadata) | PRD FR-3.1.3 | `brand(id, name_en, name_bn, slug unique, logo_key, is_active)` + `product_brand` link |
| DB-M-15 🟠 | `category_localization` | PRD FR-10.3.2 | Prefer native translation module; otherwise `category_id`, `locale`, `name`, `description`, `meta_*`, unique `(category_id, locale)` |
| DB-M-16 🟠 | `media_asset` | PRD FR-5.1.6/FR-5.1.7 | `id`, `bucket`, `key unique`, `mime`, `size_bytes`, `width`, `height`, `checksum`, `uploaded_by`, `created_at` — enables limit warnings and orphan cleanup |
| DB-M-17 🟠 | `landing_page_version` | PRD FR-5.1.3 rollback | `landing_page_id`, `version`, `sections_json`, `theme_tokens_json`, `published_at`, `published_by`, `is_current` |
| DB-M-18 🟡 | `order_tracking_attempt` (or documented Redis-only) | PRD FR-12.5 / architecture §5.1 | If audit/lockout evidence is required, persist `ip`, `order_ref_hash`, `result`, `created_at`; otherwise explicitly document Redis-only retention |

---

## 4. Missing Fields in Existing Entities

#### DB-F-01 🔴 `order_bd_details` lacks the courier/finance fields needed by the DFD

Missing:

- `cod_collectable_paisa` — DFD DF-11 sends “COD BDT paisa” to courier, but the source is unspecified. Snapshot it write-once.
- `postal_code` — present in `CustomerAddress4Tier` (DFD §6.1) but absent from the table.
- `alternate_phone_e164` — BD delivery standard; couriers often require it.
- `delivery_instructions` / `landmark`.
- `order_source` (`web|manual|facebook|whatsapp|phone`) — PRD FR-6.1.2.
- `campaign_id`, `landing_page_id` — PRD FR-5.2.4 requires both; only `landing_page_slug` exists (mutable, not a key).
- `payment_fee_paisa` — bKash/Nagad MDR; PRD FR-14.3.
- `rto_shipping_cost_paisa`, `packaging_cost_actual_paisa` — PRD FR-14.3.
- `delivery_attempts_count` — courier `DELIVERY_FAILED` loop and risk scoring.
- `cancel_reason`, `canceled_at`, `canceled_by` — PRD FR-6.7.15.
- `cod_expiry_at` — computed from settings; needed by the expiry cron.
- `exception_code` — to model `unfulfillable_stockout` without touching core status (see DB-N-01).
- `customer_note` / `staff_note` separation (current `cod_notes` mixes both).

#### DB-F-02 🔴 No per-line financial snapshot

**Evidence:** `OrderTimeSnapshot` is described as a JSON composite in DFD §6.1, but no table/column stores it. `order_bd_details.cogs_total` is order-level only. PRD FR-6.4.1 requires title, SKU, variant, unit price, discount, delivery, VAT and cost per line.

**Impact:** Contribution profit per line/SKU, return-level COGS reversal, and VAT audit are impossible. `cogs_total` cannot be recomputed or audited.
**Fix:** `order_line_cost_snapshot` (DB-M-12) or store in `order_line_item.metadata.cost_snapshot` with an explicit schema and immutability rule. Do not rely on `cogs_total` alone.

#### DB-F-03 🔴 `order_return_request` lacks line-level and policy fields

Missing:

- `return_type` (`customer_return|rto|partial_delivery|damaged_delivery`)
- `requested_at`, `approved_at`, `rejected_at`, `received_at`, `completed_at`
- `return_shipping_cost_paisa`, `return_shipping_paid_by` (`customer|merchant|shared`)
- `policy_snapshot_json`, `policy_id`
- `line_items_json` or child `order_return_item(return_id, order_line_item_id, quantity, reason_code, condition, received_qty, damaged_qty)`
- `refund_status` separate from request status
- `customer_visible_note`, `staff_note`
- `rejection_reason`, `info_requested_note`
- `restocked_at`, `restocked_by`, `quarantine_location_id`

**Impact:** Partial returns, return shipping disputes, customer tracking detail, and per-line condition cannot be represented.

#### DB-F-04 🔴 `payment_transaction` cannot support dropped-callback recovery or refund linkage

Missing:

- `cart_id` — DFD §4.1 Scenario C poller must find the cart to place the order after a dropped browser callback.
- `idempotency_key` — PRD FR-4.3.7 / AC-4.3.
- `initiated_at`, `completed_at`, `expires_at`.
- `payer_msisdn_masked` (never full).
- `provider_fee_paisa`.
- `refund_of_transaction_id`.
- `failure_code`.

**Impact:** GAP-02 recovery is not implementable from the documented schema; duplicate payment attempts cannot be deduped.

#### DB-F-05 🟠 `landing_page` cannot enforce campaign expiry or offer pricing

Missing: `status` (`draft|published|unpublished`), `starts_at`, `ends_at`, `published_version_json`, `campaign_id`, `created_by`, `updated_by`, `default_locale`, `canonical_url`.

PRD FR-5.2.5 requires blocking expired/sold-out offers. `published_at` is not an end date.
**Impact:** Expired campaigns can be checked out at stale prices.

#### DB-F-06 🟠 `customer_risk_profile` lacks link, score and recency fields

Missing: `customer_id` (Medusa customer), `risk_score`, `risk_level`, `last_evaluated_at`, `last_rto_at`, `last_delivery_at`, `normalized_phone_e164`.

**Impact:** Profile can drift from customer identity; risk badges are computed from stale counters.

#### DB-F-07 🟠 `product_variant_cost` is not temporal

Single row per variant means a COGS change overwrites history. PRD FR-6.4.1/FR-14.3 needs the cost **at order time**.
**Fix:** Add `effective_from`, `effective_to` (or keep history table), and snapshot into the order line. Do not compute historical margin from the current cost row.

#### DB-F-08 🟠 `vat_config` is not versioned and not snapshotted

Missing: `effective_from`, `effective_to`, `is_active`, `vat_included_in_price`, `legal_note`. Order/invoice must snapshot `vat_rate_percent`, `vat_registration_number`, `prices_include_vat` at order time (PRD FR-11.7.3).
**Impact:** A later VAT change rewrites historical invoice math.

#### DB-F-09 🟠 `audit_log` is missing operational fields

Missing: `correlation_id` / `request_id`, `user_agent`, `record_hash`, `prev_hash`, `created_at` (explicit), `actor_ip_country` (optional), `entity_label` (human-readable snapshot).

Also: `entity_type` enum lacks `customer`, `payment`, `sms`, `campaign`, `content_page` is present but `landing_page` absent, `vat`, `export`; `action` enum lacks `export`, `view_sensitive`, `login_success`, `refund_approved`, `refund_paid`, `webhook_rejected`.

**Impact:** PRD FR-12.8.7 requires data-export logging; the current enum cannot record it.

#### DB-F-10 🟡 `DeliveryZoneConfig` is too rigid

Missing: `cod_enabled`, `min_order_paisa`, `max_weight_grams`, `effective_from`, `priority`, `is_default`.

`flat_rate_bdt` assumes flat pricing per zone; PRD allows future weight-based rules. Add a `zone_rate_rule` table later rather than altering the main table.

#### DB-F-11 🟡 `ProductLocalization` lacks translation governance fields

Missing: `translation_source` (`manual|machine`), `translation_status` (`draft|reviewed|published|failed`), `reviewed_by`, `reviewed_at`, `source_hash`.

PRD FR-10.3.3–10.3.5 require drafted/reviewed/failed states. `is_bilingual_complete` alone is insufficient.

#### DB-F-12 🟡 `category_attribute` / `product_attribute_value` lack scope and validation

- `category_attribute` has `options_json` but no option table; `product_attribute_value.raw_value` can contain a value not in the options list.
- `product_attribute_value` has no `category_id`, so the same `attribute_code` in two categories is ambiguous.
- No `unit`, `sort_order`, `help_text_en/bn`.

#### DB-F-13 🟡 `CourierShipmentLog` lacks idempotency and duration

Missing: `request_id`, `webhook_event_id`, `duration_ms`, `consignment_id` (currently only `order_id`), `tracking_code`.

DFD says “audit trail of every courier API interaction”; without `consignment_id` and event id it cannot be joined reliably.

#### DB-F-14 🟡 `payment_webhook_log` lacks a provider event identity

Missing: `provider_event_id` (unique per provider), `received_at`, `processed_at`, `retry_count`, `payload_hash`.

**Impact:** Replay/duplicate callbacks cannot be deduped at the database level; PRD AC-7.2 is enforced only in code.

---

## 5. Wrong Relations & Cardinality

#### DB-R-01 🔴 `order_return_request` link is 1:1 by default but the model allows many per order

**Evidence:** `links/order-return-request.ts` calls `defineLink(Order, OrderReturnRequest)` without `isList`. The model indexes `order_id` (non-unique). Medusa link defaults to a single-record link unless `isList` is set.

**Impact:** Either the link table blocks the second return (partial returns/RTO + customer return), or direct repository inserts bypass the link and create orphans.
**Fix:** Set the return-request side as a list link, or enforce exactly one return request per order and move line-level data into child rows. Do not leave both possibilities.

#### DB-R-02 🔴 Redundant relation columns next to Module Links

`order_bd_details.order_id`, `product_localization.product_id`, `product_variant_cost.variant_id` are stored **and** linked via `defineLink`. The link table is the real relation; the text column is a second source of truth with no FK.

**Impact:** A row can point to `order_id=A` while the link table points to `order_id=B`. Queries using the column and queries using the link disagree.
**Fix:** Choose one:
- **Preferred:** keep `order_id` as a unique, write-once denormalized key for reporting, but document that the link is authoritative and add a consistency check job; or
- Remove the column and query through the link.

Also: `product_localization.product_id` must be **unique** if it is 1:1. Currently only `index()`.

#### DB-R-03 🔴 `category_attribute` uniqueness is wrong

`attribute_code` is indexed globally, but attribute definitions are category-scoped (PRD FR-3.1.1). Two categories can legitimately define `fabric` with different options, yet `product_attribute_value` references only `attribute_code`.
**Fix:** Add `UNIQUE(category_id, attribute_code)` and make `product_attribute_value` reference `category_attribute_id` (or `(category_id, attribute_code)`), not a bare code string.

#### DB-R-04 🔴 Multi-category products vs category-scoped attributes

PRD FR-3.1.1 allows a product in one or more categories; `CategoryAttribute` assumes a single `category_id`; Medusa product↔category is many-to-many.
**Impact:** Which category’s attributes apply to a product in Apparel + Sale? Filtering and PDP rendering become ambiguous.
**Fix:** Define a primary category (`product_category.is_primary`) and/or an explicit `product_attribute_value.category_attribute_id`; document conflict resolution.

#### DB-R-05 🟠 `CustomerRiskProfile` is keyed only by raw phone text

`phone_number` is `unique()` but docs allow `+88017...` or `017...`. Two formats for the same person create two profiles. The model has no `customer_id`, so it cannot survive a customer phone change or merge.

**Fix:**
- Store `phone_e164` with `CHECK (phone_e164 ~ '^\+8801[3-9][0-9]{8}$')`.
- Add `customer_id` (nullable, link to customer).
- Keep `phone_raw` for audit only.
- Define merge behavior when two profiles collide.

#### DB-R-06 🟠 `order_bd_details` is 1:1 but courier re-booking overwrites history

`courier_consignment_id` / `courier_tracking_code` are single-valued. DFD GAP-07 explicitly clears them on cancellation/re-route.
**Fix:** Add `courier_consignment` (1:N per order) with `status`, `booked_at`, `canceled_at`, `rebooked_from_id`; keep the current fields as a cached “active consignment”.

#### DB-R-07 🟠 `landing_page.featured_product_id` and `order_bd_details.landing_page_slug` have no integrity

- Product may be deleted/unpublished; PRD AC-9.1 requires blocking publish.
- Slug can change; historical orders then point to a dead slug.

**Fix:** Store immutable `landing_page_id` + `campaign_id` on the order; keep `landing_page_slug` only as a display snapshot. Validate links at publish time.

#### DB-R-08 🟠 `DeliveryZoneConfig.coverage_districts_json` is not a relation

JSON cannot enforce “one district → one zone”, cannot be joined, and needs a GIN index for containment queries.
**Fix:** `delivery_zone_district(zone_id, district_code, UNIQUE(district_code))`; use `coverage_json` only as a cache if needed.

#### DB-R-09 🟠 `StaffRolePermission` has no link to Medusa `user`

`user_id` is unique text with no link. Deleting a user leaves an orphan permission row; a recreated user id collision is unlikely but the row is unmanaged.
**Fix:** Link to `user` (or a FK in a single-database deployment) and cascade/deactivate on user deletion.

#### DB-R-10 🟠 `PaymentTransaction.payment_session_id` and `order_id` have no link

Zero-orphan flow creates a transaction before the order exists. When the order is created, nothing establishes the relation except app code.
**Fix:** Add `cart_id` + `idempotency_key`, and update `order_id` in the same workflow step that creates the order. Add a unique `(provider_id, gateway_transaction_id)`.

#### DB-R-11 🟡 `PaymentWebhookLog` / `CourierWebhookLog` have no relation to the transaction/order

Webhook logs store payloads but not `payment_transaction_id` or `order_id`. Unmatched webhooks cannot be reconciled.
**Fix:** Add nullable `payment_transaction_id` / `order_id`; populate after matching; keep unmatched rows for ops review.

#### DB-R-12 🟡 `landing_page.theme_tokens_json` vs global theme tokens

`architecture.md` §4.2 says `bd-settings` owns design tokens; `data-models.md` puts `theme_tokens_json` on each landing page. Both may be valid (global default + per-page override), but the precedence is undocumented.
**Fix:** Define `theme = global tokens ← campaign override` and validate contrast at both levels.

---

## 6. Duplicate Data & Conflicting Sources of Truth

#### DB-D-01 🔴 Two address models with no declared winner

`order_bd_details` stores `division/district/thana/area_street`; Medusa `order.shipping_address` stores `address_1/address_2/city/province/postal_code`. Both are written at order time.
**Impact:** Courier payload source is ambiguous; a later address correction updates one copy only. `postal_code` exists in Medusa but not in the BD table.
**Fix:** Declare `order.shipping_address` as the canonical address; store a **snapshot copy** in `order_bd_details` for courier/BD reporting, with a documented write-once rule and a drift check. Or make `order_bd_details` canonical and explicitly not use Medusa addresses. Do not leave both writable.

#### DB-D-02 🔴 `CustomerRiskProfile` counters duplicate order facts

`total_orders_placed`, `total_orders_delivered`, `total_rto_orders`, `total_canceled_orders`, `delivery_success_rate` are derivable from orders/returns.
**Impact:** Drift after cancellation, RTO correction, manual order edits, or refunds. Risk badges become wrong. `delivery_success_rate` is a stored float with no defined denominator.
**Fix:** Treat counters as a **projection** updated by workflows, with a nightly reconciliation query; or replace with a view/materialized view. Define the formula explicitly (e.g., delivered / (delivered + RTO), excluding canceled and in-flight).

#### DB-D-03 🔴 Two payment ledgers

Medusa `payment` / `payment_session` already store amount, currency, provider, captured/refunded state. `payment_transaction` stores the same again.
**Impact:** Two “captured” truths; reconciliation and refund accounting diverge. `is_verified_server_to_server` can be true in one and false in the other.
**Fix:** Make `payment_transaction` a **gateway audit log** only, linked to `payment.id`/`payment_session.id`, and use Medusa payment status as the authoritative state. Or explicitly declare the custom table authoritative and disable/ignore the core payment state — but do not write both independently.

#### DB-D-04 🟠 `cogs_total` duplicates per-line COGS

`order_bd_details.cogs_total` is a sum of line-level costs that are not stored.
**Impact:** Cannot audit or reverse a single returned line; margin per SKU is impossible.
**Fix:** Add line snapshots (DB-M-12); compute `cogs_total` as a generated/derived value, not an independently editable field.

#### DB-D-05 🟠 `customer_paid_delivery` duplicates `order.shipping_total`

Both represent what the customer paid for delivery. Discounts and free-shipping rules can make them differ.
**Fix:** Define one as the snapshot of the other at order creation; never recompute from settings. Add a check constraint or reconciliation report.

#### DB-D-06 🟠 UTMs are stored twice

DFD/architecture say UTMs are attached to order metadata; `order_bd_details` also has `utm_source/medium/campaign`.
**Fix:** Pick `order_bd_details` as the reporting source and mirror to metadata only for compatibility, or vice versa. Document it.

#### DB-D-07 🟠 `must_change_password` is duplicated

`StaffRolePermission.must_change_password` vs `user.metadata.must_change_password` (architecture §6.2).
**Impact:** One says true, the other false; a forced-reset bypass is possible.
**Fix:** Keep it in one place (prefer auth/user metadata) and remove the duplicate; or make the custom row the only source and never read metadata.

#### DB-D-08 🟠 RBAC is modeled three times

- Medusa native `rbac_role` / `rbac_policy`
- `StaffRolePermission.role` enum + boolean flags
- `architecture.md` §6.3 RBAC matrix (UI-level)
- PRD §8.2 role list (Owner/Manager/Staff)

**Impact:** Permission drift; a user may see a button allowed by the matrix but be blocked by the flags (or vice versa).
**Fix:** Use native RBAC as the policy engine; keep `staff_role_permission` only for BD-specific fast flags (`can_view_cogs`, `can_confirm_cod`, `can_book_courier`) or drop it. Define one matrix.

#### DB-D-09 🟡 `customer_risk_profile.customer_name` duplicates customer/order name

Which name wins when they differ? Define latest verified order recipient vs customer profile name.

#### DB-D-10 🟡 `audit_log.actor_email/actor_role` duplicate user data

This duplication is **intentional** for historical immutability. Keep it, but add a comment so future reviewers do not “normalize” it away. Ensure it is snapshot-at-action, not a join.

#### DB-D-11 🟡 `order_bd_details.cod_confirmed_by` duplicates audit actor

`cod_confirmed_by` is current-state convenience; audit log is history. Keep both but document that `cod_confirmed_by` is not a complete history (use `cod_call_log` for attempts).

---

## 7. Indexing & Constraint Issues

> Medusa DML `index()` creates partial indexes (`WHERE deleted_at IS NULL`). Composite/unique indexes must be declared with `.indexes([...])` on the model or added in a raw migration. The scaffold currently relies on single-column `index()` only.

#### DB-I-01 🔴 COD queue and shipment queries have no composite indexes

`order_bd_details` indexes only `order_id` (unique) and `courier_tracking_code`. Operational screens filter by status + recency.

**Add:**

```sql
CREATE INDEX CONCURRENTLY idx_obd_cod_queue
  ON order_bd_details (cod_status, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_obd_shipment_queue
  ON order_bd_details (shipment_state, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_obd_courier_manifest
  ON order_bd_details (courier_provider, shipment_state, created_at)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_obd_settlement
  ON order_bd_details (cod_settlement_status, created_at)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_obd_campaign
  ON order_bd_details (landing_page_id, created_at DESC)
  WHERE deleted_at IS NULL;
```

#### DB-I-02 🔴 Courier webhooks cannot uniquely resolve a consignment

Only `courier_tracking_code` is indexed. Steadfast/Pathao webhooks often send `consignment_id`. Two orders could share a consignment id across couriers.

**Add:**

```sql
CREATE UNIQUE INDEX CONCURRENTLY uq_obd_courier_consignment
  ON order_bd_details (courier_provider, courier_consignment_id)
  WHERE courier_consignment_id IS NOT NULL AND deleted_at IS NULL;
```

#### DB-I-03 🟠 `order_return_request` lacks queue/reconciliation indexes

Add:

```sql
CREATE INDEX CONCURRENTLY idx_orr_queue
  ON order_return_request (status, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_orr_tracking
  ON order_return_request (return_tracking_code)
  WHERE return_tracking_code IS NOT NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX CONCURRENTLY uq_orr_refund_trx
  ON order_return_request (refund_trx_id)
  WHERE refund_trx_id IS NOT NULL AND deleted_at IS NULL;
```

The unique refund trx index prevents recording the same external payout against two returns.

#### DB-I-04 🟠 `payment_transaction.gateway_transaction_id` is not unique

A duplicate callback can insert two capture rows with the same `trxID`.

**Add:**

```sql
CREATE UNIQUE INDEX CONCURRENTLY uq_paytx_provider_gateway
  ON payment_transaction (provider_id, gateway_transaction_id)
  WHERE gateway_transaction_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_paytx_poller
  ON payment_transaction (transaction_type, gateway_status, created_at)
  WHERE deleted_at IS NULL;
```

#### DB-I-05 🟠 `payment_webhook_log` has no dedupe key and only a deleted_at index

Add `provider_event_id` + `UNIQUE(provider, provider_event_id)`; index `(processed, created_at)` and `(provider, created_at)`.

#### DB-I-06 🟠 Catalog uniqueness gaps

```sql
CREATE UNIQUE INDEX CONCURRENTLY uq_prodloc_product
  ON product_localization (product_id)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX CONCURRENTLY uq_catattr_category_code
  ON category_attribute (category_id, attribute_code)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX CONCURRENTLY uq_pattrval_product_code
  ON product_attribute_value (product_id, attribute_code)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_pattrval_code_value
  ON product_attribute_value (attribute_code, raw_value)
  WHERE deleted_at IS NULL;
```

#### DB-I-07 🟠 `audit_log` indexes are single-column and there is no time index

Audit viewer queries by time range and entity. Current indexes on `actor_id`, `entity_type`, `entity_id`, `action` are low-selectivity alone.

```sql
CREATE INDEX CONCURRENTLY idx_audit_entity_time
  ON audit_log (entity_type, entity_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_audit_actor_time
  ON audit_log (actor_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_audit_created_brin
  ON audit_log USING BRIN (created_at);
```

For an append-only table, consider monthly partitioning once volume exceeds ~10M rows.

#### DB-I-08 🟠 JSONB fields need GIN only where queried

`delivery_zone_config.coverage_districts_json` is used for containment lookups → needs `GIN (coverage_districts_json)` if kept. `landing_page.sections_json` is rendered, not queried → no GIN. `audit_log.old_value/new_value` is searched rarely → avoid GIN (write cost).

#### DB-I-09 🟡 `landing_page` lacks an active/publish index

Add `(is_active, published_at DESC)` for storefront listing.

#### DB-I-10 🟡 `order_bd_details.courier_consignment_id` should also be indexed for lookups

Covered by DB-I-02. If not unique, at least index it.

#### DB-I-11 🟡 `invoice` lookup indexes

When added: unique `invoice_number`, unique `order_id`, index `(generated_at)`, unique `snapshot_hash` if regeneration is forbidden.

#### DB-I-12 🟡 Soft-delete + unique index behavior

Medusa’s partial unique indexes allow a new row with the same slug/phone after the old row is soft-deleted. That is usually desired, but:
- Module link tables may still reference the soft-deleted row.
- `customer_risk_profile.phone_number` can be “reused” after soft delete, merging two people’s history.

Document the restore/merge policy.

---

## 8. Medusa-Native Model Conflicts

#### DB-N-01 🔴 `order.status = "unfulfillable_stockout"` is not a valid Medusa status

Verified `@medusajs/utils` `OrderStatus`:

```
pending, completed, draft, archived, canceled, requires_action
```

**Evidence:** `dfd.md` §4.1 Scenario B and §6.3 use `unfulfillable_stockout` as an order status.
**Impact:** The insert fails the DB enum, or you fork the core enum (violates “do not fork core”).
**Fix:** Use `order.status = "requires_action"` + `order_bd_details.exception_code = "stockout_after_payment"` (or `order.metadata.exception`). Keep the payment status `captured`. The customer-facing label stays “payment received, item out of stock”.

#### DB-N-02 🔴 `ProductLocalization` duplicates the native translation module

Verified `@medusajs/translation` model:

```
translation(reference_id, reference, locale_code, translations JSON, translated_field_count)
```

It is polymorphic across product/category/content.
**Impact:** Product translations live in a custom table while categories/content use another mechanism (or none). Search sync must join two systems. No locale extensibility.
**Fix:** Evaluate native translation module for product/category/content; if you keep `product_localization` for editorial fields (care instructions, material), link it to the translation row and do not duplicate title/description/meta. At minimum add category/content translation coverage.

#### DB-N-03 🔴 `order_return_request` duplicates native `Return` / `ReturnItem`

Verified `@medusajs/order` models: `return`, `return_item`, `return_reason`, with `refund_amount`, `received_quantity`, `damaged_quantity`, `requested_at`, `received_at`, and `OrderTransaction` for refunds.
**Impact:** Two return lifecycles; native fulfillment/return flows and custom admin queue diverge. Stock restock/quarantine may double-count.
**Fix:** Use native `Return` + `ReturnItem` for physical return and quantities; add a custom `return_approval` extension (status: pending/approved/rejected/info_requested, reviewed_by, policy_snapshot) linked 1:1 to the native return. Use `OrderTransaction` for the refund ledger (plus custom `refund` for method/trx id if needed). This preserves the PRD’s manual-approval requirement without duplicating the return entity.

#### DB-N-04 🔴 `shipment_state` duplicates native fulfillment lifecycle

Verified `FulfillmentStatus`:

```
not_fulfilled, partially_fulfilled, fulfilled,
partially_shipped, shipped, partially_delivered, delivered, canceled
```

Custom `shipment_state` repeats `dispatched/in_transit/out_for_delivery/delivered` and adds `delivery_failed/rto_*`.
**Impact:** Two writable shipment truths; Medusa fulfillment and the custom badge disagree; partial delivery cannot be reconciled.
**Fix:** Make `shipment_state` a **projection** derived from native fulfillment + courier event log, or keep only BD-only states (`delivery_failed`, `rto_initiated`, `rto_received`) and map the rest to native `fulfillment_status`. Never let both be independently writable.

#### DB-N-05 🔴 Money units conflict: paisa vs Medusa major units

`data-models.md` §1.2 and `architecture.md` §12.3 mandate all amounts as BDT paisa integers. Medusa core `price.amount`, `order.total`, `line_item.unit_price`, `shipping_method.amount` are `BigNumber` **major-unit decimals** (e.g., `2500.00`), not paisa.
**Impact:** Storing `250000` in a core `price.amount` means ৳2,50,000 (100×). Tax, discounts, shipping and invoices all break.
**Fix:** Define a strict boundary:
- Medusa core tables: BDT major units (`numeric(20,2)`), as Medusa expects.
- Custom BD tables: integer paisa (`bigint`) if you prefer.
- Conversion only in the module service/DTO layer, with a single helper and tests.
- Rename fields to remove ambiguity: `cogs_paisa`, `flat_rate_paisa`, `amount_paisa` (not `_bdt` if the value is paisa).

Also note: `model.bigNumber()` creates `numeric` + `raw_* jsonb`, not `bigint`. The docs say “bigint”; clarify.

#### DB-N-06 🔴 `payment_transaction` duplicates Medusa `payment`

Medusa already has `payment`, `payment_session`, `payment_collection`, `refund`. Custom rows duplicate amount/provider/status.
**Fix:** Link custom rows to `payment.id` and store only gateway-specific fields (`trxID`, raw response, verification flag). Use native payment status as the state machine.

#### DB-N-07 🟠 `reservation_item` has no expiry field

Verified `ReservationItemDTO`: `quantity`, `location_id`, `inventory_item_id`, `line_item_id`, `description`, `allow_backorder`, `metadata`, timestamps. **No `expires_at`.**
**Impact:** The architecture’s “reserve until staff confirms” COD policy locks stock indefinitely; `cod_expiry_hours` cannot be enforced by the reservation itself.
**Fix:** Store `cod_expiry_at` on `order_bd_details` and release via a scheduled workflow; do not assume a native reservation TTL. Also note manual/phone orders may not have a `line_item_id`, so reservation creation needs a fallback.

#### DB-N-08 🟠 `inventory_item` vs `inventory_level` confusion

`dfd.md` §6.2 says `inventory_item` holds `location_id` and stock. In Medusa v2, stock is in `inventory_level` (`inventory_item_id` + `location_id` + `stocked_quantity`/`reserved_quantity`); `inventory_item` is location-agnostic.
**Impact:** Seed/migration code will be written against the wrong table; quarantine location logic fails.
**Fix:** Document `inventory_level` for sellable/quarantine; seed two stock locations (`loc_central_warehouse`, `loc_damaged_quarantine`) via the Stock Location module, not magic strings in JSON.

#### DB-N-09 🟠 Native RBAC exists; custom role flags bypass it

Verified `@medusajs/rbac` models: `rbac_role`, `rbac_policy`, `rbac_role_policy`, `rbac_role_parent`.
**Impact:** Two authorization systems. A user can be `owner` in `staff_role_permission` but lack the native policy, or vice versa.
**Fix:** Use native RBAC for route/action policy; keep only BD-specific flags as metadata. Remove `role` enum from `staff_role_permission` or make it a mirror with a single writer.

#### DB-N-10 🟠 Native tax module exists; custom VAT may bypass tax lines

Verified `@medusajs/tax` models: `tax_region`, `tax_rate`, `tax_rate_rule`.
**Impact:** If VAT is computed only in `vat_config` and not in Medusa tax lines, order totals and invoices disagree; tax reporting is wrong.
**Fix:** Decide:
- Use native tax rates for calculation + custom `vat_config` only for display/registration; or
- Explicitly disable native tax and compute VAT in the order workflow, storing tax lines manually.
Do not do both silently.

#### DB-N-11 🟠 Product multi-category + category attributes (also DB-R-04)

Medusa product↔category is many-to-many; `CategoryAttribute.category_id` is singular. `ProductAttributeValue` has no category scope.
**Fix:** Add primary category + attribute scoping; validate attribute codes per category.

#### DB-N-12 🟠 Closed enums block Phase 2 extensions promised by the PRD

Hardcoded enums:
- `delivery_zone` (`inside_dhaka|dhaka_suburbs|outside_dhaka`) — PRD FR-11.3/FR-7.4.3 allows finer zones later.
- `courier_provider` (`steadfast|pathao|redx|manual`) — PRD Phase 2 adds couriers.
- `provider_id` (`pp_cod|pp_bkash|pp_nagad`) — PRD Phase 2 adds providers.
- `refund_method` (`bkash|nagad|bank|store_credit`) — PRD FR-6.7.1 says refund methods are configurable.
- `actor_role` — native RBAC roles can change.

**Impact:** Each new zone/courier/provider/method requires a DB migration and enum alteration; “configurable” becomes false.
**Fix:** Use `text` codes + a config table (`zone`, `courier_provider`, `payment_provider_config`, `refund_method_config`) and validate in the service layer. Keep enums only for truly closed state machines (`cod_status`, `return_status`).

#### DB-N-13 🟡 `store_credit` refund method has no store-credit entity

`refund_method` includes `store_credit`, but there is no credit ledger or gift-card/promotion mapping. Either implement a store-credit ledger or remove the value until Phase 2.

---

## 9. Data Security & Privacy

#### DB-S-01 🔴 `audit_log` is not immutable at the database level

The migration creates `updated_at` and `deleted_at`, and Medusa’s base model allows updates/soft deletes. Any bug or admin with DB access can rewrite history. “Append-only immutable ledger” is a documentation claim only.

**Fix:**
- Remove `updated_at`/`deleted_at` from the audit model (or ignore them in code) and block updates at the DB layer:

```sql
CREATE OR REPLACE FUNCTION reject_audit_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_no_update
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION reject_audit_mutation();
```

- Use a DB role that only has `INSERT`/`SELECT` on `audit_log`.
- Optional: hash chain (`prev_hash`, `record_hash`) for tamper evidence.
- Test the negative case (update/delete must fail) in CI.

#### DB-S-02 🔴 Webhook and gateway logs can leak secrets/PII

`payment_webhook_log.headers_json` and `payment_transaction.gateway_response_json` store raw headers/payloads. Courier logs store raw request/response. These can contain `Authorization`, cookies, API keys, payer MSISDN, addresses.
**Impact:** Violates PRD FR-12.3 (“never written to application logs”) and FR-12.8.3; a DB dump or admin export leaks credentials.
**Fix:**
- Redact header allowlist before persist (`authorization`, `cookie`, `x-api-key`, `x-signature` → `[redacted]`).
- Store `payload_hash` + a redacted payload, not raw secrets.
- Encrypt at rest or restrict to a separate schema with tighter grants.
- Add retention (e.g., 90 days) and a purge job.

#### DB-S-03 🔴 Refund destination accounts are stored in plaintext

`order_return_request.refund_target_account` and any future `refund.target_account` hold bKash/Nagad/bank numbers. This is high-value financial PII.
**Fix:** Encrypt at application level (KMS/pgcrypto), store `*_last4` for display, mask in all APIs/logs, and restrict to Finance/Owner. Add access audit.

#### DB-S-04 🔴 Provider credentials are planned for the database

`architecture.md` §4.2 says `bd_settings` owns “SMS API keys, Meta Pixel ID, bKash/Nagad credentials”. Storing live payment credentials in a settings table contradicts §9.4 (Nagad private key in a file) and PRD FR-12.3.
**Fix:** Keep secrets in environment/secrets manager. In DB store only non-secret config (`provider`, `merchant_id`, `enabled`, `sandbox`, `key_version`, `last_rotated_at`). If DB storage is unavoidable, use envelope encryption with a KMS key and never return the value after save.

#### DB-S-05 🔴 Per-page `meta_pixel_id` enables data exfiltration and violates PRD

`landing_page.meta_pixel_id` lets staff set an arbitrary pixel per campaign. PRD FR-5.3.1 says **one centrally managed Meta Pixel** serves the storefront and all pages, subject to privacy review.
**Impact:** Customer events can be sent to an unauthorized pixel; consent/deduplication controls bypassed.
**Fix:** Remove the per-page override or restrict to an allowlisted set from settings, with Owner-only permission and audit logging.

#### DB-S-06 🟠 `sections_json` / `theme_tokens_json` are unvalidated content injection points

Even without `custom_css`, JSON can contain `html`, `script`, `javascript:` URLs, iframes, or arbitrary image URLs.
**Fix:** Validate against a JSON schema per section type; sanitize HTML; allow only `https:`/relative URLs; enforce CSP; disallow `<script>`, `on*`, `iframe` unless explicitly trusted. Contrast validation (architecture §16.3) needs the token schema, not free JSON.

#### DB-S-07 🟠 Phone numbers are stored raw and used as a unique identity

`customer_risk_profile.phone_number` and Medusa `customer.phone` are plaintext. Medusa does **not** index or unique-constrain `customer.phone` (verified: only `(email, has_account)` is unique).
**Impact:** PII exposure; duplicate customers; risk-profile mismatch; tracking lookup by phone becomes an enumeration surface.
**Fix:** Normalize to E.164, add a partial unique index where appropriate, encrypt at rest if required by the owner’s legal review, and mask in all responses (`017****5678`).

#### DB-S-08 🟠 Audit `old_value`/`new_value` can expose COGS to non-finance roles

Audit viewer is limited to Owner/Finance, but the JSON may include full product costs, supplier names, customer PII. There is no field-level masking.
**Fix:** Store a redacted projection for non-finance entity types, or mask COGS fields at the API layer based on role. Test with a call-center user.

#### DB-S-09 🟠 No retention/purge/anonymization model

PRD FR-12.8.4–12.8.6 requires configurable retention and no silent deletion of financial/audit records. All custom tables are soft-delete-only; webhook logs grow forever; customer PII never anonymizes.
**Fix:** Document retention per table (orders/invoices/audit = legal hold; webhook logs = 90 days; SMS logs = 180 days; risk profiles = 24 months after last order). Add a scheduled purge/anonymize job with audit records. Never purge financial rows without a legal review.

#### DB-S-10 🟡 `order_bd_details.cod_notes` / `customer_risk_profile.notes` are unrestricted free text

Agents may paste phone numbers, addresses, or allegations. No length limit, no masking.
**Fix:** Limit length, add UI guidance, mask on export, and separate `staff_note` from `customer_visible_note`.

#### DB-S-11 🟡 No `created_by`/`updated_by` on content/settings/campaign tables

Audit log may capture changes, but direct rows have no owner. Add `created_by`/`updated_by` and require audit writes for publish actions.

---

## 10. Bangladesh Business-Rule Gaps

#### DB-B-01 🔴 No canonical geo hierarchy / postal codes

See DB-M-06. Add BBS-style codes, bilingual names, and a `postal_code` per thana/area. Store `postal_code` on the order and saved address.
**Why:** Courier APIs and address validation need stable codes, not free text.

#### DB-B-02 🔴 No Pathao/Steadfast/RedX area mapping

Pathao needs `city_id` + `zone_id`; Steadfast/RedX need district/thana names. There is no mapping table.
**Fix:** `courier_area_map` (DB-M-06), seeded and versioned. Cache mappings; fall back to manual courier when unmapped (PRD FR-7.4.4).

#### DB-B-03 🔴 COD collectable amount is not stored

`order_bd_details` has delivery fee and COGS, but not the amount the courier must collect. The courier payload must be a write-once snapshot; otherwise a later discount/refund changes the COD amount.
**Fix:** `cod_collectable_paisa` = order total − prepaid amount, snapshot at dispatch.

#### DB-B-04 🔴 Partial delivery has no per-line quantities

DFD §4.3 Process 5.6b says “partial collection → create return request for rejected items”, but there is no `delivered_quantity` / `rejected_quantity` per line.
**Impact:** Cannot compute partial COD, partial refund, restock quantity, or RTO cost. `cogs_total` cannot be adjusted.
**Fix:** Add `order_delivery_item(order_id, order_line_item_id, delivered_qty, rejected_qty, damaged_qty, collected_paisa)` or use native fulfillment items + return items. Do not store only an order-level amount.

#### DB-B-05 🔴 Courier COD remittance is per-order only

`cod_remittance_received` is one figure per order. Couriers pay in batches covering many orders, with fees and short remittances.
**Fix:** Add `courier_remittance_batch` + lines (DB-M-08). Reconcile: expected COD − courier fee − COD fee − returns = net remitted. Record variance per line and a dispute status.

#### DB-B-06 🟠 Missing courier/payment cost components

PRD FR-14.3 requires:
- actual courier cost
- payment fees (bKash/Nagad MDR)
- packaging/fulfillment cost
- return/RTO cost

`order_bd_details` has only `courier_cost_to_business` and `cogs_total`.
**Fix:** Add `payment_fee_paisa`, `packaging_cost_actual_paisa`, `rto_shipping_cost_paisa`, `cod_handling_fee_paisa`, and optionally `other_cost_paisa` + `cost_note`. Snapshot each at the event that incurs it.

#### DB-B-07 🟠 Return policy is not modeled

PRD FR-6.7.1 requires configurable return window, conditions, non-returnable categories/products, refund methods, return shipping responsibility, and enable/disable toggles.
**Fix:** Add `return_policy` + `return_policy_scope` (DB-M-09), with versioning. `order_return_request.policy_snapshot_json` records which policy applied. Block deletion when referenced (PRD FR-6.7.2).

#### DB-B-08 🟠 Return shipping responsibility/cost is missing

`order_return_request` has no `return_shipping_paid_by` or `return_shipping_cost_paisa`. PRD FR-6.7.1 explicitly lists this as configurable.
**Fix:** Add both fields; include in refund calculation and contribution profit.

#### DB-B-09 🟠 VAT is not effective-dated or snapshotted

See DB-F-08. Also: `prices_include_vat` exists in code but not in the DB doc; invoice display requires `vat_registration_number` at order time.
**Fix:** Version `vat_config`; snapshot rate/registration/inclusive flag onto the invoice/order line. Add a legal-review flag (`vat_status = unverified|verified`) per PRD FR-11.7.4.

#### DB-B-10 🟠 Campaign expiry and offer pricing are not persistable

`landing_page` has no `starts_at`/`ends_at`/`status`/offer price; only `published_at`. PRD FR-5.2.5 requires blocking expired/sold-out offers.
**Fix:** Add campaign window fields + `landing_page_offer` (offer price, bundle quantity, promotion id). Validate at checkout server-side.

#### DB-B-11 🟠 Phone normalization / BD phone validation is not enforced

Docs allow `+88017...` or `017...`; PRD FR-6.6.1 requires validation. No CHECK constraint, no canonical column.
**Fix:** `phone_e164` with `CHECK (phone_e164 ~ '^\+8801[3-9][0-9]{8}$')`; reject other formats at the API boundary. Use the same normalizer for risk profile, order tracking, and courier payloads.

#### DB-B-12 🟠 District/thana naming variants break matching

Chattogram/Chittagong, Barishal/Barisal, Cumilla/Comilla, Jashore/Jessore. Free-text storage will not match courier masters.
**Fix:** Canonical codes + bilingual display names; store code on the order and snapshot the display name.

#### DB-B-13 🟠 No order source / channel

PRD FR-6.1.2 manual orders come from phone/Facebook/WhatsApp/personal messages. Without `order_source`, reporting cannot separate channels and manual entry cannot be audited by origin.
**Fix:** `order_source` enum/text + `source_reference` (e.g., conversation id), `created_by`.

#### DB-B-14 🟠 Delivery attempts are not tracked

Courier `DELIVERY_FAILED` may repeat 1–3 times; risk scoring and call-center alerts need a count and last attempt time.
**Fix:** Add `delivery_attempts_count`, `last_delivery_attempt_at`, or a `delivery_attempt` child table with courier reason codes.

#### DB-B-15 🟡 SMS consent/opt-out is not modeled

BD SMS compliance and customer preference require an opt-out flag. `sms_log` alone is not consent.
**Fix:** `customer.sms_opt_out` (or custom `notification_preference`) + source/timestamp. Transactional vs promotional classification.

#### DB-B-16 🟡 No Bangla/English names on geo and courier data

Storefront and admin are bilingual; geo names must have `name_en`/`name_bn`. The DFD JSON only shows English.
**Fix:** Include both in geo and zone tables; expose locale-aware labels.

---

## 11. Priority Remediation Plan

### Phase 0 — Before any new migration (must do)

1. **Freeze one canonical schema list** and update all four docs to match (§2).
2. **Resolve the money-unit boundary** (DB-N-05): core major units vs custom paisa; add conversion helpers and tests.
3. **Fix `order.status`** (DB-N-01): use `requires_action` + `exception_code`.
4. **Decide native vs custom for returns/refunds** (DB-N-03/06): native `Return` + `OrderTransaction`, custom approval extension.
5. **Add missing P0 entities**: `order_return_request` spec, `sms_log`, `homepage_section`, `content_page`, `invoice_template`, `invoice`, `bd_settings`/`operational_settings`, `vat_config`, `refund`.
6. **Add geo master + courier area map + delivery_zone_district** (DB-M-06/DB-R-08).
7. **Add COD collectable + partial delivery quantities + remittance batch** (DB-B-03/04/05).
8. **Make `audit_log` append-only at the DB level** (DB-S-01).
9. **Redact webhook headers/payloads and encrypt refund accounts** (DB-S-02/03).
10. **Add unique/idempotency keys** for payment transactions, webhook events, refund trx ids (DB-I-03/04/05).

### Phase 1 — Before COD/courier launch

11. Add composite indexes for COD queue, shipment queue, returns queue, audit viewer (DB-I-01/03/07).
12. Add per-line cost/discount/VAT snapshot (DB-F-02/DB-M-12).
13. Add campaign window + offer pricing (DB-F-05/DB-M-10).
14. Add return policy + return shipping payer + non-returnable flags (DB-M-09/DB-B-07/08).
15. Add `customer_address_bd`, `cod_call_log`, `brand`, `category_localization` (DB-M-11/13/14/15).
16. Normalize phone to E.164 and add CHECK constraints (DB-B-11).
17. Add `order_source`, `postal_code`, `alternate_phone`, `delivery_instructions` (DB-F-01/DB-B-13).
18. Split `shipment_state` into native fulfillment projection + BD exception states (DB-N-04).

### Phase 2 — Hardening

19. Replace closed enums for zone/courier/provider/refund method with config tables (DB-N-12).
20. Add retention/purge/anonymization jobs (DB-S-09).
21. Add hash-chain tamper evidence to audit (DB-S-01).
22. Add `media_asset`, `landing_page_version`, invoice records (DB-M-05/16/17).
23. Reconcile native RBAC/tax/translation modules (DB-N-02/09/10).

---

## 12. Proposed Schema Deltas (Condensed)

> Names use `_paisa` for integer minor units to avoid the current `_bdt` ambiguity. If you standardize on decimal BDT, drop the `_paisa` suffix and use `numeric(20,2)`.

### 12.1 New tables

```text
geo_division(code PK, name_en, name_bn, bbs_code)
geo_district(code PK, division_code FK, name_en, name_bn, bbs_code)
geo_thana(code PK, district_code FK, name_en, name_bn, bbs_code, is_city_corporation)
courier_area_map(courier_code, thana_code, courier_city_id, courier_zone_id, UNIQUE(courier_code, thana_code))
delivery_zone_district(zone_id, district_code, UNIQUE(district_code))

customer_address_bd(id, customer_id, label, division_code, district_code, thana_code,
                    area_street, postal_code, phone_e164, alt_phone_e164, is_default)

order_line_cost_snapshot(id, order_line_item_id UNIQUE, order_id, variant_id,
                         cogs_unit_paisa, packaging_unit_paisa, discount_alloc_paisa,
                         tax_rate_percent, tax_amount_paisa, supplier_id, snapshot_json)

order_delivery_item(id, order_id, order_line_item_id, delivered_qty, rejected_qty,
                    damaged_qty, collected_paisa, UNIQUE(order_id, order_line_item_id))

cod_call_log(id, order_id, attempt_no, outcome, agent_id, notes, called_at, next_followup_at)

courier_consignment(id, order_id, courier, consignment_id, tracking_code, status,
                    booked_at, canceled_at, rebooked_from_id,
                    UNIQUE(courier, consignment_id))

courier_remittance_batch(id, courier, batch_ref, period_start, period_end,
                         gross_collected_paisa, courier_fee_paisa, cod_fee_paisa,
                         net_remitted_paisa, received_at, bank_ref, status)
courier_remittance_line(id, batch_id, order_id, expected_paisa, remitted_paisa,
                        variance_paisa, variance_reason)

refund(id, order_id, return_id NULL, payment_transaction_id NULL, amount_paisa,
       currency, method, target_account_encrypted, target_account_last4, trx_id,
       status, reason_code, approved_by, approved_at, paid_at, recorded_by,
       audit_log_id, UNIQUE(method, trx_id) WHERE trx_id IS NOT NULL)

return_policy(id, version, return_window_days, conditions_en, conditions_bn,
              return_shipping_paid_by, is_active, effective_from, effective_to)
return_policy_scope(id, policy_id, category_id NULL, product_id NULL,
                    is_returnable, UNIQUE(policy_id, category_id, product_id))

return_approval(id, native_return_id UNIQUE, order_id, status, reason,
                policy_snapshot_json, reviewed_by, reviewed_at, approved_at,
                rejected_at, info_requested_note, customer_visible_note)

campaign(id, name, meta_campaign_id, starts_at, ends_at, status, ad_spend_paisa)
landing_page_offer(id, landing_page_id, variant_id, offer_price_paisa, bundle_qty,
                   promotion_id, starts_at, ends_at, UNIQUE(landing_page_id, variant_id))

homepage_section(id, section_type, title_en, title_bn, config_json, sort_order,
                 is_active, starts_at, ends_at, published_at, published_version_json,
                 created_by, updated_by)
content_page(id, slug UNIQUE, page_type, title_en, title_bn, body_en, body_bn,
             status, published_version_json, seo_title_en, seo_title_bn,
             seo_description_en, seo_description_bn, published_at, created_by, updated_by)

invoice_template(id, name, version, is_active, logo_asset_key, header_en, header_bn,
                 footer_en, footer_bn, terms_en, terms_bn, published_at, created_by)
invoice(id, order_id UNIQUE, invoice_number UNIQUE, template_id, template_version,
        s3_key, snapshot_hash UNIQUE, vat_snapshot_json, total_paisa,
        generated_at, generated_by, voided_at, void_reason)

sms_log(id, order_id, event_type, template_key, recipient_phone_masked,
        provider, provider_message_id, status, attempt_count,
        request_payload_redacted, response_payload_redacted, error_message,
        sent_at, delivered_at, UNIQUE(provider, provider_message_id))

operational_settings(id singleton, cod_expiry_hours, free_shipping_threshold_paisa,
                     sms_sender_id, meta_pixel_id, invoice_terms_en, invoice_terms_bn,
                     updated_by, updated_at)

media_asset(id, bucket, key UNIQUE, mime, size_bytes, width, height, checksum,
            uploaded_by, created_at)
landing_page_version(id, landing_page_id, version, sections_json, theme_tokens_json,
                     published_at, published_by, is_current,
                     UNIQUE(landing_page_id, version))

brand(id, slug UNIQUE, name_en, name_bn, logo_key, is_active)
category_localization(id, category_id, locale, name, description, meta_title,
                      meta_description, UNIQUE(category_id, locale))
```

### 12.2 Fields to add to existing tables

**order_bd_details**

```text
postal_code, alternate_phone_e164, delivery_instructions,
order_source, source_reference, campaign_id, landing_page_id,
cod_collectable_paisa, payment_fee_paisa, packaging_cost_actual_paisa,
rto_shipping_cost_paisa, cod_handling_fee_paisa,
delivery_attempts_count, last_delivery_attempt_at,
cancel_reason, canceled_at, canceled_by,
cod_expiry_at, exception_code, staff_note, customer_note
```

**order_return_request** (if kept as-is; otherwise fold into `return_approval`)

```text
return_type, requested_at, approved_at, rejected_at, received_at, completed_at,
return_shipping_cost_paisa, return_shipping_paid_by, policy_id, policy_snapshot_json,
refund_status, customer_visible_note, staff_note, rejection_reason,
restocked_at, restocked_by, quarantine_location_id
```

**payment_transaction**

```text
cart_id, idempotency_key, initiated_at, completed_at, expires_at,
payer_msisdn_masked, provider_fee_paisa, refund_of_transaction_id, failure_code
```

**landing_page**

```text
status, starts_at, ends_at, campaign_id, published_version_json,
created_by, updated_by, default_locale, canonical_url
```

**customer_risk_profile**

```text
customer_id, phone_e164, risk_score, risk_level, last_evaluated_at,
last_rto_at, last_delivery_at, normalized_at
```

**audit_log**

```text
correlation_id, user_agent, record_hash, prev_hash, entity_label
-- plus enum values: customer, payment, sms, campaign, landing_page, vat, export,
-- login_success, refund_approved, refund_paid, webhook_rejected
```

**product_localization**

```text
translation_source, translation_status, reviewed_by, reviewed_at, source_hash
```

**product_variant_cost**

```text
effective_from, effective_to, changed_by, change_reason
```

**vat_config**

```text
effective_from, effective_to, is_active, vat_included_in_price, legal_status
```

**DeliveryZoneConfig**

```text
cod_enabled, min_order_paisa, max_weight_grams, effective_from, priority, is_default
```

---

## 13. Decisions Required From the Owner

These are design decisions, not bugs. They must be answered before migration:

1. **Money representation:** integer paisa in custom tables + decimal BDT in Medusa core, or decimal BDT everywhere? (DB-N-05)
2. **Returns:** native Medusa `Return` + approval extension, or fully custom `order_return_request`? (DB-N-03)
3. **Shipment state:** native fulfillment projection, or custom writable state machine? (DB-N-04)
4. **Payments:** native payment ledger as authoritative, or custom `payment_transaction`? (DB-D-03/DB-N-06)
5. **Tax:** native `@medusajs/tax` rates, or custom VAT calculation? (DB-N-10)
6. **Translations:** native translation module, or custom localization tables? (DB-N-02)
7. **RBAC:** native `@medusajs/rbac`, or custom permission flags? (DB-D-08/DB-N-09)
8. **Zones/couriers/providers:** keep closed enums (migration per addition) or move to config tables? (DB-N-12)
9. **COD stock reservation:** indefinite until staff action, or auto-expire after `cod_expiry_hours`? (PRD Q#18 / DB-N-07)
10. **Audit retention/immutability:** DB-enforced append-only + hash chain, or application-only convention? (DB-S-01)
11. **Return policy defaults:** window, non-returnable categories, return shipping payer, refund methods (PRD Q#4 / DB-B-07/08).
12. **Retention periods:** webhook logs, SMS logs, risk profiles, audit, invoices (PRD Q#12 / DB-S-09).

---

## 14. Appendix — Verified Medusa v2 Facts

Verified from installed `node_modules/@medusajs/*` on 2026-10-24:

| Fact | Verified value |
|---|---|
| `OrderStatus` | `pending`, `completed`, `draft`, `archived`, `canceled`, `requires_action` — **no `unfulfillable_stockout`** |
| `PaymentStatus` | `not_paid`, `awaiting`, `authorized`, `partially_authorized`, `captured`, `partially_captured`, `partially_refunded`, `refunded`, `canceled`, `requires_action` |
| `FulfillmentStatus` | `not_fulfilled`, `partially_fulfilled`, `fulfilled`, `partially_shipped`, `shipped`, `partially_delivered`, `delivered`, `canceled` |
| Native return models | `return`, `return_item`, `return_reason`; `return.refund_amount`, `return_item.received_quantity`, `damaged_quantity` |
| Native refund ledger | `order_transaction` (`amount`, `currency_code`, `reference`, `reference_id`, `return_id`) |
| Native translation | `translation(reference_id, reference, locale_code, translations JSON)` |
| Native RBAC | `rbac_role`, `rbac_policy`, `rbac_role_policy`, `rbac_role_parent` |
| Native tax | `tax_region`, `tax_rate`, `tax_rate_rule` |
| Reservation item | No `expires_at`; `line_item_id` nullable |
| Customer email | Nullable; unique only on `(email, has_account)` |
| Customer phone | Not unique, not indexed |
| DML `bigNumber()` | `numeric` column + `raw_* jsonb`; not `bigint` |
| DML link default | Single-record link unless `isList` is set |
| DML `index()` | Partial index `WHERE deleted_at IS NULL` |

---

## 15. Review Sign-Off

- **Files modified:** only `docs/database-review.md` was created.
- **Source documents:** untouched.
- **Code:** untouched.
- **Recommended next step:** resolve the 12 decisions in §13, then produce a single reconciled `data-models.md` v2.0 with the canonical table list and the P0 deltas above.

*End of review.*
