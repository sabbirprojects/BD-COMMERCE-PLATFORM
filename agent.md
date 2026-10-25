# AI Agent Instructions — Bangladesh Single-Vendor E-commerce Platform

**Document:** `agent.md`  
**Audience:** Future AI Agents (Cursor, Antigravity, Claude, Copilot) & Engineers  
**Status:** Mandatory Standing Rules — Apply on Every Task & Session  
**Date:** 2026-10-24  
**Governing Documents:**
- [`prd.md`](prd.md) — Product Requirements Document (v2.0)
- [`docs/architecture.md`](docs/architecture.md) — System Architecture Specification (v2.0)
- [`dfd.md`](dfd.md) — Data Flow Diagram Specification (v2.0)
- [`database.md`](database.md) — Canonical Database Specification (v2.0 — 51 custom tables, 10 modules)
- [`quality-checklist.md`](quality-checklist.md) — QA Protocol & 52 Verification Release Gates
- [`final-system-validation.md`](final-system-validation.md) — Reconciled System Verdict & Conflict Resolutions
- [`prompt.md`](prompt.md) — Execution Prompt Plan (18 Backend-First Sequential Prompts)

> [!IMPORTANT]
> **InsForge SDK Warning:**  
> The root `AGENTS.md` file contains generic InsForge template scaffolding. **It does not govern this platform.** Do NOT install `@insforge/sdk`, do NOT call InsForge MCP tools, and do NOT apply InsForge database or auth patterns to this project. Follow **this document (`agent.md`)** exclusively.

---

## 1. Project Purpose and Scope

### 1.1 Purpose
Build and maintain a high-reliability, mobile-first, single-vendor B2C e-commerce platform custom-engineered for a single Bangladeshi merchant. The system pairs a high-conversion Next.js 15 storefront with a centralized Medusa v2 backend and embedded Medusa Admin panel, supporting Cash on Delivery (COD) call-center verification, bKash/Nagad direct merchant payments, automated courier dispatch, manual-only return/refund workflows, campaign landing pages, and contribution-margin financial analytics.

### 1.2 In Scope (Phase 1 Baseline)
- **Single Merchant, Single Currency:** Single vendor B2C store, BDT (৳) only.
- **Single Warehouse & Damaged Quarantine:** One central sellable stock location (`Central Warehouse`) plus a quarantined non-sellable location (`Quarantine / Damaged Location`) for RTOs and returns.
- **Product & Category Model:** Multi-category catalog, category-specific dynamic attributes, Brand entity (1:1 with product), max 3 variant option types per product, and product returnability flags.
- **Unified Cart & Buy Now:** Shared cart across storefront, category listings, and campaign landing pages; cart-preserving Buy Now behavior (never clears cart, never duplicates or increments when variant is already present).
- **Guest Checkout & 4-Tier Address:** Streamlined one-page checkout, E.164 phone validation, 4-tier Bangladesh address hierarchy (`Division` -> `District` -> `Upazila/Thana` -> `Area/Street`), and dynamic Inside/Outside Dhaka delivery fee calculation.
- **COD Operational Workflow:** Dominant payment mode (>80% volume) with dedicated Call Center Verification Queue in Admin (`/app/cod-queue`), 3-attempt tracking, pre-shipment cancellation, and 48-hour unconfirmed order expiry cron.
- **Online Payments (bKash & Nagad):** Direct Merchant API integrations with zero-trust server-to-server execute checks, zero-orphan cart preservation on cancel/failure, and replay-safe webhook idempotency.
- **Fulfillment & Logistics:** Courier integration engine (`bd-courier`) supporting Steadfast API, label printing, parcel status tracking, COD remittance reconciliation, and a guaranteed Manual Courier Fallback.
- **Manual-Only Return & Refund Management:** 100% human-verified return inspection; quarantined inventory; permission-gated manual refund ledger.
- **Campaign Landing Pages:** Reusable block builder in Admin (`/app/landing-pages`), versioning, rollback, and Mode B direct checkout bound to the unified cart.
- **SMS Infrastructure:** Transactional SMS notifications (outbox pattern) for order placement, COD confirmation, dispatch, and delivery.
- **Invoicing & PDF Engine:** Immutable fiscal year invoices (`INV-2026-27-000001`) generated from write-once order-time financial snapshots.
- **Search Engine:** Meilisearch 1.11 typo-tolerant search protected by a strict data allowlist (COGS and margins permanently stripped).
- **Security & RBAC:** Native Medusa RBAC (`Owner`, `Manager`, `Staff`), 5-attempt/15-minute brute-force lockout, append-only immutable `audit_log` via PostgreSQL triggers, and secret protection.

