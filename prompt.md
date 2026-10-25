# Execution Prompt Plan — Bangladesh Single-Vendor E-commerce Platform

**Document:** `prompt.md`  
**Audience:** Antigravity / Cursor execution agents  
**Status:** Authoritative implementation sequence for Phase 1  
**Date:** 2026-10-24  
**Mode:** Backend-first, one prompt at a time, feature-by-feature  

**Governing documents (read before every prompt):**
- [`prd.md`](prd.md) — business requirements and acceptance criteria
- [`docs/architecture.md`](docs/architecture.md) — runtime topology, modules, workflows
- [`dfd.md`](dfd.md) / [`docs/dfd.md`](docs/dfd.md) — data flows (identical copies)
- [`database.md`](database.md) — **canonical** tables, money rules, constraints (supersedes `docs/data-models.md`)
- [`quality-checklist.md`](quality-checklist.md) — P0/P1 verification checks
- [`final-system-validation.md`](final-system-validation.md) — resolved conflicts and owner gates
- [`agent.md`](agent.md) — standing rules for every agent

**Do not treat as schema source of truth:** `docs/data-models.md` (superseded), old scaffold models under `apps/medusa/src/modules/` that still use draft names (`order_return_request`, `staff_role_permission`, `vat_config`, `delivery_zone_config`, `payment_transaction`, `payment_webhook_log`, `courier_webhook_log`, `courier_shipment_log`).

---

## How to execute this plan

1. Run **exactly one numbered prompt** per session unless the user explicitly chains the next number.
2. Complete the prompt’s **Done when** checklist with evidence (commands, HTTP status, DB queries). Do not mark done on assumption.
3. If a previous prompt is incomplete, finish or repair it first. Do not invent a parallel implementation.
4. If an item is **[Open]** in `prd.md` §19 / owner decisions O-01–O-15, implement **structure + recommended baseline**, never invent a business value. Surface “not yet configured” in Admin.
5. After each prompt, leave the repo buildable: `npm run build:medusa` (and `npm run build:web` once storefront work has started) must still succeed.
6. Never commit secrets. Never drop Docker volumes. Never `DROP` Prisma tables (`categories`, `order_items`, `orders`, `products`, `users`) that share the same PostgreSQL database.

### Authority order (when documents disagree)

1. Installed Medusa v2.22.0 behaviour in `node_modules/@medusajs/*`
2. `database.md` for persistence
3. `prd.md` for requirements
4. `dfd.md` for flows
5. `docs/architecture.md` for module ownership and topology
6. This file for **sequence and execution scope**

### Global constraints (every prompt)

- **Single-vendor only.** No marketplace, vendor dashboards, commissions, or split payouts.
- **Medusa-first.** Use native Product, Pricing, Inventory, Cart, Order, Payment, Fulfillment, Translation, Tax, RBAC, Notification. Bangladesh facts live in custom modules + module links. Never fork core tables.
- **Money.** Native Medusa amounts = BDT **major units**. Custom BD columns = integer **paisa** (`*_paisa`). Conversion only via `apps/medusa/src/lib/money.ts`. Suffix `_bdt` is banned on paisa columns.
- **4 independent status dimensions.** Native `order.status`, native payment status, shipment via native fulfillment + `courier_consignment`/`v_order_shipment_state`, return review via native `return` + `return_review`. Never collapse into one field.
- **No automatic return/refund.** No automatic restock of RTO/damaged goods.
- **Zero-orphan online payments.** Do not create a Medusa Order before verified bKash/Nagad capture. Cart must survive cancel/fail.
- **Zero-trust callbacks.** Never trust redirect query params or webhook bodies for payment success.
- **Unified cart.** Add to Cart, Buy Now, and campaign Mode B share one cart. Never silently clear it.
- **Phase 1 payments:** COD + direct bKash + direct Nagad. No cards, no SSLCommerz, no Shurjopay, no Foster.
- **Phase 1 tracking:** client-side Meta Pixel only. Meta CAPI is Phase 2.
- **Tailwind CSS 3.4.x locked** on the storefront. Do not upgrade to v4.
- **Default storefront locale:** English, with a visible Bangla switch (`prd.md` FR-10.2.1).
- **TypeScript strict.** No `any`. No secrets in logs.

### Current repo state (inspect, do not assume greenfield)

`apps/medusa` already exists at `@medusajs/medusa@2.22.0` with Docker PostgreSQL 16, Redis 7, Meilisearch 1.11. Some BD modules were scaffolded against the **superseded** draft schema. Prompt 01’s job is to **align that scaffold to `database.md`**, not to create a second Medusa app.

---

## Prompt 01 — Medusa v2 foundation setup

```
PROMPT 01 — Medusa v2 foundation setup
You are an implementation agent for bd-commerce-platform.

READ FIRST (mandatory):
- agent.md (all standing rules)
- prd.md §1–2, §11, §12, §18–19
- docs/architecture.md §1–5, §18, §21
- database.md §1, §2, §9.2 Phase 0
- final-system-validation.md §2–4
- apps/medusa/medusa-config.ts, apps/medusa/package.json, .env.example, docker-compose.yml

GOAL:
Harden the existing Medusa v2.22.0 backend as the single commerce engine. Align custom modules with canonical database.md. Do not start storefront feature work in this prompt.

SCOPE (do):
1. Inspect current apps/medusa. Confirm @medusajs/medusa 2.22.0, embedded admin enabled, PostgreSQL + Redis wired, /health returns 200.
2. Confirm docker compose services postgres, redis, meilisearch stay up. Do not recreate volumes.
3. Update medusa-config.ts:
   - Enable/confirm native modules needed: product, pricing, inventory, cart, order, customer, auth, user, fulfillment, payment, tax, translation, rbac, notification, file, promotion.
   - Register custom modules only as they exist after reshape: bd-settings, bd-audit first; keep others registered only if their DML matches database.md.
4. Create apps/medusa/src/lib/money.ts with toPaisa / toMajor (ROUND_HALF_UP) and unit tests.
5. Reshape bd-settings to canonical tables (database.md §3.8, §9.2 steps 2–3):
   operational_settings, geo_division, geo_district, geo_thana, delivery_zone, delivery_zone_district, vat_settings.
   Move rates out of custom tables: shipping rates → native shipping_option + price set; VAT rate → native tax_rate. vat_settings holds registration/display only.
6. Reshape bd-audit to canonical tables (database.md §3.12, §6.5):
   audit_log (append-only trigger + grants; no UPDATE/DELETE), webhook_event, staff_profile.
   Remove staff_role_permission (RBAC is native).
7. Seed:
   - Region BD, currency BDT only, one sales channel, one store.
   - Stock locations: loc_central, loc_damaged_quarantine, loc_courier_return_desk (O-14).
   - Geo master: 8 divisions, 64 districts, thanas (scripts under apps/medusa/src/scripts/seed/geo/).
   - Delivery zones: inside_dhaka, dhaka_suburbs, outside_dhaka with native shipping options. Default display rates ৳60 / ৳100 / ৳130 are recommended placeholders, admin-editable, never hardcoded in checkout logic.
   - VAT disabled, unverified, 0% until owner sign-off (O-02).
8. Document env vars in .env.example only (no real secrets): DATABASE_URL, REDIS_URL, JWT_SECRET, COOKIE_SECRET, STORE_CORS, ADMIN_CORS, AUTH_CORS, MEDUSA_BACKEND_URL, MEILISEARCH_*, S3_*, NAGAD_PRIVATE_KEY_PATH.
9. Ensure Prisma tables in the same database are untouched.
10. Write a short completion note in docs/prompt-01-foundation-report.md with commands and evidence.

SCOPE (do not):
- Do not build storefront pages, payment providers, courier adapters, or admin custom routes beyond what is required to boot.
- Do not invent Open policy values (return window, courier choice, VAT rate).
- Do not store secrets in PostgreSQL; secret_ref + key_version only.
- Do not introduce SSLCommerz, card payments, or a second cart service.
- Do not ALTER Medusa core tables except performance indexes listed in database.md §5.

DONE WHEN:
- GET http://localhost:9000/health → 200 OK
- npm run medusa:migrate exits 0
- Canonical Phase 0 tables exist; superseded names delivery_zone_config / vat_config / staff_role_permission are gone or migrated
- Region currency_code = bdt; no other store currencies
- money.ts tests pass for ৳2500.00 ↔ 250000 paisa
- Prisma tables still present
- Quality checks conceptually covered: CHK-OPS-01 (env/secrets template), CHK-OPS-02 (migrate on clean schema path)

HANDOFF:
Prompt 02 consumes a booting Medusa + Admin at /app, BDT region, geo seed, audit_log, operational_settings.
```

