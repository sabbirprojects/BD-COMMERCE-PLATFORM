# Architecture Decision: MedusaJS v2 Migration

## 1. Decision
The Bangladesh Single-Vendor B2C E-commerce Platform will adopt **MedusaJS v2 (`@medusajs/medusa@^2.0` with `@medusajs/framework`)** as the core headless commerce engine, and will utilize **Medusa Admin** (built with `@medusajs/ui`) as the centralized administrative dashboard.

The **Next.js Storefront (`apps/web`)** will remain a decoupled, standalone web application powered by the Next.js 15 App Router, React Server Components (RSC), and Tailwind CSS 3.4, communicating with the Medusa v2 engine via `@medusajs/js-sdk` over REST APIs.

The temporary custom Express + Prisma ORM scaffold currently in `apps/api` will be phased out and replaced by an official MedusaJS v2 application workspace (`apps/medusa`), aligning the implementation with governing specifications in [`technical-plan.md`](../technical-plan.md), [`quality-checklist.md`](../quality-checklist.md), and [`docs/medusa-admin-reference-audit.md`](medusa-admin-reference-audit.md).

---

## 2. Why This Decision

### 2.1 Battle-Tested Commerce Foundations
Building a reliable e-commerce platform from scratch requires handling hundreds of interdependent edge cases: variant option Cartesian matrices, multi-location inventory allocation, price sets across customer groups, idempotent payment authorizations, tax/shipping adjustments, order state machines, and partial fulfillments.
- MedusaJS v2 provides these foundations natively with proven correctness.
- Re-implementing these primitives in a custom Express + Prisma scaffold would divert engineering resources away from Bangladesh-specific business value (COD verification, local couriers, and campaign landing pages) toward reinventing standard commerce machinery.

