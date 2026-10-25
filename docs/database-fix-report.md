# Database Reconciliation — Fix Report

**Report Date:** 2026-10-24
**Scope:** Resolve the findings in `docs/database-review.md` and produce one canonical database design
**Inputs:** `docs/database-review.md`, `docs/data-models.md`, `docs/architecture.md`, `docs/dfd.md`, `prd.md`, installed Medusa v2.22.0 packages
**Canonical output:** [`database.md`](../database.md) v2.0
**Status:** All 107 review findings dispositioned. 105 resolved in the schema; 2 resolved by explicit implementation deferral with documented rationale. 15 owner decisions remain open (business values, not schema gaps).

---

## 1. What changed

| File | Change | Type |
|---|---|---|
| `database.md` (repo root) | **Created** — canonical database design, 10 required sections + 4 appendices | New document |
| `docs/data-models.md` | Added supersession banner at the top; content otherwise unchanged | Documentation marker only |
| `docs/database-fix-report.md` | **Created** — this report | New document |
| `docs/database-review.md` | Unchanged by the reconciliation (it is the finding source, written earlier in the same documentation task) | — |
| `docs/architecture.md`, `docs/dfd.md`, `prd.md` | **Unchanged** | — |
| `apps/**` (application code) | **Unchanged** | — |
| Migrations (`apps/medusa/src/modules/*/migrations/*`) | **Unchanged** | — |
| Database data | **Unchanged** — no `db:migrate`, no seed, no SQL executed against any database | — |

### 1.1 Why `database.md` did not exist

Evidence collected before writing:

| Check | Command | Result |
|---|---|---|
| File at root | `find . -name "database*.md" -not -path "./node_modules/*"` | empty |
| File in `docs/` | `ls docs/` | no `database.md` |
| Git history | `git log --all -- database.md docs/database.md` | empty |
| Git tracking | `git ls-files \| grep -E "database\.md\|data-models\.md"` | empty |
| Draft that exists | `stat docs/data-models.md` | untracked, mtime 2026-10-24 11:59 |

`docs/data-models.md` is therefore the only database draft, and it was written after `architecture.md` (11:12) and `dfd.md` (11:36) yet disagrees with both. That is the evidence basis for marking it superseded rather than treating it as canonical.

### 1.2 Medusa verification method

Every "native" claim in `database.md` was checked against installed code, not documentation memory:

| Package | Version | Read |
|---|---|---|
| `@medusajs/framework` | 2.22.0 | `package.json` |
| `@medusajs/utils` | 2.22.0 line | `dist/order/status.d.ts`, `dist/payment/refund.d.ts`, `dist/notification/common.d.ts`, `dist/promotion/index.d.ts`, `dist/dml/entity-builder.js`, `dist/dal/mikro-orm/big-number-field.js` |
| `@medusajs/types` | 2.22.0 line | `dist/order/common.d.ts:1710,1714`, `dist/payment/common.d.ts:6`, `dist/inventory/common/reservation-item.d.ts` |
| `@medusajs/order` | 2.22.0 line | `dist/models/{order,order-item,order-summary,return,return-item,transaction}.js` |
| `@medusajs/fulfillment` | 2.22.0 line | `dist/models/{fulfillment,fulfillment-item,geo-zone,service-zone,shipping-option}.js` |
| `@medusajs/payment` | 2.22.0 line | `dist/models/{payment,payment-session,payment-collection,capture,refund}.js` |
| `@medusajs/rbac` | 2.22.0 line | `dist/models/{rbac-role,rbac-policy}.js` |
| `@medusajs/link-modules` | 2.22.0 line | `dist/definitions/user-rbac-role.js`, `cart-payment-collection.js` |
| `@medusajs/translation` | 2.22.0 line | `dist/models/{translation,settings}.js` |
| `@medusajs/tax` | 2.22.0 line | `dist/models/{tax-region,tax-rate}.js` |
| `@medusajs/promotion` | 2.22.0 line | `dist/models/campaign.js` |
| `@medusajs/notification` | 2.22.0 line | `dist/models/notification.js` |
| `@medusajs/product` | 2.22.0 line | `dist/models/{product,product-category,variant}.js` |
| `@medusajs/customer` | 2.22.0 line | `dist/models/{customer,address}.js` |
| `@medusajs/inventory` | 2.22.0 line | `dist/models/inventory-level.js` |
| `@medusajs/stock-location` | 2.22.0 line | `dist/models/stock-location.js` |