---

## Prompt 02 — Medusa Admin setup

```
PROMPT 02 — Medusa Admin setup
You are an implementation agent for bd-commerce-platform.

READ FIRST:
- agent.md
- prd.md §8, §12
- docs/architecture.md §6, §15
- quality-checklist.md CHK-ADM-01 to CHK-ADM-04, CHK-SEC-01 (UI hide is not enough)
- technical-plan.md §6 (sidebar grouping) if present

PREREQUISITE: Prompt 01 complete (backend boots, /app serves).

GOAL:
Make embedded Medusa Admin (/app) the only staff UI. Native @medusajs/ui look. Bangladesh operations appear as custom routes and widgets, even if some routes are placeholders until later prompts.

SCOPE (do):
1. Confirm Admin SPA at http://localhost:9000/app with Inter, light/dark, official tokens. No custom CSS framework replacing @medusajs/ui.
2. Sidebar groups matching architecture.md §15.1:
   COMMERCE: Orders, Products, Categories, Inventory, Customers, Promotions
   BANGLADESH OPERATIONS: COD Queue, Manual Order, Courier Manifest, Returns
   MARKETING & CONTENT: Landing Pages, Homepage, Policy Pages
   FINANCE & REPORTS: Contribution Profit, COD Settlement, Audit Logs
   SETTINGS: Bangladesh, VAT, SMS, Gateways, Invoices, Team
3. Create custom admin route shells (can be empty states with copy “Implemented in Prompt N”) so navigation never 404s:
   /app/cod-queue, /app/manual-order, /app/courier-manifest, /app/returns,
   /app/landing-pages, /app/content/homepage, /app/content/pages,
   /app/reports/profit, /app/reports/cod-settlement, /app/audit-logs,
   /app/settings/bangladesh, /app/settings/vat, /app/settings/sms,
   /app/settings/gateways, /app/settings/invoices, /app/settings/team
4. Implement settings/bangladesh + settings/vat against bd-settings (zone rates via native shipping option prices, VAT display flags). Mask secret_ref fields.
5. Implement /app/audit-logs (Owner/Finance only) reading audit_log. Read-only.
6. Widget injection points only (architecture.md §15.2):
   order.details.side.before, order.details.after, product.details.after
   Do NOT invent orders.list.table.row widgets — Medusa v2 has no such zone. Fast COD actions belong on /app/cod-queue.
7. Loading skeletons, empty states, unsaved-changes Prompt from @medusajs/ui.
8. Create initial owner user via medusa user if missing. Do not print the password in reports.

SCOPE (do not):
- Do not build a separate Next.js admin app.
- Do not implement full COD/courier/return business logic (later prompts). Routes may be shells.
- Do not show COGS on product UI yet except a hidden placeholder gated “Owner/Finance only” if you touch the widget.
- Do not store plaintext passwords or show them after create.

DONE WHEN:
- CHK-ADM-01: sidebar groups exist, no 404s, collapse works
- CHK-ADM-03: @medusajs/ui tokens, theme toggle
- CHK-ADM-04: skeleton + empty + unsaved guard on at least one custom form
- /app/settings/bangladesh saves Inside Dhaka / Suburbs / Outside Dhaka rates into native prices
- Direct /admin/audit-logs without Owner/Finance JWT → 403

HANDOFF:
Prompt 03 uses Admin product/category screens plus product.details.after widget slot.
```

---

## Prompt 03 — Product and category foundation

```
PROMPT 03 — Product and category foundation
You are an implementation agent for bd-commerce-platform.

READ FIRST:
- agent.md
- prd.md §3, §10.3
- docs/architecture.md §4.1, §4.2 bd-catalog
- database.md §2.1 catalog tables, §3.3, §8.12, §9.2 Phase 1
- quality-checklist.md CHK-CAT-01, CHK-CAT-02, CHK-CAT-05

PREREQUISITE: Prompts 01–02.

GOAL:
Native Medusa product/category/variant pipeline is the catalog source of truth. Enforce ≤3 option types. Bilingual catalog via native translation. Upload validation.

SCOPE (do):
1. Use native product, product_variant, product_option (max 3 types — UI + API reject a 4th), product_category, product_image, product_tag, product_collection.
2. Unique SKU per variant within a product (AC-3.2). Deactivating a variant must not delete historical order line snapshots (later orders prompt will snapshot; for now do not hard-delete variants that have been sold — prefer unpublish).
3. Brand is product-level (database.md brand + product_brand), not a variant option.
4. Native translation for product title/subtitle/description/material and category name/description (locale bn). translation_review governance: draft → reviewed → published; failed translations flagged; never auto-publish machine drafts.
5. product_localization only for BN-only editorial (care, origin, excerpt, SEO meta, BN handle) — NOT a duplicate of title/description.
6. Admin product create/edit:
   - English core fields (native)
   - Bangla fields via translation UI + localization extras
   - Media: JPG/PNG/WebP, max 5MB, reject exe/php/svg-with-script; drag-reorder; primary thumbnail
7. Categories: hierarchy, handle, bilingual names, assignment of products to one or more categories.
8. Publish rules: a product cannot be marked “complete” with missing required EN title or with failed required translation for checkout-critical content. Warn on missing BN (AC-10.2).
9. Seed a small catalog in a script (not production data): e.g. Panjabi with Size+Color, grocery pack-size example, footwear example — used by later storefront prompts.

SCOPE (do not):
- Do not store prices as paisa in native price.amount.
- Do not put COGS on the public product payload.
- Do not build Meilisearch sync yet (Prompt 15) beyond leaving product.created/updated events unblocked.
- Do not implement category attribute values yet (Prompt 04).

DONE WHEN:
- CHK-CAT-01: EN+BN product persists; BN in translation (+ localization extras)
- CHK-CAT-02: 4th option type blocked in Admin and API
- CHK-CAT-05: invalid uploads rejected; reorder persists
- Unpublished/deleted products do not appear in /store/products
- SKU uniqueness enforced

HANDOFF:
Prompt 04 adds category attributes, product_bd_profile, variant costs.
```

