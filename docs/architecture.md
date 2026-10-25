# Final System Architecture
## Bangladesh Single-Vendor E-commerce Platform

**Document Version:** 2.0 — Final Reconciled  
**Status:** Authoritative Reference  
**Date:** 2026-10-24  
**Reconciled With:**
- [`docs/architecture-review.md`](architecture-review.md) — 28 Review Findings Resolved
- [`prd.md`](../prd.md) — v2 (Reconciled)
- [`technical-plan.md`](../technical-plan.md) — v1.0
- [`docs/architecture-decision-medusa-v2.md`](architecture-decision-medusa-v2.md) — ADR
- [`user-journeys.md`](../user-journeys.md) — Draft v1
- [`quality-checklist.md`](../quality-checklist.md) — QA Reference (Reconciled)

---

## Table of Contents

1. [System Overview & Guiding Principles](#1-system-overview--guiding-principles)
2. [Layer Architecture](#2-layer-architecture)
3. [Monorepo & Directory Structure](#3-monorepo--directory-structure)
4. [Module Boundaries & Responsibility Map](#4-module-boundaries--responsibility-map)
5. [API Communication Architecture](#5-api-communication-architecture)
6. [Authentication, Authorization & Staff Security](#6-authentication-authorization--staff-security)
7. [Caching Strategy & Concurrency (Redis)](#7-caching-strategy--concurrency-redis)
8. [Search Architecture & Data Protection (Meilisearch)](#8-search-architecture--data-protection-meilisearch)
9. [Payment Architecture (COD, bKash, Nagad)](#9-payment-architecture-cod-bkash-nagad)
10. [Courier & Fulfillment Architecture (Steadfast, Pathao, RedX)](#10-courier--fulfillment-architecture-steadfast-pathao-redx)
11. [SMS Notification Architecture](#11-sms-notification-architecture)
12. [Data Architecture & DML Models (PostgreSQL)](#12-data-architecture--dml-models-postgresql)
13. [Workflow Engine & Reliability Guarantees](#13-workflow-engine--reliability-guarantees)
14. [Storefront Architecture (Next.js 15)](#14-storefront-architecture-nextjs-15)
15. [Admin Panel Architecture (Medusa Admin)](#15-admin-panel-architecture-medusa-admin)
16. [Content Management & Theming System](#16-content-management--theming-system)
17. [Invoice & PDF Generation System](#17-invoice--pdf-generation-system)
18. [Deployment Boundary & Infrastructure](#18-deployment-boundary--infrastructure)
19. [Security Architecture & Fraud Defense](#19-security-architecture--fraud-defense)
20. [Observability, Audit Logging & Reliability](#20-observability-audit-logging--reliability)
21. [Environment Configuration Reference](#21-environment-configuration-reference)
22. [Architecture Decision Log](#22-architecture-decision-log)

---

## 1. System Overview & Guiding Principles

### 1.1 Platform Identity
A **single-vendor B2C e-commerce platform** custom-engineered for Bangladesh. The platform operates under a single merchant business model: single BDT currency (৳), single centralized inventory/warehouse, mobile-first responsive storefront, and a unified Medusa Admin panel for managing catalog, orders, COD call center queues, courier dispatch, manual return/refund processing, campaign landing pages, content pages, and contribution-margin financial reporting.

**Single-Vendor Rule:** There are NO multi-vendor capabilities, vendor registration, vendor commissions, sub-merchant split payments, or multi-tenant schemas. All products, inventory, and orders belong strictly to the single store entity.

### 1.2 Technology Stack (Locked)

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Commerce Backend** | MedusaJS | v2.x (`@medusajs/medusa@^2.0`) | Headless commerce engine, DML, workflows, admin |
| **Admin UI** | Medusa Admin (`@medusajs/ui`) | Embedded in backend | Native React SPA at `/app` with widgets & custom routes |
| **Storefront** | Next.js App Router | 15.x | Server Components (RSC), SSR, bilingual routing |
| **Storefront Styling** | Tailwind CSS | **3.4.x (locked — do NOT upgrade to v4)** | Mobile-first CSS utility framework |
| **ORM / Data Layer** | MikroORM + Medusa DML | Bundled with Medusa v2 | Schema definitions, relations, migrations |
| **Primary Database** | PostgreSQL | 16-alpine | ACID relational database, audit logs, snapshots |
| **Cache / Queue / Pub-Sub** | Redis | 7-alpine | Workflows, distributed locks, rate limits, session store |
| **Full-Text Search** | Meilisearch | v1.11 | Typo-tolerant Banglish instant search |
| **Runtime** | Node.js | 20+ LTS | Asynchronous server runtime |
| **Storefront SDK** | `@medusajs/js-sdk` | Latest | Type-safe communication with Medusa API |

### 1.3 Guiding Principles

1. **Medusa First** — Utilize native Medusa v2 core primitives (Product, Inventory, Cart, Order, Payment Collection, Workflows) without reinventing generic commerce logic. Extensions are strictly confined to Bangladesh-specific operational and market requirements.
2. **Module Isolation** — Every Bangladesh-specific capability lives in its own Medusa custom module with encapsulated DML models, services, and event subscribers. Inter-module communication uses Medusa's Module Link system; no direct foreign-key coupling to core models.
3. **Workflow Transactions & Outbox Pattern** — All multi-step state mutations (Order Placement, COD Confirmation, Courier Booking, RTO Condition Review, Manual Refunds) are implemented as Medusa Workflows with compensation logic. Irreversible external actions (such as SMS dispatch) execute strictly as the final step after database commitment.
4. **Zero-Trust External Callbacks** — Payment gateway redirect callbacks (bKash/Nagad) and courier webhooks never trust client-provided payloads. Payments are captured only after an authenticated server-to-server execute/status query succeeds.
5. **Single Source of Truth** — Storefront, campaign landing pages, and admin tools share the exact same underlying catalog, pricing, cart, and inventory records. No shadow catalogs or parallel stock tables.
6. **Bangladesh Operational Reality** — Accommodate COD dominance (>80% volume), call-center confirmation workflows, courier delivery fee splits, manual return condition inspections, and strict 4-field status separation.

---

## 2. Layer Architecture

```
PRESENTATION LAYER
  Next.js Storefront (Port 3000)          Medusa Admin UI (Port 9000/app)
  - App Router + RSC                       - Embedded SPA (Vite + React)
  - Bilingual (BN/EN, Inter + Hind)        - @medusajs/ui Design System
  - One-Page Checkout (4-Tier Address)     - Custom Routes: COD Queue, Manual Order,
  - Campaign Landing Pages (Unified Cart)    Manifest, Returns, Content, Invoices
  - Meta Pixel (Client-Side Tracking)      - RBAC Role Gated (Owner/Manager/Staff)
        |                                          |
        | HTTPS / REST (@medusajs/js-sdk)          | HTTPS / REST (Bearer JWT)
        v                                          v

API GATEWAY & ROUTER LAYER
  MedusaJS v2 HTTP Router
  /store/*   — Public Storefront API (CORS-restricted, rate-limited, cart token)
  /admin/*   — Protected Admin API (Bearer JWT, RBAC middleware, audit logged)
  /hooks/*   — Provider Webhooks (bKash/Nagad execute check, courier HMAC/RSA)
  /api/*     — Custom Bangladesh Storefront Endpoints (order tracking, invoices)

COMMERCE DOMAIN LAYER
  MEDUSA CORE MODULES        BANGLADESH MODULES         WORKFLOW ENGINE
  - @medusajs/product        - bd-catalog               - order-placement
  - @medusajs/pricing (BDT)  - bd-orders (4-status)     - cod-confirmation
  - @medusajs/inventory      - bd-payments (COD/bKash)  - courier-dispatch
  - @medusajs/cart           - bd-courier (Adapters)    - return-refund (manual)
  - @medusajs/order          - bd-campaigns (Landing)   - sms-notification
  - @medusajs/customer       - bd-reports (Profit/COD)  - cron-cod-expiry (optional)
  - @medusajs/auth           - bd-sms (Gateway)
  - @medusajs/fulfillment    - bd-settings (VAT/Zones)
                             - bd-audit (Audit Log)
                             - bd-content (CMS/Pages)
                             - bd-invoices (PDF Engine)

DATA & INFRASTRUCTURE LAYER
  PostgreSQL 16 (Port 5432)   Redis 7 (Port 6379)    Meilisearch v1.11 (Port 7700)
  - Core Medusa Schema        - Workflow Bull Queues  - Allowed fields index only
  - Custom BD Models          - Event Bus Pub/Sub     - Banglish & synonym rules
  - Audit Trail Table         - Flash-Sale Locks      - Stripped COGS & margin data
  - Immutable Snapshots       - Rate Limit Buckets    - Near-real-time event sync
  - Content & Invoice Data    - Account Lockouts

EXTERNAL INTEGRATION LAYER
  bKash Merchant API (v1.2)   Steadfast / Pathao / RedX   Greenweb / BulkSMSBD
  Nagad PGW (RSA PSS)         Courier APIs                SMS Gateways (Bangla Unicode)
  [Phase 2: Meta CAPI]        Cloudflare R2 / S3          [Phase 2: Auto-Translation API]
```

---

## 3. Monorepo & Directory Structure

```
bd-commerce-platform/                     <- Root Workspace
├── apps/
│   ├── web/                              <- Next.js Storefront (Port 3000)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── [locale]/             <- Bilingual routing (/bn, /en)
│   │   │   │   │   ├── (main)/           <- Standard store layout
│   │   │   │   │   │   ├── page.tsx      <- Homepage (CMS-driven blocks)
│   │   │   │   │   │   ├── products/[handle]/page.tsx  <- PDP
│   │   │   │   │   │   ├── categories/[handle]/page.tsx
│   │   │   │   │   │   ├── cart/page.tsx
│   │   │   │   │   │   ├── checkout/page.tsx <- 4-tier address checkout
│   │   │   │   │   │   ├── track-order/page.tsx <- Rate-limited tracking
│   │   │   │   │   │   └── pages/[slug]/page.tsx <- Policy/CMS pages
│   │   │   │   │   └── lp/[slug]/page.tsx  <- Campaign landing pages (Unified cart)
│   │   │   │   └── api/
│   │   │   │       ├── orders/track/route.ts <- Rate-limited order tracking
│   │   │   │       ├── invoices/[id]/route.ts <- Customer invoice download
│   │   │   │       └── tracking/capi/route.ts <- [Phase 2 Candidate] CAPI proxy
│   │   │   ├── components/
│   │   │   │   ├── ui/                   <- Design tokens, buttons, inputs
│   │   │   │   ├── catalog/              <- PDP, variant chips, sticky ATC
│   │   │   │   ├── checkout/             <- Cascading Division/District/Thana picker
│   │   │   │   ├── landing/              <- Hero, bundle, reviews, embedded checkout
│   │   │   │   ├── cms/                  <- Dynamic homepage section renderers
│   │   │   │   └── common/               <- LanguageSwitcher, WhatsApp widget
│   │   │   └── lib/
│   │   │       ├── medusa.ts             <- @medusajs/js-sdk client
│   │   │       ├── meilisearch.ts        <- Instant search client (search-only key)
│   │   │       ├── localization.ts       <- BN/EN dictionaries & formatters
│   │   │       └── meta-pixel.ts         <- Client-side Meta Pixel tracker
│   │   ├── package.json
│   │   └── next.config.ts
│   │
│   └── medusa/                           <- MedusaJS v2 Backend + Admin (Port 9000)
│       ├── src/
│       │   ├── admin/                    <- Admin Extensions
│       │   │   ├── routes/               <- Custom Admin pages
│       │   │   │   ├── cod-queue/        <- COD Call Center queue & fast actions
│       │   │   │   ├── manual-order/     <- Phone-first BD manual order creation
│       │   │   │   ├── courier-manifest/ <- Consignment batching & thermal print
│       │   │   │   ├── returns/          <- Manual return/refund review queue
│       │   │   │   ├── landing-pages/    <- Campaign page builder
│       │   │   │   ├── content/          <- Homepage sections & policy page CMS
│       │   │   │   ├── reports/          <- Contribution profit & COD reconciliation
│       │   │   │   ├── audit-logs/       <- Central security & operational audit trail
│       │   │   │   └── settings/         <- Zones, VAT, SMS, Gateways, Invoices
│       │   │   └── widgets/              <- UI Widgets injected into native views
│       │   │       ├── cod-verification/ <- order.details.side.before
│       │   │       ├── courier-booking/  <- order.details.after
│       │   │       ├── return-status/    <- order.details.side.before (4th status)
│       │   │       ├── cost-margin/      <- order.details.after (Finance/Owner only)
│       │   │       ├── bdt-pricing/      <- product.details.after
│       │   │       ├── bangla-fields/    <- product.details.after
│       │   │       └── category-attrs/   <- product.details.after
│       │   ├── modules/                  <- Custom Bangladesh Modules
│       │   │   ├── bd-catalog/           <- Translations, category attributes
│       │   │   ├── bd-orders/            <- OrderBdDetails, RiskProfile, ReturnRequest
│       │   │   ├── bd-payments/          <- COD, bKash, Nagad providers
│       │   │   ├── bd-courier/           <- Steadfast, Pathao, RedX adapters
│       │   │   ├── bd-campaigns/         <- LandingPage model & builder logic
│       │   │   ├── bd-reports/           <- Contribution profit & COD reconciliation
│       │   │   ├── bd-sms/               <- SMS provider abstraction & templates
│       │   │   ├── bd-settings/          <- Zones, VAT settings, API keys
│       │   │   ├── bd-audit/             <- Audit logging service & subscribers
│       │   │   ├── bd-content/           <- Homepage sections & CMS content pages
│       │   │   └── bd-invoices/          <- Server-side PDF generation & templates
│       │   ├── subscribers/              <- Medusa event listeners for audit & search
│       │   ├── workflows/                <- Transactional Workflow Definitions
│       │   │   ├── order-placement.ts
│       │   │   ├── cod-confirmation.ts
│       │   │   ├── courier-dispatch.ts
│       │   │   ├── sms-notification.ts
│       │   │   ├── return-refund.ts      <- Strictly manual review & recording
│       │   │   ├── meilisearch-sync.ts   <- Strict field allowlist sync
│       │   │   └── cod-expiry-cron.ts    <- [Disabled by default, Q#18 placeholder]
│       │   └── api/                      <- Custom API Route Handlers
│       │       ├── store/                <- /store/landing-pages, /store/content, track
│       │       ├── admin/                <- /admin/audit-logs, /admin/invoices, manual-order
│       │       └── hooks/                <- /hooks/bkash, /hooks/nagad, /hooks/courier
│       ├── medusa-config.ts              <- Master config: DB, Redis, modules
│       ├── package.json
│       └── tsconfig.json
│
├── docs/                                 <- Architecture & Review Documentation
│   ├── architecture.md                   <- THIS FILE (authoritative reference)
│   ├── architecture-review.md            <- Complete gap analysis & critique
│   └── architecture-decision-medusa-v2.md
├── docker-compose.yml                    <- PostgreSQL, Redis, Meilisearch
├── .env                                  <- Secrets (untracked)
├── .env.example                          <- Public template
└── package.json                          <- Root workspace orchestrator
```

---

## 4. Module Boundaries & Responsibility Map

### 4.1 Core Medusa Modules (Native — Do Not Override)

| Module | Responsibility | Strict Boundary Rule |
|---|---|---|
| `@medusajs/product` | Base product, variants, options, categories | Extend via `bd-catalog` links; do not fork core schema |
| `@medusajs/pricing` | Price sets, currency rules (BDT only) | Regional pricing managed through custom Admin Widget |
| `@medusajs/inventory` | Variant stock levels, reservations | Reservations managed atomically via Medusa Inventory API |
| `@medusajs/cart` | Cart sessions, line items, discounts | Single unified cart per session; no shadow/parallel carts |
| `@medusajs/order` | Order entity, totals, line items | Extended via `order_bd_details` Module Link |
| `@medusajs/customer` | Customer identity, addresses | Phone-first authentication; email optional |
| `@medusajs/auth` | JWT issuance, password hashing, sessions | Admin auth extended with forced password change & lockout |
| `@medusajs/fulfillment` | Shipping options, fulfillment sets | BD zones implemented via custom fulfillment provider |
| `@medusajs/payment` | Payment collections & sessions | COD, bKash, Nagad registered as `AbstractPaymentProvider` |

### 4.2 Bangladesh Custom Modules

#### `bd-catalog` — Catalog Localization & Attributes
- **Owns:** `product_localization`, `category_attribute`, `product_attribute_value`.
- **Boundary:** Reads core product/category IDs; persists Bangla title, description excerpt, full Bangla body, and dynamic category attributes (e.g. fabric, size chart, warranty).
- **APIs:** `GET /store/products/:id/localization`, `GET /admin/products/:id/localization`, `POST /admin/products/:id/localization`.

#### `bd-orders` — Order Bangladesh Extension & 4-Status Lifecycle
- **Owns:** `order_bd_details`, `customer_risk_profile`, `return_review` (canonical 1:1 extension of native `return` + `return_item`).
- **Boundary:** Linked 1:1 with Medusa `order_id`. Manages the **4-status separation**:
  1. Core Order Status: `open`, `completed`, `canceled`.
  2. Payment Status: `pending`, `authorized`, `captured`, `partially_refunded`, `refunded`.
  3. Shipment State: `pending_confirmation`, `ready_to_ship`, `dispatched`, `in_transit`, `out_for_delivery`, `delivered`, `delivery_failed`, `rto_initiated`, `rto_received`.
  4. Return/Refund Status (`return_review.status`): `none`, `pending_manual_review`, `approved`, `rejected`, `info_requested`, `item_received_evaluating`, `completed`.
- **COD Settlement Tracking:** Manages 3 separate figures per FR-14.9:
  - `customer_paid_delivery`: Fee charged to customer (e.g., ৳60 or ৳130).
  - `courier_cost_to_business`: Fee charged by courier to merchant (e.g., ৳50 or ৳110).
  - `cod_remittance_received`: Actual net cash remitted by courier.
- **APIs:** `GET /admin/orders/:id/bd-details`, `PATCH /admin/orders/:id/cod-confirm`, `POST /admin/orders/:id/courier-book`, `GET /admin/customers/:phone/risk-profile`.

#### `bd-payments` — Local Payment Gateways
- **Owns:** Payment providers `pp_cod`, `pp_bkash`, `pp_nagad`.
- **Boundary:** Registered as `AbstractPaymentProvider` plugins. Implements zero-orphan redirect architecture (orders created only upon verified capture).
- **Security Rule:** Webhooks/callbacks never trust incoming request body status; must execute server-to-server validation.

#### `bd-courier` — Courier Dispatch & Tracking Adapters
- **Owns:** Courier provider interface and adapters (`SteadfastAdapter`, `PathaoAdapter`, `RedXAdapter`, `ManualCourierAdapter`).
- **Boundary:** Invoked strictly via `courier-dispatch` workflow; parses webhooks and maps courier parcel statuses to internal `shipment_state`.

#### `bd-campaigns` — Landing Page Engine
- **Owns:** `landing_page` model.
- **Boundary:** Reads live products and inventory via Medusa SDK. Embedded checkout binds to the customer's unified cart (preserving any existing items) and submits idempotently.

#### `bd-reports` — Contribution Profit & Financial Reconciliation
- **Owns:** Financial queries and cost attribution logic.
- **Boundary:** Strictly read-only queries against PostgreSQL. Produces Contribution Profit before/after advertising, COD settlement reconciliation, and RTO damage loss reports.

#### `bd-sms` — SMS Gateway Abstraction
- **Owns:** `SmsProvider` interface, adapters (`Greenweb`, `BulkSMSBD`, `Onnorokom`, `MockAdapter`), message templates, and `sms_log`.
- **Boundary:** Dispatched exclusively as the final non-compensatable step in workflows or outbox subscribers.

#### `bd-settings` — Bangladesh Configuration & VAT Infrastructure
- **Owns:** `bd_settings` model (Delivery zone flat rates, free shipping threshold, SMS API keys, Meta Pixel ID, bKash/Nagad credentials, design tokens).
- **VAT Infrastructure (FR-11.4):** Models `vat_enabled: boolean` (default false), `vat_rate_percent: number`, `vat_registration_number: string`, `vat_display_on_invoice: boolean`.

#### `bd-audit` — Security & Operational Audit Log (Critical Baseline)
- **Owns:** `audit_log` model and subscriber listeners.
- **Boundary:** Automatically captures who, what, when, old values, new values, IP address, and stated reason for sensitive actions (price/stock updates, return/refund actions, role changes, settings modifications, manual order creation).
- **APIs:** `GET /admin/audit-logs` (strictly restricted to Owner and Finance roles).

#### `bd-content` — Content Management System (Homepage & Pages)
- **Owns:** `homepage_section` and `content_page` models.
- **Boundary:** Enables non-technical admin staff to manage homepage sections (hero banners, featured collections, trust badges) and policy pages (Terms, Privacy, Shipping, Return & Refund Policy) with draft, preview, publish, and instant rollback.
- **APIs:** `GET /store/content/homepage`, `GET /store/content/pages/:slug`, `POST /admin/content/*`.

#### `bd-invoices` — Server-Side PDF & Invoice Management
- **Owns:** `invoice_template` model and PDF generation service.
- **Boundary:** Generates immutable printable invoices compiled strictly from the historical order-time financial snapshot (`order_line_item` snapshot, discounts, delivery charge, and conditional VAT line).
- **APIs:** `GET /admin/orders/:id/invoice`, `GET /store/orders/:id/invoice` (signed token download).

---

## 5. API Communication Architecture

### 5.1 Route Namespaces & Access Control

| Route Prefix | Consumer | Auth Requirement | Rate Limit |
|---|---|---|---|
| `/store/*` | Next.js Storefront (RSC / Client) | Public / Cart Token in cookie | 60 req/min per IP |
| `/store/orders/track` | Customer order tracking | Order ID + 11-digit phone match | 10 req/min per IP (lockout on 3 fails) |
| `/admin/*` | Medusa Admin SPA (`/app`) | Bearer JWT + RBAC Role Check | 120 req/min per staff user |
| `/admin/audit-logs` | Admin Security / Finance | Bearer JWT + Role: Owner / Finance | 30 req/min |
| `/hooks/*` | bKash, Nagad, Courier Webhooks | Server-to-server signature / HMAC verification | 100 req/min per provider IP |
| `/api/*` | Next.js Internal API routes | Next.js server context | Internal only |

### 5.2 Storefront <-> Backend Communication

```
Next.js Server Component (RSC)
  -> @medusajs/js-sdk (Internal server call, no browser exposure)
  -> MedusaJS v2 /store/*
  -> PostgreSQL (direct read via backend)

Next.js Client Component (Cart mutations, checkout submission)
  -> @medusajs/js-sdk (using publishable_key)
  -> MedusaJS v2 /store/carts/*, /store/orders
  -> X-Idempotency-Key header attached to every state mutation

Instant Search:
  -> Browser -> Meilisearch /indexes/products/search (Public search-only key)
  -> Stripped document structure (NO COGS, NO MARGINS)
```

### 5.3 Webhook Ingestion & Zero-Trust Protocol

```
External Provider POST /hooks/{provider}
  │
  ├── 1. Signature / Token Validation Middleware
  │     ├── INVALID -> Return 401 Unauthorized + write audit log + fire security alert
  │     └── VALID -> Proceed
  │
  ├── 2. Provider Verification (Zero-Trust)
  │     ├── bKash / Nagad: DO NOT trust request payload status.
  │     │   Execute server-to-server verification query (POST /checkout/payment/execute).
  │     │   Verify amount, currency="BDT", transactionStatus="Completed".
  │     └── Courier (Steadfast/Pathao): Verify consignment ID matches database record.
  │
  ├── 3. Transactional Workflow Execution (Medusa Workflow Engine)
  │     └── DB updates, inventory state, outbox SMS dispatch
  │
  └── 4. Return 200 OK to Provider
```

### 5.4 Meta Tracking Architecture (Phase 1 Pixel vs Phase 2 CAPI)

- **Phase 1 Baseline (Confirmed):** Client-side Meta Pixel loaded via Next.js script (`NEXT_PUBLIC_META_PIXEL_ID`). Tracks `ViewContent`, `AddToCart`, `InitiateCheckout`, and `Purchase` events. Captures UTM parameters from URL and attaches them to order metadata.
- **Phase 2 Candidate (Post-Launch Enhancement per PRD FR-5.3.7):** Dual-layer Server Conversions API (CAPI) proxy route (`/api/tracking/capi`) is documented in architecture but deferred to Phase 2 pending business privacy and customer consent review.

---

## 6. Authentication, Authorization & Staff Security

### 6.1 Customer Authentication
- **Guest Customer (Primary):** No mandatory registration. Cart bound to `cart_id` in secure HTTP-only cookie. Order tracking authenticated via combination of `Order ID` + customer's exact 11-digit mobile phone number.
- **Registered Customer (Optional):** Phone-based login (`POST /store/auth/customer`) returning short-lived JWT in HTTP-only cookie.

### 6.2 Staff Accounts & Login Security (A-6 Resolved)

1. **Forced Password Change on First Login (FR-8.2.5):**
   - When Owner/Admin provisions a new staff account, `user.metadata.must_change_password` is set to `true`.
   - Medusa Admin authentication middleware intercepts all requests: if `must_change_password === true`, all API access is blocked except `POST /admin/auth/change-password`.
2. **Account-Level Lockout Defense (FR-8.2.7):**
   - Distinct from IP rate limiting: Redis key `auth:lockout:{user_email}` tracks consecutive failed login attempts per account.
   - 5 consecutive failed attempts → Account locked for 15 minutes across all IPs.
   - Failed attempts and lockout triggers are immediately recorded in `audit_log` and flagged to Owner.
3. **Session Invalidation (FR-8.2.6):**
   - Changing password or modifying a staff member's role/permissions immediately invalidates all active JWT/refresh session tokens in Redis.
4. **Privileged Account 2FA (FR-8.2.9):**
   - 2FA/TOTP required for Owner and Store Manager accounts where supported by the deployment environment.

### 6.3 Role-Based Access Control (RBAC) Matrix

| Feature / Area | Super Admin / Owner | Store Manager | Call Center Staff | Warehouse Staff | Finance / Accounts |
|---|---|---|---|---|---|
| **Catalog & Products** | Full CRUD | Full CRUD | View Only | View Only | View Only |
| **Pricing & BDT Rates** | Full CRUD | Edit Standard | View Only | View Only | View Only |
| **COGS & Cost Margin** | Full Access | No Access | No Access | No Access | Full Access |
| **Orders & COD Queue** | Full Access | Full Access | Confirm/Add Notes | View Confirmed | View Only |
| **Manual Order Route** | Full Access | Full Access | Create Orders | No Access | No Access |
| **Courier Dispatch** | Full Access | Full Access | No Access | Book & Print | View Only |
| **Returns / Refunds** | Authorize & Payout | Review / Inspect | Log Request | Receive / Inspect | Record Payout |
| **Audit Logs Viewer** | Full Access | No Access | No Access | No Access | Full Access |
| **Content & Pages** | Publish / Rollback | Publish / Rollback | No Access | No Access | No Access |
| **Invoices & Templates** | Full Access | Print Invoices | Print Invoices | Print Invoices | Full Access |
| **System Settings** | Full Access | View Only | No Access | No Access | Gateway View |

---

## 7. Caching Strategy & Concurrency (Redis)

### 7.1 Redis Key Registry

| Key Pattern | TTL | Role | Purpose |
|---|---|---|---|
| `bull:medusa-*` | Persistent | Workflow Queue | BullMQ job queue for Medusa Workflows |
| `stock:lock:{variant_id}` | 30s | Distributed Mutex | Atomic lock during concurrent checkout |
| `auth:lockout:{user_email}` | 15 min | Security | Staff account lockout after 5 failed logins |
| `ratelimit:{ip}:{endpoint}` | 60s | Token Bucket | Endpoint abuse protection |
| `ratelimit:track:{ip}` | 60s | Phone Privacy | Rate limit on order tracking lookups |
| `cart:{cart_id}` | 24h | Session Cache | Cached cart payload to reduce DB reads |
| `sms:ratelimit:{order_id}:{event}` | 1h | Deduplication | Max 3 SMS per order per event type |

### 7.2 Concurrency & Inventory Integrity
- **Atomic Decrement:** Inventory is reserved via Medusa Inventory Module inside an atomic transaction when an order is submitted (not at cart add).
- **Concurrent Checkout Protection:** For low-stock variants, a Redis distributed mutex (`stock:lock:{variant_id}`) ensures serialized stock evaluation. If variant stock reaches 0, concurrent checkouts fail gracefully with a localized out-of-stock notification.
- **COD Stock Reservation Expiry Policy [Open Q#18 Acknowledged]:**
  - *Phase 1 Baseline:* Orders reserve stock immediately upon placement. Stock remains reserved until staff explicitly confirms or cancels the order via `/app/cod-queue`.
  - *Scheduled Expiry Infrastructure:* A scheduled workflow `cron.cod-expiry-check` is implemented in architecture but remains **DISABLED by default**. If the owner activates automatic cancellation (e.g. 48 hours unreachable), the cron can be enabled via `bd_settings.cod_expiry_hours` without code changes.

### 7.3 Rate Limiting & Protection Rules

| Endpoint | Threshold | Window | Breach Action |
|---|---|---|---|
| `POST /store/carts/*` | 60 req/min | Per IP | HTTP 429 Too Many Requests |
| `POST /store/orders` | 5 req/min | Per IP | HTTP 429 (Prevent checkout spam) |
| `GET /store/orders/track` | 10 req/min | Per IP | 3 failed lookups → 15-minute IP block or CAPTCHA |
| `POST /admin/auth` | 5 req/min | Per IP & User | Redis account lockout + audit log alert |
| `POST /hooks/*` | 100 req/min | Per provider IP | HTTP 429 |

---

## 8. Search Architecture & Data Protection (Meilisearch)

### 8.1 Index Configuration: `products`
- **Primary Key:** `id` (Medusa Product ID).
- **Searchable Attributes (Weighted):** `title_en` (10), `title_bn` (9), `sku` (8), `category_name` (7), `tags` (5), `description_excerpt` (3).
- **Filterable Attributes:** `category_id`, `category_handle`, `status`, `in_stock`, `price_bdt`, `attribute_*`.
- **Sortable Attributes:** `price_bdt`, `created_at`, `popularity_score`.
- **Typo Tolerance & Banglish:** Configured with Bengali phonetic synonyms (e.g., "punjabi" ↔ "পাঞ্জাবি", "sharee" ↔ "শাড়ি").

### 8.2 Confidential COGS & Margin Exclusion (C-1 Resolved)
To prevent confidential financial data leakage through the public browser search key (`NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY`), the synchronization service enforces a **strict allowlist**:

```typescript
// Strict Allowlist of indexed fields:
const ALLOWED_INDEX_FIELDS = [
  "id", "title", "title_bn", "handle", "description_excerpt",
  "sku", "category_id", "category_handle", "category_name",
  "tags", "status", "in_stock", "price_bdt", "original_price_bdt",
  "thumbnail", "popularity_score", "created_at", "attribute_*"
];

// STRICT EXCLUSION DENYLIST (Stripped prior to indexing):
const EXCLUDED_FIELDS = [
  "cogs_bdt", "cogs_total", "cost_price", "supplier_info", "margin", "metadata.cogs"
];
```

### 8.3 Soft Delete Handling (D-4 Resolved)
When a product is deleted or archived in Medusa, the subscriber intercepts `product.deleted` and immediately issues `DELETE /indexes/products/documents/{id}` using the product ID directly from the event payload. The sync step **does not re-fetch** the product from PostgreSQL, eliminating race conditions and 404 errors.

---

## 9. Payment Architecture (COD, bKash, Nagad)

### 9.1 Zero-Orphan Payment Redirect Architecture (B-2 Resolved)
To eliminate orphan orders and dangling inventory reservations when customers abandon online payment gateways:
1. When customer selects bKash or Nagad, the backend initializes a `PaymentSession` (`initiatePayment()`).
2. **The Medusa Order is NOT created at this point.**
3. The customer's cart (`cart_id`) remains open, valid, and preserved in browser storage/cookies.
4. If the customer cancels on the gateway or payment fails:
   - Gateway redirects to `/checkout?payment_error=cancelled`.
   - The cart, customer phone number, and address inputs remain completely intact.
   - Zero orders created; zero inventory reserved or stranded.
5. Only when the gateway redirects to the callback route with success credentials does the server execute the verification call and, upon confirmed success, run the `order-placement` workflow.

### 9.2 COD Payment & Call Center Lifecycle
- Customer places order with COD -> `order_bd_details.cod_status = "unconfirmed"`.
- Inventory is atomically reserved; order placed in Call Center Queue (`/app/cod-queue`).
- Staff calls customer:
  - Confirmed: `cod_status -> "confirmed"`, shipment state -> `ready_to_ship`, SMS sent.
  - Unreachable: Call attempt logged in notes (Attempt 1, 2, 3).
  - Canceled: `cod_status -> "canceled"`, inventory immediately released.
- Courier delivers parcel:
  - Courier webhook triggers `CodProvider.capturePayment()`.
  - Payment marked `captured`; actual cash remitted recorded.
- **Partial COD Delivery (D-3 Resolved):** If a customer accepts partial items from a multi-item parcel, the courier collects partial cash. The full authorized amount is captured, a manual credit adjustment is logged in finance, and the variance is recorded in `order_bd_details.cod_remittance_received` with reconciliation notes.

### 9.3 bKash Tokenized Direct Integration (C-3 Resolved)
- Direct integration with bKash Tokenized Checkout API v1.2.0-beta.
- **Zero-Trust Rule:** The `/hooks/bkash/callback` route **never trusts** incoming `paymentID` or `status` parameters in the request body.
- Handler immediately invokes server-to-server execute call:
  `POST https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout/execute` using secure merchant credentials.
- Verification checks:
  1. `transactionStatus === "Completed"`.
  2. `currency === "BDT"`.
  3. Returned `amount` matches expected cart total exactly.
- Upon passing all checks: Payment captured, transaction ID (`trxID`) saved, Medusa Order finalized. Any mismatch triggers a security alert and rejects fulfillment.

### 9.4 Nagad PGW Direct Integration (C-5 Resolved)
- Uses Nagad DFS Check-Out API with RSA-SHA256 signature verification.
- **Private Key Security (C-5):** Nagad merchant RSA private key is NEVER passed as raw PEM in environment variables. Stored as an isolated file referenced via `NAGAD_PRIVATE_KEY_PATH=/etc/secrets/nagad_private.pem` with OS-level permissions `0600` (read-only by the application process).
- Callback executes server-to-server `POST Nagad /api/dfs/check-out/complete/{paymentRefId}` and verifies response signature before marking payment captured.

---

## 10. Courier & Fulfillment Architecture (Steadfast, Pathao, RedX)

### 10.1 4-Tier Bangladesh Address Model (E-3 Resolved)
To satisfy courier API requirements without ambiguous lookups:
- The checkout address and database schema enforce a **4-tier administrative hierarchy**:
  1. **Division:** 8 administrative divisions (`Dhaka`, `Chattogram`, `Rajshahi`, `Khulna`, `Barishal`, `Sylhet`, `Rangpur`, `Mymensingh`).
  2. **District (Zilla):** 64 recognized districts.
  3. **Upazila / Thana:** Police station / sub-district.
  4. **Area / Street Address:** Street, road, house number.
- **Courier Mapping:**
  - **Pathao:** Resolves `city_id` from Division + District, and `zone_id` from Upazila/Thana.
  - **Steadfast & RedX:** Direct mapping to District and Thana names.

### 10.2 Delivery Zones & Flat-Rate Calculation
- Implemented as custom Medusa Fulfillment Provider reading from `bd_settings`:
  - **Inside Dhaka:** Flat rate (default ৳60), mapped to Dhaka City thanas.
  - **Dhaka Suburbs:** Flat rate (default ৳100), mapped to Gazipur, Savar, Keraniganj, Narayanganj.
  - **Outside Dhaka:** Flat rate (default ৳130), all remaining 63 districts.
  - **Free Shipping Threshold:** If cart subtotal >= `bd_settings.free_shipping_threshold` (e.g. ৳2,000), shipping is ৳0.
- Delivery fee snapshot is locked at order creation and cannot be changed by later settings updates.

### 10.3 RTO 3-Step Condition & Restock Workflow (B-4 Resolved)
When an undelivered parcel is returned by courier (RTO):
- **Step 1 — Parcel Receipt:** Warehouse staff marks parcel physically received (`shipment_state = "rto_received"`).
- **Step 2 — Condition Evaluation:** Staff inspects parcel contents and records condition: `sellable`, `damaged`, or `not_restockable` with notes.
- **Step 3 — Controlled Restock:**
  - If `sellable`: Authorized staff clicks "Restock to Inventory". Inventory increments and an entry is written to `audit_log`.
  - If `damaged` / `not_restockable`: Items are segregated; stock is NOT incremented; cost is recorded in `bd-reports` as RTO damage expense.
- Restocking is **NEVER automatic**.

### 10.4 Manual Courier Fallback
If courier APIs are down or merchant uses local riders, staff manually enters consignment tracking ID, selects courier name, and updates shipment states through `/app/orders`.

---

## 11. SMS Notification Architecture

### 11.1 SMS Reliability & Outbox Pattern (D-5 Resolved)
- SMS dispatch is the **final, non-compensatable step** in all workflows. It triggers only after order, inventory, and payment changes have successfully committed to PostgreSQL.
- If an SMS gateway times out, the failure is logged in `sms_log` with a retry queue; it **never rolls back** an already-created order.

### 11.2 SMS Trigger Events & Bangla Unicode Templates

| Event | Recipient | Trigger Workflow | Bangla SMS Template |
|---|---|---|---|
| **Order Placed (COD)** | Customer | order-placement | `আপনার অর্ডার #{id} সফলভাবে গ্রহণ করা হয়েছে। শীঘ্রই কনফার্মেশনের জন্য কল করা হবে।` |
| **Order Paid (Online)** | Customer | bkash/nagad callback | `পেমেন্ট সফল। অর্ডার #{id} নিশ্চিত করা হয়েছে। ধন্যবাদ!` |
| **COD Confirmed** | Customer | cod-confirmation | `আপনার অর্ডার #{id} নিশ্চিত হয়েছে। ৩-৫ কার্যদিবসে ডেলিভারি হবে।` |
| **Dispatched** | Customer | courier-dispatch | `অর্ডার #{id} কুরিয়ারে ({courier}) বুক করা হয়েছে। ট্র্যাকিং: {tracking_url}` |
| **Out for Delivery** | Customer | courier webhook | `আপনার পার্সেল #{id} আজ ডেলিভারি হবে। অনুগ্রহ করে ৳{amount} প্রস্তুত রাখুন।` |
| **Delivered** | Customer | courier webhook | `পার্সেল #{id} সফলভাবে ডেলিভারি সম্পন্ন হয়েছে। কেনাকাটার জন্য ধন্যবাদ!` |
| **Manual Refund Recorded** | Customer | return-refund | `অর্ডার #{id}-এর রিফান্ড (৳{amount}) সম্পন্ন হয়েছে। TrxID: {trx_id}` |

### 11.3 Rate Limiting & Audit
- Redis limits SMS dispatch to max 3 messages per order per event type within 1 hour.
- All outbound SMS logged to `sms_log` with phone (masked: `017****1234`), template, gateway response, and timestamp.

---

## 12. Data Architecture & DML Models (PostgreSQL)

### 12.1 Schema Overview

```
Medusa Core Schema (Migrated by Medusa v2):
  product, product_variant, product_category, price_set, price, region,
  cart, line_item, order, order_line_item, payment_collection, payment_session,
  customer, address, fulfillment, inventory_item, reservation_item, user

Bangladesh Custom Schema (Migrated via Custom Modules):
  product_localization        <- bd-catalog
  category_attribute          <- bd-catalog
  product_attribute_value     <- bd-catalog
  order_bd_details            <- bd-orders
  customer_risk_profile       <- bd-orders
  return_review               <- bd-returns (canonical extension of native return, 4th status model)
  landing_page                <- bd-campaigns
  homepage_section            <- bd-content
  content_page                <- bd-content
  invoice_template            <- bd-invoices
  audit_log                   <- bd-audit
  sms_log                     <- bd-sms
  bd_settings                 <- bd-settings
```

### 12.2 Key DML Models & Status Enums

```typescript
// PENDING OWNER SIGN-OFF — DO NOT MIGRATE without owner approval per PRD Q#3:
export enum ShipmentState {
  PENDING_CONFIRMATION = "pending_confirmation",
  READY_TO_SHIP = "ready_to_ship",
  DISPATCHED = "dispatched",
  IN_TRANSIT = "in_transit",
  OUT_FOR_DELIVERY = "out_for_delivery",
  DELIVERED = "delivered",
  DELIVERY_FAILED = "delivery_failed",
  RTO_INITIATED = "rto_initiated",
  RTO_RECEIVED = "rto_received"
}

export enum CodStatus {
  NOT_APPLICABLE = "not_applicable",
  UNCONFIRMED = "unconfirmed",
  CONFIRMED = "confirmed",
  ESCALATED = "escalated",
  CANCELED = "canceled"
}

export enum ReturnRequestStatus {
  NONE = "none",
  PENDING_MANUAL_REVIEW = "pending_manual_review",
  APPROVED = "approved",
  REJECTED = "rejected",
  INFO_REQUESTED = "info_requested",
  ITEM_RECEIVED_EVALUATING = "item_received_evaluating",
  COMPLETED = "completed"
}

// order_bd_details (Linked 1:1 to Medusa Order)
{
  order_id: string,                 // Foreign key to Medusa Order
  division: string,                 // 8 Divisions
  district: string,                 // 64 Zillas
  thana: string,                    // Upazila / Police Station
  delivery_zone: "inside_dhaka" | "dhaka_suburbs" | "outside_dhaka",
  cod_status: CodStatus,
  cod_confirmed_by: string | null,  // Staff ID
  shipment_state: ShipmentState,
  courier_provider: "steadfast" | "pathao" | "redx" | "manual" | null,
  courier_tracking_code: string | null,
  courier_consignment_id: string | null,
  
  // 3-Way Financial Reconciliation Fields (FR-14.9, B-5):
  customer_paid_delivery: bigint,   // BDT paisa charged to customer
  courier_cost_to_business: bigint, // BDT paisa invoiced by courier
  cod_remittance_received: bigint,  // Actual net cash remitted by courier
  cod_settlement_status: "pending" | "partially_remitted" | "settled" | "disputed",
  
  cogs_total: bigint,               // Snapshot cost of goods in paisa
  utm_source: string | null,
  utm_medium: string | null,
  utm_campaign: string | null,
  landing_page_slug: string | null
}

// audit_log (Critical Security Baseline, A-1)
{
  id: string,
  actor_id: string,                 // Staff user ID or 'system' / 'customer'
  actor_role: string,               // 'owner', 'manager', 'staff', 'system'
  actor_email: string,
  entity_type: "product" | "price" | "inventory" | "order" | "return_refund" | "staff" | "settings" | "content",
  entity_id: string,
  action: "create" | "update" | "delete" | "status_transition" | "refund_record" | "restock" | "lockout",
  old_value: JSON | null,
  new_value: JSON | null,
  ip_address: string,
  stated_reason: string | null,
  created_at: DateTime
}

// return_review (4th Independent Status, A-2 & Canonical Database §3.5.3)
{
  id: string,
  order_id: string,
  return_id: string,                // 1:1 link to native Medusa return
  status: ReturnRequestStatus,      // Independent 4th status dimension
  reason: string,
  item_condition: "uninspected" | "sellable" | "damaged" | "not_restockable",
  refund_method: "bkash" | "nagad" | "bank" | "store_credit",
  refund_target_account: string,
  refund_amount_bdt: bigint,
  refund_trx_id: string | null,     // Manually recorded by Finance staff
  reviewed_by: string | null,
  reviewed_at: DateTime | null,
  created_at: DateTime
}
```

### 12.3 Data Conventions
- **Monetary Values as BigInt Paisa:** 1 BDT = 100 paisa. All prices, discounts, delivery fees, and refunds are stored as `bigint`. Eliminates floating-point calculation errors.
- **Order-Time Financial Snapshot:** All order line items store an immutable snapshot of product title, SKU, variant options, unit price, discount, delivery fee, and COGS at order placement time. Later catalog or pricing edits NEVER alter historical orders.

---

## 13. Workflow Engine & Reliability Guarantees

### 13.1 Workflows Summary

#### 1. `order-placement`
- Step 1: Validate cart, prices, stock, and payment session.
- Step 2: Acquire Redis distributed lock; reserve inventory atomically.
- Step 3: Create Medusa Order record with order-time snapshot.
- Step 4: Authorize/Capture payment (`pp_cod`, `pp_bkash`, `pp_nagad`).
- Step 5: Create `order_bd_details` (zone, delivery fees, COD status, UTMs).
- Step 6: Increment `customer_risk_profile.total_orders_placed`.
- Step 7: Clear storefront cart cookie.
- Step 8 (Final Non-Compensatable Step): Dispatch Order Confirmation SMS.
- Step 9 (Async Non-Blocking): [Phase 2: Fire Meta CAPI Purchase event].

#### 2. `cod-confirmation`
- Step 1: Verify order exists and `cod_status === "unconfirmed"`.
- Step 2: Log staff confirmation note and timestamp to `audit_log`.
- Step 3: Transition `cod_status -> "confirmed"` and `shipment_state -> "ready_to_ship"`.
- Step 4: Dispatch COD Confirmed SMS to customer.

#### 3. `courier-dispatch`
- Step 1: Resolve selected courier adapter (`SteadfastAdapter`, `PathaoAdapter`, `RedXAdapter`).
- Step 2: Format recipient 4-tier address and parcel COD remittance amount.
- Step 3: Call courier API `adapter.createParcel()`.
- Step 4: Persist `consignment_id` and `tracking_code` in `order_bd_details`.
- Step 5: Update `shipment_state -> "dispatched"`.
- Step 6: Dispatch Dispatched SMS with live tracking link.

#### 4. `return-refund` (Strictly Manual Processing — A-2 & B-4 Resolved)
- Step 1: Staff logs return request -> `return_status = "pending_manual_review"`.
- Step 2: Authorized staff reviews request -> marks `approved` or `rejected` with reason (logged to `audit_log`).
- Step 3: Customer returns item -> Staff marks `item_received_evaluating`.
- Step 4: Warehouse staff inspects item condition -> selects `sellable`, `damaged`, or `not_restockable`.
- Step 5: Finance staff manually executes external payment transfer (via bKash/Nagad portal or bank) and inputs verified `refund_trx_id`, amount, and date.
- Step 6: `return_status -> "completed"`, `payment_status -> "refunded"` or `"partially_refunded"`.
- Step 7: If condition is `sellable`, staff triggers manual restock -> inventory increments with audit log entry.
- Step 8: Dispatch Refund Completed SMS to customer.
- *Strict Rule:* No automated refund payouts or automated restocks are executed.

---

## 14. Storefront Architecture (Next.js 15)

### 14.1 Rendering Strategy

| Route | Strategy | Revalidation | Description |
|---|---|---|---|
| `/[locale]` | SSR + ISR | 60s | Dynamic homepage powered by `bd-content` |
| `/[locale]/products/[handle]` | SSR + ISR | 30s | PDP with live stock check |
| `/[locale]/categories/[handle]` | SSR + ISR | 30s | Category catalog with Meilisearch facets |
| `/[locale]/cart` | CSR | Real-time | Unified cart state synced with cookie |
| `/[locale]/checkout` | CSR | Real-time | 4-tier address form, payment options |
| `/[locale]/lp/[slug]` | SSR + ISR | 60s | Campaign landing page with embedded checkout |
| `/[locale]/track-order` | SSR | Real-time | Rate-limited order & return tracking |
| `/[locale]/pages/[slug]` | SSR + ISR | 60s | Policy pages (Terms, Privacy, Returns) |

### 14.2 Campaign Mode B Checkout & Unified Cart (B-3 & B-6 Resolved)
- **Single Unified Cart:** When a visitor lands on a Campaign Landing Page (`/lp/[slug]`) configured with Mode B (Embedded Direct Checkout), the embedded checkout form binds directly to the visitor's existing Medusa cart (`cart_id` from cookie).
- **Line Item Transparency:** The embedded form renders the campaign offer alongside any pre-existing cart items with clear removal and quantity adjustment controls.
- **Idempotency (B-6):** Submitting the embedded checkout submits an `X-Idempotency-Key` header and calls the same server-side order workflow, preventing duplicate orders during network lag or double-clicking.

### 14.3 Customer Order Tracking & Phone Protection (C-2 Resolved)
- Located at `/[locale]/track-order`.
- Lookup requires exact match of `Order ID` (e.g. `ord_...`) + customer's 11-digit mobile phone number.
- Response returns order status, delivery zone, courier tracking timeline, and independent return/refund status (`return_review.status` linking native return).
- Customer phone number is masked in the response (`017****5678`).

---

## 15. Admin Panel Architecture (Medusa Admin)

### 15.1 Navigation Structure & Custom Routes (D-1 & PRD §8.1 Resolved)

```
Medusa Admin (/app)
├── COMMERCE
│   ├── /app/orders                  Native orders list + COD status & courier badges
│   ├── /app/products                Catalog, BDT pricing widget, Bangla fields
│   ├── /app/categories              Category hierarchy + custom attribute config
│   ├── /app/inventory               Warehouse variant stock management
│   ├── /app/customers               Customer list + RTO risk profile badges
│   └── /app/promotions              Discounts and promo codes
│
├── BANGLADESH OPERATIONS
│   ├── /app/cod-queue               Call center verification queue with fast actions
│   ├── /app/manual-order            Phone-first Bangladesh manual order creation
│   ├── /app/courier-manifest        Bulk consignment creation & thermal sticker print
│   └── /app/returns                 Return/refund manual review & payout recording
│
├── MARKETING & CONTENT
│   ├── /app/landing-pages           Campaign landing page builder
│   ├── /app/content/homepage        Homepage section builder (reorder/toggle)
│   └── /app/content/pages           Policy pages CMS (draft/publish/rollback)
│
├── FINANCE & REPORTS
│   ├── /app/reports/profit          Contribution profit dashboard (before/after ads)
│   ├── /app/reports/cod-settlement  Courier delivery fee & remittance reconciliation
│   └── /app/audit-logs              Security, role, price, and operational audit trail
│
└── SETTINGS
    ├── /app/settings/bangladesh     Zone delivery rates, free shipping threshold
    ├── /app/settings/vat            VAT enable/disable, rate, display rules
    ├── /app/settings/sms            SMS gateway credentials & message templates
    ├── /app/settings/gateways       bKash & Nagad Merchant credentials
    ├── /app/settings/invoices       Printable invoice templates & logo upload
    └── /app/settings/team           Staff accounts, roles, and security policies
```

### 15.2 Widget Injection & Limitations (D-2 Resolved)
- **Medusa Widget Injection Points:**
  - `order.details.side.before`: Injects COD Verification widget & Return Status badge.
  - `order.details.after`: Injects Courier Booking widget & Cost/Margin Breakdown (Finance/Owner only).
  - `product.details.after`: Injects BDT Pricing widget, Bangla Translation editor, Category Attributes.
- **Admin Limitation Clarification (D-2):** Medusa v2 Admin does NOT support widget injection into native `/app/orders` table rows (no `orders.list.table.row` zone). Fast actions ("One-Click Confirm", "Call Log Notes") are located on the custom route `/app/cod-queue` and inside the Order Detail sidebar widget.

### 15.3 Phone-First Manual Order Creation (D-1 Resolved)
Native Medusa Draft Orders requires email and lacks BD delivery zones. Therefore, the custom route `/app/manual-order` is built:
1. Staff enters customer's 11-digit mobile phone -> system looks up past order history and displays RTO risk profile.
2. Staff selects recipient 4-tier address: Division -> District -> Thana -> Street address.
3. System auto-calculates delivery charge (Inside Dhaka: ৳60, Suburbs: ৳100, Outside Dhaka: ৳130).
4. Staff selects product variants (with real-time stock availability check).
5. Payment method set to COD (Unconfirmed/Confirmed) or Manual Online Payment (entering external trxID).
6. Order placed; staff user ID recorded in `audit_log`.

---

## 16. Content Management & Theming System

### 16.1 Homepage Section Builder (`bd-content`)
- Stores sections in `homepage_section` table: `hero_banner`, `featured_products`, `category_grid`, `promo_banner`, `trust_badges`.
- Non-technical admins can add, edit, reorder (drag-and-drop), hide, or delete sections with zero code deployments.
- **Link Integrity Protection (FR-9.6):** Publishing a section linking to a deleted or unpublished product/category is blocked with an admin warning.

### 16.2 Policy Pages CMS
- Static policy pages (`about`, `contact`, `faq`, `privacy`, `terms`, `shipping`, `returns`) managed through `/app/content/pages`.
- Features separate English and Bangla text fields, draft/preview/publish state machine, and instant rollback to `published_version_json`.

### 16.3 Controlled Design Tokens & Contrast Validation (A-7 & C-4 Resolved)
- Storefront appearance is governed by **controlled design tokens** (`primary_color`, `accent_color`, `font_family_latin`, `font_family_bangla`, `border_radius`).
- **Contrast Validator:** Server-side validation checks contrast ratio (WCAG AA ratio >= 4.5:1 for body text, >= 3:1 for large text). Publishing unreadable color schemes is blocked.
- Raw arbitrary CSS injection (`custom_css`) is replaced with structured tokens to eliminate XSS risks.

---

## 17. Invoice & PDF Generation System

### 17.1 Server-Side PDF Engine (A-3 Resolved)
- Built within `bd-invoices` using server-side PDF generation (`@react-pdf/renderer` or `pdfkit`).
- Compiles immutable PDF invoices directly from the **order-time financial snapshot**:
  - Store details & logo.
  - Order ID, date, customer name, 4-tier delivery address, masked phone.
  - Line items: title, SKU, variant, snapshot unit price, quantity, total.
  - Subtotal, applied discount coupon, delivery charge.
  - **Conditional VAT Line:** Renders VAT breakdown and merchant VAT registration number ONLY when `bd_settings.vat_enabled === true`.

### 17.2 Invoice Templates & Asset Validation (FR-5.1.6)
- Admins configure invoice header/footer text, terms, and logo via `/app/settings/invoices`.
- Asset uploads (logo, seal) are strictly validated: SVG/PNG/JPG only, max file size 2MB.

---

## 18. Deployment Boundary & Infrastructure

### 18.1 Local Development Environment (Docker Compose)

```
Services:
  bd_commerce_postgres    -> Port 5432 (PostgreSQL 16)
  bd_commerce_redis       -> Port 6379 (Redis 7)
  bd_commerce_meilisearch -> Port 7700 (Meilisearch v1.11)

Applications:
  apps/medusa (npm run dev) -> Port 9000 [Medusa Backend + Admin UI at /app]
  apps/web (npm run dev)    -> Port 3000 [Next.js Storefront]
```

### 18.2 Production Topology

```
Internet (HTTPS 443)
  ├── Cloudflare CDN / WAF
  │     ├── Next.js Storefront (Vercel or VPS Node.js runtime, Port 3000)
  │     └── MedusaJS v2 Backend + Admin (VPS Container runtime, Port 9000)
  │           │
  │           ├── Managed PostgreSQL 16 (Private VPC network)
  │           ├── Managed Redis 7 (Private VPC network)
  │           ├── Meilisearch v1.11 (Private VPC network)
  │           └── S3 / Cloudflare R2 (Private bucket for media & invoices)
```

---

## 19. Security Architecture & Fraud Defense

1. **COGS & Financial Privacy (C-1):** Strict allowlist on Meilisearch indexing strips all product cost and margin figures.
2. **Order Tracking Phone Enumeration Defense (C-2):** Rate-limited to 10 req/min per IP. 3 consecutive failed lookups triggers 15-minute IP lockout. Responses mask customer phone and street address.
3. **Zero-Trust Online Payment Verification (C-3):** bKash and Nagad redirect callbacks execute server-to-server transaction queries before capturing payment.
4. **CSS Sanitization & CSP (C-4):** Arbitrary CSS injection eliminated; design tokens enforced; Content Security Policy header applied.
5. **Private Key Isolation (C-5):** Nagad RSA private key stored in filesystem (`0600` permissions) via `NAGAD_PRIVATE_KEY_PATH`, never in environment variables.
6. **Staff Account Lockout & Forced Password Reset (A-6):** 5 consecutive failed logins triggers 15-minute account lockout. Staff forced to change password at first login.
7. **Customer Fraud Defense:** Call center staff view `customer_risk_profile` (order count, delivery count, RTO count, fraud flag) during COD verification calls.

---

## 20. Observability, Audit Logging & Reliability

### 20.1 Centralized Audit Log System (`bd-audit`)
- Every sensitive operation generates an immutable `audit_log` record:
  `actor_id`, `actor_role`, `actor_email`, `entity_type`, `entity_id`, `action`, `old_value`, `new_value`, `ip_address`, `timestamp`, `stated_reason`.
- Covered events: Price updates, stock adjustments, COD status changes, manual order creation, return reviews, refund recordings, staff role changes, VAT settings updates, and content publishing.
- Accessible only via `/admin/audit-logs` by Owner and Finance roles.

### 20.2 Disaster Recovery & Verification
- Daily automated PostgreSQL logical dumps (`pg_dump`) at 02:00 BST with 30-day retention.
- Mandatory test restore drill required prior to production launch sign-off.

---

## 21. Environment Configuration Reference

```bash
# Database (PostgreSQL 16)
DATABASE_URL=postgresql://postgres:password@localhost:5432/bd_commerce
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=bd_commerce

# Cache & Queues (Redis 7)
REDIS_URL=redis://:password@localhost:6379
REDIS_PASSWORD=<strong-password>

# Search Engine (Meilisearch v1.11)
MEILISEARCH_URL=http://localhost:7700
MEILI_MASTER_KEY=<strong-master-key>

# Medusa Backend & Auth
MEDUSA_BACKEND_URL=http://localhost:9000
JWT_SECRET=<64-char-random>
COOKIE_SECRET=<64-char-random>
MEDUSA_ADMIN_EMAIL=admin@yourdomain.com
MEDUSA_ADMIN_PASSWORD=<strong-password>

# CORS Origins
ADMIN_CORS=http://localhost:9000
STORE_CORS=http://localhost:3000
AUTH_CORS=http://localhost:9000,http://localhost:3000

# Next.js Storefront Public Config
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=<pk_from_admin>
NEXT_PUBLIC_MEILISEARCH_URL=http://localhost:7700
NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY=<search-only-key>
NEXT_PUBLIC_META_PIXEL_ID=<pixel-id>

# bKash Direct Merchant Credentials
BKASH_APP_KEY=<app-key>
BKASH_APP_SECRET=<app-secret>
BKASH_USERNAME=<merchant-username>
BKASH_PASSWORD=<merchant-password>
BKASH_SANDBOX=true

# Nagad Direct PGW Credentials (C-5 Secure File Path)
NAGAD_MERCHANT_ID=<merchant-id>
NAGAD_PRIVATE_KEY_PATH=/etc/secrets/nagad_private.pem
NAGAD_PUBLIC_KEY_PATH=/etc/secrets/nagad_public.pem
NAGAD_SANDBOX=true

# Courier API Credentials
STEADFAST_API_KEY=<steadfast-key>
STEADFAST_API_SECRET=<steadfast-secret>
PATHAO_CLIENT_ID=<pathao-client-id>
PATHAO_CLIENT_SECRET=<pathao-client-secret>

# SMS Gateway Credentials
SMS_PROVIDER=greenweb
SMS_API_KEY=<sms-key>
SMS_SENDER_ID=<approved-sender-id>

# Marketing & Tracking
# [Phase 2 Candidate — Not required for Phase 1 launch per PRD FR-5.3.7]
# META_CAPI_ACCESS_TOKEN=<capi-token>

# Cloud Storage (Production)
S3_BUCKET_NAME=<bucket>
S3_REGION=<region>
S3_ACCESS_KEY_ID=<access-key>
S3_SECRET_ACCESS_KEY=<secret-key>
S3_ENDPOINT=<r2-or-s3-endpoint>
```

---

## 22. Architecture Decision Log

| ADR | Decision | Rationale & Reconciled Review Item |
|---|---|---|
| **ADR-001** | MedusaJS v2 Backend | Native headless primitives; avoids reinventing core commerce machinery. |
| **ADR-002** | Embedded Medusa Admin | Official `@medusajs/ui` extension system; zero separate admin codebase. |
| **ADR-003** | Next.js 15 App Router | RSC, bilingual routing, and custom 4-tier BD checkout UX. |
| **ADR-004** | Tailwind CSS 3.4.x Locked | Locked per AGENTS.md rule; ensures CSS build stability. |
| **ADR-005** | BigInt Paisa for Money | Zero floating-point rounding errors across catalog, orders, and finance. |
| **ADR-006** | 4-Status Separation | Order, Payment, Shipment, and Return statuses remain strictly independent (A-2). |
| **ADR-007** | Zero-Orphan Payment Redirect | Medusa Orders created only upon verified server payment capture (B-2). |
| **ADR-008** | Zero-Trust Webhook Model | Server-to-server execute calls mandatory; never trust callback body (C-3). |
| **ADR-009** | 3-Step Manual RTO Restock | Staff records condition; damaged items segregated; restock never automatic (B-4). |
| **ADR-010** | 4-Tier Address Hierarchy | Division -> District -> Thana -> Street resolves all courier API needs (E-3). |
| **ADR-011** | Meilisearch COGS Exclusion | Strict field allowlist prevents cost/margin leakage to public search key (C-1). |
| **ADR-012** | Phone-First Manual Order Route | Custom route `/app/manual-order` replaces email-centric Draft Orders (D-1). |
| **ADR-013** | Dedicated Audit Log Module | `bd-audit` logs all price, stock, order, return, and staff actions (A-1). |
| **ADR-014** | Server-Side PDF Invoices | `bd-invoices` compiles immutable PDFs from order-time snapshot (A-3). |
| **ADR-015** | Non-Technical CMS & Theming | `bd-content` manages homepage blocks & policy pages with instant rollback (A-4). |
| **ADR-016** | VAT Infrastructure in Base | Configurable VAT settings built in Phase 1; conditional display on invoices (A-5). |
| **ADR-017** | Account-Level Staff Lockout | 5 failed attempts -> 15-minute lockout + forced password reset at first login (A-6). |
| **ADR-018** | Meta CAPI Classified as Phase 2 | Pixel-only in Phase 1; CAPI deferred pending privacy review per PRD FR-5.3.7 (E-1). |
| **ADR-019** | COD Expiry Policy Flagged Open | Manual confirmation is Phase 1 baseline; cron built but disabled per Q#18 (B-1). |
| **ADR-020** | Unified Single-Vendor Cart | Campaign Mode B binds to shared cart; submits idempotently (B-3, B-6). |

---

*This document is the **final authoritative system architecture reference** for the Bangladesh Single-Vendor E-commerce Platform.*  
*All implementation code, database migrations, workflow definitions, and API integrations must strictly adhere to the specifications herein.*  
*Last updated: 2026-10-24*