---

## 2. Resolution summary

| Category | Findings | Resolved in schema | Resolved by deferral | Unresolved |
|---|---:|---:|---:|---:|
| Missing entities (`DB-M`) | 18 | 17 | 1 (tracking-attempt log) | 0 |
| Missing fields (`DB-F`) | 14 | 14 | 0 | 0 |
| Wrong relations (`DB-R`) | 12 | 12 | 0 | 0 |
| Duplicate data (`DB-D`) | 11 | 11 | 0 | 0 |
| Indexing (`DB-I`) | 12 | 12 | 0 | 0 |
| Medusa-native conflicts (`DB-N`) | 13 | 12 | 1 (store-credit ledger) | 0 |
| Security/privacy (`DB-S`) | 11 | 11 | 0 | 0 |
| Bangladesh rules (`DB-B`) | 16 | 16 | 0 | 0 |
| **Total** | **107** | **105** | **2** | **0** |

Note: a finding that is "resolved by deferral" is still dispositioned — the schema explicitly forbids the unsafe option until the deferred feature is built (e.g. `store_credit` cannot be used as a refund method).

One review recommendation was adjusted for factual accuracy:

| Review said | Implemented | Why |
|---|---|---|
| DB-S-01: "Remove `updated_at`/`deleted_at` from the audit model" | Columns remain (DML adds them to every model) but are frozen by trigger + `CHECK (deleted_at IS NULL)` + `REVOKE UPDATE/DELETE` | Removing DML-managed columns breaks MikroORM mapping. The intent (immutability) is met at the database level, and this is documented in `database.md` §3.12.1 and §6.5. |

---

## 3. Disposition — Missing entities (`DB-M`)

| ID | Sev | Status | Resolution / section |
|---|---|---|---|
| DB-M-01 | P0 | **Resolved** | `order_return_request` replaced by native `return` + `return_item` + 1:1 `return_review` with all missing fields (§3.5.3, §2.3) |
| DB-M-02 | P0 | **Resolved** | `sms_log` → native `notification` + `sms_delivery_detail` + `sms_template` (§3.10) |
| DB-M-03 | P0 | **Resolved** | `bd_settings` split into `operational_settings`, `vat_settings`, `delivery_zone`, `payment_provider_config`, `courier`; secrets excluded (§3.8.1, §6.4) |
| DB-M-04 | P0 | **Resolved** | `homepage_section`, `content_page` added with draft/publish/rollback fields (§3.9.6, §3.9.7) |
| DB-M-05 | P0 | **Resolved** | `invoice_template` + immutable `invoice` (unique order, number, hash, VAT snapshot) (§3.11) |
| DB-M-06 | P0 | **Resolved** | `geo_division` / `geo_district` / `geo_thana`, `courier_area_map`, `courier_area_alias`, `delivery_zone_district` (§3.8.2, §3.6.2, §3.8.3) |
| DB-M-07 | P0 | **Resolved** | `refund_ledger` independent of returns, covering stockout/goodwill/delivery-fee refunds (§3.7.3) |
| DB-M-08 | P1 | **Resolved** | `courier_remittance_batch` + `courier_remittance_line` with variance/dispute (§3.6.5) |
| DB-M-09 | P1 | **Resolved** | `return_policy` + `return_policy_scope` + `product_bd_profile.is_returnable` (§3.5.1, §3.5.2, §3.3.3) |
| DB-M-10 | P1 | **Resolved** | `ad_campaign` (ad spend/UTM) + `landing_page_offer`; promo window uses native `promotion_campaign` (§3.9.3, §3.9.4) |
| DB-M-11 | P1 | **Resolved** | `cod_call_log` per attempt with unique `(order_id, attempt_no)` (§3.4.6) |
| DB-M-12 | P1 | **Resolved** | `order_line_snapshot` per-line price/discount/tax/COGS/packaging (§3.4.5) |
| DB-M-13 | P1 | **Resolved** | Native `customer_address` kept canonical + 1:1 `address_bd_detail` for codes (§3.4.3) |
| DB-M-14 | P1 | **Resolved** | `brand` + DB-enforced 1-brand-per-product `product_brand` (§3.3.4) |
| DB-M-15 | P1 | **Resolved** | Category translations use native `translation` (no duplicate table) (§3.3.1, §8.12) |
| DB-M-16 | P1 | **Resolved** | `media_asset` with checksum dedupe and orphan flag (§3.9.8) |
| DB-M-17 | P1 | **Resolved** | `landing_page_version` with `is_current` rollback pointer (§3.9.2) |
| DB-M-18 | P2 | **Resolved by deferral** | Tracking lookups stay Redis-only; decision recorded as O-07, documented in §6.7. Reason: persisting IP + order ref is a privacy liability with no Phase-1 requirement; lockouts/auth events are still audited |