---

## Prompt 04 — Bangladesh custom product data

```
PROMPT 04 — Bangladesh custom product data
You are an implementation agent for bd-commerce-platform.

READ FIRST:
- agent.md
- prd.md §3.1, FR-3.1.1–3.1.3, AC-3.3
- database.md §3.3 remaining tables, §8.12
- quality-checklist.md CHK-CAT-04, CHK-CAT-07
- docs/architecture.md widgets: bangla-fields, category-attrs, cost-margin

PREREQUISITE: Prompt 03.

GOAL:
Complete bd-catalog so category-specific attributes, returnability profile, and COGS exist without forking Product.

SCOPE (do):
1. DML + migrations for remaining catalog tables if not already canonical:
   product_bd_profile, category_attribute, category_attribute_option, product_attribute_value, product_variant_cost.
2. Category attributes: typed (text, number, enum, boolean). Options bilingual. Required/optional per category. Grocery must not show Size S/M/L unless that category defines it (AC-3.3).
3. Admin: assigning a product to a category refreshes the attribute form. Persist product_attribute_value.
4. product_bd_profile: primary category, is_returnable, warranty/origin notes. Hard false on is_returnable wins over policy later.
5. product_variant_cost: effective-dated COGS + packaging/supplier cost in paisa. Owner/Finance only. Never in store /store/products JSON. Never in logs.
6. product.details.after widgets: Bangla editorial, category attributes, BDT-facing cost (role-gated).
7. Store API extension GET /store/products/:id/localization returns BN editorial + attributes safe for PDP (no COGS).
8. Admin APIs for localization and attributes with RBAC.

SCOPE (do not):
- Do not index COGS into Meilisearch.
- Do not auto-approve translations.
- Do not implement return policy values (O-01) — only is_returnable flag structure.

DONE WHEN:
- CHK-CAT-04: Footwear attributes save; switching to Clothing refreshes form; PDP-ready payload has specs without fashion size if grocery
- CHK-CAT-07: Call Center JWT cannot read/write product_variant_cost (403 + absent from payload)
- Module links product-localization, product-bd-profile, product-variant-cost exist
- Nightly drift check hook documented (unique product_id vs link table)

HANDOFF:
Prompt 05 wires inventory locations and BDT pricing UX.
```

---

## Prompt 05 — Inventory and pricing

```
PROMPT 05 — Inventory and pricing
You are an implementation agent for bd-commerce-platform.

READ FIRST:
- agent.md
- prd.md §4.2, §6.3, §6.4, FR-11.1
- docs/architecture.md §7, §12.3
- database.md §1.6 money, §2.1 inventory/pricing, stock locations
- quality-checklist.md CHK-CAT-03, CHK-CAT-06, CHK-CAT-08 (index allowlist stub)

PREREQUISITE: Prompts 03–04.

GOAL:
Native inventory + native BDT prices. Admin sees simple Regular / Sale BDT fields. Stock never goes negative. Historical prices are not rewritten (snapshot comes in order prompt; pricing writes must not mutate past orders).

SCOPE (do):
1. Inventory:
   - Track inventory on variants. allow_backorder = false for Phase 1 (no backorders / preorders).
   - Sellable stock only at loc_central. Quarantine and courier-return desk start at 0.
   - Manual adjustments write audit_log (old qty, new qty, actor, reason).
   - Low-stock threshold in operational_settings; Admin dashboard widget can be simple count.
2. Pricing:
   - One BD region, currency bdt.
   - Admin widget: Regular Price (BDT) and optional Sale Price (BDT) per variant. Sync to price_set / price in major units (৳1,200 → 1200, not 120000).
   - Storefront display later uses Intl; Admin may show ৳ with Latin digits.
3. Reservation policy:
   - Do not reserve stock on add-to-cart.
   - Reserve atomically at order placement (implemented in checkout/COD prompts). Document the invariant in code comments and a small helper used later.
   - Redis key stock:lock:{variant_id} TTL 30s helper module ready for checkout.
4. Out of stock:
   - available_quantity 0 → variant selectable for viewing later, not purchasable (API reject).
5. Meilisearch allowlist constant file apps/medusa/src/search/allowlist.ts created now (used in Prompt 15) listing public fields and EXCLUDED_FIELDS including cogs_* / margin / supplier.
6. Do not change existing order rows if any exist when prices change.

SCOPE (do not):
- Do not implement multi-currency or USD.
- Do not implement multi-warehouse selling.
- Do not decrement stock at cart add.
- Do not enable the COD expiry cron as a silent default without operational_settings.cod_expiry_hours (recommended 48, O-03). Cron may exist disabled.

DONE WHEN:
- CHK-CAT-03: Regular 1500 + sale 1200 stored as major units; sale is the payable price
- CHK-CAT-06: buying 2 units (via a temporary admin/test complete or inventory API) decrements by 2; at 0, store add-line would 400
- Negative stock impossible (constraint or service guard)
- COGS still absent from any public payload
- audit_log has inventory adjustment samples

HANDOFF:
Prompt 06 builds the Next.js catalog against live /store APIs.
```

---

## Prompt 06 — Storefront catalog