### 1.3 Strict Out of Scope (Never Implement in Phase 1)
- **Multi-vendor marketplace:** No vendor onboarding, vendor dashboards, commission calculations, or split payouts.
- **Card payment aggregators:** No SSLCommerz, Shurjopay, Foster, PortPos, or direct credit/debit card gateways.
- **Unrestricted visual design editors:** No free-form HTML/CSS editors (`custom_css` stored XSS risk).
- **Automatic refund execution / auto-approval:** No automated refund approvals or automatic money disbursement via payment APIs.
- **Automatic restock of RTO / damaged returns:** Returned goods must never be automatically returned to sellable stock.
- **Complex inventory:** No digital downloads, pre-orders, backorders, or multi-warehouse routing.
- **Social media bots:** No automated order creation from Facebook Messenger or WhatsApp without a verified, supported integration.
- **Meta Conversions API (CAPI):** CAPI is deferred to Phase 2; Phase 1 uses client-side Meta Pixel exclusively.
- **Store credit ledger:** Deferred to Phase 2 (O-13).

### 1.4 Open Owner Decisions (Do Not Invent as Final)
The following 15 decisions (O-01 to O-15, documented in `final-system-validation.md` §3) are commercial or legal policies owned by the merchant. The system must provide configurable database and Admin UI structures with sensible baseline defaults, displaying **"not yet configured"** when unset:
- **O-01 Return Policy:** 7-day default window, customer pays return delivery unless defective; Admin-configurable.
- **O-02 VAT Registration:** Disabled (0%) by default until the merchant's accountant confirms BIN.
- **O-03 COD Expiry:** 48-hour expiration window; 3 verification call attempts before moving to `escalated`.
- **O-05 Data Retention:** 90 days for webhooks, 180 days for SMS logs, 6 years for financial audit logs.
- **O-11 Primary Courier:** Steadfast API enabled initially; Manual Courier Fallback always active.
- **O-12 Refund Approval Threshold:** Dual authorization (Manager + Owner) required for refunds > ৳5,000.

---

## 2. Tech Stack (Locked)

| Layer | Technology | Version | Hard Constraint / Rule |
|---|---|---|---|
| **Commerce Engine** | MedusaJS v2 | `2.22.x` | Sole commerce backend. Runs on port 9000. Backend source in `apps/medusa`. |
| **Admin Dashboard** | Medusa Admin | Embedded (`@medusajs/dashboard` + `@medusajs/ui`) | Native SPA at `/app`. No separate admin app. Design tokens strictly followed. |
| **Storefront** | Next.js App Router | 15.x | Server Components (RSC) by default; `"use client"` only for user interactivity. Runs on port 3000 in `apps/web`. |
| **Storefront Styling** | Tailwind CSS | **3.4.x (LOCKED)** | **DO NOT upgrade to Tailwind v4.** Lock dependencies in `apps/web/package.json`. |
| **ORM / Data Layer** | Medusa DML + MikroORM | Bundled with Medusa v2 | Custom schemas in `apps/medusa/src/modules/bd-*`. |
| **Primary Database** | PostgreSQL | 16-alpine | Docker container `bd_commerce_postgres` (port 5432). Shared with legacy Prisma tables. |
| **Cache & Queue** | Redis | 7-alpine | Docker container `bd_commerce_redis` (port 6379). Workflows, rate limits, locks. No durable facts in Redis. |
| **Full-Text Search** | Meilisearch | 1.11 | Docker container `bd_commerce_meilisearch` (port 7700). Public allowlist only. |
| **Storefront SDK** | `@medusajs/js-sdk` | Latest | Type-safe communication with `/store/*` endpoints. |
| **Runtime** | Node.js | 20+ LTS | Strict TypeScript compilation (`tsc --noEmit`). |

> [!WARNING]
> **Database Safety Rule:**  
> The database `bd_commerce` contains 5 legacy Prisma tables: `categories`, `order_items`, `orders`, `products`, `users`. **NEVER drop, truncate, or alter these tables.** Legacy `apps/api` is non-authoritative for new commerce features; all new commerce logic lives in `apps/medusa` and `apps/web`.