## 4. Disposition — Missing fields (`DB-F`)

| ID | Sev | Status | Resolution / section |
|---|---|---|---|
| DB-F-01 | P0 | **Resolved** | `order_bd_details` gains COD collectable, postal code, alt phone, instructions, order source, campaign/landing ids, payment fee, RTO/packaging cost, attempts, cancel fields, `cod_expires_at`, exception code, split notes (§3.4.4) |
| DB-F-02 | P0 | **Resolved** | `order_line_snapshot` replaces the JSON/`cogs_total` shortcut (§3.4.5) |
| DB-F-03 | P0 | **Resolved** | All return line/policy/timing/shipping/refund fields present in native return + `return_review` + `return_policy` (§3.5) |
| DB-F-04 | P0 | **Resolved** | `payment_attempt` gains `cart_id`, idempotency, timestamps, masked MSISDN, provider fee, failure code; refund linkage via `refund_ledger` (§3.7.2/§3.7.3) |
| DB-F-05 | P1 | **Resolved** | `landing_page` gains status, windows, version, campaign, authors, locale, canonical URL (§3.9.1) |
| DB-F-06 | P1 | **Resolved** | `customer_risk_profile` gains customer_id, risk score/level, recency, evaluation timestamps, normalised phone (§3.4.2) |
| DB-F-07 | P1 | **Resolved** | `product_variant_cost` effective-dated with one open row per variant (§3.3.6) |
| DB-F-08 | P1 | **Resolved** | `vat_settings` versioned/current flag + order/invoice snapshots (§3.8.4, §8.8) |
| DB-F-09 | P1 | **Resolved** | `audit_log` gains correlation/request id, user agent, entity label, hash chain, explicit time, expanded open-set entity/action values (§3.12.1) |
| DB-F-10 | P2 | **Resolved** | `delivery_zone` gains COD enable, min order, weight cap, priority, active; rate stays native (§3.8.3) |
| DB-F-11 | P2 | **Resolved** | `product_localization` + `translation_review` carry source/status/reviewer/hash/failure (§3.3.1, §3.3.2) |
| DB-F-12 | P2 | **Resolved** | `category_attribute_option` table, typed values, unit/help/sort, attribute-id reference (§3.3.5) |
| DB-F-13 | P2 | **Resolved** | `courier_event` adds event id, consignment id, duration-equivalent timestamps, dedupe hash (§3.6.4) |
| DB-F-14 | P2 | **Resolved** | `webhook_event` adds external event id, payload hash, attempts, processed time, retry state (§3.12.2) |

## 5. Disposition — Relations (`DB-R`)