```
PROMPT 06 — Storefront catalog
You are an implementation agent for bd-commerce-platform.

READ FIRST:
- agent.md
- prd.md §4.1–4.2, §10, §13
- docs/architecture.md §14
- quality-checklist.md CHK-UX-01, CHK-UX-02, CHK-UX-03 (SEO baseline)
- apps/web current Next.js app (extend; do not replace with a new app)

PREREQUISITE: Prompts 01–05. Medusa /store/products works with publishable key.

GOAL:
Mobile-first bilingual catalog: home (minimal), category, PDP. Single source of truth = Medusa catalog. No shadow product table in apps/web.

SCOPE (do):
1. Next.js 15 App Router under apps/web/src/app/[locale]/ with locales en (default) and bn.
2. @medusajs/js-sdk client in lib/medusa.ts (server) using MEDUSA_BACKEND_URL + publishable key. Never expose admin keys.
3. Tailwind 3.4.x only. Fonts: Inter + Hind Siliguri / Noto Sans Bengali with fallbacks.
4. Pages:
   - /[locale] home: language switch, featured products from store API or placeholder CMS later
   - /[locale]/categories/[handle]
   - /[locale]/products/[handle] PDP
5. PDP (FR-4.2):
   - Price, variant chips, stock state, category-specific specs from localization API
   - Out-of-stock variant selectable to view, Add to Cart / Buy Now disabled
   - Sticky mobile action bar when CTA scrolls away (CHK-UX-01)
   - Delivery estimate can be a static “calculated at checkout” until Prompt 08, or a simple zone teaser — do not hardcode ৳60 in JSX; read configured shipping options if already exposed
6. Language switch keeps path, selected variant, and later cart (FR-10.1.2). SKU/price/phone never translated.
7. SEO: one h1, title, meta description, canonical, Product JSON-LD, og:image from thumbnail.
8. Images via next/image, WebP/AVIF.
9. Remove any SSLCommerz copy from the storefront.

SCOPE (do not):
- Do not implement cart/checkout yet (next prompts). Buttons may be present but must call a stub that will be replaced — prefer wiring add-to-cart if Prompt 07 is at risk of conflict; if you wire cart mutations, follow Prompt 07 rules exactly.
- Preferred: visual ATC/Buy Now disabled with “coming in Prompt 07” only if you cannot share the cart module yet. Better: implement presentational PDP fully and leave cart actions as TODO components imported in Prompt 07.
- Do not query Prisma apps/api for products.
- Do not put COGS on the page.

DONE WHEN:
- EN and BN PDP render from the same product id
- Switching language does not change handle or selected variant
- Grocery PDP has no fashion size selector
- OOS variant cannot be purchased
- CHK-UX-02: no missing i18n keys on catalog routes; Bangla title does not overflow at 360px
- Lighthouse not required yet; images have dimensions

HANDOFF:
Prompt 07 implements unified cart + Buy Now on this PDP.
```

---

## Prompt 07 — Cart and Buy Now

```
PROMPT 07 — Cart and Buy Now
You are an implementation agent for bd-commerce-platform.

READ FIRST:
- agent.md
- prd.md §4.3 FR-4.3.1–4.3.8, AC-4.1–4.5, AC-G2
- docs/architecture.md §14.2, ADR-020
- quality-checklist.md CHK-CHK-01 to CHK-CHK-04
- user-journeys.md Journeys 3–6 if present

PREREQUISITE: Prompt 06 PDP exists.

GOAL:
One Medusa cart per session. Add to Cart and Buy Now never wipe existing lines. Buy Now same-variant does not increment.

SCOPE (do):
1. Cart id in HTTP-only cookie. Guest cart persists on abandon (FR-4.3.8).
2. Add to Cart: same variant increments qty; new variant new line. Stay on PDP. Mini-cart + navbar badge (CHK-CHK-01).
3. Buy Now:
   - Empty cart → add qty 1 → go /[locale]/checkout (CHK-CHK-02)
   - Cart has other items → add new line, keep others, go checkout (CHK-CHK-03, AC-4.2)
   - Same variant already in cart → keep qty, no duplicate line, go checkout (CHK-CHK-04, AC-4.1, FR-4.3.3)
4. Cart page: edit qty, remove line. Quantity 0 removes line.
5. All mutations send X-Idempotency-Key.
6. Server validates variant exists and is in stock for increases; never trust client price.
7. Campaign Mode B will reuse this cart later — export a shared cart service, no second cart.

SCOPE (do not):
- Do not create orders in this prompt.
- Do not clear cart on Buy Now.
- Do not auto-increment on Buy Now same variant.
- Do not build a campaign-only exclusive checkout (PRD FR-5.2.6).

DONE WHEN:
- Automated or documented tests for AC-4.1, AC-4.2, CHK-CHK-01–04
- Refresh/double-click Buy Now does not duplicate lines
- Guest cart survives browser refresh

HANDOFF:
Prompt 08 adds Bangladesh checkout, address, delivery zones.
```

---

## Prompt 08 — Checkout and delivery zones

```
PROMPT 08 — Checkout and delivery zones
You are an implementation agent for bd-commerce-platform.

READ FIRST:
- agent.md
- prd.md §4.3.4–4.3.8, §4.4, §11.2–11.5, FR-7.4.3, AC-7.6
- docs/architecture.md §10.1–10.2, §14.1 checkout
- database.md §8.1, §8.3, §8.13
- dfd.md P2.0
- quality-checklist.md CHK-CHK-05, CHK-CHK-06, CHK-CHK-07

PREREQUISITE: Prompt 07 cart works. Geo + delivery_zone seeded (Prompt 01).

GOAL:
One-page guest checkout with 4-tier BD address and zone-based native shipping options. Server revalidates price and stock. No payment capture yet except preparing payment session selection UI (COD radio can be visual; completion is Prompt 09).

SCOPE (do):
1. Route /[locale]/checkout. Guest checkout, no forced account (FR-4.4.1).
2. Phone: E.164 +8801[3-9]XXXXXXXX. Normalize 01… → +8801…. Invalid 012 / wrong length blocked with Bangla+English error (CHK-CHK-05).
3. Address cascade: Division → District → Upazila/Thana → Area/Street. Validate codes against geo_* tables. Snapshot names into metadata for later order_bd_details.
4. Shipping: resolve native shipping options from district → delivery_zone_district → delivery_zone.shipping_option_id.
   inside_dhaka / dhaka_suburbs / outside_dhaka. Totals update live. Delivery line separate from merchandise.
5. Free shipping only via native promotion if configured; do not hardcode threshold.
6. Checkout review: all cart lines, qty edit, remove, delivery charge, grand total. Stale price/stock: show new state, require acknowledgement (FR-4.3.6, CHK-CHK-07). Never place with stale price.
7. Idempotency on complete. Rate limit complete: 5/min/IP (architecture §7.3) — can implement middleware now.
8. Persist UTM from session into cart metadata for later order_bd_details.
9. Do not create the order for bKash/Nagad in this prompt. For this prompt, “Place order” may be disabled until Prompt 09 except a development COD path if you implement Prompt 09 immediately after — prefer completing the form + shipping + validation without calling completeCart until Prompt 09.

Recommended split: implement completeCart only for COD in Prompt 09. This prompt ends when shipping methods apply and validation works.

SCOPE (do not):
- Do not skip thana because a courier API “only needs district” — capture all 4 tiers.
- Do not guess unmapped geo.
- Do not rewrite historical shipping amounts (none yet).
- Do not enable card methods.

DONE WHEN:
- CHK-CHK-05: invalid phone blocked; valid guest checkout form proceeds
- CHK-CHK-06: switching Dhaka vs outside changes delivery charge from config, not hardcoded JSX
- CHK-CHK-07: admin price change while cart open → checkout shows new price / blocks stale submit
- Address codes persist on cart

HANDOFF:
Prompt 09 implements COD order-placement workflow.
```