---

## 3. MedusaJS Rules

1. **Medusa-First Primitives:** Always use native Medusa v2 core modules: Product, Variant, Price Set, Inventory, Cart, Order, Payment Collection, Tax, Translation, Notification, and RBAC. Never recreate commerce primitives.
2. **Never Fork Core Tables:** Do NOT execute raw `ALTER TABLE` on native Medusa schemas. Extend core entities exclusively via custom modules (`apps/medusa/src/modules/bd-*`) and Medusa Module Links (`apps/medusa/src/links/`).
3. **Single Writer Principle:** Every mutable business fact has exactly one authoritative table. If Medusa stores it (order status, payment amount, item line quantity), do NOT duplicate it in custom tables.
4. **Medusa Workflows:** Implement all multi-step state transitions using `createWorkflow` and `createStep` with corresponding compensation steps.
5. **Outbox Pattern for External Side Effects:** Irreversible side effects (such as sending transactional SMS via telco gateways or booking external courier APIs) must execute strictly in the final step AFTER database transactions commit.
6. **Canonical Money Representation (Hard Boundary):**
   - **Medusa Core Tables:** Amounts are stored as BDT major units (`numeric` via `model.bigNumber()`). Example: `৳ 2,500.00` = `2500` or `2500.00`.
   - **Custom Bangladesh Tables:** Amounts are stored as integer paisa (`numeric` with integer `CHECK`, named `*_paisa`). Example: `৳ 2,500.00` = `250000`.
   - **Conversion Rule:** All currency conversions must take place exclusively inside [`apps/medusa/src/lib/money.ts`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/apps/medusa/src/lib/money.ts).
   - **Naming Violation:** The suffix `_bdt` on an integer paisa column is strictly banned.
7. **Native Enums Win:** Native Order, Payment, Fulfillment, and Return statuses belong to Medusa. Custom enums are reserved exclusively for Bangladesh operational lifecycles (`cod_status`, `return_review.status`, `courier_consignment.status`, `refund_ledger.status`).
8. **Shipment State View:** Shipment state is NOT a writable column on `order_bd_details`. It is derived dynamically via database view `v_order_shipment_state` by composing native `fulfillment_status`, `courier_consignment`, and `courier_event`.
9. **Returns & Refunds:** Return entities use native Medusa `return` / `return_item` paired 1:1 with custom `return_review`. Do NOT resurrect legacy `order_return_request`.
10. **Delivery Charges:** Delivery zone rates live in native `shipping_option` price sets. Table `delivery_zone` manages geographic coverage and COD availability policies, not duplicate fee columns.
11. **Installed Code Beats Assumptions:** When in doubt, behavior in `node_modules/@medusajs/*` at 2.22.x is the absolute framework truth.
12. **Returns Use Native Entities:** Return lifecycle uses native Medusa `return` / `return_item` paired 1:1 with custom `return_review`. Do NOT create parallel return entities.
13. **Notifications Use Native Module:** SMS notification uses native `notification` table with `sms_delivery_detail` as BD-specific 1:1 extension. Do NOT create a standalone `sms_log` table.

---

## 4. Bangladesh Business Rules

1. **Currency:** Bangladesh Taka (BDT, ৳) is the only currency. Storefront formatting must use `Intl.NumberFormat('bn-BD')`.
2. **Phone Number Standard:** All phone numbers must conform to E.164 format: `+8801[3-9]\d{8}`. Storefronts may accept `01[3-9]\d{8}` but must normalize it to `+8801...` via a shared validation utility.
3. **4-Tier Administrative Address Hierarchy:**
   - Hierarchy: **Division (8)** -> **District (64)** -> **Upazila/Thana (~495)** -> **Area / Street Address**.
   - Delivery zone routing and courier API integrations (Steadfast, Pathao, RedX) bind strictly to administrative division/district/thana codes, never free-text spelling matching.
4. **Delivery Zones:**
   - Minimum zones: `inside_dhaka` (Dhaka district) and `outside_dhaka` (remaining 63 districts). Extensible to `dhaka_suburbs`.
   - Delivery rates must be Admin-configurable; historical orders snapshot `customer_paid_delivery_paisa`.