| ID | Sev | Status | Resolution / section |
|---|---|---|---|
| DB-R-01 | P0 | **Resolved** | `return_review.return_id` unique (1:1) + native return allows many per order; link declared without `isList` and enforced by uniqueness (§3.5.3, §4.2) |
| DB-R-02 | P0 | **Resolved** | Denormalised key + link documented as authoritative with nightly drift check (§4.2, §7.7) |
| DB-R-03 | P0 | **Resolved** | `UNIQUE(category_id, code)` and values reference `category_attribute_id` (§3.3.5) |
| DB-R-04 | P0 | **Resolved** | `product_bd_profile.primary_category_id` resolves multi-category attribute ambiguity (§3.3.3) |
| DB-R-05 | P1 | **Resolved** | E.164 CHECK, phone-keyed risk profile, customer identity separate, raw kept for audit, merge policy defined (§3.4.1, §3.4.2, §5.7) |
| DB-R-06 | P1 | **Resolved** | `courier_consignment` 1:N with `is_active`, `rebooked_from_id`, cancel fields; cached active courier on order (§3.6.3, §3.4.4) |
| DB-R-07 | P1 | **Resolved** | Orders store immutable `landing_page_id` + `ad_campaign_id`; slug no longer referenced (§3.4.4) |
| DB-R-08 | P1 | **Resolved** | `delivery_zone_district` with unique `district_code` replaces JSON coverage (§3.8.3) |
| DB-R-09 | P1 | **Resolved** | Native `user_rbac_role` (verified) + `staff_profile` with unique `user_id`; deactivation policy in §5.7 |
| DB-R-10 | P1 | **Resolved** | `payment_attempt` links to collection/session/payment/order/cart with idempotency + unique gateway id (§3.7.2) |
| DB-R-11 | P2 | **Resolved** | `webhook_event` carries nullable `order_id`, `payment_attempt_id`, `courier_consignment_id` (§3.12.2) |
| DB-R-12 | P2 | **Resolved** | Theme precedence defined (global tokens ← page override) with independent contrast validation (§6.6, §8.11) |

## 6. Disposition — Duplicate data (`DB-D`)

| ID | Sev | Status | Resolution / section |
|---|---|---|---|
| DB-D-01 | P0 | **Resolved** | Native address canonical; order snapshot write-once, refreshed only by audited workflow (§3.4.4) |
| DB-D-02 | P0 | **Resolved** | Risk counters are projections with explicit formula and nightly rebuild (§3.4.2, §7.7) |
| DB-D-03 | P0 | **Resolved** | Native payment/refund state authoritative; `payment_attempt` is evidence only (§3.7.2, decision D-07) |
| DB-D-04 | P1 | **Resolved** | `cogs_total` removed as an editable column; derived from `order_line_snapshot` and exposed by view (§2.3, §4.6) |
| DB-D-05 | P1 | **Resolved** | `customer_paid_delivery_paisa` declared a write-once snapshot of native shipping total (§3.4.4) |
| DB-D-06 | P1 | **Resolved** | UTM stored only on `order_bd_details` (§3.4.4) |
| DB-D-07 | P1 | **Resolved** | `must_change_password` single writer in `auth_identity.app_metadata`; removed from custom table (§2.3, §3.12.3) |
| DB-D-08 | P1 | **Resolved** | Native RBAC authoritative; staff table stores HR data only; one matrix (§6.2) |
| DB-D-09 | P2 | **Resolved** | `customer_risk_profile.display_name` is an explicitly-labelled last-recipient snapshot; precedence documented (§3.4.2) |
| DB-D-10 | P2 | **Resolved** | Actor email/role snapshots retained deliberately for immutability, documented as snapshot (§3.12.1) |
| DB-D-11 | P2 | **Resolved** | `cod_confirmed_by` is convenience state; full attempt history lives in `cod_call_log` (§3.4.4, §3.4.6) |

## 7. Disposition — Indexing (`DB-I`)

| ID | Sev | Status | Resolution / section |
|---|---|---|---|
| DB-I-01 | P0 | **Resolved** | COD/shipment/attribution/settlement composite indexes catalogued (§5.3) |
| DB-I-02 | P0 | **Resolved** | Unique `(courier_code, consignment_external_id)` + tracking unique + active-consignment unique (§5.2, §5.3) |
| DB-I-03 | P1 | **Resolved** | Return queue index, refund unique/index set (§5.2, §5.3) |
| DB-I-04 | P1 | **Resolved** | Unique `(provider_code, gateway_transaction_id)` + poller index (§5.2, §5.3) |
| DB-I-05 | P1 | **Resolved** | `(source, external_event_id)` and payload-hash dedupe + processing queue index (§5.2, §5.4) |
| DB-I-06 | P1 | **Resolved** | Product localization, attribute, brand, attribute-value uniqueness (§5.2) |
| DB-I-07 | P1 | **Resolved** | Audit composite indexes + BRIN + partition plan (§3.12.1, §5.3) |
| DB-I-08 | P2 | **Resolved** | JSONB index policy — no GIN on render-only/money JSON (§5.6) |
| DB-I-09 | P2 | **Resolved** | Landing page publish index; content page publish index (§5.3) |
| DB-I-10 | P2 | **Resolved** | Consignment indexed and unique per active booking (§5.2) |
| DB-I-11 | P2 | **Resolved** | Invoice unique number/order/hash + fiscal-year index (§3.11.2, §5.3) |
| DB-I-12 | P2 | **Resolved** | Soft-delete uniqueness/restore/merge policy (§5.7) |