---

## Prompt 09 — COD workflow

```
PROMPT 09 — COD workflow
You are an implementation agent for bd-commerce-platform.

READ FIRST:
- agent.md
- prd.md §6.1–6.6, §7.1, AC-6.1, AC-4.3
- docs/architecture.md §9.1–9.2, §13.1 order-placement + cod-confirmation, §7.2
- database.md §3.4, §8.4, §7.1–7.3
- dfd.md §4.2
- quality-checklist.md CHK-PAY-01, CHK-ORD-01, CHK-ORD-02, CHK-CHK-08, CHK-ORD-05

PREREQUISITE: Prompt 08 checkout form. bd-orders tables canonical (create/migrate now if still draft).

GOAL:
COD is a real AbstractPaymentProvider (pp_cod). Order is created only after server-side stock+price validation. Call center queue confirms orders. No automatic refund.

SCOPE (do):
1. Canonical bd-orders: customer_identity, customer_risk_profile, address_bd_detail, order_bd_details, order_line_snapshot, cod_call_log, cod_collection_line. Remove order_return_request if still present (returns come later).
2. Payment provider pp_cod: authorize 0 fee; payment awaiting collection; capture only on delivery (later courier prompt). cod_status = pending_confirmation (map UI label Unconfirmed).
3. Workflow order-placement (COD path):
   - Validate cart, prices, stock, phone, address codes, shipping option
   - Redis lock stock:lock:{variant_id}
   - Reserve inventory atomically at loc_central
   - Create native order + order_line_snapshot (immutable prices, VAT snapshot, COGS snapshot from product_variant_cost if set — null if missing, never 0-fill)
   - Create order_bd_details (geo, zone code, customer_paid_delivery_paisa snapshot, UTMs, landing_page_id if any)
   - Increment customer_risk_profile
   - Idempotency key unique
   - SMS outbox later; for now enqueue placeholder or skip with TODO if bd-notifications missing — do not block order on SMS
4. Concurrent last-unit: exactly one success (CHK-CHK-08, AC-6.1).
5. Admin /app/cod-queue + order.details COD widget:
   - Confirm → confirmed + ready_to_ship semantics
   - Call attempt 1/2/3 logged in cod_call_log
   - After 3 attempts → escalated
   - Cancel → release reservation, inventory back, audit
   - Risk badge from customer_risk_profile
6. operational_settings.cod_expiry_hours recommended 48. Cron workflow exists, DISABLED by default until O-03 sign-off, but implementable (CHK-ORD-05). Document how to enable.
7. Duplicate complete → one order (AC-4.3).
8. Guest tracking stub: GET /store/orders/track requires order id + phone, rate limit, mask phone (full tracking UI can finish in Prompt 12).

SCOPE (do not):
- Do not auto-cancel COD without the setting enabled.
- Do not capture COD payment at placement.
- Do not create orders for unpaid bKash (Prompt 11).
- Do not restock on cancel after fulfillment — only pre-shipment cancel releases stock.

DONE WHEN:
- CHK-PAY-01, CHK-ORD-01, CHK-ORD-02, CHK-CHK-08
- order_line_snapshot unchanged after later catalog price edit (place a test order, change price, re-read snapshot)
- Staff without permission cannot confirm via API (403)
- audit_log records confirm/cancel

HANDOFF:
Prompt 10 locks down staff auth/RBAC used by COD queue.
```

---

## Prompt 10 — Authentication and RBAC

```
PROMPT 10 — Authentication and RBAC
You are an implementation agent for bd-commerce-platform.

READ FIRST:
- agent.md
- prd.md §8.2, FR-8.2.1–8.2.9, AC-8.1–8.5
- docs/architecture.md §6
- database.md §2.1 auth/rbac, §3.12 staff_profile, D-08
- quality-checklist.md CHK-SEC-01, CHK-SEC-02, CHK-SEC-04

PREREQUISITE: Admin + COD APIs exist so you can prove 403s.

GOAL:
Native Medusa auth + native RBAC is the only authorization system. staff_profile is HR/ops only. Server enforces every sensitive action.

SCOPE (do):
1. Seed rbac_role: owner, manager, finance, warehouse, call_center, content, staff (database.md §2.5).
2. Map policies to architecture.md §6.3 matrix. Especially:
   - COGS / contribution reports: owner + finance
   - Return approve / refund record: permission-gated (O-12 dual-control >৳5000 as config, not hardcoded forever)
   - Settings/gateways: owner
   - COD confirm: owner, manager, call_center
   - Courier book: owner, manager, warehouse
3. user_rbac_role assignment in /app/settings/team. Fine-grained grants via rbac_policy.
4. Forced password change: auth_identity.app_metadata.must_change_password = true on invite; middleware blocks all but change-password (FR-8.2.5).
5. Redis auth:lockout:{email}: 5 failures → 15 min lockout; audit_log + owner notify hook (FR-8.2.7).
6. Password or role change invalidates sessions (FR-8.2.6).
7. Passwords never returned (AC-8.5).
8. Customer: guest primary; optional phone login later if time; email not required.
9. 2FA for owner/manager where Medusa MFA exists (FR-8.2.9) — enable if supported; do not fake it.
10. Order tracking rate limit CHK-SEC-04 (align architecture 10/min and checklist 5/min: implement the stricter 5/min per IP+phone as quality-checklist P0, document in code).

SCOPE (do not):
- Do not reintroduce staff_role_permission boolean table.
- Do not authorize only by hiding sidebar links.
- Do not log password or JWT.

DONE WHEN:
- CHK-SEC-01: call_center cannot open settings/gateways or profit report (UI + 403)
- CHK-SEC-02: 6th failed login locked; cookies HttpOnly
- AC-8.4: role change kills existing session
- CHK-SEC-04: tracking enumeration blocked

HANDOFF:
Prompt 11 adds bKash/Nagad providers behind payment settings RBAC.
```

---

## Prompt 11 — Payment providers