5. **COD Dominance & Call Center Verification:**
   - Cash on Delivery orders initialize in `unconfirmed` state.
   - Call center staff log verification attempts (1, 2, 3) in `cod_call_log`. Reaching 3 failed attempts moves the order to `escalated`.
   - Orders unconfirmed after 48 hours are automatically cancelled by a background cron job and stock is released.
   - Payment capture for COD occurs upon courier delivery, never at order placement.
6. **Online Payments (bKash & Nagad):**
   - Direct Merchant API integrations. Medusa orders are created ONLY after verified server-to-server execute checks.
   - Customer cart is preserved if payment is cancelled or fails on the gateway redirect.
   - Redirect callback parameters (`/hooks/bkash/callback`, `/hooks/nagad/callback`) are zero-trust.
7. **Independent 4-Status Dimension Model:**
   The system maintains 4 independent status dimensions that must NEVER be collapsed into a single status badge:
   - 1. Order Status (`pending`, `completed`, `cancelled`)
   - 2. Payment Status (`not_paid`, `awaiting`, `captured`, `partially_refunded`, `refunded`)
   - 3. Shipment Status (`booked`, `shipped`, `out_for_delivery`, `delivered`, `failed_delivery`, `rto_initiated`, `rto_received`)
   - 4. Return/Refund Review Status (`pending_manual_review`, `approved`, `rejected`, `completed`)
8. **Strict Buy Now Behavior (PRD FR-4.3.2 & FR-4.3.3):**
   - Case 1: Empty cart -> adds variant, opens checkout.
   - Case 2: Cart has other items -> appends variant to existing cart (preserves all items), opens checkout.
   - Case 3: Cart already contains the exact variant -> **DO NOT increment quantity**, **DO NOT create duplicate line**, retain current quantity as-is, open checkout directly.
9. **Manual-Only Returns & Quarantined Restock:**
   - Every return request requires manual review (`pending_manual_review`).
   - Refunds are NEVER automatically initiated or paid out.
   - Physical returns or RTO parcels are inspected by warehouse staff; damaged goods are quarantined in `Quarantine / Damaged Location` and NEVER automatically restocked into sellable inventory.
10. **Financial Reporting Integrity (PRD §14):**
    - The term **"Net Profit" is strictly forbidden** unless overhead, payroll, rent, and taxes are audited. Reports must display **"Contribution Profit"** or **"Estimated Contribution Profit"**.
    - Customer delivery fee collected (`customer_paid_delivery_paisa`) and courier cost charged to the business (`courier_cost_paisa`) must be tracked and displayed as **separate, independently labeled figures** (FR-14.9).
11. **Bilingual Presentation:** English is default; visible Bangla switch (`English | বাংলা`) is always accessible. Identifiers (SKU, order ID, phone numbers, prices) are never translated.
12. **Centralized Meta Pixel:** Exactly one Meta Pixel ID configured in `operational_settings.meta_pixel_id`. Landing pages cannot override it.

---

## 5. Folder Structure & Code Placement