## 8. Disposition — Medusa-native conflicts (`DB-N`)

| ID | Sev | Status | Resolution / section |
|---|---|---|---|
| DB-N-01 | P0 | **Resolved** | `requires_action` + `order_exception_code = stockout_after_payment`; native enum untouched (§2.5, §3.4.4) |
| DB-N-02 | P0 | **Resolved** | Native `translation` for translatable fields; custom table limited to BN-only editorial + review state (§3.3.1, §3.3.2) |
| DB-N-03 | P0 | **Resolved** | Native `return`/`return_item` + 1:1 `return_review`; native quantities authoritative (§3.5.3, decision D-04) |
| DB-N-04 | P0 | **Resolved** | No custom `shipment_state`; native `fulfillment_status` + consignment/event + read view (§2.3, §4.6) |
| DB-N-05 | P0 | **Resolved** | Explicit money boundary: core major units, custom paisa, one converter, `_bdt` banned, `numeric` not `bigint` (§1.6) |
| DB-N-06 | P0 | **Resolved** | Native payment authoritative; custom gateway audit linked to payment/session (§3.7.2) |
| DB-N-07 | P1 | **Resolved** | `cod_expires_at` + cron release because reservation has no TTL; manual lines handled (§3.4.4, §8.4) |
| DB-N-08 | P1 | **Resolved** | `inventory_level` documented as stock location; three stock locations seeded (§1.7, §3.13, §8.4) |
| DB-N-09 | P1 | **Resolved** | Native `rbac_*` + `user_rbac_role` verified and used; custom flags removed (§3.12.3, §6.2) |
| DB-N-10 | P1 | **Resolved** | Native `tax_region`/`tax_rate` compute VAT; `vat_settings` display only; snapshots (§3.8.4, §8.8) |
| DB-N-11 | P1 | **Resolved** | Primary category + attribute scoping (§3.3.3, §3.3.5) |
| DB-N-12 | P1 | **Resolved** | Config tables for couriers, providers, zones; enums only for closed lifecycles (§2.5) |
| DB-N-13 | P2 | **Resolved by deferral** | `store_credit` is not an accepted refund method until a credit ledger exists; documented as O-13 (§8.7, §10) |

## 9. Disposition — Security/privacy (`DB-S`)

| ID | Sev | Status | Resolution / section |
|---|---|---|---|
| DB-S-01 | P0 | **Resolved** | Trigger + `CHECK(deleted_at IS NULL)` + grants + hash chain + verification job + negative tests (§6.5, §9.5) |
| DB-S-02 | P0 | **Resolved** | Header allowlist, field-level payload redaction, SHA-256, retention (§6.8, §3.12.2) |
| DB-S-03 | P0 | **Resolved** | Refund accounts envelope-encrypted, last-4 display, reveal audited (§6.3, §3.7.3) |
| DB-S-04 | P0 | **Resolved** | No credentials in DB; `secret_ref` + `key_version` only (§6.4, §3.6.1, §3.7.1) |
| DB-S-05 | P0 | **Resolved** | Single Meta Pixel in `operational_settings`, unique index, validator rejects per-page pixels (§6.10, §3.9.1) |
| DB-S-06 | P1 | **Resolved** | JSON schema per block type, HTML allowlist, contrast validation, URL restrictions (§6.6) |
| DB-S-07 | P1 | **Resolved** | E.164 CHECK, masked outputs, lookup requires phone + order ref, rate limiting (§3.4.1, §6.9, §8.13) |
| DB-S-08 | P1 | **Resolved** | Entity-aware audit redaction + role-based visibility + `view_sensitive` audit (§6.9, §3.12.1) |
| DB-S-09 | P1 | **Resolved** | Retention matrix + purge/anonymise jobs + legal-hold rule (§6.7) |
| DB-S-10 | P2 | **Resolved** | Length limits, split staff/customer notes, export masking (§3.4.4, §3.4.2, §6.9) |
| DB-S-11 | P2 | **Resolved** | `created_by`/`updated_by` on content, campaign, settings, template tables (§3.8–§3.11) |