```
PROMPT 11 — Payment providers
You are an implementation agent for bd-commerce-platform.

READ FIRST:
- agent.md
- prd.md §7 entire, FR-7.3.7, AC-7.1–7.5, AC-G6, AC-G8
- docs/architecture.md §5.3, §9
- database.md §3.7, §6.4 secrets, §7.2 idempotency
- dfd.md §4.1
- quality-checklist.md CHK-PAY-02, CHK-PAY-03, CHK-PAY-04, CHK-SEC-03

PREREQUISITE: Prompts 09–10. Cart preserved across checkout.

GOAL:
Direct Merchant API providers pp_bkash and pp_nagad with zero-orphan + zero-trust. Credentials post-build: methods disabled until configured.

SCOPE (do):
1. Canonical bd-payments: payment_provider_config, payment_attempt, refund_ledger. Migrate/drop payment_transaction and payment_webhook_log.
2. Secrets: env / file; DB stores secret_ref + key_version. Nagad private key via NAGAD_PRIVATE_KEY_PATH mode 0600, never PEM in env (architecture C-5).
3. Admin /app/settings/gateways: enable/disable, masked secrets (CHK-SEC-03). Incomplete credentials → method disabled, hidden at checkout (AC-7.4).
4. Zero-orphan:
   - initiatePayment creates payment_session only
   - Order NOT created
   - Cancel/fail → /checkout?payment_error=cancelled, cart intact (CHK-PAY-04, FR-7.3.7)
   - Success callback: server-to-server execute/status; verify Completed, currency BDT, amount matches cart; then order-placement workflow
5. Background poller for dropped browser redirects (final-system-validation item 10 / dfd). Idempotent.
6. Webhooks /hooks/bkash and /hooks/nagad: verify, redact into webhook_event, never trust body status.
7. Duplicate callbacks: one payment, HTTP 200 (CHK-PAY-03, AC-7.2).
8. Disabling a method hides it; historical orders unchanged (AC-7.1).
9. Screenshots never mark Paid (AC-7.5).
10. refund_ledger exists for later manual payouts; no provider auto-refund (FR-6.7.12).

SCOPE (do not):
- Do not integrate SSLCommerz or cards.
- Do not create orphan orders or reservations on redirect.
- Do not claim live bKash/Nagad operational without credentials.
- Do not auto-complete refunds from webhooks.

DONE WHEN:
- CHK-PAY-02 sandbox or recorded executePayment mock with amount+currency checks
- CHK-PAY-03 replay 3× → one order
- CHK-PAY-04 cancel preserves cart, zero orders
- CHK-SEC-03 masked secrets
- Payment and order status remain separate fields

HANDOFF:
Prompt 12 builds full order management, returns, invoices, SMS hooks.
```

---

## Prompt 12 — Order management

```
PROMPT 12 — Order management
You are an implementation agent for bd-commerce-platform.

READ FIRST:
- agent.md
- prd.md §6.1–6.2, §6.7, §11.6–11.7, AC-6.2–6.8, AC-G7
- docs/architecture.md §13 return-refund, §15.3, §17
- database.md §3.5 bd_returns, §3.10–3.11, §8.7–8.10
- dfd.md §4.4
- quality-checklist.md CHK-ORD-03, CHK-ORD-04, CHK-FUL-04, CHK-FUL-05, CHK-INV-01, CHK-MKT-04

PREREQUISITE: COD + payments + RBAC.

GOAL:
Staff can run daily order ops: list/detail, manual order, independent return review, printable invoices, SMS infrastructure. Courier booking is Prompt 13; provide manual tracking fields if needed.

SCOPE (do):
1. Orders list: filters for COD status, payment, fulfillment; search phone; zone; badges. Native order + order_bd_details.
2. Order detail widgets: 4 statuses visible independently; financial snapshot; COD box; return badge.
3. /app/manual-order phone-first (architecture §15.3), not email-centric draft-only. Lookup risk by phone. 4-tier address. Live stock. COD or manual trxID. audit_log actor.
4. bd_returns: return_policy, return_policy_scope, return_review 1:1 with native return.
   - Policy values Open (O-01): UI “not yet configured” if window_days null
   - Never auto-approve (AC-6.5, AC-G7)
   - Webhook cannot complete refund (AC-6.6)
   - Permission on every action (AC-6.7)
   - Condition required before restock; damaged → loc_damaged_quarantine, never sellable auto (AC-6.3)
   - Rejected requests keep reason/user/time (FR-6.7.13)
   - Shipped cancel blocked; route to RTO flow (AC-6.4)
5. Invoices: bd_invoices, fiscal year INV-2026-27-000001 (O-09), snapshot hash, VAT line only if vat enabled. Immutable; void = new number.
6. SMS: bd_notifications sms_template + sms_delivery_detail + native notification. Outbox last step. Failure does not roll back order. Manual resend. Mock adapter if no gateway (O-09). Bangla templates from architecture §11.2.
7. Customer /[locale]/track-order: order id + phone, masked PII, return status (CHK-FUL-04).
8. CHK-ORD-03: price/title/VAT/template edits never rewrite old orders/invoices.

SCOPE (do not):
- Do not auto-payout bKash refunds.
- Do not implement store credit (O-13 Phase 2).
- Do not merge return status into order.status.

DONE WHEN:
- AC-6.2–6.8 evidenced
- CHK-ORD-03, CHK-ORD-04 (manual order), CHK-INV-01, CHK-FUL-04
- CHK-FUL-05 happy path with manual trxID
- SMS failure logged, order intact
- Policy unconfigured blocks return create with clear message

HANDOFF:
Prompt 13 adds courier adapters on top of order_bd_details + consignments.
```

---

## Prompt 13 — Courier integrations

```
PROMPT 13 — Courier integrations
You are an implementation agent for bd-commerce-platform.

READ FIRST:
- agent.md
- prd.md FR-7.4.*, AC-7.3, AC-12.2
- docs/architecture.md §10
- database.md §3.6, §8.2, §8.5–8.6
- dfd.md §4.3
- quality-checklist.md CHK-FUL-01, CHK-FUL-02, CHK-FUL-03

PREREQUISITE: Prompt 12 orders + returns.

GOAL:
Steadfast / Pathao / RedX adapters + mandatory ManualCourierAdapter. Webhooks map to consignment events. RTO never auto-restocks. COD capture on delivered.

SCOPE (do):
1. Canonical courier, courier_area_map, courier_area_alias, courier_consignment, courier_event, courier_remittance_batch, courier_remittance_line.
2. Adapter interface; unmapped thana → block that courier, offer Manual (FR-7.4.4). Never guess zone.
3. Recommended Phase 1 primary: Steadfast (O-11) but all three adapters + manual. Do not claim “integrated” in UI until credentials tested.
4. Workflow courier-dispatch: 4-tier address, COD collectable snapshot, persist consignment, SMS dispatched.
5. /app/courier-manifest batch + thermal label placeholder (PDF/ZPL later ok if time).
6. Manual consignment ID path (CHK-FUL-02, AC-7.3).
7. Webhooks HMAC/token → webhook_event. Distinguish delivery_failed (retry) vs rto_initiated. DELIVERED → capture COD. RTO → rto_received + quarantine, not sellable increment (CHK-FUL-03).
8. Partial delivery: cod_collection_line; native delivered_quantity; variance not silent revenue.
9. Remittance UI/report structure: customer_paid_delivery vs courier_cost vs remitted (FR-14.9). Missing costs null not zero.
10. API down: operations continue via manual (AC-12.2).

SCOPE (do not):
- Do not auto-restock RTO.
- Do not block order placement if courier API is down.
- Do not store full webhook PII; redact.

DONE WHEN:
- CHK-FUL-01 (sandbox or mock), CHK-FUL-02, CHK-FUL-03
- Unmapped area cannot book Pathao; manual still works
- Two webhooks same event → one consignment transition
- v_order_shipment_state (or equivalent read model) matches native + events

HANDOFF:
Prompt 14 landing pages reuse catalog, cart, order, payment.
```

