# Project Context Handoff

## 1. Project Identity
- **Project Name:** Bangladesh Single-Vendor B2C E-commerce Platform (`bd-commerce-platform`)
  - *Evidence:* [`package.json`](package.json#L2), [`prd.md`](prd.md#L1), [`technical-plan.md`](technical-plan.md#L1).
- **Product Summary:** A mobile-first, high-performance, single-vendor B2C e-commerce platform tailored for the Bangladesh market, supporting bilingual shopping (Bangla/English), local payment gateways (bKash, Nagad, COD), courier dispatch integrations, and dedicated marketing landing pages.
  - *Evidence:* [`prd.md`](prd.md#L31-L32), [`technical-plan.md`](technical-plan.md#L22-L27).
- **Target Market & Business Model:**
  - **Market:** Bangladesh (Dhaka, Suburbs, Outside Dhaka across all 64 districts).
  - **Model:** Single-vendor B2C direct-to-consumer brand.
  - *Evidence:* [`prd.md`](prd.md#L5-L6), [`ideaproposition.md`](ideaproposition.md#L5-L10).
- **Confirmed Scope vs Explicitly Out-of-Scope Items:**
  - **Confirmed In-Scope:**
    - Single-vendor multi-category product catalog with multi-variant options (max 3 option types per product).
    - Mobile-first storefront with sticky add-to-cart/buy-now action bars and sub-50ms search.
    - Centralized administrative dashboard modeled on Medusa Admin conventions.
    - Cash on Delivery (COD) phone verification state machine and risk scoring.
    - Direct merchant integration for bKash and Nagad (sandbox configured, merchant approval needed for production).
    - Automated and manual third-party courier dispatch (Steadfast, Pathao, RedX).
    - Campaign landing page builder sharing the central catalog and cart system.
    - Gross contribution margin reporting (Delivered Revenue − COGS − Shipping Subsidy − Gateway Fees).
    - Bilingual content support (Bangla `bn` & English `en`) with BDT (৳) currency formatting.
    - *Evidence:* [`prd.md`](prd.md#L56-L70), [`technical-plan.md`](technical-plan.md#L26).
  - **Explicitly Out-of-Scope:**
    - Multi-vendor marketplace or seller payout portals.
    - Automated refund execution via payment gateway APIs (all refunds are strictly manual, staff-approved, and logged).
    - Automated social media messaging bots (Facebook/WhatsApp chatbots).
    - Multi-currency or cross-border international shipping.
    - Native mobile apps (iOS/Android native builds; PWA/mobile web only).
    - *Evidence:* [`prd.md`](prd.md#L72-L85), [`Cross-Audit Report v4 vs PRD v2.md`](Cross-Audit%20Report%20v4%20vs%20PRD%20v2.md#L7).

---

## 2. Status Summary

| Area | Status | Evidence | Notes |
|---|---|---|---|
| **Planning & Documentation** | Confirmed complete | [`prd.md`](prd.md), [`technical-plan.md`](technical-plan.md), [`quality-checklist.md`](quality-checklist.md), [`docs/medusa-admin-reference-audit.md`](docs/medusa-admin-reference-audit.md), [`user-journeys.md`](user-journeys.md), [`ideaproposition.md`](ideaproposition.md) | Exhaustive specifications covering 24 user journeys, architectural blueprints, audit reports, and 48 quality assurance criteria. |
| **Storefront App (`apps/web`)** | Partially complete | [`apps/web/package.json`](apps/web/package.json), [`apps/web/src/app/page.tsx`](apps/web/src/app/page.tsx), [`apps/web/tailwind.config.ts`](apps/web/tailwind.config.ts) | Next.js 15 App Router scaffolded with Tailwind CSS 3.4 and brand status landing page; full commerce catalog/PDP/checkout components not yet built. |
| **Backend API (`apps/api`)** | Partially complete | [`apps/api/package.json`](apps/api/package.json), [`apps/api/src/main.ts`](apps/api/src/main.ts), [`apps/api/prisma/schema.prisma`](apps/api/prisma/schema.prisma) | Express + Prisma ORM scaffolded with core schema, database singleton, and health check. **Note:** Does not yet contain MedusaJS v2 framework despite docs recommending it. |
| **Medusa Backend** | Not started | [`package.json`](package.json), [`apps/api/package.json`](apps/api/package.json) | MedusaJS v2 framework is documented in technical plan as the primary engine candidate, but zero `@medusajs/*` packages are installed in the workspace. |
| **Medusa Admin** | Recommended only | [`docs/medusa-admin-reference-audit.md`](docs/medusa-admin-reference-audit.md), [`technical-plan.md`](technical-plan.md#L37-L44) | Reference audit completed against `demo.medusajs.com/app/orders`; visual layout, component library (`@medusajs/ui`), and widget zones documented, but no admin UI code is installed yet. |
| **Docker Infrastructure** | Confirmed complete | [`docker-compose.yml`](docker-compose.yml) | Multi-container setup with PostgreSQL 16, Redis 7, and Meilisearch 1.11; persistent volumes, bridge network, and healthchecks running and verified healthy. |
| **Database & Schema** | Confirmed complete | [`apps/api/prisma/schema.prisma`](apps/api/prisma/schema.prisma) | PostgreSQL 16 running via Docker; Prisma schema defined with User, Category, Product, Order, and OrderItem models; live sync verified via `prisma db push`. |
| **Authentication** | Partially complete | [`.env`](.env#L35-L40), [`apps/api/prisma/schema.prisma`](apps/api/prisma/schema.prisma#L45-L58) | User model with roles (`CUSTOMER`, `ADMIN`, `SELLER`), password hashing field, and generated 512-bit JWT secrets in `.env`; login/signup API endpoints not yet implemented. |
| **Payments** | Partially complete | [`.env`](.env#L41-L55), [`apps/api/prisma/schema.prisma`](apps/api/prisma/schema.prisma#L33-L41) | Payment enums (`COD`, `BKASH`, `NAGAD`, `SSLCOMMERZ`, `STRIPE`) in schema; sandbox URLs and credential variables configured in `.env`; payment gateway client modules not yet implemented. |
| **Shipping & Courier** | Not started | [`prd.md`](prd.md#L10), [`quality-checklist.md`](quality-checklist.md#L343-L375) | Steadfast, Pathao, and RedX integration planned in specifications; database schema captures delivery address JSON and shipping fees; courier API integration code not yet written. |
| **Bangladesh Localization** | Partially complete | [`.cursorrules`](.cursorrules#L19-L23), [`apps/web/tailwind.config.ts`](apps/web/tailwind.config.ts) | Guidelines for BDT formatting, phone regex (+8801...), and brand color tokens configured in cursorrules; bilingual dictionaries and UI switchers not yet built. |
| **Tests & Verification** | Not started | [`quality-checklist.md`](quality-checklist.md#L594-L610) | Quality checklist established with 48 criteria initialized to `Pending Verification`; zero automated test files (`*.test.ts`, `*.spec.ts`) exist in the repository. |
| **CI/CD** | Not started | Repository root inspection | No GitHub Actions workflows (`.github/workflows`) or CI pipelines configured. |
| **Deployment** | Not started | [`.cursorrules`](.cursorrules), [`technical-plan.md`](technical-plan.md) | Deployment scripts and production infrastructure definitions have not yet been created. |

---

## 3. Approved Decisions

| Decision | Status | Evidence Path | Short Implementation Impact |
|---|---|---|---|
| **Single-Vendor B2C Model** | Confirmed | [`prd.md`](prd.md#L5-L6), [`ideaproposition.md`](ideaproposition.md#L5) | No marketplace splitting, vendor sub-accounts, or automated commission payouts. Single operational catalog and merchant identity. |
| **Monorepo Workspace Structure** | Confirmed | [`package.json`](package.json#L7-L10) | Root package manifest orchestrates `apps/*` workspaces using npm workspaces (`apps/web` and `apps/api`). |
| **Relational Database: PostgreSQL 16** | Confirmed | [`docker-compose.yml`](docker-compose.yml#L2-L20), [`apps/api/prisma/schema.prisma`](apps/api/prisma/schema.prisma#L1-L4) | PostgreSQL 16 containerized with persistent volume `postgres_data`; strict relational integrity, cuid keys, and Decimal pricing precision. |
| **Cache & Queue: Redis 7** | Confirmed | [`docker-compose.yml`](docker-compose.yml#L22-L43), [`.cursorrules`](.cursorrules#L49-L55) | Redis 7 containerized with password authentication; reserved for cache tagging, session management, and BullMQ worker queues. |
| **Catalog Search: Meilisearch 1.11** | Confirmed | [`docker-compose.yml`](docker-compose.yml#L45-L60), [`.cursorrules`](.cursorrules#L57-L62) | Containerized typo-tolerant search engine on port 7700 with master key authentication for sub-50ms instant search. |
| **Storefront: Next.js 15 App Router** | Confirmed | [`apps/web/package.json`](apps/web/package.json#L11-L15), [`apps/web/src/app/layout.tsx`](apps/web/src/app/layout.tsx) | Server Components by default (`"use client"` only for interactivity), React 19, Lucide icons, and Tailwind CSS 3.4. |
| **Tailwind CSS 3.4 Dependency Lock** | Confirmed | [`AGENTS.md`](AGENTS.md#L119), [`apps/web/package.json`](apps/web/package.json#L21) | Strict architectural constraint to lock Tailwind CSS at `3.4.17` and avoid upgrading to Tailwind v4. |
| **Backend Framework Foundation** | Open question / Contradiction | [`technical-plan.md`](technical-plan.md#L32-L44) vs [`apps/api/package.json`](apps/api/package.json#L15-L23) | **Architectural Discrepancy:** Planning docs specify MedusaJS v2 (`@medusajs/medusa@^2.0`), whereas the current repository scaffolded `apps/api` using Node.js/Express with Prisma ORM 5.22.0. Requires owner/architect decision on whether to adopt Medusa v2 or retain custom Express + Prisma. |
| **Admin Design & UI Alignment** | Confirmed (Direction) | [`docs/medusa-admin-reference-audit.md`](docs/medusa-admin-reference-audit.md#L5-L21) | Administrative UX must follow official Medusa Admin patterns (`https://demo.medusajs.com/app/orders`) and `@medusajs/ui` components. |
| **Manual-Only Return & Refund Policy** | Confirmed | [`prd.md`](prd.md#L41), [`Cross-Audit Report v4 vs PRD v2.md`](Cross-Audit%20Report%20v4%20vs%20PRD%20v2.md#L7) | Never automatically issue refunds via payment gateway APIs; every return and refund is a deliberate, logged staff action. |
| **Delivery Zones & Dynamic Charges** | Confirmed | [`prd.md`](prd.md#L10), [`quality-checklist.md`](quality-checklist.md#L209-L219) | Separate configurable rates for `Inside Dhaka`, `Suburbs`, and `Outside Dhaka`. |
| **SMS Gateway in Phase 1** | Confirmed | [`prd.md`](prd.md#L14), [`Cross-Audit Report v4 vs PRD v2.md`](Cross-Audit%20Report%20v4%20vs%20PRD%20v2.md#L7) | Required in Phase 1 scope; non-operational until gateway credentials (e.g. Greenweb, SSL Wireless) are configured. |
| **Default Storefront Language** | Open question | [`Cross-Audit Report v4 vs PRD v2.md`](Cross-Audit%20Report%20v4%20vs%20PRD%20v2.md#L53) | PRD v2 documents English as default; Idea Proposition documents Bangla as default. Owner decision needed. |

---

## 4. Actual Technology Stack

| Layer | Confirmed technology/version | Evidence path | Notes |
|---|---|---|---|
| **Node.js Runtime** | Node.js `v22.23.2` | System environment check | Host development runtime. |
| **Package Manager** | npm `10.9.8` (Workspaces enabled) | [`package.json`](package.json#L7-L10) | Root orchestrates `apps/*` workspaces. |
| **Web Storefront** | Next.js `15.1.0` | [`apps/web/package.json`](apps/web/package.json#L12) | App Router, React Server Components. |
| **Frontend UI Library** | React `19.0.0` / React DOM `19.0.0` | [`apps/web/package.json`](apps/web/package.json#L13-L14) | Latest React 19 release. |
| **Styling & CSS** | Tailwind CSS `3.4.17`, Autoprefixer `10.4.20`, PostCSS `8.4.49` | [`apps/web/package.json`](apps/web/package.json#L19-L22) | Locked to Tailwind v3.4 per [`AGENTS.md`](AGENTS.md#L119). |
| **Icons** | Lucide React `0.468.0` | [`apps/web/package.json`](apps/web/package.json#L11) | Component icon library. |
| **Backend Framework** | Express `4.21.2` | [`apps/api/package.json`](apps/api/package.json#L18) | Node.js HTTP server at `apps/api/src/main.ts`. |
| **Database ORM** | Prisma `5.22.0` / `@prisma/client` `5.22.0` | [`apps/api/package.json`](apps/api/package.json#L15,L27) | Client generated; live PostgreSQL schema synced. |
| **Primary Database** | PostgreSQL `16-alpine` | [`docker-compose.yml`](docker-compose.yml#L3) | Running in Docker on port `5432`. |
| **In-Memory Store & Cache** | Redis `7-alpine` / `ioredis` `5.4.2` | [`docker-compose.yml`](docker-compose.yml#L23), [`apps/api/package.json`](apps/api/package.json#L19) | Running in Docker on port `6379`. |
| **Search Engine** | Meilisearch `v1.11` (Image: `getmeili/meilisearch:v1.11`) / Client `0.44.0` | [`docker-compose.yml`](docker-compose.yml#L46), [`apps/api/package.json`](apps/api/package.json#L20) | Running in Docker on port `7700`. |
| **Data Validation** | Zod `3.24.1` | [`apps/api/package.json`](apps/api/package.json#L21) | Schema validation library installed. |
| **Dev Execution & TS** | TypeScript `5.7.2`, `tsx` `4.19.2` | [`apps/api/package.json`](apps/api/package.json#L28-L29) | Fast development execution without manual transpile. |
| **Container Engine** | Docker Desktop `29.9.2`, Docker Compose `v5.6.1` | Host environment check | CLI linked to `~/.local/bin/docker`. |

---

## 5. Repository Map

```
bd-commerce-platform/
├── AGENTS.md                            # Global customization & BaaS SDK rules
├── Cross-Audit Report v4 vs PRD v2.md   # Pre-implementation cross-audit of IP v4 vs PRD v2
├── ideaproposition.md                   # Approved Idea Proposition v4 (business model & foundation)
├── prd.md                               # Product Requirements Document Draft v2
├── user-journeys.md                     # Draft v1 covering 24 customer & admin journeys
├── technical-plan.md                    # Technical Architecture Plan v1.0
├── quality-checklist.md                 # Quality Assurance & Release Checklist (48 criteria)
├── .cursorrules                         # Development guidelines, standards & BD market conventions
├── .gitignore                           # Ignores node_modules, build artifacts, and env secrets
├── .env                                 # Root environment configuration (active, untracked)
├── .env.example                         # Environment configuration template with empty placeholders
├── package.json                         # Root monorepo workspace definition & dev scripts
├── package-lock.json                    # Monorepo dependency lockfile
├── docker-compose.yml                   # Docker Compose specification for Postgres, Redis, Meilisearch
├── docs/
│   └── medusa-admin-reference-audit.md  # Detailed reference audit of demo.medusajs.com/app/orders
└── apps/
    ├── web/                             # Next.js Storefront workspace
    │   ├── package.json                 # Next.js 15, React 19, Tailwind CSS 3.4 dependencies
    │   ├── tsconfig.json                # TypeScript compiler config for Next.js App Router
    │   ├── next.config.mjs              # Next.js configuration (remote image patterns)
    │   ├── tailwind.config.ts           # Tailwind configuration with brand color tokens
    │   ├── postcss.config.mjs           # PostCSS configuration for Tailwind CSS
    │   ├── .env.local                   # Symlinked to root .env
    │   └── src/
    │       └── app/
    │           ├── layout.tsx           # Root layout with metadata and font setup
    │           ├── page.tsx             # Starter landing page showcasing architecture status
    │           └── globals.css          # Tailwind directives and CSS theme variables
    └── api/                             # Backend API workspace
        ├── package.json                 # Express, Prisma, Redis, Meilisearch dependencies
        ├── tsconfig.json                # NodeNext TypeScript compiler configuration
        ├── .env                         # Symlinked to root .env
        ├── prisma/
        │   └── schema.prisma            # Prisma schema (User, Category, Product, Order, OrderItem)
        └── src/
            ├── lib/
            │   └── prisma.ts            # Prisma Client singleton
            └── main.ts                  # Express server entry point with /health and /api/v1 routes
```

### Purpose of Key Areas
- **Root Documentation (`*.md`, `docs/`):** Comprehensive architectural blueprints, PRDs, user journeys, reference audits, and quality gates defining the system before building.
- **`apps/web`:** Next.js App Router storefront serving consumer traffic, campaign landing pages, localized checkout, and mobile catalog browsing.
- **`apps/api`:** Headless backend service providing REST API endpoints, Prisma database access, Redis caching, and Meilisearch query dispatch.
- **`docker-compose.yml`:** Local orchestration for persistent backend dependencies (PostgreSQL, Redis, Meilisearch) ensuring reproducibility.

---

## 6. Docker and Local Development

### 6.1 Docker Compose Services
- **Configuration File:** [`docker-compose.yml`](docker-compose.yml)
- **Services:**
  1. `postgres` (Container: `bd_commerce_postgres`):
     - Image: `postgres:16-alpine`
     - Ports: `${POSTGRES_PORT:-5432}:5432`
     - Volume: `postgres_data` -> `/var/lib/postgresql/data`
     - Healthcheck: `pg_isready -U postgres -d bd_commerce` (interval: 10s, timeout: 5s, retries: 5)
  2. `redis` (Container: `bd_commerce_redis`):
     - Image: `redis:7-alpine`
     - Ports: `${REDIS_PORT:-6379}:6379`
     - Command: Configurable password authentication via `redis-server --requirepass`
     - Volume: `redis_data` -> `/data`
     - Healthcheck: `redis-cli ping` (interval: 10s, timeout: 5s, retries: 5)
  3. `meilisearch` (Container: `bd_commerce_meilisearch`):
     - Image: `getmeili/meilisearch:v1.11`
     - Ports: `${MEILISEARCH_PORT:-7700}:7700`
     - Volume: `meilisearch_data` -> `/meili_data`
     - Healthcheck: HTTP `curl -f http://localhost:7700/health` (interval: 10s, timeout: 5s, retries: 5)
- **Network:** `bd_commerce_network` (bridge mode).
- **Volumes:** `postgres_data`, `redis_data`, `meilisearch_data` (local driver).

### 6.2 Development & Lifecycle Commands
Configured in [`package.json`](package.json#L11-L22):
- `npm run docker:up` — Spins up Postgres, Redis, and Meilisearch in background (`docker compose up -d`).
- `npm run docker:down` — Gracefully stops all containers (`docker compose down`).
- `npm run docker:ps` — Inspects health status of all running services (`docker compose ps`).
- `npm run dev:api` — Starts API dev server on port 4000 via `tsx watch src/main.ts`.
- `npm run dev:web` — Starts Next.js storefront on port 3000 via `next dev -p 3000`.
- `npm run prisma:generate` — Generates `@prisma/client`.
- `npm run prisma:studio` — Opens web GUI for exploring database records.

### 6.3 Environment Variables (Names Only)
Defined in [`.env`](.env) and [`.env.example`](.env.example):
- **Application:** `NODE_ENV`, `API_PORT`, `WEB_PORT`, `PORT`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`, `CORS_ORIGIN`.
- **PostgreSQL:** `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_HOST`, `POSTGRES_PORT`, `DATABASE_URL`, `DIRECT_URL`.
- **Redis:** `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_URL`.
- **Meilisearch:** `MEILISEARCH_HOST`, `MEILISEARCH_PORT`, `MEILI_MASTER_KEY`, `MEILI_ENV`.
- **Authentication & Security:** `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`, `SESSION_SECRET`, `ENCRYPTION_KEY`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`.
- **Payment Gateways:** `BKASH_BASE_URL`, `BKASH_APP_KEY`, `BKASH_APP_SECRET`, `BKASH_USERNAME`, `BKASH_PASSWORD`, `BKASH_CALLBACK_URL`, `NAGAD_BASE_URL`, `NAGAD_MERCHANT_ID`, `NAGAD_PUBLIC_KEY`, `NAGAD_PRIVATE_KEY`, `NAGAD_CALLBACK_URL`, `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWD`, `SSLCOMMERZ_IS_SANDBOX`, `SSLCOMMERZ_SESSION_API`, `SSLCOMMERZ_VALIDATION_API`, `SSLCOMMERZ_SUCCESS_URL`, `SSLCOMMERZ_FAIL_URL`, `SSLCOMMERZ_CANCEL_URL`, `SSLCOMMERZ_IPN_URL`.

### 6.4 Confirmed Setup Gaps or Risks
- **No Dockerfile for Application Code:** Docker Compose only orchestrates external dependencies (DB, Redis, Search). No production multi-stage Dockerfiles exist for `apps/web` or `apps/api`.
- **Symlinked `.env` Files:** [`apps/api/.env`](apps/api/.env) and [`apps/web/.env.local`](apps/web/.env.local) rely on relative filesystem symlinks (`../../.env`). In containerized builds or Windows checkouts, symlinks may need resolution.

---

## 7. Medusa Admin Reference and Audit

### 7.1 Reference Target & Documented Findings
- **Target URL:** `https://demo.medusajs.com/app/orders`
- **Audit Document:** [`docs/medusa-admin-reference-audit.md`](docs/medusa-admin-reference-audit.md)
- **Target Version Evaluated in Docs:** MedusaJS v2 (`@medusajs/medusa@^2.0` with `@medusajs/ui`).
- **Research Status:** Automated Playwright browser inspection failed during audit research due to environment CDN driver download errors. The audit was conducted using official Medusa v2 documentation, component specifications, and widget manuals ([`docs/medusa-admin-reference-audit.md`](docs/medusa-admin-reference-audit.md#L17-L20)).

### 7.2 Actual Repository Audit vs Reference Intent

| Domain / Screen | Intended Medusa Admin Reference | Actual Repository Implementation | Current Status |
|---|---|---|---|
| **Medusa Engine** | Medusa v2 Framework core with DML & Workflows | Custom Express backend with Prisma ORM 5.22.0 | **Discrepancy:** Medusa is not installed; custom API exists instead. |
| **Admin App Shell** | `@medusajs/ui` App Shell, collapsible sidebar, `⌘K` palette | No admin web application scaffolded | **Not started** |
| **Orders List** (`/app/orders`) | High-density table, pill status badges, customer search, tabs | Prisma `Order` model defined; no UI | **Planned work only** |
| **COD Workflow Extensions** | Sidebar widget at `order.details.side` for call center phone verification & risk badge | Prisma `Order` model has `status` and `paymentStatus` enums | **Planned work only** |
| **Product Create Flow** (`/app/products/create`) | Full-height `FocusModal` wizard: general, media, organization, variant matrix, pricing sets, inventory | Prisma `Product` & `Category` models created; no UI wizard | **Planned work only** |
| **3-Option-Type Cap** | Enforcement preventing > 3 option dimensions | Documented in PRD §3.2 and checklist; not enforced in code | **Planned work only** |
| **Bilingual Product Fields** | Bangla Title (`পণ্যের নাম`) & Description in product modal | Prisma Product schema currently has single `title` and `description` | **Gaps in schema:** Needs localization table or JSON fields. |
| **Courier Dispatch** | Main column widget at `order.details` for Steadfast/Pathao booking and tracking | No courier modules written | **Planned work only** |
| **Dedicated Routes** | 4 custom UI routes: COD Queue, Campaign Pages, Profit Analytics, BD Settings | Documented in architecture plan; no route files exist | **Planned work only** |

**Summary Classification:**
- **Confirmed Implementation:** Prisma data models for User, Category, Product, Order, OrderItem; PostgreSQL 16 database sync.
- **Planned Work:** Custom admin UI routes, widget injection, courier booking widgets, COD call center queues.
- **Reference / Design Intention Only:** `@medusajs/ui` component library adoption, Medusa v2 framework migration or alignment.

---

## 8. Production Quality Checklist

The QA checklist is defined in [`quality-checklist.md`](quality-checklist.md) (established as Prompt 6 in the specification series). It defines **48 total checks** across 10 sections:
- **41 P0 (Critical Release Blockers)**
- **7 P1 (High Priority / Post-Launch)**
- **0 P2 (Operational Polish)**
- **Current Verification State:** `[ ] All 48 Pending Verification (Pre-Build)`.

### Summary by Checklist Area

| Checklist Area | Scope & Code | Priority | Evidence | Missing Items / Key Risks |
|---|---|---|---|---|
| **Admin Navigation & UI** | App Shell, `⌘K` search, `@medusajs/ui` tokens, states | 2 P0, 2 P1 | [`quality-checklist.md`](quality-checklist.md#L27-L74) | Admin frontend does not exist yet. No `@medusajs/ui` installed. |
| **Catalog, Pricing & Inventory** | Bilingual fields, 3-option cap, BDT price, dynamic attrs, stock deduction, COGS | 6 P0, 1 P1 | [`quality-checklist.md`](quality-checklist.md#L76-L145) | Schema lacks Bangla localized fields and category dynamic attributes; variant options not capped in API. |
| **Cart, Buy Now & Checkout** | Concurrency locking, guest checkout, BD phone regex, zone delivery charges, price tampering | 8 P0, 0 P1 | [`quality-checklist.md`](quality-checklist.md#L147-L241) | Storefront checkout flow not built; Redis distributed lock for flash-sales not implemented. |
| **COD & Payment Gateways** | COD lifecycle, bKash Merchant API, idempotency, cart recovery | 4 P0, 0 P1 | [`quality-checklist.md`](quality-checklist.md#L243-L290) | Payment gateway SDK/clients not written; webhook endpoints not implemented. |
| **Orders & COD Workflow** | Orders table, COD phone verification widget, snapshot integrity, draft orders | 4 P0, 0 P1 | [`quality-checklist.md`](quality-checklist.md#L292-L341) | Call center confirmation state machine not implemented in backend. |
| **Fulfillment & Couriers** | Automated courier booking (Steadfast/Pathao), manual fallback, courier webhooks, tracking | 4 P0, 1 P1 | [`quality-checklist.md`](quality-checklist.md#L343-L400) | Courier API clients and webhook receivers not implemented. |
| **Staff Roles & Security** | RBAC enforcement, rate limiting, credential masking (`••••1234`) | 3 P0, 0 P1 | [`quality-checklist.md`](quality-checklist.md#L402-L436) | RBAC guards not implemented; brute-force rate limiter not attached to auth routes. |
| **Marketing & Meta Tracking** | Campaign landing pages, Meta Pixel + CAPI deduplication, UTM persistence, SMS gateway | 3 P0, 1 P1 | [`quality-checklist.md`](quality-checklist.md#L438-L485) | Meta CAPI integration not built; SMS gateway integration not built. |
| **Mobile UX, SEO & Performance** | 44px touch targets, sticky action bar, font subset stability, OpenGraph, Web Vitals (LCP < 2.5s) | 2 P0, 2 P1 | [`quality-checklist.md`](quality-checklist.md#L487-L535) | Storefront UI components pending build; Lighthouse audits not runnable yet. |
| **Infrastructure & Deployment** | Secret isolation, database migrations, daily backup cron, API rate limits, input sanitization | 5 P0, 0 P1 | [`quality-checklist.md`](quality-checklist.md#L537-L592) | Backup cron script missing; API rate-limiting middleware not attached. |

---

## 9. Implementation Plan Progress

| Step / Prompt | Goal | Current Status | Evidence | Remaining Work |
|---|---|---|---|---|
| **Prompt 1: Idea Proposition** | Formulate business model, market constraints, and functional baseline | Confirmed complete | [`ideaproposition.md`](ideaproposition.md) | None. Document approved as baseline. |
| **Prompt 2: Cross-Audit** | Audit Idea Proposition v4 against PRD Draft v2 and resolve conflicts | Confirmed complete | [`Cross-Audit Report v4 vs PRD v2.md`](Cross-Audit%20Report%20v4%20vs%20PRD%20v2.md) | Resolve remaining 3 open items (default language, stock expiry window, return scope). |
| **Prompt 3: PRD Draft v2** | Standardize requirements, user roles, business rules, and edge cases | Confirmed complete | [`prd.md`](prd.md) | None. Governs all feature requirements. |
| **Prompt 4: User Journeys** | Detail 24 step-by-step customer, campaign, and administrative journeys | Confirmed complete | [`user-journeys.md`](user-journeys.md) | None. Guides UI component assembly. |
| **Prompt 5: Admin Audit & Tech Plan** | Audit Medusa Admin reference & design system architecture | Confirmed complete | [`docs/medusa-admin-reference-audit.md`](docs/medusa-admin-reference-audit.md), [`technical-plan.md`](technical-plan.md) | **Critical Architecture Decision:** Reconcile documented MedusaJS v2 recommendation with existing Express/Prisma codebase. |
| **Prompt 6: Quality Assurance Checklist** | Formulate 48-item release readiness and testing checklist | Confirmed complete | [`quality-checklist.md`](quality-checklist.md) | Execute verification tests as features are built. |
| **Prompt 7 (Workspace Setup)** | Initialize monorepo, Docker Compose, .env, and foundational database schema | Confirmed complete | [`package.json`](package.json), [`docker-compose.yml`](docker-compose.yml), [`.env`](.env), [`apps/api/prisma/schema.prisma`](apps/api/prisma/schema.prisma), [`.cursorrules`](.cursorrules) | Build application business logic (auth, catalog APIs, checkout, admin, integrations). |

---

## 10. Tests and Verification

### Existing Verification Commands & Results
- **API Build / Typecheck:**
  - Command: `npm run build --workspace=apps/api` (`tsc`)
  - Latest Result: **Passed (Code 0)**. Zero TypeScript compilation errors.
- **Frontend Typecheck:**
  - Command: `cd apps/web && npx tsc --noEmit`
  - Latest Result: **Passed (Code 0)**. Zero TypeScript compilation errors.
- **Docker Compose Service Health:**
  - Command: `docker compose ps`
  - Latest Result: **Passed**. `bd_commerce_postgres`, `bd_commerce_redis`, and `bd_commerce_meilisearch` all reported `Up (healthy)`.
- **Database Schema Sync:**
  - Command: `cd apps/api && npx prisma db push`
  - Latest Result: **Passed**. Prisma schema synchronized cleanly with live PostgreSQL container; tables `users`, `categories`, `products`, `orders`, `order_items` created.
- **Redis Connectivity:**
  - Command: Authenticated `PING` via `ioredis` in [`apps/api`](apps/api)
  - Latest Result: **Passed**. Returned `PONG`.
- **Meilisearch API:**
  - Command: Authenticated `GET http://localhost:7700/version`
  - Latest Result: **Passed**. Returned `pkgVersion: 1.11.3`.

### Missing Verification
- **Automated Test Suites:** Zero unit tests, integration tests, or end-to-end tests exist in the repository (no Jest, Vitest, Playwright, or Cypress setup).
- **Linting:** No ESLint configuration or lint scripts executed yet.
- **Quality Checklist Items:** All 48 items in [`quality-checklist.md`](quality-checklist.md) remain unverified (`Pre-Build`).

---

## 11. Risks, Gaps, and Open Questions

### 11.1 Blocking
1. **Backend Framework Architecture Mismatch:**
   - *Risk:* Planning documents ([`technical-plan.md`](technical-plan.md), [`quality-checklist.md`](quality-checklist.md), [`docs/medusa-admin-reference-audit.md`](docs/medusa-admin-reference-audit.md)) strictly assume **MedusaJS v2** (`@medusajs/medusa` with built-in embedded admin, workflows, DML, and `@medusajs/ui`). However, workspace setup initialized a custom **Express + Prisma ORM** backend in [`apps/api`](apps/api/package.json).
   - *Evidence:* [`technical-plan.md`](technical-plan.md#L32-L44) vs [`apps/api/package.json`](apps/api/package.json#L15-L23).
   - *Action Required:* Project owner must explicitly decide whether to:
     - **Option A:** Replace `apps/api` with an official MedusaJS v2 project (`npx create-medusa-app@latest`).
     - **Option B:** Commit to custom Node.js/Express + Prisma and build a custom React admin dashboard mimicking Medusa's visual style.

### 11.2 Important Before Production
1. **Bangla Localization in Database Schema:**
   - *Gap:* The current [`apps/api/prisma/schema.prisma`](apps/api/prisma/schema.prisma#L70-L93) only has singular `title` and `description` string fields on `Product`. PRD §10.3 and Journey 13 require dual Bangla/English titles and descriptions.
   - *Evidence:* [`prd.md`](prd.md#L12), [`apps/api/prisma/schema.prisma`](apps/api/prisma/schema.prisma#L72-L74).
2. **Category Dynamic Attributes & 3-Option Cap:**
   - *Gap:* Category-specific attributes (e.g. Fabric, Fit) and the strict 3-option-type cap are missing from the current Prisma schema and API validation.
   - *Evidence:* [`quality-checklist.md`](quality-checklist.md#L87,L105).
3. **Third-Party Credentials & Approvals:**
   - *Gap:* bKash Merchant API, Nagad PGW, SMS Gateway (e.g. Greenweb/SSL Wireless), and Courier APIs (Steadfast/Pathao) are using sandbox environment variables. Production requires merchant account approval and live keys.
   - *Evidence:* [`prd.md`](prd.md#L9-L10), [`.env`](.env#L41-L55).

### 11.3 Nice to Have
1. **Automated Database Backup Script:** Daily pg_dump backup cron and cloud storage upload script outlined in CHK-OPS-03 is not yet created.
   - *Evidence:* [`quality-checklist.md`](quality-checklist.md#L561-L569).
2. **Containerized Production Dockerfiles:** Multi-stage Dockerfiles for building and running `apps/web` and `apps/api` in production container environments.

### 11.4 Decisions Needed from Project Owner
1. **Framework Confirmation:** Confirm Option A (MedusaJS v2) or Option B (Custom Express + Prisma) for the commerce backend.
2. **Default Storefront Language:** Decide whether the initial load of the storefront defaults to **English** (per PRD v2) or **Bangla** (per Idea Proposition v4).
   - *Evidence:* [`Cross-Audit Report v4 vs PRD v2.md`](Cross-Audit%20Report%20v4%20vs%20PRD%20v2.md#L53).
3. **Unconfirmed COD Stock Reservation Expiry:** Decide the exact duration (e.g. 24 hours vs 48 hours) before an unconfirmed COD order's reserved stock is automatically returned to available inventory.
   - *Evidence:* [`Cross-Audit Report v4 vs PRD v2.md`](Cross-Audit%20Report%20v4%20vs%20PRD%20v2.md#L42).

---

## 12. Recommended Immediate Next Steps

1. **Resolve Backend Framework Choice (Decision Required):**
   - *Goal:* Formally choose between MedusaJS v2 or custom Express+Prisma backend.
   - *Why:* All subsequent API endpoints, database schemas, and admin UI implementations depend entirely on whether Medusa's DML/Workflows or Prisma ORM is the foundational engine.
   - *Files:* [`technical-plan.md`](technical-plan.md), [`apps/api/package.json`](apps/api/package.json).
2. **Align Product & Category Schema for Bangladesh Commerce:**
   - *Goal:* Extend product data structures to support bilingual fields (`titleBn`, `descriptionBn`), category-specific dynamic attributes (`attributes: Json`), and cost price (`costPrice`).
   - *Why:* Required before building catalog APIs or product creation forms.
   - *Files:* [`apps/api/prisma/schema.prisma`](apps/api/prisma/schema.prisma) (or Medusa DML models).
3. **Implement Authentication & RBAC Service:**
   - *Goal:* Build customer and staff authentication (JWT with HttpOnly cookies) supporting roles: `CUSTOMER`, `ADMIN`, `SELLER`.
   - *Why:* Protects admin endpoints, supports customer profile management, and unblocks call-center staff workflows.
   - *Files:* [`apps/api/src/main.ts`](apps/api/src/main.ts), [`apps/api/src/lib/`](apps/api/src/lib/).
4. **Implement Storefront Product Catalog & PDP:**
   - *Goal:* Build high-performance SSR catalog listing, category filters, and product detail pages with variant selectors and sticky mobile action bars in `apps/web`.
   - *Why:* Core customer journey (Journeys 1–3 in [`user-journeys.md`](user-journeys.md)).
   - *Files:* [`apps/web/src/app/`](apps/web/src/app/).
5. **Implement Cart & Buy Now Flow with Concurrency Protection:**
   - *Goal:* Build multi-item cart, guest checkout, and direct "Buy Now" workflows preserving existing cart contents.
   - *Why:* Prevents customer cart loss and enables campaign landing page direct conversions (Journeys 4–7).
   - *Files:* [`apps/web/src/app/`](apps/web/src/app/), [`apps/api/src/`](apps/api/src/).
6. **Implement Cash on Delivery (COD) & Delivery Zone Calculation:**
   - *Goal:* Build checkout delivery fee calculator (`Inside Dhaka` vs `Outside Dhaka`) and COD order placement pipeline with phone verification states.
   - *Why:* COD accounts for over 80% of Bangladesh e-commerce volume.
   - *Files:* [`apps/api/src/`](apps/api/src/), [`apps/web/src/`](apps/web/src/).
7. **Scaffold Admin UI Dashboard:**
   - *Goal:* Implement administrative layout adhering to Medusa Admin reference patterns (`@medusajs/ui` styling, table layouts, status badges, and orders view).
   - *Why:* Enables staff to manage catalog, verify COD orders, and view inventory.
   - *Files:* Admin application workspace or `apps/web/src/app/admin/`.
8. **Setup Automated Test Suite (Unit & Integration):**
   - *Goal:* Configure Vitest / Jest and write initial test suites for price calculation, stock deduction, and JWT auth rate-limiting.
   - *Why:* Validates P0 criteria in [`quality-checklist.md`](quality-checklist.md) before production readiness.
   - *Files:* `apps/api/`, `apps/web/`.

---

## 13. Source Index

### Documentation
- [`prd.md`](prd.md) — Product Requirements Document Draft v2.
- [`ideaproposition.md`](ideaproposition.md) — Approved Idea Proposition v4.
- [`Cross-Audit Report v4 vs PRD v2.md`](Cross-Audit%20Report%20v4%20vs%20PRD%20v2.md) — Cross-audit report comparing IP v4 and PRD v2.
- [`user-journeys.md`](user-journeys.md) — Draft v1 user journeys (24 customer, campaign, and admin flows).
- [`technical-plan.md`](technical-plan.md) — Technical Architecture Plan v1.0.
- [`quality-checklist.md`](quality-checklist.md) — Quality Assurance & Release Verification Checklist (48 items).
- [`docs/medusa-admin-reference-audit.md`](docs/medusa-admin-reference-audit.md) — Reference audit of Medusa Admin (`demo.medusajs.com/app/orders`).

### Configuration and Docker
- [`package.json`](package.json) — Monorepo workspace configuration and orchestration scripts.
- [`package-lock.json`](package-lock.json) — Dependency lockfile.
- [`docker-compose.yml`](docker-compose.yml) — Docker Compose services for PostgreSQL, Redis, and Meilisearch.
- [`.env`](.env) — Active environment variables (untracked, real values omitted).
- [`.env.example`](.env.example) — Template environment variables with empty placeholders.
- [`.gitignore`](.gitignore) — Git ignore rules for node_modules, build outputs, and `.env`.
- [`.cursorrules`](.cursorrules) — AI coding agent rules and Bangladesh commerce architectural guidelines.
- [`AGENTS.md`](AGENTS.md) — Antigravity IDE custom instructions and BaaS SDK guidance.

### Backend & Database
- [`apps/api/package.json`](apps/api/package.json) — Express, Prisma, Redis, Meilisearch dependencies.
- [`apps/api/tsconfig.json`](apps/api/tsconfig.json) — TypeScript compiler configuration for API.
- [`apps/api/prisma/schema.prisma`](apps/api/prisma/schema.prisma) — Relational models: User, Category, Product, Order, OrderItem.
- [`apps/api/src/lib/prisma.ts`](apps/api/src/lib/prisma.ts) — Prisma Client singleton.
- [`apps/api/src/main.ts`](apps/api/src/main.ts) — Express application server with `/health` and `/api/v1` routes.

### Frontend
- [`apps/web/package.json`](apps/web/package.json) — Next.js 15, React 19, Tailwind CSS 3.4 dependencies.
- [`apps/web/tsconfig.json`](apps/web/tsconfig.json) — TypeScript compiler configuration for Next.js.
- [`apps/web/next.config.mjs`](apps/web/next.config.mjs) — Next.js runtime configuration.
- [`apps/web/tailwind.config.ts`](apps/web/tailwind.config.ts) — Tailwind CSS styling tokens.
- [`apps/web/postcss.config.mjs`](apps/web/postcss.config.mjs) — PostCSS plugins.
- [`apps/web/src/app/layout.tsx`](apps/web/src/app/layout.tsx) — Root HTML layout and metadata.
- [`apps/web/src/app/page.tsx`](apps/web/src/app/page.tsx) — Next.js home page and architecture dashboard.
- [`apps/web/src/app/globals.css`](apps/web/src/app/globals.css) — CSS theme variables and Tailwind directives.