## 10. Disposition — Bangladesh rules (`DB-B`)

| ID | Sev | Status | Resolution / section |
|---|---|---|---|
| DB-B-01 | P0 | **Resolved** | Division/district/thana master with stable codes, BBS codes, bilingual names, postal codes (§3.8.2, §8.1) |
| DB-B-02 | P0 | **Resolved** | `courier_area_map` (city/zone/area ids) + alias table + fallback order (§8.2) |
| DB-B-03 | P0 | **Resolved** | `cod_collectable_paisa` write-once snapshot + mismatch blocks booking (§3.4.4, §8.4) |
| DB-B-04 | P0 | **Resolved** | Per-line courier quantities + native delivered/return quantities + COD money allocation (§3.4.7, §8.5) |
| DB-B-05 | P0 | **Resolved** | Remittance batch + lines + variance/dispute lifecycle (§3.6.5, §8.6) |
| DB-B-06 | P1 | **Resolved** | Payment fee, packaging, RTO, COD handling, other cost fields (§3.4.4) |
| DB-B-07 | P1 | **Resolved** | Versioned return policy + scope + activation rules (§3.5.1, §3.5.2) |
| DB-B-08 | P1 | **Resolved** | Return shipping payer + cost on policy and on the review snapshot (§3.5.1, §3.5.3) |
| DB-B-09 | P1 | **Resolved** | VAT effective config + order/invoice snapshots, registration status (§3.8.4, §8.8) |
| DB-B-10 | P1 | **Resolved** | Campaign/offer windows server-validated; expired offers cannot check out (§3.9.1, §3.9.3, §8.11) |
| DB-B-11 | P1 | **Resolved** | E.164 normalisation + CHECK on all phone columns (§3.4.1, §3.4.3, §8.13) |
| DB-B-12 | P1 | **Resolved** | Courier alias table + canonical codes for spelling variants (§3.6.2, §8.2) |
| DB-B-13 | P1 | **Resolved** | `order_source`, `source_reference`, `created_by` (§3.4.4) |
| DB-B-14 | P1 | **Resolved** | Attempt counter, last-attempt time, event history (§3.4.4, §3.6.4) |
| DB-B-15 | P2 | **Resolved** | SMS opt-out/in flags with source and timestamps (§3.4.1, §8.10) |
| DB-B-16 | P2 | **Resolved** | Bilingual names on geo, zone, attribute, template data (§3.8.2, §3.3.5, §8.12) |

---

## 11. Intentionally deferred findings

| Finding | What is deferred | Why | What exists now | Revisit trigger |
|---|---|---|---|---|
| **DB-M-18** — order tracking attempt persistence | No `order_tracking_attempt` table | Persisting IP + order reference for every lookup is a privacy liability; Phase 1 needs rate limiting, not retention. Auth lockouts and suspicious events are already in `audit_log`. | Redis `ratelimit:track:{ip}` + `audit_log` for security events; decision recorded as **O-07** | Owner asks for abuse-forensics evidence, or a dispute requires lookup history |
| **DB-N-13** — store-credit refund method | No credit/gift-card ledger; `store_credit` rejected as a `refund_ledger.method_code` | No PRD Phase-1 requirement; a half-built ledger creates unbacked liability. Refund methods are config-driven, so enabling later is data + one table, not a redesign. | `refund_ledger.method_code` validated against `payment_provider_config` + `bank`; decision recorded as **O-13** | Owner offers store credit as a refund option |

No other finding is deferred. No finding was rejected.

---

## 12. Remaining owner decisions

These are business values, not schema gaps. The schema supports each option; the default is the least-committal behaviour.