---

## Prompt 14 — Campaign landing pages

```
PROMPT 14 — Campaign landing pages
You are an implementation agent for bd-commerce-platform.

READ FIRST:
- agent.md
- prd.md §5, §9, AC-5.1–5.3, FR-5.2.3
- docs/architecture.md §14.2, §16
- database.md §3.9, §8.11, D-21 one pixel
- quality-checklist.md CHK-MKT-01, CHK-MKT-03, CHK-ADM related content

PREREQUISITE: Unified cart + checkout + catalog.

GOAL:
Template landing pages + CMS homepage/policy pages. Mode B embedded checkout binds the SAME cart. One Meta Pixel.

SCOPE (do):
1. bd_campaigns canonical: landing_page, landing_page_version, landing_page_offer, ad_campaign, ad_conversion_event, homepage_section, content_page, media_asset.
2. Admin builder: templates/sections only, no free-form JS/CSS. Preview, publish, unpublish, duplicate, rollback last published. SEO fields.
3. Publish validation: unpublished/OOS product blocked (AC-5.2). Expired offer blocked at checkout (FR-5.2.5).
4. Storefront /[locale]/lp/[slug] standalone layout (CHK-MKT-01). Mode B embedded checkout shows campaign item PLUS existing cart lines; X-Idempotency-Key; standard order workflow (AC-5.1).
5. Attach campaign id, landing_page_id, UTM on order_bd_details (CHK-MKT-03). Do not change prices via UTM.
6. One pixel: operational_settings.meta_pixel_id. Events ViewContent, AddToCart, InitiateCheckout, Purchase. No CAPI.
7. CMS: homepage sections reorder/hide; policy pages EN/BN draft/preview/publish/rollback. Broken product links block publish (FR-9.6). Design tokens + contrast check; no custom_css XSS.
8. Uploads: type/size/security; failed upload does not unpublish other pages (AC-5.3).
9. Machine translation optional later; manual EN/BN fields now.

SCOPE (do not):
- Do not build campaign-only exclusive cart (FR-5.2.6).
- Do not per-page Meta Pixel.
- Do not implement Meta Marketing API spend sync as required (manual ad_campaign.spend ok).
- Do not implement CAPI.

DONE WHEN:
- AC-5.1, AC-5.2, AC-5.3
- CHK-MKT-01, CHK-MKT-03
- Unpublish removes from sitemap (CHK-UX-03 related)
- Theme rollback does not touch orders

HANDOFF:
Prompt 15 search indexes public catalog fields only.
```

---

## Prompt 15 — Search

```
PROMPT 15 — Search
You are an implementation agent for bd-commerce-platform.

READ FIRST:
- agent.md
- prd.md §4.1
- docs/architecture.md §8
- dfd.md §4.5
- quality-checklist.md CHK-CAT-08
- apps/medusa/src/search/allowlist.ts from Prompt 05

PREREQUISITE: Catalog + inventory.

GOAL:
Meilisearch products index, Banglish search, facets. Strict allowlist. Soft-delete sync without re-fetch.

SCOPE (do):
1. Index primary key = product id.
2. Searchable: title_en, title_bn, sku, category_name, tags, description_excerpt (weights per architecture §8.1).
3. Filterable: category, status, in_stock, price_bdt (major units), attribute_*.
4. Sortable: price_bdt, created_at, popularity_score.
5. Synonyms: punjabi ↔ পাঞ্জাবি, sharee ↔ শাড়ি, plus a small seed list.
6. Workflow/subscriber meilisearch-sync on product.created/updated; product.deleted uses event id DELETE document, do not re-fetch (architecture §8.3).
7. Storefront search + category facets. OOS shown, marked, not hidden by default (FR-4.1.2). Facets only values that exist (FR-4.1.3).
8. Public key = search-only. Master key never in Next.js public env.
9. Tests: document with COGS must not contain excluded keys (CHK-CAT-08).

SCOPE (do not):
- Do not index cogs, margin, supplier, refund accounts.
- Do not use Medusa search as a second public product DB with private metadata.

DONE WHEN:
- CHK-CAT-08 pass with GET document dump
- BN and EN queries return the seeded Panjabi product
- Delete product removes index doc
- Storefront search uses search-only key

HANDOFF:
Prompt 16 reporting reads snapshots, not live catalog prices.
```

---

## Prompt 16 — Analytics

```
PROMPT 16 — Analytics
You are an implementation agent for bd-commerce-platform.

READ FIRST:
- agent.md
- prd.md §5.3, §14, AC-14.1–14.2, AC-G5, FR-5.3.5–5.3.6
- docs/architecture.md §4.2 bd-reports, §5.4
- database.md §8.11, §8.14, views in §4.6
- quality-checklist.md CHK-MKT-03 (already), reports section

PREREQUISITE: Orders, payments, courier remittance fields, campaigns.

GOAL:
Read-only contribution and COD settlement reports. Never label incomplete figures Net Profit. Store sales vs Meta attribution are distinct.

SCOPE (do):
1. Module bd-reports (query-only). SQL views: v_contribution_profit with missing_inputs array; v_cod_settlement.
2. Formulas from database.md §8.14. Null ≠ 0. UI: “Estimated Contribution Profit” when missing courier/COGS/ad spend (AC-14.1). Word “Net Profit” forbidden unless all overhead included (it is not) — do not show Net Profit at all in Phase 1.
3. Delivered sales exclude cancelled/RTO; incurred courier cost still in costs (AC-14.2).
4. Distinct metrics: campaign spend (manual), Meta-attributed purchases (if pixel events stored), store-verified orders. Never merge (FR-5.3.5). Failed Meta sync shows last success time, not zero spend (FR-5.3.6) — if no API, show “not connected”.
5. Admin /app/reports/profit and /app/reports/cod-settlement. Owner/Finance only.
6. Dashboard: sales overview, low stock, pending COD, pending returns — no fake charts.
7. Client Pixel already from Prompt 14; do not add CAPI.

SCOPE (do not):
- Do not write to order tables from reports.
- Do not allocate ad spend as causation; label estimate (FR-14.7).
- Do not implement Marketing API as a launch blocker.

DONE WHEN:
- AC-14.1, AC-14.2, AC-G5
- Finance sees COGS-based contribution; call_center 403
- Delivery collected and courier cost are two columns

HANDOFF:
Prompt 17 tests security and P0 checklist evidence.
```