```
bd-commerce-platform/
├── apps/
│   ├── medusa/                            # Medusa v2 Backend & Embedded Admin
│   │   ├── src/
│   │   │   ├── admin/                     # Embedded Admin UI Extensions
│   │   │   │   ├── routes/                # Custom Admin Pages (/cod-queue, /courier-manifest, etc.)
│   │   │   │   └── widgets/               # Entity Widgets (Order details, Product BD profile)
│   │   │   ├── api/                       # HTTP API Routes (/store, /admin, /hooks)
│   │   │   ├── jobs/                      # Scheduled Cron Jobs (COD expiry, payment reconciliation)
│   │   │   ├── lib/                       # Utilities (money.ts, phone.ts, idempotency.ts)
│   │   │   ├── links/                     # Medusa Remote Module Links
│   │   │   ├── modules/                   # Custom Bangladesh Modules (DML Models & Services)
│   │   │   │   ├── bd-audit/              # audit_log, webhook_event, staff_profile
│   │   │   │   ├── bd-campaigns/          # landing_page, version, offer, media_asset, CMS (homepage_section, content_page), ad_campaign
│   │   │   │   ├── bd-catalog/            # brand, attributes, product_bd_profile, localization, costs, translation_review
│   │   │   │   ├── bd-courier/            # courier, consignment, events, area map, remittance
│   │   │   │   ├── bd-invoices/           # invoice_template, invoice, fiscal year serial generator
│   │   │   │   ├── bd-notifications/      # sms_template, sms_delivery_detail (BD-specific extension of native notification)
│   │   │   │   ├── bd-orders/             # order_bd_details, line_snapshot, cod_call_log, customer_identity, risk_profile
│   │   │   │   ├── bd-payments/           # payment_provider_config, payment_attempt, refund_ledger
│   │   │   │   ├── bd-returns/            # return_policy, return_policy_scope, return_review
│   │   │   │   └── bd-settings/           # operational_settings, geo (div/dist/thana), delivery_zone, vat_settings
│   │   │   ├── subscribers/               # Event Handlers (Meilisearch sync, outbox SMS trigger)
│   │   │   └── workflows/                 # Transaction Workflows (order-placement, cod-confirmation)
│   │   ├── medusa-config.ts               # Core Engine Configuration
│   │   └── package.json
│   ├── web/                               # Next.js 15 App Router Storefront
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   └── [locale]/              # Bilingual Routing (/en default, /bn)
│   │   │   │       ├── (main)/            # Catalog, PDP, Cart, Checkout, Order Tracking
│   │   │   │       └── lp/[slug]/         # Campaign Landing Pages (Mode B Unified Checkout)
│   │   │   ├── components/                # React UI Components (Tailwind 3.4)
│   │   │   ├── context/                   # Cart & Language State Providers
│   │   │   └── lib/                       # Storefront SDK Client & Geo Fetchers
│   │   ├── tailwind.config.js             # Locked to Tailwind 3.4.x
│   │   └── package.json
│   └── api/                               # Legacy Prisma API (Non-authoritative — DO NOT EXTEND)
├── docs/                                  # Specifications & Architecture Reviews
│   ├── architecture.md                    # System Architecture Specification v2.0
│   ├── dfd.md                             # Data Flow Diagram Specification v2.0
│   └── architecture-decision-medusa-v2.md # Architecture Decision Record (ADR)
├── prd.md                                 # Product Requirements Document v2.0
├── dfd.md                                 # Root DFD Reference v2.0
├── database.md                            # Canonical Database Specification v2.0 (51 tables)
├── quality-checklist.md                   # 52 Release Gate Verification Checks
├── final-system-validation.md             # Reconciled Conflict Matrix & Release Readiness
├── prompt.md                              # 18 Step-by-Step Antigravity Execution Prompts
├── agent.md                               # THIS FILE (Standing Agent Rules)
├── docker-compose.yml                     # Local Dev PostgreSQL, Redis, Meilisearch
├── docker-compose.prod.yml                # Production Multi-Container Deployment
└── .env.example                           # Committed Environment Template (No Secrets)
```

### Where New Code Goes

| Purpose / Requirement | Target Location |
|---|---|
| Database DML Model | `apps/medusa/src/modules/bd-<name>/models/` |
| Domain Service Logic | `apps/medusa/src/modules/bd-<name>/service.ts` |
| Multi-Step Mutation / Transaction | `apps/medusa/src/workflows/` |
| Inter-Module Relation | `apps/medusa/src/links/` |
| Public Store Endpoint | `apps/medusa/src/api/store/` |
| Protected Admin Endpoint | `apps/medusa/src/api/admin/` |
| Inbound Webhook Handler | `apps/medusa/src/api/hooks/` |
| Custom Admin Page | `apps/medusa/src/admin/routes/<route-name>/page.tsx` |
| Admin Detail Widget | `apps/medusa/src/admin/widgets/<widget-name>.tsx` |
| Storefront UI Component | `apps/web/src/components/` |
| Storefront Route | `apps/web/src/app/[locale]/(main)/` |
| Geographic Seed Data | `apps/medusa/src/scripts/seed-geo.ts` |

---

## 6. Security Rules

1. **Server-Side Enforcement:** Every mutating endpoint on `/admin` and `/store` must enforce authorization and validation on the server. Never rely on disabling or hiding a button in the frontend.
2. **Secrets Storage:** 
   - Never commit `.env` or credential files to Git.
   - Nagad private keys must reside on the filesystem (`NAGAD_PRIVATE_KEY_PATH`, mode 0600), never in environment variables or database columns.
   - Database tables store ONLY secret references (`secret_ref` and `key_version`), never plaintext API keys.