| ID | Decision | Default until answered | Blocks |
|---|---|---|---|
| O-01 | Return window, conditions, non-returnable categories, who pays return shipping, refund methods | No active policy; returns blocked with "not yet configured" | Return launch |
| O-02 | VAT registration status, rate, inclusive/exclusive, legal invoice fields | Disabled + unverified | Invoice/VAT launch |
| O-03 | COD expiry hours; whether trusted customers skip confirmation | 48h, always confirm | COD launch |
| O-04 | Shared phone numbers vs one phone per customer | Shared allowed; risk per phone | Customer accounts |
| O-05 | Retention/legal hold periods | webhook 90d, SMS 180d, risk 24m, audit/financial 6y | Compliance |
| O-06 | Encryption scope + KMS ownership | Refund accounts only | Security sign-off |
| O-07 | Persist tracking lookups? | Redis only | Security review |
| O-08 | Meta Pixel ID, consent mode, CAPI token custody, event list | Pixel null, CAPI disabled | Marketing launch |
| O-09 | Invoice fiscal year, numbering format, mandatory legal fields | July–June, `INV-{FY}-{serial}` | Invoice launch |
| O-10 | Refund methods, restocking fee, store credit | bKash/Nagad/bank only | Refund launch |
| O-11 | Primary courier, rates, COD fee, remittance cadence | Manual courier only | Courier launch |
| O-12 | Role→policy matrix + refund four-eyes threshold | Proposed matrix §6.2; four-eyes above ৳5,000 | Admin launch |
| O-13 | Store-credit ledger in Phase 1? | Deferred | Refund methods |
| O-14 | Warehouse/quarantine topology | 3 stock locations as seeded | Inventory launch |
| O-15 | Data residency, backup retention, restore drills | Current region; owner sign-off | Compliance |

---

## 13. Evidence index

| Claim | Evidence path |
|---|---|
| No prior `database.md` | `find . -name "database*.md"`, `git log --all -- database.md docs/database.md`, `git ls-files` (all empty) |
| Draft is untracked and newer than architecture/DFD | `stat docs/data-models.md` (11:59) vs `docs/architecture.md` (11:12), `docs/dfd.md` (11:36) |
| Three-schema drift | `docs/data-models.md` §2 vs `docs/architecture.md` §12.1 vs `docs/dfd.md` §1.2 |
| Invalid order status | `docs/dfd.md` §4.1 Scenario B; `node_modules/@medusajs/utils/dist/order/status.d.ts` |
| Native return/quantity fields | `node_modules/@medusajs/order/dist/models/return.js`, `return-item.js`, `order-item.js` |
| Native fulfilment/geo/service zone | `node_modules/@medusajs/fulfillment/dist/models/{fulfillment,geo-zone,service-zone,shipping-option}.js` |
| Native payment/refund/idempotency | `node_modules/@medusajs/payment/dist/models/{payment,refund,capture}.js` |
| Native RBAC + user link | `node_modules/@medusajs/rbac/dist/models/*`, `node_modules/@medusajs/link-modules/dist/definitions/user-rbac-role.js` |
| Native translation shape | `node_modules/@medusajs/translation/dist/models/translation.js` |
| Native tax | `node_modules/@medusajs/tax/dist/models/{tax-region,tax-rate}.js` |
| Native promotion campaign | `node_modules/@medusajs/promotion/dist/models/campaign.js` |
| Native notification + idempotency | `node_modules/@medusajs/notification/dist/models/notification.js` |
| `bigNumber` = numeric + raw JSONB | `node_modules/@medusajs/utils/dist/dml/entity-builder.js:163`, `dist/dal/mikro-orm/big-number-field.js` |
| `model.number()` = integer | `node_modules/@medusajs/order/dist/migrations/Migration20240219102530.js` (`"version" integer`) |
| `model.enum()` = text + CHECK | scaffold migrations `apps/medusa/src/modules/bd-audit/migrations/*.js` |
| DML index is partial on `deleted_at` | `node_modules/@medusajs/*/dist/models/*.js` (`where: "deleted_at IS NULL"`) |
| Reservation has no TTL | `node_modules/@medusajs/types/dist/inventory/common/reservation-item.d.ts` |
| Customer phone not unique/indexed | `node_modules/@medusajs/customer/dist/models/customer.js` |
| Order totals live in `order_summary.totals` | `node_modules/@medusajs/order/dist/models/order-summary.js` |
| Current scaffold modules/tables | `apps/medusa/src/modules/*/models/*.ts`, `.../migrations/*.ts`, `apps/medusa/src/links/*.ts`, `apps/medusa/medusa-config.ts` |
| PRD rules | `prd.md` FR-5.3.1, FR-6.4.1, FR-6.6.2, FR-6.7.x, FR-11.4, FR-11.7.3, FR-12.3, FR-14.9 |
| DFD rules/flows | `docs/dfd.md` §1.2, §4.1–4.4, §6 |
| Architecture rules | `docs/architecture.md` §7.1, §9.4, §12 |

