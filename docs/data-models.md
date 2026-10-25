> ⚠️ **SUPERSEDED — DO NOT IMPLEMENT FROM THIS FILE**
>
> This v1.0 draft has been replaced by [`database.md`](../database.md) **v2.0 (Canonical)** as of 2026-10-24.
>
> **Why:** no canonical database document ever existed; this draft was written after `architecture.md`/`dfd.md` but conflicts with both (different table lists) and with verified Medusa v2.22.0 behaviour (invalid `order.status = "unfulfillable_stockout"`, parallel `order_return_request` vs native `return`, `bigint` paisa claims vs DML `numeric`, per-page Meta Pixel vs PRD's single-pixel rule). It also omits the `order_return_request` entity it links to.
>
> The file is retained for history only. Entity definitions, money strategy, enums, indexes, security and retention are authoritative **only** in `database.md`. See `docs/database-fix-report.md` for the finding-by-finding disposition.
>
> Mapping of the names below to the canonical model: `database.md` Appendix A.

# Data Model Specification

## Bangladesh Single-Vendor E-commerce Platform

**Document Version:** 1.0 — Authoritative  
**Target Engine:** MedusaJS v2 Framework (`@medusajs/framework@2.22.0`)  
**Database:** PostgreSQL 16  
**ORM:** Medusa DML (`@medusajs/framework/utils`)  
**Date:** 2026-10-24  
**Reconciled With:**
- [`docs/architecture.md`](architecture.md) — Version 2.0 (Authoritative Reference)
- [`prd.md`](../prd.md) — v2 (Reconciled)
- [`docs/dfd.md`](dfd.md) — Version 2.0 (Data Flow Specifications)
- [`docs/dfd-review.md`](dfd-review.md) — All 18 Review Findings Resolved

---

## 1. Architectural Foundations & Principles

### 1.1 Single-Vendor Constraint
All entities are modeled strictly for a single-merchant Bangladesh e-commerce retail operation. There are no vendor entities, sub-merchant commissions, multi-tenant schemas, or split-shipment parent orders.

### 1.2 Medusa v2 DML & Module Isolation
1. **DML Definitions:** All custom database models are defined using Medusa v2 DML (`model.define`) from `@medusajs/framework/utils`.
2. **Module Encapsulation:** Custom business domains are packaged into isolated modules in `apps/medusa/src/modules/` (`bd-catalog`, `bd-orders`, `bd-courier`, `bd-payments`, `bd-campaigns`, `bd-settings`, `bd-audit`).
3. **Module Links (`defineLink`):** Associations between Medusa core models (`Product`, `ProductVariant`, `Order`) and custom Bangladesh models use Medusa v2 Module Links. No foreign-key coupling to core tables.
4. **Monetary Integer Representation:** All currency amounts are stored in BDT paisa (`model.bigNumber()`: 1 BDT = 100 paisa, e.g. ৳2,500.00 = `250000`).

---

## 2. Nine Core Domain Specifications

```
                           MEDUSA CORE COMMERCE
                   ┌───────────────────────────────────┐
                   │ Product ◄───► ProductVariant      │
                   │    │               │              │
                   │    ▼               ▼              │
                   │  Order  ◄───► OrderLineItem       │
                   └────┬───────────────┬──────────────┘
                        │               │
       ┌────────────────┴───────────────┴────────────────┐
       │             BANGLADESH CUSTOM MODULES           │
       ▼                                                 ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  bd-catalog  │     │  bd-orders   │     │ bd-payments  │     │  bd-courier  │
│--------------│     │--------------│     │--------------│     │--------------│
│• Localization│     │• BdDetails   │     │• Transaction │     │• ShipmentLog │
│• VariantCost │     │• RiskProfile │     │• WebhookLog  │     │• WebhookLog  │
│• CatAttribute│     │• ReturnReq   │     └──────────────┘     └──────────────┘
└──────────────┘     └──────────────┘
       ▲                    ▲                    ▲                    ▲
       │                    │                    │                    │
┌──────────────┐     ┌──────────────┐     ┌──────────────┐            │
│ bd-campaigns │     │ bd-settings  │     │   bd-audit   │────────────┘
│--------------│     │--------------│     │--------------│
│• LandingPage │     │• ZonesConfig │     │• AuditLog    │
│• Blocks JSON │     │• VatConfig   │     │• StaffRoles  │
└──────────────┘     └──────────────┘     └──────────────┘
```

---

### Domain 1: Bilingual Product Content (`bd-catalog`)

#### Entity: `ProductLocalization`
Provides full Bengali localization for products, supporting search, storefront rendering, and metadata.

| Field Name | DML Type | Modifiers / Constraints | Description |
|---|---|---|---|
| `id` | `model.id()` | `primaryKey()` | Unique identifier (e.g., `prodloc_...`) |
| `product_id` | `model.text()` | `index()` | Associated Medusa Product ID |
| `title_bn` | `model.text()` | `nullable()`, `searchable()` | Bengali product title (e.g., "পুরুষদের ক্যাজুয়াল পাঞ্জাবি") |
| `subtitle_bn` | `model.text()` | `nullable()` | Bengali subtitle / short tagline |
| `description_bn` | `model.text()` | `nullable()`, `searchable()` | Full Bengali product description |
| `description_excerpt_bn` | `model.text()` | `nullable()` | First 200 characters for search snippet |
| `material_bn` | `model.text()` | `nullable()` | Fabric / material name in Bengali (e.g., "১০০% কটন") |
| `care_instructions_bn` | `model.text()` | `nullable()` | Washing and care instructions in Bengali |
| `origin_country_bn` | `model.text()` | `nullable()` | Country of origin in Bengali (default: "বাংলাদেশ") |
| `handle_bn` | `model.text()` | `nullable()` | Bengali slug / phonetic URL handle |
| `meta_title_bn` | `model.text()` | `nullable()` | SEO meta title in Bengali |
| `meta_description_bn` | `model.text()` | `nullable()` | SEO meta description in Bengali |
| `is_bilingual_complete` | `model.boolean()` | `default(false)` | Flag indicating whether translation is verified |

---

### Domain 2: Product Variants & Maximum 3 Option Types (`bd-catalog`)

#### Business Constraint: Maximum 3 Option Types (Locked)
In Medusa v2, a product can have multiple `ProductOption` records. To prevent variant matrix explosion and mobile UX clutter on slow 3G/4G connections, the platform enforces a **hard constraint of maximum 3 option types** per product (e.g. `Size`, `Color`, `Fabric` or `Weight`).

#### Entity: `CategoryAttribute`
Defines dynamic attributes applicable to all products belonging to a category (e.g., Apparel: Fabric, Sleeve Length, Occasion).

| Field Name | DML Type | Modifiers / Constraints | Description |
|---|---|---|---|
| `id` | `model.id()` | `primaryKey()` | Unique identifier (`catattr_...`) |
| `category_id` | `model.text()` | `index()` | Medusa ProductCategory ID |
| `attribute_code` | `model.text()` | `index()` | Standard identifier (e.g., `fabric`, `sleeve_type`) |
| `name_en` | `model.text()` | — | Display label in English (e.g., "Fabric") |
| `name_bn` | `model.text()` | — | Display label in Bengali (e.g., "কাপড়ের ধরন") |
| `attribute_type` | `model.enum(["select", "multiselect", "text", "boolean"])` | `default("select")` | Input and filter type |
| `options_json` | `model.json()` | `nullable()` | Permitted options list: `["Cotton", "Silk", "Linen"]` |
| `is_required` | `model.boolean()` | `default(false)` | Whether required during product creation |
| `is_filterable` | `model.boolean()` | `default(true)` | Whether indexed in Meilisearch as `attribute_*` facet |

#### Entity: `ProductAttributeValue`
Stores the assigned category attribute values for an individual product.

| Field Name | DML Type | Modifiers / Constraints | Description |
|---|---|---|---|
| `id` | `model.id()` | `primaryKey()` | Unique identifier (`pattrval_...`) |
| `product_id` | `model.text()` | `index()` | Medusa Product ID |
| `attribute_code` | `model.text()` | `index()` | Matching `CategoryAttribute.attribute_code` |
| `value_en` | `model.text()` | — | Value in English (e.g., "100% Cotton") |
| `value_bn` | `model.text()` | `nullable()` | Value in Bengali (e.g., "১০০% সুতি") |
| `raw_value` | `model.text()` | `nullable()` | Normalized slug for faceted search matching |

---

### Domain 3: COGS & Contribution Margin (`bd-catalog` & `bd-orders`)

#### Entity: `ProductVariantCost` (`bd-catalog`)
Tracks variant-level Cost of Goods Sold (COGS) and supplier information. Restricted strictly to Finance and Owner roles.

| Field Name | DML Type | Modifiers / Constraints | Description |
|---|---|---|---|
| `id` | `model.id()` | `primaryKey()` | Unique identifier (`varcost_...`) |
| `variant_id` | `model.text()` | `unique()` | Associated Medusa ProductVariant ID |
| `cogs_bdt` | `model.bigNumber()` | `default(0)` | Cost of Goods per unit in BDT paisa (160000 = ৳1,600) |
| `packaging_cost_bdt` | `model.bigNumber()` | `default(0)` | Packaging materials cost in BDT paisa |
| `estimated_shipping_cost_bdt`| `model.bigNumber()` | `default(0)` | Estimated merchant delivery cost in paisa |
| `supplier_name` | `model.text()` | `nullable()` | Sourcing vendor / factory name |
| `supplier_sku` | `model.text()` | `nullable()` | Manufacturer SKU / barcode |
| `minimum_margin_percent` | `model.number()` | `default(20)` | Minimum target gross margin percentage |

*Security Rule:* Never indexed in Meilisearch. Stripped from all public storefront API responses.

---

### Domain 4: Delivery Zones (`bd-settings`)

#### Entity: `DeliveryZoneConfig`
Defines flat-rate shipping costs, SLAs, and free shipping thresholds for Bangladesh delivery zones.

| Field Name | DML Type | Modifiers / Constraints | Description |
|---|---|---|---|
| `id` | `model.id()` | `primaryKey()` | Unique identifier (`zone_...`) |
| `zone_code` | `model.enum(["inside_dhaka", "dhaka_suburbs", "outside_dhaka"])` | `unique()` | Standard zone code |
| `name_en` | `model.text()` | — | "Inside Dhaka", "Dhaka Suburbs", "Outside Dhaka" |
| `name_bn` | `model.text()` | — | "ঢাকা সিটির ভেতর", "ঢাকা উপশহর", "ঢাকার বাইরে" |
| `flat_rate_bdt` | `model.bigNumber()` | `default(6000)` | Shipping charge in BDT paisa (6000 = ৳60, 13000 = ৳130) |
| `free_shipping_threshold_bdt` | `model.bigNumber()` | `default(200000)` | Subtotal threshold for ৳0 shipping (200000 = ৳2,000) |
| `delivery_days_min` | `model.number()` | `default(1)` | Minimum SLA in business days |
| `delivery_days_max` | `model.number()` | `default(3)` | Maximum SLA in business days |
| `is_active` | `model.boolean()` | `default(true)` | Enable / disable zone |
| `coverage_districts_json` | `model.json()` | `nullable()` | List of matching districts / thanas |

---

### Domain 5: COD Verification & Risk Status (`bd-orders`)

#### Entity: `CustomerRiskProfile`
Maintains customer order history and RTO delivery track record, indexed by 11-digit mobile phone.

| Field Name | DML Type | Modifiers / Constraints | Description |
|---|---|---|---|
| `id` | `model.id()` | `primaryKey()` | Unique identifier (`risk_...`) |
| `phone_number` | `model.text()` | `unique()` | Normalized E.164 phone (`+88017...` or `017...`) |
| `customer_name` | `model.text()` | `nullable()` | Full customer name |
| `total_orders_placed` | `model.number()` | `default(0)` | Lifetime orders submitted |
| `total_orders_delivered` | `model.number()` | `default(0)` | Lifetime successfully delivered orders |
| `total_rto_orders` | `model.number()` | `default(0)` | Lifetime orders returned to origin (RTO) |
| `total_canceled_orders` | `model.number()` | `default(0)` | Lifetime canceled orders before dispatch |
| `delivery_success_rate` | `model.float()` | `default(0.0)` | Ratio of delivered / (delivered + RTO) |
| `is_flagged_fraud` | `model.boolean()` | `default(false)` | High-risk blacklist flag |
| `flag_reason` | `model.text()` | `nullable()` | Notes justifying fraud / abuse flag |
| `notes` | `model.text()` | `nullable()` | Call center operational remarks |
| `last_order_at` | `model.dateTime()` | `nullable()` | Timestamp of most recent order |

---

### Domain 6: Courier Shipment & Tracking (`bd-orders` & `bd-courier`)

#### Entity: `OrderBdDetails` (`bd-orders`)
Extends Medusa `Order` with Bangladesh 4-tier address, COD status, courier dispatch details, and 3-way financial split.

| Field Name | DML Type | Modifiers / Constraints | Description |
|---|---|---|---|
| `id` | `model.id()` | `primaryKey()` | Unique identifier (`ordbd_...`) |
| `order_id` | `model.text()` | `unique()` | Associated Medusa Order ID |
| `division` | `model.text()` | — | One of 8 divisions (`Dhaka`, `Chattogram`, etc.) |
| `district` | `model.text()` | — | One of 64 districts (zillas) |
| `thana` | `model.text()` | — | Upazila / Police Station |
| `area_street` | `model.text()` | — | Road, house, sector, village |
| `delivery_zone` | `model.enum(["inside_dhaka", "dhaka_suburbs", "outside_dhaka"])` | — | Resolved delivery zone |
| `cod_status` | `model.enum(["not_applicable", "unconfirmed", "confirmed", "escalated", "canceled"])` | `default("unconfirmed")` | COD verification status |
| `call_attempts_count` | `model.number()` | `default(0)` | Call attempts (escalates after 3) |
| `last_call_attempt_at` | `model.dateTime()` | `nullable()` | Timestamp of last agent call |
| `cod_confirmed_by` | `model.text()` | `nullable()` | Staff user ID who verified the order |
| `cod_notes` | `model.text()` | `nullable()` | Agent conversation notes |
| `shipment_state` | `model.enum(["pending_confirmation", "ready_to_ship", "dispatched", "in_transit", "out_for_delivery", "delivery_failed", "rto_initiated", "rto_received", "delivered"])` | `default("pending_confirmation")` | Shipment progression |
| `courier_provider` | `model.enum(["steadfast", "pathao", "redx", "manual"])` | `nullable()` | Chosen logistics carrier |
| `courier_consignment_id` | `model.text()` | `nullable()` | Courier API parcel reference |
| `courier_tracking_code` | `model.text()` | `nullable()`, `index()` | Public parcel tracking code |
| `customer_paid_delivery` | `model.bigNumber()` | `default(0)` | Delivery charge paid by customer (paisa) |
| `courier_cost_to_business` | `model.bigNumber()` | `default(0)` | Invoice cost charged by courier (paisa) |
| `cod_remittance_received` | `model.bigNumber()` | `default(0)` | Net cash remitted by courier (paisa) |
| `cod_settlement_status` | `model.enum(["pending", "partially_remitted", "settled", "disputed"])` | `default("pending")` | 3-way settlement reconciliation status |
| `cogs_total` | `model.bigNumber()` | `default(0)` | Snapshot total cost of goods (paisa) |
| `utm_source` | `model.text()` | `nullable()` | Ad campaign attribution source |
| `utm_medium` | `model.text()` | `nullable()` | Attribution medium |
| `utm_campaign` | `model.text()` | `nullable()` | Attribution campaign name |
| `landing_page_slug` | `model.text()` | `nullable()` | Campaign landing page identifier |

#### Entity: `CourierShipmentLog` (`bd-courier`)
Audit trail of every courier API interaction (booking, cancel, webhook).

| Field Name | DML Type | Modifiers / Constraints | Description |
|---|---|---|---|
| `id` | `model.id()` | `primaryKey()` | Unique identifier (`cshlog_...`) |
| `order_id` | `model.text()` | `index()` | Associated Medusa Order ID |
| `courier` | `model.text()` | — | `steadfast`, `pathao`, `redx` |
| `action` | `model.text()` | — | `create_parcel`, `cancel_parcel`, `track_query`, `webhook` |
| `request_payload` | `model.json()` | `nullable()` | Outbound API JSON |
| `response_payload` | `model.json()` | `nullable()` | Inbound API JSON response |
| `status_code` | `model.number()` | `nullable()` | HTTP response status code |
| `error_message` | `model.text()` | `nullable()` | Error details on failure |

---

### Domain 7: Payment Transaction & Webhook Log (`bd-payments`)

#### Entity: `PaymentTransaction`
Captures every payment attempt, verification query, and transaction ID.

| Field Name | DML Type | Modifiers / Constraints | Description |
|---|---|---|---|
| `id` | `model.id()` | `primaryKey()` | Unique identifier (`paytx_...`) |
| `order_id` | `model.text()` | `nullable()`, `index()` | Associated Medusa Order ID |
| `payment_session_id` | `model.text()` | `nullable()`, `index()` | Medusa PaymentSession ID |
| `provider_id` | `model.enum(["pp_cod", "pp_bkash", "pp_nagad"])` | — | Payment provider |
| `transaction_type` | `model.enum(["authorization", "capture", "refund", "status_query"])` | — | Action type |
| `amount_bdt` | `model.bigNumber()` | — | Transaction amount in BDT paisa |
| `currency_code` | `model.text()` | `default("bdt")` | Currency (strictly `bdt`) |
| `gateway_transaction_id`| `model.text()` | `nullable()`, `index()` | External trxID (bKash trxID, Nagad payment_ref_id) |
| `gateway_status` | `model.text()` | — | Status returned by gateway (e.g., `Completed`) |
| `gateway_response_json`| `model.json()` | `nullable()` | Complete raw JSON payload from gateway |
| `is_verified_server_to_server` | `model.boolean()` | `default(false)` | Verified via server-to-server execute call |

#### Entity: `PaymentWebhookLog`
Ingests all incoming payment callbacks and webhooks with raw payloads.

| Field Name | DML Type | Modifiers / Constraints | Description |
|---|---|---|---|
| `id` | `model.id()` | `primaryKey()` | Unique identifier (`paywhk_...`) |
| `provider` | `model.text()` | — | `bkash`, `nagad` |
| `endpoint` | `model.text()` | — | `/hooks/bkash/callback`, `/hooks/nagad/callback` |
| `http_method` | `model.text()` | — | `GET` or `POST` |
| `headers_json` | `model.json()` | `nullable()` | Incoming request HTTP headers |
| `payload_json` | `model.json()` | `nullable()` | Incoming request body / query parameters |
| `ip_address` | `model.text()` | `nullable()` | Originating IP address |
| `signature_valid` | `model.boolean()` | `default(false)` | Signature or credential check result |
| `verification_result` | `model.text()` | `nullable()` | Summary of verification execution |
| `processed` | `model.boolean()` | `default(false)` | Whether workflow successfully processed event |
| `error_message` | `model.text()` | `nullable()` | Failure reason if processing failed |

---

### Domain 8: Campaign Landing Pages (`bd-campaigns`)

#### Entity: `LandingPage`
Powers high-converting marketing landing pages with embedded single-vendor checkout.

| Field Name | DML Type | Modifiers / Constraints | Description |
|---|---|---|---|
| `id` | `model.id()` | `primaryKey()` | Unique identifier (`lp_...`) |
| `slug` | `model.text()` | `unique()` | URL-safe slug (e.g., `eid-panjabi-special`) |
| `title_en` | `model.text()` | — | Campaign page title in English |
| `title_bn` | `model.text()` | `nullable()` | Campaign page title in Bengali |
| `is_active` | `model.boolean()` | `default(true)` | Active status |
| `featured_product_id` | `model.text()` | `nullable()` | Main promotional product ID |
| `checkout_mode` | `model.enum(["embedded", "modal", "redirect"])` | `default("embedded")` | Mode B embedded checkout configuration |
| `sections_json` | `model.json()` | — | Block layout structure (Hero, Bundle, Reviews) |
| `theme_tokens_json` | `model.json()` | `nullable()` | Controlled design tokens (primary color, fonts) |
| `seo_title` | `model.text()` | `nullable()` | Page meta title |
| `seo_description` | `model.text()` | `nullable()` | Page meta description |
| `meta_pixel_id` | `model.text()` | `nullable()` | Optional campaign-specific Meta Pixel ID |
| `published_at` | `model.dateTime()` | `nullable()` | Publication timestamp |

---

### Domain 9: Staff Roles & Audit Logs (`bd-audit`)

#### Entity: `StaffRolePermission`
Extends Medusa `User` with fine-grained Bangladesh operational roles and permission flags.

| Field Name | DML Type | Modifiers / Constraints | Description |
|---|---|---|---|
| `id` | `model.id()` | `primaryKey()` | Unique identifier (`stfperm_...`) |
| `user_id` | `model.text()` | `unique()` | Associated Medusa User ID |
| `role` | `model.enum(["owner", "manager", "staff", "call_center", "warehouse", "finance"])` | `default("staff")` | Operational role |
| `can_view_cogs` | `model.boolean()` | `default(false)` | Permission to view product COGS and profit margins |
| `can_confirm_cod` | `model.boolean()` | `default(false)` | Permission to confirm / cancel COD orders |
| `can_book_courier` | `model.boolean()` | `default(false)` | Permission to dispatch parcels to courier |
| `can_process_refund`| `model.boolean()` | `default(false)` | Permission to record manual refunds & payouts |
| `can_manage_content`| `model.boolean()` | `default(false)` | Permission to edit landing pages & CMS |
| `can_view_audit_logs`| `model.boolean()` | `default(false)` | Permission to view `/admin/audit-logs` |
| `must_change_password`| `model.boolean()` | `default(true)` | Forced password reset flag on first login |

#### Entity: `AuditLog`
Immutable append-only ledger of all sensitive state changes.

| Field Name | DML Type | Modifiers / Constraints | Description |
|---|---|---|---|
| `id` | `model.id()` | `primaryKey()` | Unique identifier (`aud_...`) |
| `actor_id` | `model.text()` | `index()` | Staff User ID, 'system', or 'customer' |
| `actor_role` | `model.enum(["owner", "manager", "staff", "call_center", "warehouse", "finance", "system"])` | — | Role at time of action |
| `actor_email` | `model.text()` | `nullable()` | Staff email address |
| `entity_type` | `model.enum(["product", "variant_price", "variant_cogs", "inventory", "order", "return_refund", "courier_consignment", "staff_user", "settings", "content_page", "auth_security"])` | `index()` | Affected entity type |
| `entity_id` | `model.text()` | `index()` | Primary key of affected record |
| `action` | `model.enum(["create", "update", "delete", "status_transition", "refund_recorded", "restocked", "quarantined", "consignment_booked", "consignment_canceled", "failed_login", "account_lockout", "password_reset"])` | `index()` | Action executed |
| `old_value` | `model.json()` | `nullable()` | JSON state before change |
| `new_value` | `model.json()` | `nullable()` | JSON state after change |
| `ip_address` | `model.text()` | `nullable()` | Client IP address |
| `stated_reason` | `model.text()` | `nullable()` | Human-entered rationale |

---

## 3. Module Links Specification

```typescript
// apps/medusa/src/links/product-localization.ts
import BdCatalogModule from "../modules/bd-catalog"
import ProductModule from "@medusajs/medusa/product"
import { defineLink } from "@medusajs/framework/utils"

export default defineLink(
  ProductModule.linkable.product,
  BdCatalogModule.linkable.productLocalization
)

// apps/medusa/src/links/product-variant-cost.ts
export default defineLink(
  ProductModule.linkable.productVariant,
  BdCatalogModule.linkable.productVariantCost
)

// apps/medusa/src/links/order-bd-details.ts
import BdOrdersModule from "../modules/bd-orders"
import OrderModule from "@medusajs/medusa/order"

export default defineLink(
  OrderModule.linkable.order,
  BdOrdersModule.linkable.orderBdDetails
)

// apps/medusa/src/links/order-return-request.ts
export default defineLink(
  OrderModule.linkable.order,
  BdOrdersModule.linkable.orderReturnRequest
)
```

---

## 4. Migration & Seeding Plan

1. **Step 1 — Module Scaffolding:** Create modular directories in `apps/medusa/src/modules/` with DML models, services, and module definitions.
2. **Step 2 — Medusa Configuration:** Register custom modules in `apps/medusa/medusa-config.ts` under `modules: [...]`.
3. **Step 3 — Module Links Setup:** Create link definitions in `apps/medusa/src/links/`.
4. **Step 4 — Migration Execution:** Run `medusa db:migrate` to create database tables and sync cross-module links.
5. **Step 5 — Seed Initial Bangladesh Data:** Insert default delivery zones (Inside Dhaka ৳60, Suburbs ৳100, Outside Dhaka ৳130), VAT configuration (disabled by default), and initial Super Admin role assignment.
6. **Step 6 — Verification:** Run `npm run build:medusa` and query PostgreSQL tables to verify schema integrity.