3. **Zero-Trust Webhooks:** Verify HMAC signatures or RSA tokens on all payment and courier webhooks. Immediately redact sensitive credentials before logging to `webhook_event`.
4. **Idempotent Operations:** Enforce `X-Idempotency-Key` headers on order submissions and unique event keys on payment and courier webhooks. Duplicate requests must return HTTP 200 without executing duplicate actions.
5. **Rate Limiting (Redis):**
   - Admin Login: Max 5 failed attempts per 15 minutes (triggers account lockout).
   - Order Tracking: Max 5 requests per minute per IP+phone.
   - Order Completion: Max 10 requests per minute per IP.
   - Inbound Webhooks: Max 100 requests per minute per provider.
6. **Order Tracking Privacy:** `/track-order` requires BOTH Order ID AND Phone Number. Phone numbers in responses must be masked (`017****5678`).
7. **Immutable Audit Ledger:** Table `audit_log` is protected by database trigger `trg_prevent_audit_log_mutation` which raises an exception on any `UPDATE` or `DELETE` statement.
8. **No Secret Leakage:** Never log raw passwords, authorization headers, full credit card/account numbers, or customer MSISDN in application logs.
9. **Meilisearch Shield:** The public search index must NEVER contain `cogs_paisa`, `cost_per_unit_paisa`, supplier identities, or internal profit margin calculations.
10. **Asset Upload Validation:** All uploads must pass MIME type allowlist verification (`image/jpeg`, `image/png`, `image/webp`), size limits (max 5MB), and script/SVG executable scanning.

---

## 7. Code-Quality Rules

1. **Strict TypeScript:** No implicit `any`. No unused `@ts-ignore` statements without an accompanying one-line explanation.
2. **Naming Conventions:**
   - Directories & Files: `kebab-case.ts`
   - React Components: `PascalCase.tsx`
   - Functions & Variables: `camelCase`
   - Database Tables: `snake_case` (singular for Medusa custom models, e.g. `order_bd_details`, `delivery_zone`)
   - Integer Paisa Columns: `*_paisa` (e.g. `cogs_paisa`, `customer_paid_delivery_paisa`)
3. **Async / Await:** Use modern async/await syntax; avoid raw promise chaining.
4. **Error Handling:** Avoid catching errors without logging or rethrowing. API routes must map errors to structured JSON format:
   ```json
   {
     "statusCode": 400,
     "error": "BAD_REQUEST",
     "message": "Human readable explanation",
     "timestamp": "2026-10-24T12:00:00.000Z"
   }
   ```
5. **Medusa Query over Raw SQL:** Prefer Medusa Query and remote links for domain reads. Raw SQL is permitted only for complex reporting views (`database.md` §4).
6. **Build Cleanliness:** Ensure `npm run build:medusa` and `npm run build:web` pass without errors after every change.
7. **Scoped Diffs:** Keep changes focused on the prompt at hand. Do not perform drive-by refactorings across unrelated files.

---

## 8. Testing Rules

1. **Release Gates:** Every pull request or prompt completion must pass the corresponding verification criteria in `quality-checklist.md`. P0 failures strictly block release.
2. **Evidence-Based Pass:** Mark checklist items `[x]` only with verifiable evidence (terminal output, API curl status, database row inspection, or browser screenshot).
3. **Mandatory Automated Coverage:**
   - Concurrency inventory lock test (verifying atomic stock reservation under parallel checkout).
   - Buy Now 3-case cart preservation test.
   - Zero-orphan payment cancel/failure test (cart stays intact, no order created).
   - Stale price rejection at checkout.
   - Manual return review protection (proves no automatic approval).
   - RBAC 403 Forbidden matrix test.
   - `money.ts` precision rounding unit tests.
   - Audit log PostgreSQL trigger immutability rejection test.
4. **Integration Realism:** Integration tests must run against live Docker PostgreSQL and Redis containers, not mocked in-memory stubs.
5. **Disaster Recovery Drill:** Before public launch, execute the database backup and restore drill (`scripts/restore-db.sh`) to prove 100% data recoverability (AC-12.3 / CHK-SEC-05).

---

## 9. Comprehensive "Do-Not-Do" Rules