---

## 14. Schema-level changes at a glance

| Change | Count / detail |
|---|---|
| Custom tables defined | **51** across 10 modules |
| Tables removed from the draft/replaced | 19 entries in `database.md` §2.3 |
| Native tables explicitly protected from duplication | 88 named across 37 rows in §2.1 |
| Unique constraints catalogued | 69 in §5.2 |
| Composite/operational indexes catalogued | 30 in §5.3 |
| Dedupe/idempotency keys catalogued | 16 in §5.4 |
| Derived read-only views | 5 in §4.6 |
| Retention rules | 17 classes in §6.7 |
| Decision log entries | 22 (`D-01`…`D-22`) |
| Open owner decisions | 15 (`O-01`…`O-15`) |

---

## 15. No-code / no-migration / no-data attestation

I confirm:

1. **No application code was created or modified by this reconciliation task.** No file under `apps/web` or `apps/medusa/src` (models, services, routes, workflows, links, jobs, scripts) was written or edited. The newest source files under `apps/medusa` carry mtimes of 12:03–12:06 (pre-existing scaffold/build from the earlier setup work), whereas the documentation work in this task started at 12:17.
2. **No migration was created, edited or run.** `apps/medusa/src/modules/*/migrations/*.ts` are unchanged since the scaffold was generated; `medusa db:migrate` was not executed.
3. **No database data was read, written, migrated or seeded.** No SQL was executed against any database.
4. **Only documentation files were written by this task:** `database.md` (new), `docs/database-fix-report.md` (new), a supersession banner prepended to `docs/data-models.md`, and `docs/database-review.md` (written earlier in the same documentation task).
5. `docs/architecture.md`, `docs/dfd.md`, `prd.md`, `docs/architecture-decision-medusa-v2.md`, `docs/architecture-review.md`, `docs/dfd-review.md`, `dfd.md` and `dfd-review.md` are unchanged by this task.
6. **Pre-existing working-tree changes are not mine.** `git status` also lists `.env.example`, `.gitignore`, `package.json`, `package-lock.json`, `prd.md` and `quality-checklist.md` as modified, plus the whole `apps/` scaffold as untracked; their mtimes (10:31–12:06) all precede this task's first write (12:17).

Verification commands to reproduce:

```bash
# files written by this task (all documentation)
find . -maxdepth 2 -name "*.md" -newermt "2026-10-24 12:15:00" -not -path "./node_modules/*"

# application source is older than the documentation work
find apps -name "*.ts" -newermt "2026-10-24 12:15:00" -not -path "*/.medusa/*"   # empty

# pre-existing working-tree state (predates this task)
git status --short
```

---

## 16. Recommended next steps

1. Owner answers **O-01, O-02, O-03, O-05, O-11, O-12** — these gate Phase 0/COD/courier/returns launch.
2. Update `docs/architecture.md` §12 and `docs/dfd.md` §1.2 to the canonical names (`database.md` §9.6) in a separate docs task.
3. Implement Phase 0 migrations exactly as ordered in `database.md` §9.2, with the §9.5 verification checklist after each phase.
4. Wire the CI negative tests for audit immutability, invoice immutability, PII masking, COGS access, and idempotency uniqueness before the first production migration.
5. Add the money-boundary unit tests (`toPaisa`/`toMajor`) with real bKash/Nagad/Pathao payload fixtures before any pricing work resumes.

*End of fix report.*
