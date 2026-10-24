# Technical Architecture Plan: Bangladesh-Focused Single-Vendor E-commerce Platform

**Document Version:** 1.0  
**Status:** Under Review (Awaiting User Approval)  
**Foundation Candidate:** MedusaJS v2 (`@medusajs/medusa` v2.x) with Official Medusa Admin (`@medusajs/ui`) & Next.js Storefront  
**Reference Admin Design:** [https://demo.medusajs.com/app/orders](https://demo.medusajs.com/app/orders)  
**Governing Documents:**  
- [ideaproposition.md](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/ideaproposition.md)  
- [prd.md](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/prd.md)  
- [user-journeys.md](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/user-journeys.md)  

---

## 1. Executive Summary & Repository Status

### 1.1 Current Repository Status
Inspection of `/Users/sabbir/Desktop/All projects/bd-commerce-platform` confirms that the repository is **greenfield** (empty of code):
- Contains only specification documents: `ideaproposition.md`, `prd.md`, `user-journeys.md`, `Cross-Audit Report v4 vs PRD v2.md`, and IDE custom instructions (`AGENTS.md`).
- No package managers, lockfiles, node modules, or backend/frontend directories exist yet.
- **Rule Adherence:** No packages are installed and no application code is written during this planning phase.

### 1.2 Architectural North Star
This platform is engineered specifically for a single-vendor retail brand operating in Bangladesh. It bridges enterprise-grade commerce primitives with local market realities:
- **MedusaJS v2 Framework & Admin Foundation:** Native order lifecycle, pricing sets, product catalog, customer management, inventory units, and extensible workflows.
- **Admin UI Preservation:** Preservation of Medusa's clean, fast, tabular visual language (`@medusajs/ui`), while extending standard screens (Orders, Products) via official UI Widgets and introducing dedicated routes for Bangladesh store operations.
- **Bangladesh Commerce Primitives:** Single-currency BDT pricing, Cash on Delivery (COD) phone confirmation workflows, bKash & Nagad Merchant APIs, multi-zone delivery calculation (Inside Dhaka, Suburbs, Outside Dhaka), automated third-party courier dispatch (Steadfast, Pathao, RedX), dual-language (Bangla & English) storefront with localized typography, high-converting campaign landing page builder, and gross contribution profit reporting.

---

## 2. Technology Stack Evaluation & Version Strategy

### 2.1 Backend: MedusaJS v2 Evaluation
Medusa v2 is the definitive framework candidate for this platform.

| Architectural Dimension | Medusa v1 (Legacy) | Medusa v2 (Selected Architecture) | Strategic Advantage for BD Commerce |
|---|---|---|---|
| **Architecture** | Monolithic plugin architecture, TypeORM | Modular Framework (`@medusajs/framework`), MikroORM, DML (Data Modeling Language) | Strict isolation between core commerce and BD-specific modules (Courier, BD Payments, Landing Pages). |
| **Admin Panel** | Separate Vite SPA project | Embedded Admin directly built into backend bundle (`src/admin`) | Single deployment target, unified types, instant widget injection. |
| **Custom Data Models** | Custom entities + TypeORM subscribers | DML (`model.define`) + Workflows (`createWorkflow`, `createStep`) | Custom models (e.g. `LandingPage`, `CODSettings`, `CourierManifest`) automatically expose database links, events, and API endpoints. |
| **Workflows Engine** | Ad-hoc event subscribers & custom services | Transactional Workflows with built-in compensation/rollback | Critical for multi-step order pipelines (e.g., reserve stock -> create courier consignment -> send SMS -> trigger Meta CAPI; if SMS/Courier fails, compensate cleanly). |
| **Admin Design System** | Medusa UI v1 | `@medusajs/ui` (Tailwind-based Radix primitives, dark/light theme, keyboard shortcuts) | Exact match to the reference admin (`demo.medusajs.com/app/orders`). |

**Recommended Version:** Medusa v2 latest stable (`@medusajs/medusa@^2.0`). Node.js 20+ LTS runtime.

### 2.2 Storefront: Next.js (App Router)
- **Framework:** Next.js 14/15 with React Server Components (RSC) and App Router.
- **Styling:** Vanilla CSS design system supplemented with Tailwind CSS v3.4 (explicitly locked per project rules).
- **Client SDK:** Official `@medusajs/js-sdk` for server-side and client-side data fetching.
- **Localization:** Bilingual (Bangla `bn` & English `en`) URL routing (`/[locale]/...`), with Google Fonts `Inter` (English) and `Hind Siliguri` / `Anek Bangla` (Bangla) with unicode font subsets.
- **Image Optimization:** Next.js `Image` component with automatic WebP/AVIF transcoding and CDN caching.

### 2.3 Database, Cache & Background Jobs
- **Primary Database:** PostgreSQL 16+. Relational integrity, JSONB support for category-specific attributes and order-time snapshots, native foreign keys, and ACID transactions.
- **In-Memory Store & Queue:** Redis 7+ (Alpine). Serves as pub/sub event bus, job queue broker for Medusa workflows, and distributed lock manager for flash-sale checkout synchronization.
- **Object Storage:** Local disk provider for local development; S3-compatible cloud storage (Cloudflare R2 or AWS S3) for production media and invoice PDFs.

---

## 3. High-Level System Topology

```
                                      +---------------------------------------------+
                                      |                Storefront                   |
                                      |         Next.js App Router (RSC)            |
                                      | - SSR Catalog & PDP                         |
                                      | - Buy Now / Cart / Localized Checkout       |
                                      | - Campaign Landing Page Dynamic Renderer    |
                                      | - Bilingual (BN/EN) & Meta CAPI Event Proxy |
                                      +----------------------+----------------------+
                                                             |
                                                             | HTTPS / JSON (Public Store APIs)
                                                             v
+------------------------------------------------------------+-----------------------------------------------------------+
|                                                   MedusaJS v2 Backend                                                  |
|                                                                                                                        |
|  +------------------------------------------------------------------------------------------------------------------+  |
|  |                                                 HTTP & Routing Layer                                             |  |
|  |   - /store/* (Public Storefront API: Cart, Products, Orders, Landing Pages, Checkout)                            |  |
|  |   - /admin/* (Protected Admin API: Catalog, Orders, Courier, Reports, Settings)                                  |  |
|  |   - /hooks/* (Provider Webhooks: bKash, Nagad, Steadfast, Pathao)                                                |  |
|  +------------------------------------------------------------------------------------------------------------------+  |
|                                                                                                                        |
|  +------------------------------------+  +-------------------------------------+  +---------------------------------+  |
|  |          Core Medusa Modules       |  |      Bangladesh Custom Modules      |  |         Workflows Engine        |  |
|  |  - Product & Category Module       |  |  - BD Store Settings Module         |  |  - Order Placement Workflow     |  |
|  |  - Pricing Module (BDT default)    |  |  - Category Attributes Module       |  |  - COD Confirmation Workflow   |  |
|  |  - Inventory & Stock Location      |  |  - Courier & Manifest Module        |  |  - Courier Dispatch Workflow    |  |
|  |  - Cart & Order Module             |  |  - Landing Page CMS Module          |  |  - Meta CAPI Tracking Flow      |  |
|  |  - Auth Module (JWT / Sessions)    |  |  - Financial Analytics Module       |  |  - Return & Refund Workflow     |  |
|  |  - Customer Module                 |  |  - SMS Dispatch Module              |  |  - Stock Level Sync Workflow    |  |
|  +------------------------------------+  +-------------------------------------+  +---------------------------------+  |
|                                                                                                                        |
|  +------------------------------------------------------------------------------------------------------------------+  |
|  |                                            Embedded Medusa Admin                                                 |  |
|  |   - Native Orders & Products Screens (Table / Detail view)                                                        |  |
|  |   - Custom UI Widgets (COD Confirmation, BD Shipping Status, Courier Consignment, Category Attribute Fields)    |  |
|  |   - Dedicated Admin Routes (/app/landing-pages, /app/reports/contribution-profit, /app/settings/bangladesh)       |  |
|  +------------------------------------------------------------------------------------------------------------------+  |
+------------------------------------------------------------+-----------------------------------------------------------+
                                                             |
                         +-----------------------------------+-----------------------------------+
                         |                                   |                                   |
                         v                                   v                                   v
          +-----------------------------+     +-----------------------------+     +-----------------------------+
          |         PostgreSQL 16       |     |           Redis 7           |     |     External Integrations   |
          | - Medusa Core Tables        |     | - Workflows Engine Queue    |     | - bKash Merchant API        |
          | - BD Custom Module Tables   |     | - Event Pub/Sub             |     | - Nagad Payment Gateway     |
          | - Order History & Snapshots |     | - Flash-sale Stock Locks    |     | - Steadfast / Pathao APIs   |
          | - Financial Reports Data    |     | - Rate-limiting Cache       |     | - BD SMS Gateway (Greenweb) |
          |                             |     |                             |     | - Meta Conversions API      |
          +-----------------------------+     +-----------------------------+     +-----------------------------+
```

---

## 4. Medusa v2 Capability Mapping: Native vs. Configured vs. Custom

To avoid rebuilding what already exists while strictly satisfying every requirement of `prd.md` and `user-journeys.md`, the platform features are categorized into three implementation tiers:

| Domain | Feature | Implementation Tier | Architectural Strategy |
|---|---|---|---|
| **Catalog** | Product title, description, handle, media | **Native** | Standard Medusa Product Module. |
| **Catalog** | Product variants & 3-option matrix (e.g. Size, Color, Material) | **Native** | Standard Product Variant module; storefront and admin widget enforce the 3-option ceiling per PRD §3.2. |
| **Catalog** | Multilingual content (Bangla title, description) | **Custom Extension** | Custom DML model linked to Product: `ProductLocalization` storing `locale`, `title`, `description`. Exposed via custom admin widget and Storefront API. |
| **Catalog** | Category hierarchies (parent/child) | **Native** | Standard Medusa Product Category Module with nesting. |
| **Catalog** | Category-specific dynamic attributes (e.g., Fabric, Capacity) | **Custom Module** | Custom `CategoryAttribute` and `ProductAttributeValue` DML models. Rendered dynamically on PDP and Product Admin. |
| **Catalog** | Variant deactivation & out-of-stock badge | **Configured** | Variant `manage_inventory=true`, `allow_backorder=false`. Status flag on variant level. |
| **Pricing** | BDT single-currency default | **Configured** | Default store region created with currency `BDT`. Zero decimal currency config. |
| **Pricing** | Simplified BDT variant pricing entry | **Custom Admin Widget** | Native Medusa v2 Pricing uses Price Sets and Regions. A custom Admin UI widget on the product page abstracts this into a single "Price in BDT" and "Compare-at Price" input, updating the underlying price set programmatically. |
| **Inventory** | Stock tracking per variant per location | **Native** | Medusa v2 Inventory & Stock Location modules. |
| **Inventory** | Inventory reservation during checkout | **Native** | Native Cart completion reserve mechanism. |
| **Inventory** | Flash-sale stock concurrency locking | **Custom Middleware** | Redis-backed distributed lock during cart completion to eliminate race conditions under heavy load. |
| **Cart & Buy Now** | Shopping Cart (multi-item) [Confirmed] | **Native** | Medusa Cart Module with custom line-item properties. |
| **Cart & Buy Now** | "Buy Now" flow (skip cart, direct checkout) [Confirmed] | **Storefront Workflow** | Adheres strictly to User Journeys (Journeys 4, 5, 6): If cart is empty, adds item and goes directly to checkout. If cart already has items, the Buy Now item is added to the existing cart (no items removed) and navigates to checkout showing all items editable. If exact same variant is already in cart, keeps existing quantity unchanged without duplicate lines. |
| **Checkout** | Bangladesh address form (District, Thana, Address) [Confirmed] | **Configured + Custom** | Map Bangladesh administrative boundaries into Medusa `Address` fields (`province` = District, `city` = Thana/Upazila, `address_1` = Full Street Address). |
| **Checkout** | Delivery zone calculation (Inside Dhaka, Suburbs, Outside) | **Custom Fulfillment** | Fulfillment provider inspects District/Thana and resolves corresponding Shipping Option rate dynamically. |
| **Payments** | Cash on Delivery (COD) | **Custom Payment Provider** | Custom `AbstractPaymentProvider` for COD: authorizes immediately with 0 fee; captures only upon delivery. |
| **Payments** | bKash Merchant API | **Custom Payment Provider** | Custom provider implementing bKash Tokenized/Checkout API: creates agreement/payment, handles redirect/callback, verifies payment amount, authorizes/captures. |
| **Payments** | Nagad Gateway API | **Custom Payment Provider** | Custom provider implementing Nagad Merchant API with public/private key verification and callback processing. |
| **Order Lifecycle** | Standard status (Pending, Completed, Canceled) | **Native** | Medusa Order Module. |
| **Order Lifecycle** | Bangladesh-specific fulfillment states (Confirmed, Dispatched, Out for Delivery, Delivered, Failed, RTO) | **Custom Module Link** | `OrderFulfillmentState` DML model linked to native `Order`. Extended order detail widget renders this lifecycle. |
| **Order Lifecycle** | Order-time immutable snapshot | **Native + Custom Link** | Medusa stores order items, variant snapshots, and pricing at order time. Custom DML table snapshots category attributes, customer note, and zone delivery policy. |
| **Order Management** | Order list table & details view | **Native (Extended)** | Native Medusa Admin preserved. Extended with UI Widgets for COD Confirmation, courier booking, and return logs. |
| **Fraud & Risk** | COD phone verification & RTO risk scoring | **Custom Module** | Custom `CustomerRiskProfile` recording RTO counts, phone delivery success rate, and warning badges. |
| **Fulfillment** | Third-party courier integration (Steadfast, Pathao, RedX) | **Custom Module** | Service layer integrating courier REST APIs for parcel generation, tracking code sync, and status webhook ingestion. |
| **Notifications** | SMS notifications (Order placed, COD confirm, Shipped, Out for delivery) | **Custom Workflow Step** | Medusa workflow steps invoking pluggable SMS Gateway provider (Greenweb, BulkSMSBD, or mock in dev). |
| **Landing Pages** | Campaign landing page builder & direct checkout | **Custom Module** | Custom DML `LandingPage` with modular JSON block schema (`hero`, `features`, `reviews`, `embedded_checkout`). Storefront dynamic renderer. |
| **Analytics** | Meta Pixel & Server Conversions API (CAPI) | **Custom Storefront + Workflow** | Next.js client renders Pixel script; Medusa workflow sends server-side CAPI event on purchase with deduplication `event_id`. |
| **Reporting** | Sales, Campaign ROI, Contribution Profit, COD Settlement | **Custom Admin Route** | Custom admin route (`/app/reports/...`) calculating net sales, product COGS, shipping subsidy, courier fees, and ad spend. |

---

## 5. Data Modeling & Custom Modules (DML Architecture)

Medusa v2 uses the Data Modeling Language (`model.define`) to create type-safe relational schemas that seamlessly integrate with Medusa's query engine and workflows.

### 5.1 Store Localization & Bangla Catalog Extension
```typescript
// src/modules/bd-catalog/models/product-localization.ts
import { model } from "@medusajs/framework/utils"

export const ProductLocalization = model.define("product_localization", {
  id: model.id().primaryKey(),
  product_id: model.text().index(),
  locale: model.enum(["bn", "en"]).default("bn"),
  title: model.text(),
  description: model.text().nullable(),
  meta_title: model.text().nullable(),
  meta_description: model.text().nullable(),
})
```

### 5.2 Dynamic Category Attributes
```typescript
// src/modules/bd-catalog/models/category-attribute.ts
import { model } from "@medusajs/framework/utils"

export const CategoryAttribute = model.define("category_attribute", {
  id: model.id().primaryKey(),
  category_id: model.text().index(),
  code: model.text().unique(), // e.g., 'fabric_type', 'shoe_size'
  name: model.text(),          // e.g., 'Fabric Type'
  name_bn: model.text(),       // e.g., 'কাপড়ের ধরন'
  type: model.enum(["text", "select", "multiselect", "number"]),
  options: model.json().nullable(), // ['Cotton', 'Silk', 'Georgette']
  is_required: model.boolean().default(false),
  is_filterable: model.boolean().default(true),
  display_order: model.number().default(0),
})

export const ProductAttributeValue = model.define("product_attribute_value", {
  id: model.id().primaryKey(),
  product_id: model.text().index(),
  attribute_id: model.text().index(),
  value: model.json(), // supports single value or array
})
```

### 5.3 Bangladesh Order Extension & COD Risk Management
```typescript
// src/modules/bd-orders/models/order-bd-details.ts
import { model } from "@medusajs/framework/utils"

export const OrderBdDetails = model.define("order_bd_details", {
  id: model.id().primaryKey(),
  order_id: model.text().unique().index(),
  delivery_zone: model.text(), // Stores configured zone code: 'inside_dhaka', 'outside_dhaka' [Confirmed], or dynamic custom zones [Recommended]
  cod_status: model.enum(["not_applicable", "unconfirmed", "confirmed", "escalated", "canceled"]).default("not_applicable"),
  cod_confirmed_by: model.text().nullable(),
  cod_confirmed_at: model.dateTime().nullable(),
  cod_notes: model.text().nullable(),
  shipment_state: model.enum([
    "pending_confirmation",
    "ready_to_ship",
    "dispatched",
    "in_transit",
    "out_for_delivery",
    "delivered",
    "delivery_failed",
    "rto_initiated",
    "rto_received"
  ]).default("pending_confirmation"),
  courier_provider: model.enum(["steadfast", "pathao", "redx", "manual"]).nullable(),
  courier_tracking_code: model.text().nullable().index(),
  courier_consignment_id: model.text().nullable(),
  courier_fee_charged: model.bigInt().default(0),      // in BDT Poisha or Taka
  courier_cod_settled_amount: model.bigInt().nullable(),
  courier_settlement_date: model.dateTime().nullable(),
  cogs_total: model.bigInt().default(0),               // total cost of goods snapshot
  utm_source: model.text().nullable(),
  utm_medium: model.text().nullable(),
  utm_campaign: model.text().nullable(),
  landing_page_slug: model.text().nullable(),
})
```

### 5.4 Customer Risk & Trust Profile
```typescript
// src/modules/bd-orders/models/customer-risk-profile.ts
import { model } from "@medusajs/framework/utils"

export const CustomerRiskProfile = model.define("customer_risk_profile", {
  id: model.id().primaryKey(),
  phone_number: model.text().unique().index(),
  total_orders_placed: model.number().default(0),
  total_orders_delivered: model.number().default(0),
  total_rto_orders: model.number().default(0),
  is_flagged_fraud: model.boolean().default(false),
  flag_reason: model.text().nullable(),
  last_order_at: model.dateTime().nullable(),
})
```

### 5.5 Campaign Landing Page Builder
```typescript
// src/modules/bd-campaigns/models/landing-page.ts
import { model } from "@medusajs/framework/utils"

export const LandingPage = model.define("landing_page", {
  id: model.id().primaryKey(),
  slug: model.text().unique().index(),
  title: model.text(),
  is_active: model.boolean().default(true),
  featured_product_id: model.text().nullable(),
  checkout_mode: model.enum(["embedded", "modal", "redirect"]).default("embedded"),
  seo_title: model.text().nullable(),
  seo_description: model.text().nullable(),
  meta_pixel_id: model.text().nullable(), // optional override
  custom_css: model.text().nullable(),
  sections: model.json(), // Structured array of blocks (Hero, Gallery, Reviews, Accordion, Checkout)
  created_at: model.dateTime(),
  updated_at: model.dateTime(),
})
```

### 5.6 Return & Refund Management
```typescript
// src/modules/bd-returns/models/order-return-request.ts
import { model } from "@medusajs/framework/utils"

export const OrderReturnRequest = model.define("order_return_request", {
  id: model.id().primaryKey(),
  order_id: model.text().index(),
  status: model.enum(["requested", "approved", "rejected", "item_received", "refund_processed"]).default("requested"),
  reason: model.text(),
  customer_phone: model.text(),
  return_courier: model.text().nullable(),
  return_tracking_code: model.text().nullable(),
  refund_method: model.enum(["bkash", "nagad", "bank_transfer", "store_credit"]).nullable(),
  refund_account_details: model.json().nullable(),
  refund_amount: model.bigInt().nullable(),
  refund_transaction_id: model.text().nullable(),
  reviewed_by: model.text().nullable(),
  refunded_at: model.dateTime().nullable(),
  notes: model.text().nullable(),
})
```

---

## 6. Admin Panel Architecture (Medusa Admin Extensions)

The reference admin ([https://demo.medusajs.com/app/orders](https://demo.medusajs.com/app/orders)) sets the standard for layout, navigation, aesthetics, and user flows. Medusa v2 provides a first-party extension architecture using `@medusajs/ui` that compiles directly into the core admin bundle.

### 6.1 Layout & Navigation Structure
The Admin dashboard maintains the standard Medusa layout, preserving native sections while organizing Bangladesh features cleanly into the sidebar:

```
+-------------------------------------------------------------+
|  Medusa Brand / Store Switcher                              |
|  [Search ⌘K]                                                |
+-------------------------------------------------------------+
|  COMMERCE                                                   |
|    • Orders              (Native - Extended with BD status) |
|    • Products            (Native - Extended with BDT/BN)    |
|    • Categories          (Native - Extended with Attributes)|
|    • Inventory           (Native)                           |
|    • Customers           (Native - Extended with COD Risk)  |
|    • Promotions          (Native)                           |
+-------------------------------------------------------------+
|  BANGLADESH OPERATIONS                                      |
|    • COD Confirmations   (Dedicated queue for call center)  |
|    • Courier Manifest    (Consignment batching & dispatch)  |
|    • Returns & Refunds   (Return approvals & payouts)       |
|    • Campaign Pages      (Landing page builder)             |
|    • Financial Analytics (Sales, COGS, Contribution Profit) |
+-------------------------------------------------------------+
|  SETTINGS                                                   |
|    • Store Settings      (Native)                           |
|    • Bangladesh Config   (Delivery Zones, SMS, Pixels)      |
|    • Payment Gateways    (bKash / Nagad credentials)        |
|    • Team & Permissions  (Native + RBAC flags)              |
+-------------------------------------------------------------+
```

### 6.2 Existing Orders Screen Re-Use & Extension
The native Orders table and Order Details view (`/app/orders` and `/app/orders/:id`) will be preserved as the core operations hub and extended via Medusa v2 Admin UI Widgets:

1. **Orders Table Customization:**
   - **Custom Status Badges:** Display COD Confirmation state (`Unconfirmed [Yellow]`, `Confirmed [Green]`, `Escalated [Red]`) alongside native Payment/Fulfillment status.
   - **Delivery Zone Indicator:** Tag showing `Inside Dhaka`, `Suburbs`, or `Outside Dhaka`.
   - **Fast Action Buttons:** Single-click "Confirm COD" button directly from the table row for high-speed dispatch operators.

2. **Order Detail Screen Widgets (`order.details.after` / `order.details.side.before`):**
   - **COD Verification Widget:** Displays customer phone number with click-to-call link, customer RTO risk history score, confirmation notes input field, and action buttons (`Confirm Order`, `Call Attempt #1`, `Call Attempt #2`, `Cancel Fraud`).
   - **Bangladesh Courier Widget:** Displays integrated courier dropdown (Steadfast / Pathao / RedX / Manual), auto-populates recipient address and COD collection amount, provides a "Generate Consignment" button, and renders live tracking timeline.
   - **Cost & Margin Breakdown Widget:** Accessible to Store Owners/Finance showing: Item Price, Cost of Goods (COGS), Customer Delivery Paid, Actual Courier Delivery Fee, Payment Gateway Deduction, and Net Order Contribution Margin in BDT.
   - **Returns & Exchanges Widget:** Logs return requests, captures bKash/Nagad refund mobile numbers, and triggers restocking upon parcel return.

### 6.3 Existing Products Screen Re-Use & Extension
The native Products list and creation flow (`/app/products`, `/app/products/create`) are preserved and extended:

1. **Simplified BDT Variant Pricing Widget:**
   - Instead of exposing Medusa v2's multi-region, multi-currency Price Sets to staff, a custom UI widget injects a clean, single-currency form:
     - **Regular Price (BDT ৳)**
     - **Discount / Sale Price (BDT ৳)** (optional)
     - **Cost of Goods per Unit (BDT ৳)** (restricted to Admin/Finance)
   - Automatically synchronizes with Medusa's underlying BDT Region Price Set upon save.
2. **Bangla Translation Widget:**
   - Adds collapsible bilingual fields directly under Product Name and Description:
     - Bangla Title (`পণ্যের নাম`)
     - Bangla Description (`পণ্যের বিবরণ`)
   - Visual banner warning if product is published without Bangla content.
3. **Category Attribute Matrix Widget:**
   - When a category is assigned to the product (e.g., "Men's Panjabi"), the widget dynamically queries `CategoryAttribute` and displays custom fields (e.g. `Fabric`, `Fit`, `Collar Style`).
4. **Variant Management Ceiling:**
   - Product creation modal restricts option types to a maximum of 3 (e.g., Size, Color, Material) to maintain high-speed storefront performance and mobile usability.

### 6.4 Custom Admin Screens (Dedicated Routes)
1. **COD Call Center Queue (`/app/cod-queue`):**
   - High-throughput interface for support staff calling customers to confirm orders before dispatch. Keyboard shortcuts for quick status transitions (`Enter` to confirm, `Esc` to mark unreached).
2. **Campaign Landing Page Builder (`/app/landing-pages`):**
   - Visual block editor built with Medusa UI components: create/edit landing pages, select featured products, toggle between embedded/modal checkout, set custom Meta Pixel IDs, and rearrange landing blocks.
3. **Financial & Contribution Reports (`/app/reports/contribution-profit`):**
   - Comprehensive dashboard showing Net Revenue, Total COGS, Shipping Subsidies, Payment Gateway Fees, Ad Spend (imported via Meta API or manual entry), and True Contribution Profit (BDT).
4. **Bangladesh Store Settings (`/app/settings/bangladesh`):**
   - Delivery zone flat rates configuration (Inside Dhaka, Suburbs, Outside Dhaka).
   - Free shipping threshold toggle and value.
   - SMS Gateway credentials (API Key, Sender ID, message templates for Order Placed, Out for Delivery, etc.).
   - Meta Pixel ID and Conversions API Access Token.

### 6.5 Manual Phone & WhatsApp Order Creation via Native Draft Orders [Confirmed — Journey 25]
To fulfill telephone, Facebook message, and WhatsApp order requests without reinventing custom order forms, the platform reuses Medusa's official **Draft Orders** feature (`/app/draft-orders`):
1. **Customer Lookup / Quick Registration:** Staff enters the customer's 11-digit mobile number. If the customer exists, their name and address pre-fill automatically; if new, staff types the customer name and phone to create a guest account on the fly.
2. **Product & Real-Time Stock Selection:** Staff selects products and variants from the live catalog. Medusa ensures that out-of-stock items cannot be accidentally drafted.
3. **Address & Delivery Zone Selection:** Staff inputs address and selects the delivery zone (`Inside Dhaka` or `Outside Dhaka` [Confirmed]), which immediately computes and applies the exact BDT shipping fee.
4. **Payment Selection:**
   - **Cash on Delivery (COD):** Set as unpaid/pending payment. Order moves directly to `Confirmed` (since staff already verbally confirmed on the call).
   - **bKash/Nagad:** Staff enters the provided transaction ID (`trxID`) directly, or Medusa generates an SMS payment link for the customer.
5. **Conversion to Order:** Clicking "Convert to Order" instantly reserves inventory, logs the staff member's ID as `created_by`, creates the standard order record, and passes the parcel to the fulfillment dispatch queue.

---

## 7. Storefront Architecture (Next.js App Router)

### 7.1 Architecture & Page Structure
```
storefront/
├── app/
│   ├── [locale]/                   # Bilingual route prefix ('bn' | 'en')
│   │   ├── (main)/                 # General store layout (Header, Nav, Footer)
│   │   │   ├── page.tsx            # High-conversion Homepage (Banners, Categories, Flash Deals)
│   │   │   ├── products/
│   │   │   │   └── [handle]/
│   │   │   │       └── page.tsx    # Optimized PDP (Variant selector, BDT pricing, Stock status, Buy Now)
│   │   │   ├── categories/
│   │   │   │   └── [handle]/
│   │   │   │       └── page.tsx    # Category listing with dynamic attribute filtering
│   │   │   ├── cart/
│   │   │   │   └── page.tsx        # Shopping Cart drawer & full review page
│   │   │   ├── checkout/
│   │   │   │   └── page.tsx        # Streamlined 1-page BD checkout
│   │   │   ├── track-order/
│   │   │   │   └── page.tsx        # Guest order tracking by Phone Number + Order ID
│   │   │   └── [page]/
│   │   │       └── page.tsx        # Content pages (Privacy, Return Policy, Terms, About)
│   │   └── lp/
│   │       └── [slug]/
│   │           └── page.tsx        # Standalone Campaign Landing Page (No distractions, direct checkout)
│   ├── api/
│   │   ├── tracking/capi/route.ts  # Server-side Meta Conversions API proxy
│   │   └── webhooks/               # Storefront utility webhooks
│   └── layout.tsx
├── components/
│   ├── ui/                         # Core design tokens & accessible primitives
│   ├── catalog/                    # PDP gallery, variant chips, sticky mobile ATC bar
│   ├── checkout/                   # BD address picker, payment radio, live delivery summary
│   ├── landing/                    # Dynamic block renderers (Hero, Video, Reviews, StickyCTA)
│   └── common/                     # LanguageSwitcher, CurrencyFormatter, WhatsAppChatFloating
└── lib/
    ├── medusa-client.ts            # Configured @medusajs/js-sdk
    ├── localization.ts             # Bangla/English dictionaries & date/number formatters
    └── meta-pixel.ts               # Deduplicated Pixel + CAPI tracker
```

### 7.2 Catalog & Product Detail Page (PDP)
- **Variant Selection Logic:** Fast interactive client component with URL state reflection (`?variant=...`). Prevents invalid option combinations; clearly flags out-of-stock variants with a distinctive badge and disables the Buy Now button.
- **BDT Currency Display:** Formatted cleanly as `৳ ১,২৫০` (Bangla) or `৳ 1,250` (English) with optional compare-at strike-through price and percentage discount badge (`২০% ছাড়`).
- **Delivery Charge Preview:** Dynamic delivery charge preview on PDP based on customer's selected zone or previous session selection.
- **Sticky Mobile Action Bar:** On mobile screens, when the main ATC button scrolls out of view, a bottom sticky bar appears with variant summary, price, and two buttons: "Add to Cart" and "Buy Now".

### 7.3 Direct "Buy Now" vs. Cart Checkout Engine [Confirmed — Aligned with User Journeys 4, 5, 6]
The platform strictly implements the unified cart model specified in `user-journeys.md` (FR-4.3.2, FR-4.3.3, FR-4.3.8) to guarantee that customers never lose previously selected cart items when tapping "Buy Now".

```
                                      [Customer on PDP]
                                              |
                     +------------------------+------------------------+
                     |                                                 |
            Click "Add to Cart"                                Click "Buy Now"
                     |                                                 |
           [Add/Increment Line]                                        |
                     |                                                 |
          [Stay on PDP + Toast]                                        |
                     |                                                 |
                     v                                                 v
    [Customer continues browsing or clicks Cart]      +--------------------------------+
                                                      | What is currently in the Cart? |
                                                      +----------------+---------------+
                                                                       |
        +--------------------------------------------------------------+--------------------------------------------------------------+
        |                                                              |                                                              |
    [Case 1: Cart is Empty]                               [Case 2: Cart has other items]                             [Case 3: Same variant in cart]
  (User Journey 4) [Confirmed]                               (User Journey 5) [Confirmed]                               (User Journey 6) [Confirmed]
        |                                                              |                                                              |
- Adds chosen variant (qty 1)                                  - Adds new variant to EXISTING cart.                           - Exact same variant already in cart
- Skips intermediate cart page                                 - Does NOT delete or replace existing items!                     (e.g., Variant A x 2).
- Immediately routes to Checkout                               - Immediately routes to Checkout.                              - Keeps quantity unchanged (qty 2).
- Shows 1 line item.                                           - Shows ALL items (Product X + Product Y).                     - Does NOT duplicate line or silently add.
- If customer navigates away/abandons,                         - Customer can edit quantities or remove any                   - Routes to Checkout with qty 2 editable.
  item remains safely in cart.                                   line in order review before placing order.                   - Customer adjusts qty if needed.
```

**Technical Implementation in Next.js Storefront & Medusa:**
1. **Single Unified Cart Instance:** The browser maintains a single active Medusa `cart_id` in secure cookies/local state. There is no confusing secondary/hidden session.
2. **Deterministic Add-and-Redirect:**
   - When **Add to Cart** is clicked: invokes Medusa Line Item Add API; stays on PDP; updates cart count badge in navbar; displays slide-out mini-cart toast.
   - When **Buy Now** is clicked:
     - If the variant is **not** in the cart: invokes Medusa Line Item Add API to append it to the current cart, then immediately redirects the browser to `/checkout`.
     - If the variant is **already** in the cart: detects the existing line item; keeps the current quantity as-is (per FR-4.3.3); immediately redirects the browser to `/checkout`.
3. **Checkout Review & Safety Net:**
   - The `/checkout` page loads the full cart contents.
   - The Order Review section shows all line items with thumbnail, title, selected variant, quantity selector (+ / - / delete), unit price, and subtotal.
   - If the customer realizes they already had an older item in the cart that they don't want right now, they can simply tap the trash/remove icon right inside the checkout page before clicking "Place Order".
   - If the customer leaves checkout and returns to shopping, all items remain safely in their cart.

### 7.4 Bangladesh-Optimized One-Page Checkout
The checkout page is engineered for zero friction and high conversion on mobile networks:
- **Phone-First Customer Identity:** Customers only need to provide Name and an 11-digit Bangladesh Mobile Number (`017XXXXXXXX`, `018...`, `019...`, `013...`, `014...`, `016...`, `015...`). No mandatory account creation or password required.
- **3-Step Local Address Selector:**
  1. **Delivery Zone Selection:** [Inside Dhaka] | [Dhaka Suburbs (Gazipur/Savar/Narayanganj)] | [Outside Dhaka]. Immediately calculates and locks shipping charge.
  2. **District & Thana:** Autocomplete dropdown of all 64 Bangladesh Districts and corresponding Thanas/Upazilas.
  3. **Street Address:** Multi-line text field for House/Road/Area details.
- **Payment Method Switcher:**
  - **Cash on Delivery (COD):** Default selected. Clear notice: *"Pay in cash when parcel is delivered to your doorstep."*
  - **bKash:** Direct online payment.
  - **Nagad:** Direct online payment.
- **Order Confirmation:** Submits directly to Medusa order placement workflow.

### 7.5 Campaign Landing Page Dynamic Architecture
- Marketing teams generate unique URLs: `myshop.com/lp/summer-panjabi-collection`.
- Completely standalone layout with header/footer navigation stripped out to minimize bounce rate.
- Dynamic JSON-driven block renderer:
  - **Hero Block:** High-impact campaign imagery/video, urgency countdown timer, product bullet points.
  - **Offer Bundle Block:** "Buy 1 for ৳1,200, Buy 2 for ৳2,200 (Free Delivery)".
  - **Customer Reviews Block:** Local social proof, customer photos, unboxing clips.
  - **Embedded Checkout Block:** Inline 1-page checkout placed directly at the bottom of the landing page. Customer enters name, phone, address, selects variant, and places order without leaving the page.

---

## 8. Bangladesh Payment Providers & Courier Architecture

### 8.1 Payment Providers (`src/modules/bd-payments`)
Built on Medusa v2's `AbstractPaymentProvider`:

```
                                +-----------------------------+
                                |  Medusa Payment Collection  |
                                +--------------+--------------+
                                               |
                   +---------------------------+---------------------------+
                   |                                                       |
                   v                                                       v
    +-------------------------------+                       +-------------------------------+
    |      COD Payment Provider     |                       |    bKash / Nagad Provider     |
    +-------------------------------+                       +-------------------------------+
    | - Status: Authorized (৳0 fee) |                       | - Status: Requires Action     |
    | - Webhook: None required      |                       | - API: Create Payment Token   |
    | - Settlement: Captured on     |                       | - Redirect/Callback URL       |
    |   delivery via courier        |                       | - Webhook: Verify Signature   |
    +-------------------------------+                       | - Status: Captured (Paid)     |
                                                            +-------------------------------+
```

1. **Cash on Delivery (COD) Provider:**
   - **Provider ID:** `pp_cod`
   - **Authorization:** Succeeds immediately with `status: authorized`. Amount is recorded as pending collection.
   - **Capture:** Triggered automatically when Courier webhook posts `DELIVERED`, or manually by Admin staff clicking "Mark as Paid".
2. **bKash Tokenized/Checkout Provider:**
   - **Provider ID:** `pp_bkash`
   - **Protocol:**
     1. `authorizePayment`: Calls bKash `createPayment` with order ID, BDT amount, and callback URL. Returns bKash redirect URL or gateway URL.
     2. `capturePayment`: On callback return, calls bKash `executePayment`. Validates transaction status (`Completed`), verifies `currency === "BDT"` and exact amount.
     3. Stores `trxID`, `paymentID`, and customer wallet number in payment session data.
3. **Nagad Merchant Provider:**
   - **Provider ID:** `pp_nagad`
   - **Protocol:** Generates cryptographic payload signed with Merchant Private Key; calls Nagad `check-out-initialize`; handles payment verification callback with Nagad Public Key.

### 8.2 Third-Party Courier Integration Service (`src/modules/bd-courier`)
Supports automated and manual dispatch workflows for Bangladesh's leading logistics providers:

```
[Order Confirmed in Admin]
            |
  [Click "Send to Courier"]
            |
            v
+-----------------------+
| Courier Router Engine |
+-----------+-----------+
            |
   +--------+--------+--------+
   |                 |        |
   v                 v        v
[Steadfast API] [Pathao API] [RedX API]
   |                 |        |
   +--------+--------+--------+
            |
            v
[Save Consignment ID & Tracking Code to Order]
            |
            v
[Auto-send SMS to Customer with Tracking Link]
            |
            v
[Listen for Courier Webhooks: IN_TRANSIT -> OUT_FOR_DELIVERY -> DELIVERED / RTO]
```

1. **Courier Adapter Interface:**
   ```typescript
   export interface CourierProviderAdapter {
     createParcel(order: OrderWithBdDetails): Promise<{
       consignment_id: string
       tracking_code: string
       courier_fee: number
     }>
     trackParcel(trackingCode: string): Promise<CourierTrackingTimeline>
     handleWebhook(payload: any, signature: string): Promise<CourierStatusUpdate>
   }
   ```
2. **Steadfast Courier Adapter:** Implements parcel booking via `POST /create_order` (recipient name, phone, address, COD amount), returns tracking code, and processes status webhook callbacks.
3. **Pathao Courier Adapter:** Implements merchant store address mapping, city/zone ID resolution, order dispatch, and parcel tracking.
4. **Manual Courier Fallback:** For local riders or paper-manifest delivery: staff inputs custom courier name and manual receipt number; status can be progressed manually.

---

## 9. Marketing Analytics: Meta Pixel & Conversions API (CAPI)

Bangladesh single-vendor brands rely heavily on Facebook and Instagram ads. Client-only tracking loses up to 35% of events due to iOS privacy, ad-blockers, and mobile network disconnects. A unified dual-layer tracking pipeline is designed:

```
  Customer Action (e.g. Purchase)
                |
        +-------+-------+
        |               |
        v               v
  [Client-side]   [Server-side]
   Meta Pixel      Medusa Workflow -> Meta Graph CAPI API
        |               |
        +-------+-------+
                |
                v
   Matching 'event_id' UUID
   (Meta deduplicates automatically)
```

1. **Deduplication Strategy:**
   - Every event (e.g. `ViewContent`, `AddToCart`, `InitiateCheckout`, `Purchase`) generates a unique `event_id` (e.g., `ord_01J...` for purchases).
   - Both browser Pixel and Medusa server dispatch this identical `event_id`.
   - Meta deduplicates the event, achieving 100% attribution without double-counting.
2. **Customer Data Parameter Hashing (Advanced Matching):**
   - Normalized phone number (E.164: `+88017XXXXXXXX`), customer email, city, and IP address are SHA-256 hashed before transmission to Meta CAPI.
3. **UTM Attribution Persistence:**
   - Storefront captures `utm_source`, `utm_medium`, `utm_campaign`, and `fbclid` from incoming URL parameters and persists them in local storage.
   - Attached to the order metadata upon completion for campaign-level contribution profit reporting.

---

## 10. Financial Reporting & Contribution Profit Architecture

Traditional e-commerce platforms only report "Gross Revenue." In Bangladesh, high COD return rates (RTO), packaging costs, courier return fees, and ad spend determine whether the business is truly profitable.

```
+------------------------------------------------------------------------+
|                      Contribution Profit Formula                       |
+------------------------------------------------------------------------+
|  Net Delivered Sales Revenue (BDT)                                     |
|  - Cost of Goods Sold (COGS of delivered units)                         |
|  - Packaging & Operational Box Costs                                   |
|  - Outbound Courier Delivery Fees (including store delivery subsidy)  |
|  - RTO Return Courier Penalties (on failed deliveries)                 |
|  - Payment Gateway Processing Fees (bKash/Nagad % cuts)                |
|  - Attributed Campaign Ad Spend (Meta Ads)                             |
|  ====================================================================  |
|  = TRUE CONTRIBUTION PROFIT (BDT ৳)                                    |
+------------------------------------------------------------------------+
```

### Reporting Engine Implementation (`src/modules/bd-reports`):
- **Sales Analytics:** Orders breakdown by payment method (COD vs. bKash/Nagad), delivery zone, and fulfillment status.
- **COD Settlement Reconciliation:** Tracks total COD value handed to couriers vs. cash actually deposited into company bank accounts, flagging discrepancies.
- **RTO Loss Analyzer:** Calculates financial loss caused by returned parcels (wasted packaging + two-way courier fees) grouped by courier and delivery zone.
- **Campaign ROI:** Merges UTM order data with ad costs to display True Return on Ad Spend (ROAS) based on *delivered and paid orders*, not just placed orders.

---

## 11. Security, Role-Based Access Control (RBAC) & Compliance

### 11.1 Staff Roles & Permissions
Staff access is strictly segregated via Medusa v2 Auth and custom permission middleware:

| Role | Catalog & Pricing | Order Management & COD | Courier Dispatch | Returns & Refunds | Financial Reports | Settings & API Keys |
|---|---|---|---|---|---|---|
| **Super Admin (Owner)** | Full access | Full access | Full access | Full access | Full access | Full access |
| **Store Manager** | Create / Edit | View / Edit | Dispatch / Track | Review / Approve | View Net Sales | View only |
| **Order Call Center** | View only | View / Confirm COD / Add Notes | View only | Log request | No access | No access |
| **Warehouse / Dispatch** | View inventory | View confirmed orders | Book courier / Print manifests | Mark item received | No access | No access |
| **Finance / Accounts** | View only | View orders | View fees | Process refund payout | Full access | View gateway settings |

### 11.2 API Boundaries & Validation
- **Public Store APIs (`/store/*`):** Rate-limited via Redis (e.g., 60 requests/minute per IP; 5 cart completions/minute to prevent checkout bot attacks).
- **Protected Admin APIs (`/admin/*`):** JWT session authentication with strict CORS policy restricted to the trusted Admin domain.
- **External Webhooks (`/hooks/*`):** Signature validation for bKash, Nagad, and courier webhooks before processing payloads.
- **Input Validation:** Zod schemas applied to all custom endpoints to sanitize inputs (e.g. Bangladesh mobile phone regex: `^(?:\+8801|8801|01)[3-9]\d{8}$`).

---

## 12. Logging, Background Jobs, Backups & Reliability

1. **Structured Logging:** Pino structured JSON logger with request correlation IDs (`x-correlation-id`). Sensitive customer data (e.g., full credit card/wallet PINs, raw passwords) is scrubbed.
2. **Workflows Engine & Compensation:** Medusa v2 workflows handle multi-step state changes. If a step fails (e.g., courier booking returns an API error), previous steps (e.g., inventory reservation) automatically execute compensating rollback steps.
3. **Database Backups:**
   - Automated daily logical backups via `pg_dump` compressed and encrypted to remote cold storage.
   - Point-in-Time Recovery (PITR) via Write-Ahead Logging (WAL) enabled on production PostgreSQL.
4. **Rate Limiting & Anti-Abuse:** Redis token-bucket rate limiter guarding order placement and SMS verification endpoints to prevent SMS gateway credit exhaustion.

---

## 13. Testing Strategy & Quality Assurance

```
+---------------------------------------------------------------+
|                       Testing Pyramid                         |
+---------------------------------------------------------------+
|  E2E Tests (Playwright)                                       |
|  - Complete Customer Journey: PDP -> Buy Now -> COD Checkout  |
|  - Admin Journey: Order list -> Confirm COD -> Dispatch       |
+---------------------------------------------------------------+
|  Integration Tests (Jest + Medusa Test Runner)                |
|  - Custom Workflows (Order placement, COD risk scoring)      |
|  - Custom Payment Providers (bKash token verification)        |
|  - Courier API Adapters (Mocked Steadfast/Pathao payloads)    |
+---------------------------------------------------------------+
|  Unit Tests (Vitest)                                          |
|  - BD phone number validation & normalization                 |
|  - Delivery zone calculation rules                            |
|  - Contribution profit formula accuracy                       |
+---------------------------------------------------------------+
```

---

## 14. Simplest Maintainable Trade-offs & Unresolved Decisions

### 14.1 Key Architecture Decisions & Trade-offs

| Decision | Selected Option | Alternative Considered | Trade-off & Rationale |
|---|---|---|---|
| **Admin Architecture** | Embedded Medusa v2 Admin with UI Widgets (`@medusajs/ui`) | Building a standalone custom React/Next.js Admin from scratch | **Selected:** Reuses 90% of battle-tested order/product management out of the box, preserving the reference UI; adds custom BD features via officially supported widgets with near-zero UI maintenance overhead. |
| **Variant Pricing Entry** | Custom single-field BDT UI Widget abstracting Price Sets | Using native Medusa v2 Region/Price Set UI | **Selected:** Medusa v2's native pricing requires selecting price lists and regions, which is error-prone for local Bangladeshi retail staff. The custom widget keeps data entry foolproof while maintaining underlying engine compatibility. |
| **Storefront Architecture** | Next.js App Router (RSC) | Medusa Next.js starter template unmodified | **Selected:** The default starter template is global-oriented. Building a tailored Next.js storefront allows native bilingual typography, direct Buy Now checkout, and Bangladesh delivery zone pickers. |
| **Courier Dispatch** | Standardized Courier Adapter Interface | Hardcoding a single courier API into order routes | **Selected:** Bangladeshi merchants frequently switch between Steadfast, Pathao, and RedX depending on delivery performance. An adapter interface allows switching couriers without altering order workflows. |

### 14.2 Unresolved Decisions Register (Pending Owner Confirmation)

| # | Topic | Decision Options | Impact |
|---|---|---|---|
| **U1** | **bKash & Nagad Setup** | Merchant Direct API vs. Aggregator (e.g. Aamarpay, Shurjopay, SSLCommerz) | Direct APIs have lower transaction fees (1.2% - 1.5%) but require formal merchant contracts; aggregators setup quickly but take 2% - 2.5%. |
| **U2** | **Primary Courier Provider** | Steadfast vs. Pathao vs. RedX | Influences which adapter is configured first for Phase 1 automated dispatch. Manual fallback is provided immediately. |
| **U3** | **SMS Gateway Vendor** | GreenwebBD vs. BulkSMSBD vs. Onnorokom SMS | Determines the outbound HTTP SMS provider configuration and approved Sender ID. |
| **U4** | **PDP Delivery Zone Preview** | Auto-detect IP vs. Default to Inside Dhaka vs. Show Range (৳৬০ - ৳১৩০) | Affects PDP layout and initial shipping cost display before checkout. |
| **U5** | **Staff Permission Granularity** | Role-based (Call Center / Warehouse / Manager) vs. Custom fine-grained flags | Affects the initial admin user configuration during onboarding. |

---

## 15. Phased Implementation Roadmap

```
+----------------------------------------------------------------------------------------------------+
|  Phase 1: Core Foundation & Essential Launch (Weeks 1 - 4)                                         |
|  - Initialize Medusa v2 backend & PostgreSQL database schema.                                      |
|  - Implement Custom Modules: Product Localization (BN/EN), Category Attributes, BD Order Details.  |
|  - Implement Payment Providers: Cash on Delivery (COD) & bKash.                                   |
|  - Configure Bangladesh Delivery Zones (Inside Dhaka, Suburbs, Outside Dhaka).                     |
|  - Build Next.js Storefront: Home, PDP (Variants + Buy Now), bilingual support, 1-page checkout.   |
|  - Extend Medusa Admin: COD Confirmation widget, BDT pricing widget, BD shipping status.           |
|  - Setup SMS notification dispatcher & Meta Pixel + CAPI pipeline.                                 |
+----------------------------------------------------------------------------------------------------+
|  Phase 2: Operational Maturity & Courier Automation (Weeks 5 - 6)                                  |
|  - Integrate Steadfast / Pathao Courier API adapters for automated consignment creation.          |
|  - Launch Campaign Landing Page Builder (`/lp/[slug]`) with embedded checkout.                     |
|  - Implement Customer COD Risk scoring & fraud detection badges.                                   |
|  - Implement Nagad Payment Provider.                                                               |
|  - Build Return & Refund management workflow.                                                      |
+----------------------------------------------------------------------------------------------------+
|  Phase 3: Financial Reporting & Scaling (Weeks 7 - 8)                                              |
|  - Deploy Contribution Profit & COGS reporting dashboard.                                          |
|  - COD Courier Settlement reconciliation tools.                                                     |
|  - Redis-based flash-sale stock concurrency locking & performance tuning.                          |
+----------------------------------------------------------------------------------------------------+
```

---

## 16. Verification & Approval Gate

In accordance with user instructions:
- **No packages have been installed.**
- **No configuration files have been altered.**
- **No application code has been generated.**

This technical plan is now presented for your review and approval. Once approved, the project will proceed to **Phase 1: Project Scaffolding & Core Architecture Setup**.