- **DO NOT** install `@insforge/sdk` or follow InsForge instructions from `AGENTS.md`.
- **DO NOT** implement multi-vendor marketplace features, vendor commissions, or vendor portals.
- **DO NOT** add SSLCommerz, Shurjopay, Foster, or card payment gateways.
- **DO NOT** create a Medusa Order before verified online payment capture.
- **DO NOT** trust payment gateway redirect query parameters alone.
- **DO NOT** silently clear or overwrite cart contents on Add to Cart, Buy Now, or Campaign checkout.
- **DO NOT** auto-increment quantity on Buy Now if the selected variant is already in the cart.
- **DO NOT** auto-approve returns or auto-execute refund payments.
- **DO NOT** auto-restock returned or RTO items without manual physical inspection.
- **DO NOT** collapse the 4 independent status dimensions into a single status column.
- **DO NOT** store integer paisa values into Medusa core decimal columns or decimal BDT into custom `*_paisa` columns.
- **DO NOT** display "Net Profit" in financial reports (use "Contribution Profit").
- **DO NOT** merge customer delivery fees collected with business courier costs incurred.
- **DO NOT** expose COGS, product costs, or margins to storefront APIs or Meilisearch.
- **DO NOT** hardcode delivery fees or district lists in frontend JSX components.
- **DO NOT** upgrade Tailwind CSS to v4 (lock to 3.4.x).
- **DO NOT** drop or alter Docker volumes or the 5 legacy Prisma tables (`categories`, `order_items`, `orders`, `products`, `users`).
- **DO NOT** commit plaintext `.env` files, API keys, or private certificates to Git.
- **DO NOT** silently decide open business questions (O-01 to O-15).
- **DO NOT** implement Meta CAPI as a Phase 1 blocker (Phase 2 only).
- **DO NOT** begin Prompt N+1 in `prompt.md` while Prompt N's Done-When criteria remain unverified.
- **DO NOT** create a standalone `sms_log` table — use native `notification` + `sms_delivery_detail`.
- **DO NOT** create a parallel return entity — use native `return` + `return_review`.
- **DO NOT** use v1.0 draft model names (`order_return_request`, `PaymentTransaction`, `payment_webhook_log`, `CourierShipmentLog`, `DeliveryZoneConfig`, `vat_config`, `bd_settings` mega-table). Use v2.0 canonical names from `database.md` §2.2.
- **DO NOT** store Nagad private keys in environment variables or database columns — use filesystem path (`NAGAD_PRIVATE_KEY_PATH`, mode 0600).

---

## 10. Documents to Read Before Implementing a Feature

Always read **`agent.md` (this file)** and the specific prompt in **[`prompt.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/prompt.md)** first.

Then, consult the authoritative spec documents by topic:

| If you are working on... | Read in this exact order: |
|---|---|
| **Database, Tables, Fields, Money Math** | [`database.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/database.md) §1–2, §3.x (specific module), §5, §6, §9.2 |
| **Business Requirements & Acceptance Criteria** | [`prd.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/prd.md) corresponding section + §15–18 |
| **Data Flows, Webhooks, Queues, Pipelines** | [`dfd.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/dfd.md) P1.0–P9.0, §4.x Level 2 diagrams, §6.3 |
| **Architecture, Modules, Routes, Middleware** | [`docs/architecture.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/docs/architecture.md) corresponding sections |
| **Resolved Conflicts & Open Owner Decisions** | [`final-system-validation.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/final-system-validation.md) §2 (Resolved Conflicts), §3 (O-01 to O-15) |
| **Verification & Release Gates** | [`quality-checklist.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/quality-checklist.md) corresponding checklist IDs (CHK-*) |
| **Customer Experience & Visual Flow** | [`user-journeys.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/user-journeys.md) Journeys 1–10 |
| **Execution Sequence & Done-When Criteria** | [`prompt.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/prompt.md) Prompts 01–18 |

### Document Authority Order:
1. **Installed Medusa v2.22.x Behavior** (`node_modules/@medusajs/*`)
2. **`database.md`** (Canonical Data Model & Money Math)
3. **`prd.md`** (Business Requirements & Acceptance Criteria)
4. **`dfd.md`** (Process Flows, Queues & Pipelines)
5. **`docs/architecture.md`** (System Topology & Components)
6. **`prompt.md`** (Execution Plan & Prompts)
7. **`agent.md`** (Standing Engineering Policy)

*If `prd.md` and `database.md` disagree on a requirement, PRD wins and `database.md` must be extended. If they disagree on a column that native Medusa already owns, Medusa + `database.md` win.*

---

*Last Updated: 2026-10-24. Keep this file synchronized whenever core specifications change.*