---

## Prompt 17 — Testing and security

```
PROMPT 17 — Testing and security
You are an implementation agent for bd-commerce-platform.

READ FIRST:
- agent.md
- prd.md §12, §16–18, all AC-G*
- quality-checklist.md entire (52 checks)
- database.md §6–7
- docs/architecture.md §19–20

PREREQUISITE: Features from Prompts 01–16 exist enough to test. Fix gaps found; do not skip P0.

GOAL:
Evidence-based verification of P0 checks. Close security holes. No new features except fixes.

SCOPE (do):
1. Create tests/ or apps/medusa/integration-tests covering:
   - Concurrent stock (CHK-CHK-08)
   - Idempotent order complete and payment webhook
   - Buy Now three cases
   - Return not auto-approved
   - Meilisearch allowlist
   - RBAC 403 matrix
   - money.ts rounding
   - audit_log trigger rejects UPDATE/DELETE
2. Security pass:
   - Helmet/CORS, CSP (no arbitrary CSS)
   - Rate limits on login, checkout complete, track-order, hooks
   - Zod/validation on custom routes
   - XSS escape on names/addresses (CHK-OPS-05)
   - Secrets not in git or logs (AC-12.4) — search repo
   - Tracking mask
3. Run through quality-checklist.md: mark [x] only with evidence paths in docs/quality-evidence.md. Leave [ ] if failing, then fix.
4. P0 failures are release blockers — fix in this prompt.
5. CHK-MKT-02 CAPI remains Phase 2, not failed P0.

SCOPE (do not):
- Do not weaken RBAC to make tests pass.
- Do not disable rate limits in production config.
- Do not add SSLCommerz to “fix” payment tests.

DONE WHEN:
- All Phase 1 P0 checks have pass evidence or a tracked bug with owner-visible status
- Negative tests for audit_log mutation pass
- grep of logs/fixtures contains no live secrets

HANDOFF:
Prompt 18 production Docker, CI/CD, backup, deploy.
```

---

## Prompt 18 — Docker production, CI/CD, backup, deployment

```
PROMPT 18 — Docker production, CI/CD, backup, deployment
You are an implementation agent for bd-commerce-platform.

READ FIRST:
- agent.md
- prd.md FR-12.6, AC-12.3
- docs/architecture.md §18, §20.2, §21
- quality-checklist.md CHK-OPS-01 to CHK-OPS-03
- final-system-validation.md Phase 0 launch gates O-01, O-02, O-03, O-05, O-11, O-12 (document, do not invent answers)

PREREQUISITE: Prompt 17.

GOAL:
Production-shaped containers, CI, encrypted backups with a tested restore, deployment docs. No public launch claim without owner gates.

SCOPE (do):
1. Production Dockerfiles: apps/medusa and apps/web. Multi-stage, non-root, no secrets in image.
2. docker-compose.prod.yml or documented compose: postgres 16, redis 7, meilisearch 1.11, medusa, web. Private network. Healthchecks.
3. CI (GitHub Actions or existing): lint, typecheck, unit/integration, medusa build, next build. No deploy from untrusted forks with secrets.
4. Backup: daily pg_dump encrypted to S3/R2, 30-day retention (architecture §20.2). Script + restore runbook.
5. Perform restore drill into a throwaway database; record evidence for AC-12.3 / CHK-OPS-03. Do not overwrite prod.
6. Migrations in deploy pipeline: medusa db:migrate, never DROP DATABASE.
7. Env: production values via secret manager; .env.example complete; Nagad key file mounts.
8. Cloudflare/WAF notes; STORE_CORS/ADMIN_CORS production domains.
9. Runbook: docs/deployment.md — rollback, backup restore, disable payment method, enable COD cron, seed geo.
10. Checklist of Phase 0 gates still Open — launch blocked until signed.

SCOPE (do not):
- Do not force-push, do not prune docker volumes.
- Do not commit production secrets.
- Do not declare the store “live” in customer-facing copy.

DONE WHEN:
- CHK-OPS-01, CHK-OPS-02, CHK-OPS-03 evidenced
- CI green on main
- Restore drill documented with row-count comparison
- deployment.md exists

HANDOFF:
Phase 1 engineering complete pending owner gates and real bKash/Nagad/courier/SMS credentials.
```

---

## Prompt index (quick)

| # | Prompt | Primary modules | Quality gates (indicative) |
|---|---|---|---|
| 01 | Medusa v2 foundation | medusa-config, bd-settings, bd-audit, geo seed | CHK-OPS-01, CHK-OPS-02 |
| 02 | Medusa Admin | src/admin routes/widgets | CHK-ADM-01–04 |
| 03 | Product & category | native product, translation | CHK-CAT-01, 02, 05 |
| 04 | BD product data | bd-catalog rest | CHK-CAT-04, 07 |
| 05 | Inventory & pricing | inventory, pricing, money | CHK-CAT-03, 06 |
| 06 | Storefront catalog | apps/web catalog/PDP | CHK-UX-01–03 |
| 07 | Cart & Buy Now | native cart | CHK-CHK-01–04 |
| 08 | Checkout & zones | fulfillment, geo | CHK-CHK-05–07 |
| 09 | COD workflow | bd-orders, pp_cod | CHK-PAY-01, CHK-ORD-01–02, CHK-CHK-08 |
| 10 | Auth & RBAC | auth, rbac, staff_profile | CHK-SEC-01, 02, 04 |
| 11 | Payment providers | bd-payments, pp_bkash, pp_nagad | CHK-PAY-02–04, CHK-SEC-03 |
| 12 | Order management | bd-returns, bd-invoices, bd-notifications | CHK-ORD-03–04, CHK-FUL-04–05, CHK-INV-01 |
| 13 | Courier integrations | bd-courier | CHK-FUL-01–03 |
| 14 | Campaign landing pages | bd-campaigns, bd-content | CHK-MKT-01, 03 |
| 15 | Search | Meilisearch sync | CHK-CAT-08 |
| 16 | Analytics | bd-reports | AC-14.*, AC-G5 |
| 17 | Testing & security | tests, checklist evidence | all P0 |
| 18 | Docker, CI/CD, backup, deploy | compose, CI, pg_dump | CHK-OPS-01–03 |

---

*This file is the execution sequence. Standing engineering rules live in [`agent.md`](agent.md).*
