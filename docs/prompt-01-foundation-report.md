# Prompt 01 Completion Report — Medusa v2 Foundation

Date: 2026-10-24 · Status: **COMPLETE** · Scope: `apps/medusa` + `.env.example` + this report

Prompt 01 hardens the existing Medusa v2.22.0 backend as the single commerce
engine, aligns the custom modules with canonical `database.md`, and seeds the
Bangladesh foundation. No storefront work was started (per SCOPE).

---

## 1. DONE WHEN — evidence

| Check | Result | Evidence |
|---|---|---|
| `GET http://localhost:9000/health` → 200 OK | PASS | `curl http://localhost:9000/health` → `OK / HTTP 200`; server boot log: `✔ Server is ready on port: 9000 – 1880ms` |
| `npm run medusa:migrate` exits 0 | PASS | `EXIT_CODE=0` (migrations applied, link sync clean, migration scripts executed) |
| Canonical Phase 0 tables exist; `delivery_zone_config` / `vat_config` / `staff_role_permission` gone | PASS | 7 canonical tables present (`operational_settings`, `geo_division`, `geo_district`, `geo_thana`, `delivery_zone`, `delivery_zone_district`, `vat_settings`, plus bd-audit's `audit_log`, `webhook_event`, `staff_profile`); superseded tables count = 0 |
| Region currency_code = bdt; no other store currencies | PASS | `region.currency_code = 'bdt'` with `region_country = [bd]`; `store_currency` = exactly `bdt (default)` |
| money.ts tests pass for ৳2500.00 ↔ 250000 paisa | PASS | 5/5 tests, incl. `toPaisa(2500) === 250000`, `toPaisa("2500.00") === 250000`, `toMajor(250000) === 2500` |
| Prisma tables still present | PASS | `categories`, `order_items`, `orders`, `products`, `users` all exist (0 rows, untouched) |
| CHK-OPS-01 (env/secrets template) | PASS | `.env.example` rewritten: no real secrets, commented placeholders only; `.env` gitignored |
| CHK-OPS-02 (migrate on clean schema path) | PASS | `db:migrate` + `db:sync-links` exit 0; trigger DDL lives inside the bd-audit migration so a fresh DB gets it too |

Store API runtime check (publishable key): `/store/regions` → 1 region
`Bangladesh / bdt` with country `bd`.

## 2. What changed

### 2.1 Money library — `apps/medusa/src/lib/money.ts`
- `toPaisa(major)` / `toMajor(paisa)` on `bignumber.js` (ROUND_HALF_UP).
- Note: Medusa's own `BigNumber` (framework/utils) is a value holder with **no
  arithmetic** — it must never be used for math. `bignumber.js@9.3.1` added as
  an explicit dependency.
- Tests: `src/lib/__tests__/money.unit.spec.ts` — `TEST_TYPE=unit npx jest src/lib/__tests__/money.unit.spec.ts` → 5/5.

### 2.2 Custom modules reshaped to canonical database.md
- **bd-settings**: `operational_settings` (singleton `global`), `geo_division`,
  `geo_district`, `geo_thana`, `delivery_zone`, `delivery_zone_district`,
  `vat_settings`. Rates moved to native `shipping_option` / `tax_rate` — the
  custom tables only carry the mirror ids (`shipping_option_id`,
  `service_zone_id`) and BD-only flags (cod_enabled, fees in paisa, SLA).
- **bd-audit**: `audit_log` (append-only — `trg_audit_log_immutable` rejects
  UPDATE/DELETE, `trg_audit_log_chain` links `prev_entry_id` hashes),
  `webhook_event`, `staff_profile`. `staff_role_permission` removed.
- Orphan draft links deleted (tables dropped by `db:sync-links --execute-all`):
  `order_bd_details`, `order_return_request`, `product_localization`,
  `product_variant_cost`; stale compiled link output removed with a full
  `medusa build`.

### 2.3 medusa-config.ts
- Only `bd-settings` + `bd-audit` registered; comment documents native-module
  defaults and the RBAC deferral.
- `admin.disable: true` — see deviations.

### 2.4 Foundation seed — `src/scripts/seed/seed-foundation.ts` (idempotent)
Run: `npm run seed:foundation`. Verified by two consecutive runs with zero
duplicates.

| Area | Result |
|---|---|
| Currency | `bdt` symbol → `৳` (display fix; currency module is read-only) |
| Region | reshaped to Bangladesh / bdt / [bd] |
| Store | BDT-only (default), locales en + bn, default region set |
| Sales channels | Default (storefront) + Manual (staff orders) |
| Stock locations | `loc_central_warehouse`, `loc_damaged_quarantine`, `loc_courier_return_desk`, linked to `manual_manual` + both channels |
| Fulfillment | `fs_bd_delivery` — 3 service zones, 64 province geo zones (one per district) |
| Shipping options | flat BDT ৳60 inside / ৳100 suburbs / ৳130 outside, rules enabled_in_store + is_return=false |
| Tax | `tp_system` tax region for BD; 7 Europe demo rows removed |
| Geo master | 8 divisions / 64 districts / 495 thanas (vendored in `src/scripts/seed/geo-data.ts`) |
| Delivery zones | 3 zones with mirror ids; 64 district mappings, each district exactly once (dup check = 0) |
| VAT | disabled, `unverified`, prices exclude VAT (PRD FR-11.4 default) |
| Operational settings | singleton `global` |
| Demo cleanup | European Warehouse + its fulfillment set removed; orphan link/inventory rows cleaned |

### 2.5 Environment documentation — `.env.example`
Rewritten with plaintext placeholders only (ports, CORS, Postgres, Redis,
Meilisearch, JWT/COOKIE secrets, optional MFA key). Removed SSLCommerz/bKash/
NextAuth/Prisma DIRECT_URL. S3 and Nagad kept as commented placeholders
(private key via file path — never in env).

### 2.6 Geo dataset
`src/scripts/seed/geo-data.ts` (5.5k lines) generated from the Open Admin Data
Bangladesh dataset (CC-BY-4.0,
github.com/open-admin-data/bangladesh-administrative-divisions). Generator and
source JSONs kept in `.geo-tmp/` for reproducibility. Canonical codes follow
database.md §3.8 (`BD-DHK`, `BD-DHK-GAZ`, `BD-DHK-GAZ-KAL`).

## 3. Documented deviations

1. **RBAC deferred (database.md §9.2 step 5).** The native `rbac` module is a
   licensed Medusa feature — booting it without `MEDUSA_LICENSE_KEY` throws
   `LICENSE_CHECK_ERROR`, and the check has no local bypass. Roles/policies are
   prepared in `src/scripts/seed/seed-rbac.ts` (run: `npm run seed:rbac` on a
   licensed env) and will be applied when a license exists.
2. **Admin dashboard disabled.** `medusa build` does not produce an admin
   bundle in this workspace, and `medusa start` aborts without it. Prompt 02
   ("Medusa Admin setup") is the designated place to re-enable it — the
   `admin-sdk`/`dashboard` deps are already installed.
3. **Delivery zone mapping at district granularity** (placeholder rule,
   admin-editable): inside = Dhaka district only; suburbs = Gazipur,
   Narayanganj, Manikganj, Munshiganj, Narsingdi; outside = remaining 58.
4. **Currency decimal digits kept at 2** (standard BDT), only the symbol was
   changed to `৳`.
5. **`bbs_code` mirrors the source dataset ids** (used for reconciliation, not
   as canonical codes).
6. **Demo products/inventory left for Phase 1** — only the European warehouse,
   its fulfillment set, tax regions, and dangling link/inventory rows were
   removed. The catalog prompt rebuilds products.
7. **Shipping rates 60/100/130 are owner-configurable placeholders** per
   database.md (no invented policy values).

## 4. Commands & scripts

```bash
cd apps/medusa
npm run medusa:migrate   # = medusa db:migrate (+ link sync) → exits 0
npm run seed:foundation  # idempotent foundation seed
npm run seed:rbac        # opt-in, requires MEDUSA_LICENSE_KEY
npm run test:unit        # includes money.ts tests (5/5)
npx medusa start --port 9000   # boots; GET /health → 200
```

## 5. Follow-ups for later prompts

- Prompt 02: re-enable admin (`disable: false`) and produce the admin bundle.
- Licensed env: run `seed:rbac` and register `@medusajs/rbac` in modules.
- Phase 1 catalog: rebuild products/inventory on the new locations; register
  the Meilisearch plugin and S3 file provider (env placeholders already
  documented).