### 2.2 Alignment with Documented Admin Reference
The product owner's explicit requirement is to match the clean, high-density administrative UX of [https://demo.medusajs.com/app/orders](https://demo.medusajs.com/app/orders).
- MedusaJS v2 ships with the official Medusa Admin embedded directly in the application bundle.
- It provides native `@medusajs/ui` design primitives (`FocusModal`, `Drawer`, `Table`, `Badge`, `Skeleton`), accessible keyboard navigation (`⌘K` command palette, `⌘\` sidebar collapse), and official extensibility mechanisms (UI Widgets and UI Routes) without maintaining a separate administrative frontend code base.

### 2.3 Modular Framework with Transactional Workflows
Bangladesh commerce depends on complex, multi-system operational pipelines:
1. An unconfirmed COD order is placed -> inventory is reserved -> an SMS is queued -> an admin call-center verification ticket is opened.
2. A COD order is confirmed -> a courier parcel is booked via third-party API (Steadfast/Pathao) -> a tracking code is assigned -> an invoice PDF is generated.
3. If courier parcel creation or SMS dispatch fails, the system must perform atomic compensation or cleanly mark the step for manual retry without leaving the order in an invalid state.
Medusa v2's **Workflows Engine** (`createWorkflow`, `createStep` with built-in compensation steps) is purpose-built for transactional pipelines, eliminating the fragility of custom Express controller logic.

### 2.4 Single-Vendor Focus with Zero Marketplace Overhead
Medusa v2 operates out-of-the-box as a single-vendor retail platform. It avoids the complexity of multi-tenant marketplace platforms, allowing clean extensions for call center staff, order confirmation teams, and delivery dispatchers.

---

## 3. Current-State Audit

| Current Component | Recommendation | Architectural Rationale | Evidence Path |
|---|---|---|---|
| **Storefront (`apps/web`)** | **Keep** | Decoupled Next.js 15 App Router application with React 19 and Tailwind CSS 3.4. Matches PRD §1.1 for mobile-first consumer browsing and campaign landing pages. Connects cleanly to Medusa v2 via `@medusajs/js-sdk`. | [`apps/web/package.json`](../apps/web/package.json), [`apps/web/src/app/page.tsx`](../apps/web/src/app/page.tsx) |
| **API Server (`apps/api`)** | **Replace** | Currently a basic Express 4.21 server with a single health check and stub endpoints. It lacks authentication, cart state management, checkout workflows, inventory reservation, and admin UI. Replacing with Medusa v2 satisfies all commerce requirements natively. | [`apps/api/package.json`](../apps/api/package.json), [`apps/api/src/main.ts`](../apps/api/src/main.ts) |
| **Prisma Schema (`apps/api/prisma`)** | **Retire** | Custom schema defining User, Category, Product, Order, and OrderItem. Medusa v2 uses its own Data Modeling Language (DML via `model.define`) and MikroORM. Keeping Prisma would create duplicate schemas and redundant database abstractions. | [`apps/api/prisma/schema.prisma`](../apps/api/prisma/schema.prisma) |
| **PostgreSQL Service** | **Keep** | PostgreSQL 16 is the required relational database for MedusaJS v2. The existing container (`bd_commerce_postgres`), persistent volume (`postgres_data`), and port `5432` are directly reusable. | [`docker-compose.yml`](../docker-compose.yml#L2-L20) |
| **Redis Service** | **Keep** | Redis 7 is required by MedusaJS v2 for event streaming, pub/sub messaging, and distributed workflow locking. The container (`bd_commerce_redis`), persistent volume (`redis_data`), and port `6379` are directly reusable. | [`docker-compose.yml`](../docker-compose.yml#L22-L43) |
| **Meilisearch Service** | **Keep / Reassess** | Medusa v2 core does not strictly require Meilisearch to operate, but [`prd.md`](../prd.md) and [`technical-plan.md`](../technical-plan.md#L57-L62) specify sub-50ms typo-tolerant search for English and Banglish queries on the storefront. The container (`bd_commerce_meilisearch`) will remain active, synced via a Medusa product mutation workflow. | [`docker-compose.yml`](../docker-compose.yml#L45-L60) |
| **Root Environment Strategy (`.env`)** | **Keep & Refine** | Root `.env` and `.env.example` already centralize PostgreSQL, Redis, Meilisearch, JWT, and payment gateway variables. Additional Medusa-specific keys (`MEDUSA_BACKEND_URL`, `COOKIE_SECRET`, `JWT_SECRET`) will be added without exposing sensitive values in git. | [`.env.example`](../.env.example), [`.gitignore`](../.gitignore#L14-L20) |
| **Existing Documentation** | **Keep** | All existing specification documents ([`prd.md`](../prd.md), [`technical-plan.md`](../technical-plan.md), [`quality-checklist.md`](../quality-checklist.md), [`user-journeys.md`](../user-journeys.md), [`docs/medusa-admin-reference-audit.md`](medusa-admin-reference-audit.md)) were pre-architected around MedusaJS v2 and remain 100% authoritative. | [`PROJECT_CONTEXT_HANDOFF.md`](../PROJECT_CONTEXT_HANDOFF.md#L38) |
| **Root Package Scripts** | **Reassess** | Root `package.json` contains scripts targeting `apps/api` (`dev:api`, `build:api`, `prisma:*`). These will be transitioned to point to the Medusa application workspace (`dev:medusa`, `build:medusa`, `medusa:migrate`). | [`package.json`](../package.json#L11-L22) |

---

## 4. Target Repository Structure

The following monorepo workspace structure is proposed. It maintains clean separation between customer-facing storefront presentation and central commerce business operations:

```
bd-commerce-platform/
├── apps/
│   ├── web/                              # Next.js Storefront Workspace (Port 3000)
│   │   ├── src/
│   │   │   ├── app/                      # App Router: [locale]/catalog, product, checkout, cart
│   │   │   ├── components/               # UI components, sticky mobile action bars, drawer
│   │   │   └── lib/
│   │   │       ├── medusa.ts             # @medusajs/js-sdk client initialization
│   │   │       └── meilisearch.ts        # Instant search client for catalog queries
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── medusa/                           # MedusaJS v2 Backend & Admin Workspace (Port 9000)
│       ├── src/
│       │   ├── admin/                    # Official Medusa Admin Extensions
│       │   │   ├── routes/               # Custom UI Routes: /app/cod-queue, /app/landing-pages, etc.
│       │   │   └── widgets/              # UI Widgets: COD phone verification, courier booking
│       │   ├── modules/                  # Custom Bangladesh Domain Modules
│       │   │   ├── bangladesh-shipping/  # Zone rate calculations (Inside/Outside Dhaka)
│       │   │   ├── cod-verification/     # COD confirmation state machine & call-log tracking
│       │   │   ├── courier-dispatch/     # Steadfast & Pathao parcel creation & tracking
│       │   │   └── landing-page/         # Campaign landing page builder model & API
│       │   └── workflows/                # Transactional workflows (Order Placement, Courier Dispatch)
│       ├── medusa-config.ts              # Database, Redis, Admin & Plugin configuration
│       ├── package.json
│       └── tsconfig.json
│
├── docs/                                 # Architectural specifications & QA checklists
├── docker-compose.yml                    # Postgres, Redis, Meilisearch containers
├── .env                                  # Root environment variables (untracked)
├── .env.example                          # Root environment template
├── .cursorrules                          # Architecture and styling guidelines
└── package.json                          # Root monorepo workspace orchestrator
```

> **Note on Shared Packages:** Dedicated `packages/*` folders are deliberately avoided in Phase 1 to prevent unnecessary packaging overhead. Type definitions will be consumed directly via `@medusajs/js-sdk` and standard TypeScript inference.

---

## 5. Data Migration and Schema Mapping

Because the current repository is in the pre-build stage and contains zero production customer records, **no database data extraction or ETL migration is required**. The mapping below establishes how concepts from the prototype Prisma schema transition into native Medusa v2 concepts and custom modules.

### 5.1 Schema Concept Mapping Table

| Existing Prisma Concept | Medusa v2 Native Equivalent | Custom Extension or Module Needed? | Migration / Modeling Consideration |
|---|---|---|---|
| **User (Customer)** | Medusa `Customer` (`@medusajs/medusa`) | Native | Phone-first customer accounts without mandatory email/password for guest checkouts (PRD §8.1). |
| **User (Admin/Staff)** | Medusa `User` & `Invite` | Custom RBAC Roles | Assign granular staff permissions: Owner, Manager, Call Center / Fulfillment ([`prd.md`](../prd.md#L48-L50)). |
| **Category** | Medusa `ProductCategory` | Custom Attributes Extension | Native tree structure (`parent_category_id`, `category_children`). Needs link to category-specific attributes. |
| **Product** | Medusa `Product` | Custom Bilingual Fields | Native handles, status (`draft`, `published`), thumbnails, media gallery. |
| **Product Variants & SKU** | Medusa `ProductVariant` | Custom 3-Option Cap | Native multi-variant Cartesian generation. Needs validation preventing > 3 option dimensions (PRD §3.2). |
| **Price (BDT Currency)** | Medusa `PriceSet` / `Price` | Configuration Only | Configure single base region with currency code `BDT` (৳). Standardize single-currency display. |
| **Cost of Goods Sold (COGS)** | Not in native Core | Custom Variant Field (`cogs`) | Store cost price per variant; protect via RBAC (Owner and Finance access only). |
| **Inventory / Stock** | Medusa `InventoryItem` & `ReservationItem` | Native | Tracks stock per physical location; handles real-time stock reservations on order creation. |
| **Order** | Medusa `Order` | Custom Order Extension | Native multi-item line items, totals, currency, customer associations. |
| **Order Status** | Medusa `OrderStatus` & `FulfillmentStatus` | Custom COD State Machine | Add custom COD confirmation statuses: `Unconfirmed`, `Confirmed`, `Escalated`, `Canceled`. |
| **Payment Status & Methods** | Medusa `PaymentSession` & `PaymentCollection` | Custom Payment Providers | Custom payment providers for COD, bKash Merchant API, and Nagad PGW ([`prd.md`](../prd.md#L9)). |
| **Shipping Address** | Medusa `Address` | Configuration Only | Map Bangladesh administrative fields: `province` -> District (Zilla), `city` -> Thana/Upazila. |

### 5.2 Required Custom Medusa Modules and Extensions

1. **Bilingual Product Localization:**
   - *Requirement:* Bangla Title (`title_bn`) and Description (`description_bn`) ([`prd.md`](../prd.md#L12)).
   - *Implementation:* Custom Medusa DML Module (`product-localization`) linked to core `Product` model via Medusa module links.
2. **3-Option-Type Constraint:**
   - *Requirement:* Strict limit of maximum 3 option types (e.g. Size, Color, Material) per product ([`quality-checklist.md`](../quality-checklist.md#L87-L95)).
   - *Implementation:* Custom validation step prepended to Medusa's product creation workflow (`createProductsWorkflow`).
3. **COGS & Contribution Margin Module:**
   - *Requirement:* Variant unit cost price and true contribution profit reporting (Delivered Total − COGS − Shipping Subsidy − Courier Cost − Gateway Fee) ([`prd.md`](../prd.md#L40)).
   - *Implementation:* DML extension on `ProductVariant` and custom Admin analytics route (`/app/reports/contribution-profit`).
4. **COD Phone Verification & Fraud Risk Module:**
   - *Requirement:* Call log attempt counter, RTO risk badge, and one-click COD confirmation ([`quality-checklist.md`](../quality-checklist.md#L306-L318)).
   - *Implementation:* Custom DML Module (`order-bd-details`) linked to `Order`, rendered via an Admin Widget at `order.details.side`.
5. **Bangladesh Delivery Zone Shipping Module:**
   - *Requirement:* Dynamic delivery charge computation (`Inside Dhaka`, `Suburbs`, `Outside Dhaka`) ([`prd.md`](../prd.md#L10)).
   - *Implementation:* Custom Fulfillment Provider plugin evaluating customer delivery district and applying configured BDT flat rates.
6. **Third-Party Courier Dispatch Module:**
   - *Requirement:* Automated parcel booking and tracking synchronization for Steadfast, Pathao, and RedX ([`quality-checklist.md`](../quality-checklist.md#L345-L380)).
   - *Implementation:* Custom module with courier HTTP clients, parcel creation steps in order workflows, and public webhook routes for delivery status updates.
7. **Campaign Landing Page Module:**
   - *Requirement:* Standalone landing page builder reusing central catalog products with direct Mode A/B checkout ([`prd.md`](../prd.md#L60), [`user-journeys.md`](../user-journeys.md#L47-L48)).
   - *Implementation:* Custom DML Module (`landing-page`) with admin builder route (`/app/landing-pages`) and public storefront API.

---

## 6. Docker and Local Development Impact

### 6.1 What Remains Unchanged
- **PostgreSQL 16 (`bd_commerce_postgres`):** Continues running on port `5432`. Medusa v2 will connect directly using the existing credentials specified in root `.env`.
- **Redis 7 (`bd_commerce_redis`):** Continues running on port `6379`. Medusa v2 will utilize this Redis instance for its event bus and workflow queue.
- **Meilisearch (`bd_commerce_meilisearch`):** Continues running on port `7700`.
- **Persistent Volumes:** `postgres_data`, `redis_data`, and `meilisearch_data` remain intact.
- **Network:** `bd_commerce_network` remains the shared bridge network.

### 6.2 What Changes
- **Port Allocation:**
  - Storefront (`apps/web`): Port `3000`.
  - Medusa v2 Backend & Admin (`apps/medusa`): Standard port `9000` (API routes at `http://localhost:9000/store/...`, Admin dashboard at `http://localhost:9000/app`).
  - Former Express API port `4000` is decommissioned upon migration.
- **Environment Variable Organization:**
  - Root `.env` will supply `DATABASE_URL` and `REDIS_URL` to `apps/medusa`.
  - Medusa secrets (`COOKIE_SECRET`, `JWT_SECRET`, `ADMIN_CORS`, `STORE_CORS`) will be formalized in `.env.example`.
  - Next.js storefront will consume `NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000`.

---

## 7. Migration Phases

```
Phase 1: Preserve Current State
   │
   ▼
Phase 2: Initialize MedusaJS v2 Core
   │
   ▼
Phase 3: Connect Database & Redis Services
   │
   ▼
Phase 4: Verify Native Medusa Admin (/app)
   │
   ▼
Phase 5: Implement Custom Bangladesh Modules
   │
   ▼
Phase 6: Integrate Next.js Storefront via SDK
   │
   ▼
Phase 7: Decommission Express/Prisma Scaffold
   │
   ▼
Phase 8: Execute Quality Checklist & Verification
```

### Phase 1: Preserve Current State
- **Purpose:** Secure existing prototype work and configuration before modifying workspaces.
- **Files Affected:** `apps/api/`, `package.json`.
- **Prerequisites:** All current services healthy (`docker compose ps`).
- **Verification Criteria:** Clean backup copy or git commit checkpoint of existing code and documentation.
- **Rollback Consideration:** Trivial file revert if initial workspace reconfiguration encounters issues.

### Phase 2: Add MedusaJS v2 Application
- **Purpose:** Initialize an official Medusa v2 project inside `apps/medusa`.
- **Files Affected:** `apps/medusa/`, `package.json` (add `@medusajs/medusa@^2.0` workspace).
- **Prerequisites:** Node.js v20+ runtime verified (`node -v`).
- **Verification Criteria:** Medusa packages installed cleanly without dependency peer-conflicts; `medusa-config.ts` created.
- **Rollback Consideration:** Delete `apps/medusa` directory.

### Phase 3: Configure Database and Redis
- **Purpose:** Point Medusa v2 to the running PostgreSQL container and Redis broker.
- **Files Affected:** `apps/medusa/medusa-config.ts`, `.env`.
- **Prerequisites:** `bd_commerce_postgres` and `bd_commerce_redis` containers active.
- **Verification Criteria:** `npx medusa db:migrate` executes successfully, provisioning Medusa v2 core schema in PostgreSQL.
- **Rollback Consideration:** Reset Postgres schema via `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`.

### Phase 4: Configure and Verify Medusa Admin
- **Purpose:** Launch embedded Medusa Admin and verify design system fidelity.
- **Files Affected:** `apps/medusa/src/admin/`, `apps/medusa/medusa-config.ts`.
- **Prerequisites:** Medusa backend boots cleanly on port `9000`.
- **Verification Criteria:** Admin panel loads at `http://localhost:9000/app`; staff user created via `npx medusa user`; orders and products table visual styling matches `demo.medusajs.com/app/orders`.
- **Rollback Consideration:** Check browser console and Medusa server logs for widget registration issues.

### Phase 5: Model Bangladesh-Specific Custom Modules
- **Purpose:** Build custom DML models and workflows for Bangladesh operations.
- **Files Affected:** `apps/medusa/src/modules/`, `apps/medusa/src/workflows/`, `apps/medusa/src/admin/widgets/`.
- **Prerequisites:** Phase 4 complete and verified.
- **Verification Criteria:**
  1. `product-localization` module provides Bangla title and description fields in product modal.
  2. `createProductsWorkflow` enforces maximum 3 option types.
  3. `order-bd-details` widget renders COD phone verification controls on order details sidebar.
- **Rollback Consideration:** Disable individual module declarations in `medusa-config.ts`.

### Phase 6: Connect Next.js Storefront
- **Purpose:** Replace mock data in `apps/web` with live Medusa SDK calls.
- **Files Affected:** `apps/web/package.json` (add `@medusajs/js-sdk`), `apps/web/src/lib/medusa.ts`, `apps/web/src/app/`.
- **Prerequisites:** Medusa v2 API endpoints accessible with `STORE_CORS` allowing `http://localhost:3000`.
- **Verification Criteria:** Products published in Medusa Admin render on storefront home/catalog pages; cart items sync to Medusa cart session.
- **Rollback Consideration:** Revert storefront data fetchers to mock data.

### Phase 7: Retire Express/Prisma Scaffold
- **Purpose:** Cleanly remove deprecated `apps/api` folder and remove Prisma CLI scripts from root `package.json`.
- **Files Affected:** `apps/api/` (deleted), `package.json` (pruned).
- **Prerequisites:** Next.js storefront and Medusa Admin operating smoothly on live data.
- **Verification Criteria:** Zero references to `apps/api` remain in workspace configuration; `npm install` and build commands pass cleanly.
- **Rollback Consideration:** Restore `apps/api` from Phase 1 backup if needed.

### Phase 8: Testing and Production Hardening
- **Purpose:** Systematically execute the 48 quality criteria in [`quality-checklist.md`](../quality-checklist.md).
- **Files Affected:** Test suites, security middlewares, backup scripts.
- **Prerequisites:** All core features implemented.
- **Verification Criteria:** P0 checklist items verified with documented passes; zero security leaks in git history; automated backup verified.
- **Rollback Consideration:** Halt production launch until all P0 blockers are resolved.

---

## 8. Risks and Owner Decisions

Before initiating Phase 2 implementation, the following decisions must be documented by the project owner:

1. **Default Storefront Language:**
   - *Options:* English (as currently written in [`prd.md`](../prd.md#L59)) vs Bangla (as suggested in [`ideaproposition.md`](../ideaproposition.md)).
   - *Impact:* Determines initial locale redirect on `apps/web` root URL (`/` -> `/bn` vs `/en`).
2. **COD Stock Reservation Expiry Duration:**
   - *Options:* 24 hours vs 48 hours vs manual-only cancellation.
   - *Impact:* Determines cron interval and workflow timer for returning unconfirmed COD order items to available inventory.
3. **Payment Provider Integration Sequence:**
   - *Options:* Build Cash on Delivery (COD) first -> bKash Merchant API second -> Nagad third.
   - *Recommendation:* Prioritize COD, as it represents over 80% of launch volume in Bangladesh.
4. **Courier Integration Sequence:**
   - *Options:* Steadfast Courier API first vs Pathao Courier API first vs Manual Consignment entry fallback.
   - *Recommendation:* Implement manual consignment entry first (CHK-FUL-02), followed by Steadfast API integration (CHK-FUL-01).
5. **Role of Meilisearch in Initial Release:**
   - *Options:* Use Meilisearch immediately for storefront catalog search vs rely on native database search during initial testing.
   - *Recommendation:* Keep container running; attach Medusa indexing subscriber during storefront assembly.
6. **Data Migration Status:**
   - *Confirmed Fact:* Current database contains zero production data. Fresh initialization of Medusa schema is 100% safe.

---

## 9. Prompt 9 Readiness Checklist

Before executing the implementation commands for MedusaJS v2, ensure the following conditions remain true:

- [ ] **Docker Containers Active:** `docker compose ps` shows `bd_commerce_postgres`, `bd_commerce_redis`, and `bd_commerce_meilisearch` in `Up (healthy)` state.
- [ ] **Node.js Environment Verified:** Node.js version is `>= 20.0.0` (`node -v` confirmed `v22.23.2`).
- [ ] **Tailwind Version Locked:** `apps/web/package.json` retains Tailwind CSS locked at `3.4.17` (do not upgrade to Tailwind v4).
- [ ] **Zero Uncommitted Secrets:** All generated credentials remain inside untracked `.env` and are never committed to version control.
- [ ] **Owner Alignment Confirmed:** Product owner has reviewed this architecture decision and approved transitioning from Express/Prisma to MedusaJS v2.

---

*Document compiled and saved to [`docs/architecture-decision-medusa-v2.md`](architecture-decision-medusa-v2.md).*
