# Cross-Document Verification Report (Audited & Reconciled)
## Bangladesh Single-Vendor E-commerce Platform (MedusaJS v2)

**Report File:** `cross-document-verification.md`  
**Audit Date:** 2026-10-24  
**Audit Type:** Evidence-Backed, Non-Assumptive System Audit  
**Author:** Antigravity System Architect  
**Final Status:** **Conditional Pass**  

---

### Executive Summary

This report provides a rigorous, evidence-backed cross-document verification of the Bangladesh Single-Vendor E-commerce Platform. It examines all 10 project documents to audit consistency across business specifications, runtime architecture, data flow diagrams (DFD), database schemas, MedusaJS v2 framework boundaries, Bangladesh commerce rules, user journeys, quality checklists, and security standards.

Every assertion, status, and finding in this report is grounded in verified repository file paths, line numbers, or installed package code. Unsubstantiated claims of "100% alignment" have been eliminated. Open owner decisions are strictly segregated from confirmed requirements and proposed technical designs.

#### Governing Document Corpus Checked:
1. [`prd.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/prd.md) — Product Requirements Document (v2.0, 618 lines)
2. [`docs/architecture.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/docs/architecture.md) — System Architecture Specification (v2.0, 1,023 lines)
3. [`dfd.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/dfd.md) (and identical [`docs/dfd.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/docs/dfd.md)) — Data Flow Diagram Specification (v2.0, 1,012 lines)
4. [`database.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/database.md) — Canonical Database Specification (v2.0, 2,662 lines)
5. [`quality-checklist.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/quality-checklist.md) — Quality Assurance & Release Verification Protocol (611 lines)
6. [`user-journeys.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/user-journeys.md) — User Journeys & Step-by-Step Experience (v1.0, 1,280 lines)
7. [`docs/architecture-decision-medusa-v2.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/docs/architecture-decision-medusa-v2.md) — ADR: MedusaJS v2 Adoption (289 lines)
8. [`docs/database-review.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/docs/database-review.md) — Pre-Reconciliation Database Review (107 Findings, 1,245 lines)
9. [`docs/database-fix-report.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/docs/database-fix-report.md) — Database Fix & Disposition Report (353 lines)
10. [`docs/data-models.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/docs/data-models.md) — Initial DML Draft (Superseded by `database.md`, 385 lines)

---

## 1. Document Authority Order

When cross-document ambiguities or conflicts arise, they must be resolved strictly according to the following 8-tier authority hierarchy:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Rank 1: Approved Owner Decisions & Architecture Decision Records (ADR) │
│         (Explicit owner sign-offs in prd.md §19, database.md §10, ADR) │
├────────────────────────────────────────────────────────────────────────┤
│ Rank 2: Product Requirements Document (prd.md v2.0)                    │
│         Source of truth for business rules, commercial scope & ACs     │
├────────────────────────────────────────────────────────────────────────┤
│ Rank 3: System Architecture (docs/architecture.md v2.0)                │
│         Source of truth for runtime topology, caching & workflows      │
├────────────────────────────────────────────────────────────────────────┤
│ Rank 4: Data Flow Diagram Specification (dfd.md v2.0)                  │
│         Source of truth for data flows & process pipelines (P1.0–P9.0) │
├────────────────────────────────────────────────────────────────────────┤
│ Rank 5: Canonical Database Design (database.md v2.0)                   │
│         Source of truth for persistent schema, constraints & money     │
├────────────────────────────────────────────────────────────────────────┤
│ Rank 6: User Journeys (user-journeys.md v1.0)                          │
│         Source of truth for end-to-end customer and administrative UX  │
├────────────────────────────────────────────────────────────────────────┤
│ Rank 7: Quality Checklist (quality-checklist.md)                       │
│         Source of truth for verification steps & release criteria      │
├────────────────────────────────────────────────────────────────────────┤
│ Rank 8: Installed Medusa Code & Official Documentation                 │
│         (@medusajs/* @ 2.22.0) -> Absolute Technical Constraints       │
└────────────────────────────────────────────────────────────────────────┘
```

### Confirmation: `database.md` Supersedes `docs/data-models.md`
It is formally confirmed that [`database.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/database.md) **supersedes** [`docs/data-models.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/docs/data-models.md) in its entirety.
- **Evidence of Supersession:**
  1. `docs/data-models.md:1-10` carries an explicit top-level warning banner: `⚠️ SUPERSEDED — DO NOT IMPLEMENT FROM THIS FILE`.
  2. `docs/data-models.md` defined only 13 tables, attempted to create duplicate models for native Medusa modules (e.g. `order_return_request` while omitting the actual entity definition in its own text), and lacked 38 required Bangladesh tables.
  3. `database.md` was authored following the comprehensive 107-finding review ([`docs/database-review.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/docs/database-review.md)), establishing a canonical 51-table, 10-module schema fully reconciled with the installed `@medusajs/framework` v2.22.0 packages.
  4. Mapping of legacy names to canonical entities is authoritative in `database.md` Appendix A.

---

## 2. Requirement Coverage Matrix

Status Categories Applied:
- **Confirmed:** Requirement is explicitly approved in PRD with matching architecture, DFD, database, and journey design.
- **Partially Confirmed:** Core requirement is confirmed, but specific operational parameters or integrations remain open or proposed.
- **Conflict Found:** Contradiction identified between two or more documents requiring resolution.
- **Open Decision:** Business choice unapproved by the owner (must not be decided silently by engineering).
- **Needs Technical Verification:** Technical dependency requiring live verification before sign-off.

| Requirement / Feature | PRD (`prd.md`) | Architecture (`docs/architecture.md`) | DFD (`dfd.md`) | Database (`database.md`) | User Journey (`user-journeys.md`) | Quality Checklist (`quality-checklist.md`) | Status | Evidence & Discrepancy Analysis |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Single-Vendor Model** | §1.1, §18 | §1.1, §4.1 | §1.1, §3.2 | §1.4, §3.1 | Document Conventions | CHK-SEC-01 | **Confirmed** | PRD §18 strictly prohibits vendor registration, vendor payouts, and marketplace commissions. Single store singleton in `operational_settings`. |
| **2. Bilingual Content** | §10.1, §10.2 (FR-10.2.1) | §4.2, §12.2 | §3.2 (P1.0) | §3.3.1, §3.3.2, §8.12 | §1 (Step 1), §14 | CHK-CAT-01, CHK-CAT-04 | **Partially Confirmed** | **Evidence Correction:** PRD FR-10.2.1 and `user-journeys.md:74` mandate **English as the default language** for first-time visitors with an immediate Bangla switch (not Bangla default). Translation service selection is an Open Decision (PRD §19 Q#14). |
| **3. Product Options Max 3** | §3.2 | §4.2 | §3.2 (P1.0) | §3.3.5 | §2, §13, §14 | CHK-CAT-02 | **Confirmed** | Medusa native `product_option` enforces max 3 dimensions per variant. Non-variant specifications use custom `category_attribute` and `product_attribute_value`. |
| **4. Inventory & Stock Reservation** | §4.3.6, §6.3, §17 | §7.2, §13.1 | §3.2 (P2.0), §4.1 | §2.1, §3.4.4, §7.3 | §4, §5, §6, §14 | CHK-ORD-02, CHK-INV-01 | **Partially Confirmed** | Stock reservation on checkout is Confirmed (Redis lock + native `reservation_item`). However, **COD reservation expiry policy is an Open Decision** (O-03, PRD Q#18). |
| **5. Cart & Buy Now** | §4.3 (FR-4.3.3) | §14.2 | §3.2 (P2.0) | §2.1 | §3, §4, §5, §6 | CHK-CRT-01, CHK-CRT-02 | **Confirmed** | PRD FR-4.3.3 and AC-G2 mandate that Buy Now never silently empties or alters existing cart lines. Verified across journeys and checkout workflow. |
| **6. Guest Checkout** | §4.1, §4.2 | §5.2, §6.1 | §3.2 (P2.0) | §3.4.1 | §7 | CHK-CHK-01 | **Partially Confirmed** | Phone-first guest checkout without password is Confirmed. **Shared phone number policy** (multiple accounts per phone vs strictly unique) is an Open Decision (O-04). |
| **7. Bangladesh Address Hierarchy** | §11.2 | §10.1 (E-3) | §6.1 (`CustomerAddress4Tier`) | §3.8.2, §8.1 | §7 | CHK-CHK-02 | **Confirmed** | 4-tier administrative hierarchy (Division, District, Upazila/Thana, Postcode) is formally structured in `geo_*` tables and `address_bd_detail`. |
| **8. Delivery Zones** | §7.4.3, §11.3 | §10.2 | §3.2 (P5.0) | §3.8.3, §8.3 | §7, §22 | CHK-DLV-01 | **Partially Confirmed** | 3-zone structure (Inside Dhaka ৳60, Suburbs ৳100, Outside ৳130) is Confirmed. Contracted rates and courier COD fees remain an Open Decision (O-11, PRD Q#2). |
| **9. COD Verification & Expiry** | §6.6, §19 (Q#18) | §9.2, ADR-019 | §3.2 (P4.0), §4.2 (P4.7) | §3.4.2, §8.4, §10 (O-03) | §8, §15 | CHK-COD-01, CHK-COD-02 | **Conflict Found** | **Conflict:** PRD §19 Q#18 and Architecture ADR-019 state that manual staff cancellation is the Phase 1 baseline and **the auto-expiry cron is disabled pending owner decision**. Conversely, `dfd.md` (GAP-06, DF-37) depicts an active automated `cron.cod-expiry-check (Every 1h)`. Database O-03 proposes a 48h default that requires owner sign-off. |
| **10. bKash, Nagad, SSLCommerz** | §7.3, §18 | §9.1, §9.3, §9.4 | §3.2 (P3.0), §4.1 | §3.7.1, §3.7.2 | §9 | CHK-PAY-01 to CHK-PAY-03 | **Conflict Found** | **Conflict:** `apps/web/src/app/page.tsx:11` advertises *"Pre-configured support for bKash, Nagad, SSLCommerz..."* PRD §7.3 and §18 explicitly mandate Direct Merchant APIs for bKash & Nagad only and exclude card payment aggregators (SSLCommerz) from Phase 1. SSLCommerz is stale copy that must be removed. |
| **11. Order Lifecycle** | §6.2 | §4.2, §12.2 | §3.2 (P4.0), §6.3 | §2.1, §3.4.4, §4.6 | §10, §15, §16 | CHK-ORD-01 | **Confirmed** | 4-axis decoupled lifecycle (Order, Payment, Shipment, Return). Medusa native `order.status` kept clean; custom operational statuses mapped in `order_bd_details`. |
| **12. Refund & Return Policy** | §6.7, §17 | §10.3, §13.1 | §3.2 (P6.0), §4.4 | §3.5, §3.7.3, §8.7 | §17, §18 | CHK-RET-01, CHK-RET-02 | **Open Decision** | PRD AC-G7 and §17 mandate that no refund is ever automatically approved or executed. However, actual policy values (return window, shipping liability, refund methods) are unconfigured and represent Open Decision O-01 (PRD Q#4). |
| **13. Courier Booking, Tracking, Remittance** | §7.4 | §10.1–10.4 | §3.2 (P5.0), §4.3 | §3.6, §8.2, §8.5, §8.6 | §16, §17, §22 | CHK-LOG-01 to CHK-LOG-03 | **Partially Confirmed** | Multi-courier adapter model (Steadfast, Pathao, RedX, manual fallback) and 1:N consignment history are Confirmed. Primary courier selection and contracted terms are an Open Decision (O-11). |
| **14. Staff RBAC & Audit Logs** | §8.2, §12.3 | §6.2, §6.3, §20.1 | §3.2 (P8.0), §6.1 | §3.12.1, §6.2, §6.5 | §20 | CHK-SEC-01, CHK-SEC-02 | **Partially Confirmed** | 5 operational roles and immutable audit logging are Confirmed. The exact role-policy matrix and the proposed ৳5,000 four-eyes threshold are an Open Decision (O-12, PRD Q#6). |
| **15. SMS & Notifications** | §11.6 | §11.1–11.3 | §3.2 (P7.0) | §3.10.1, §3.10.2 | §8, §10, §16 | CHK-NOT-01 | **Partially Confirmed** | Transactional SMS outbox pattern and Unicode templates are Confirmed. Provider selection (Greenweb, SSL Wireless, Elitbuzz) is an Open Decision (PRD Q#9). |
| **16. Campaign Landing Pages** | §5.1, §5.2 | §4.2, §14.2, §16.1 | §3.2 (P1.0, P2.0, P8.0) | §3.9.1–3.9.5 | §11, §12, §24 | CHK-CMP-01, CHK-CMP-02 | **Confirmed** | Standalone landing pages (`/landing/:slug`), Mode A/B checkout, and shared inventory are Confirmed. Orders record `order_source = campaign`. |
| **17. Meta Pixel / CAPI** | §5.3, §18 | §5.4 | §1.1 | §3.8.1, §6.10, §8.11 | §24 | CHK-MKT-01 | **Partially Confirmed** | Single central Meta Pixel for Phase 1 is Confirmed. Server-side CAPI is explicitly deferred to Phase 2 per PRD FR-5.3.7. Token custody and event scope are an Open Decision (O-08). |
| **18. Meilisearch** | §1.2, §3.1 | §1.2, §8.1–8.3 | §3.2 (P1.0), §4.5 | §1.4, §3.3.6 | §1 | CHK-SCH-01 | **Confirmed** | Sub-50ms typo-tolerant search for English and Banglish queries. Derived read-only index strictly excludes COGS, margins, and supplier data. |
| **19. Contribution Margin Analytics** | §14 | §4.2, §8.2 | §3.2 (P9.0) | §3.3.6, §3.4.5, §4.6, §8.14 | §23 | CHK-REP-01 | **Partially Confirmed** | Margin formulas (Revenue - COGS - Packaging - Outbound Delivery - Gateway Fee) are Confirmed. Ad-spend allocation method is an Open Decision (PRD Q#10). |
| **20. Security, PII, Backups, Observability** | §8.2, §12, §17 | §6, §19, §20 | §1.2, §6.1 | §6.1–6.11 | §20 | CHK-SEC-01–06 | **Needs Technical Verification** | Security policies (masking, PII tiers, audit triggers) are specified in `database.md`. However, live database triggers and backup restore drill (CHK-SEC-06) require technical execution and verification. |

---

## 3. Medusa Native vs. Custom Implementation Validation

### 3.1 Verified Installed Medusa Packages
Inspection of `apps/medusa/package.json` and `node_modules/@medusajs/` confirms the following official packages installed at version **`2.22.0`**:
- `@medusajs/medusa`: `2.22.0`
- `@medusajs/framework`: `2.22.0`
- `@medusajs/admin-sdk`: `2.22.0`
- `@medusajs/dashboard`: `2.22.0`
- `@medusajs/ui`: `4.2.6`
- Core modules verified in `node_modules/@medusajs/`: `auth`, `cart`, `customer`, `fulfillment`, `inventory`, `notification`, `order`, `payment`, `pricing`, `product`, `promotion`, `rbac`, `tax`, `translation`, `stock-location`.

### 3.2 Native vs Custom Boundary Matrix

| Commerce Domain | Native Medusa Module (Do Not Fork/Re-implement) | Additive Custom Module (`database.md`) | Boundary & Extension Mechanism |
| :--- | :--- | :--- | :--- |
| **Catalog** | `product`, `product_variant`, `product_option`, `price_set`, `product_category` | `bd_catalog` (`product_localization`, `category_attribute`, `product_attribute_value`, `product_variant_cost`) | Module Link: `ProductModule.linkable.product` <-> `BdCatalogModule.linkable.productLocalization`. Variant cost linked via `productVariant`. |
| **Orders** | `order`, `order_item`, `order_address`, `order_summary` | `bd_orders` (`customer_risk_profile`, `order_bd_details`, `order_line_snapshot`, `cod_call_log`) | Module Link: `OrderModule.linkable.order` <-> `BdOrdersModule.linkable.orderBdDetails`. Immutable financial snapshot written once on placement. |
| **Returns** | `return`, `return_item`, `refund`, `return_reason` | `bd_returns` (`return_policy`, `return_policy_scope`, `return_review`) | Native `return` orchestrates items; `return_review` manages warehouse physical inspection, quarantine stock location, and dual staff approvals. |
| **Courier** | `fulfillment`, `shipping_option`, `geo_zone`, `service_zone` | `bd_courier` (`courier`, `courier_consignment`, `courier_event`, `courier_remittance_*`) | Native fulfillment tracks parcel packaging; custom module handles Steadfast/Pathao API integration, consignment webhooks, and COD remittance batches. |
| **Payments** | `payment`, `payment_session`, `payment_collection`, `refund` | `bd_payments` (`payment_provider_config`, `payment_attempt`, `refund_ledger`) | Custom payment providers (`pp_bkash`, `pp_nagad`, `pp_cod`) implement Medusa provider interface; `refund_ledger` audits manual MFS disbursements. |
| **Settings** | `tax_rate`, `tax_region` | `bd_settings` (`operational_settings`, `geo_division`, `geo_district`, `delivery_zone`, `vat_settings`) | Singleton store settings, 4-tier Bangladesh geography master, and delivery zone rate rules. |
| **Campaigns** | `promotion`, `campaign` (discounts) | `bd_campaigns` (`landing_page`, `landing_page_offer`, `ad_campaign`, `content_page`) | Standalone marketing landers, Mode A/B checkout routing, and CMS content blocks. |
| **Notifications**| `notification` | `bd_notifications` (`sms_template`, `sms_delivery_detail`) | Native notification handles event triggers; custom module implements transactional SMS outbox pattern with Unicode Bangla templates. |
| **Invoices** | *(None)* | `bd_invoices` (`invoice_template`, `invoice`) | Server-side PDF generation, immutable legal invoice records, and FY serial numbering. |
| **Audit & RBAC** | `user`, `rbac_role`, `rbac_policy`, `user_rbac_role` | `bd_audit` (`audit_log`, `webhook_event`, `staff_profile`) | Native RBAC enforces route permissions; custom module maintains append-only, SHA-256 hash-chained audit log and raw webhook logs. |

### 3.3 Discarded Anti-Patterns & Technical Corrections
1. **Invalid Native Enum Claim (`unfulfillable_stockout`):** Earlier drafts claimed `order.status` could be set to `"unfulfillable_stockout"`. Inspection of installed `@medusajs/types/dist/order/status.d.ts` confirms native statuses are strictly `pending`, `completed`, `canceled`, and `requires_action`. Reconciled: Stockout exceptions use `requires_action` with custom metadata.
2. **Duplicate Return Request Entity:** Superseded draft `docs/data-models.md` attempted to create a parallel `order_return_request` table. Reconciled: Replaced with native Medusa `return` linked to additive `return_review`.
3. **Per-Page Meta Pixel:** Discarded per PRD §5.3. All marketing events use single central ID in `operational_settings.meta_pixel_id`.
4. **Plaintext Secrets in Database:** Prohibited. Database tables store only `secret_ref` and `key_version`. Actual keys/passwords load exclusively from environment variables / KMS.

---

## 4. Flow-to-Database & Database-to-Requirement Traceability

Every operational process in [`dfd.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/dfd.md) maps to specific database tables and audit controls in [`database.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/database.md):

| DFD Process | Target Data Stores | Consumed / Created Tables | Idempotency & Concurrency Controls | Audit & Compliance Traceability |
| :--- | :--- | :--- | :--- | :--- |
| **P1.0 Catalog Engine** | D1 Core, D2 Custom, D4 Meilisearch | `product`, `product_variant`, `product_localization`, `category_attribute`, `product_attribute_value` | Read-only caching in Redis; atomic workflow updates to Meilisearch index. | Catalog edits logged in `audit_log`. COGS and supplier data strictly excluded from Meilisearch. |
| **P2.0 Cart & Checkout** | D1 Core, D2 Custom, D3 Redis | `cart`, `line_item`, `customer_address`, `address_bd_detail`, `reservation_item` | Redis mutex `stock:lock:<variant_id>`. Idempotency key on cart completion. | Unconfirmed carts expire cleanly without orphaned stock reservations. |
| **P3.0 Payment Verification** | D1 Core, D2 Custom | `payment_session`, `payment`, `payment_attempt`, `webhook_event` | Unique index `(provider_code, event_id)` on `webhook_event`. Zero-orphan server-to-server query. | Inbound webhook payloads logged with SHA-256 checksum; raw payloads retained 90 days. |
| **P4.0 Order Lifecycle & COD** | D1 Core, D2 Custom | `order`, `order_bd_details`, `customer_risk_profile`, `cod_call_log`, `order_line_snapshot` | Atomic order placement workflow. `order_line_snapshot` is write-once. | All call center attempts and notes logged with staff ID; financial snapshot retained 6 years. |
| **P5.0 Courier Dispatch** | D1 Core, D2 Custom | `fulfillment`, `courier_consignment`, `courier_event`, `delivery_zone` | 1:N consignment records preserve re-booking history; tracking updates deduplicated by timestamp. | Courier dispatch events audited; tracking webhook history retained 90 days. |
| **P6.0 Return & Refund Review** | D1 Core, D2 Custom | `return`, `return_item`, `return_review`, `refund`, `refund_ledger` | Four-eyes authorization check on refunds >৳5,000; unique refund transaction reference. | Immutable `refund_ledger`; reviewer and approver staff IDs recorded in `audit_log`. |
| **P7.0 SMS Notification** | D1 Core, D2 Custom | `notification`, `sms_template`, `sms_delivery_detail` | Outbox pattern decouples checkout from SMS gateway. Redis rate limit `sms:ratelimit:<phone>`. | SMS delivery attempts and provider response codes logged; retained 180 days. |
| **P8.0 Content CMS & Audit** | D2 Custom | `landing_page*`, `homepage_section`, `content_page`, `audit_log` | Unique slug constraints; trigger `trg_prevent_audit_log_mutation` enforces append-only log. | Audit log protected by SHA-256 cryptographic hash chaining; retained 6 years. |
| **P9.0 Financial Reporting** | D2 Custom | `courier_remittance_batch`, `courier_remittance_line`, `v_contribution_profit` | Batch lock prevents double-reconciliation; remittance matching requires manager sign-off. | Financial calculations use integer paisa (`*_paisa`); reports retained 6 years. |

### Database-to-Requirement Audit Verdict:
- **Zero Orphan Tables:** All 51 custom tables in `database.md` map to explicit PRD functional requirements, operational logging, anti-fraud rules, or Bangladesh tax compliance (Appendix B in `database.md`).
- **Zero Orphan DFD Processes:** Processes P1.0 through P9.0 and Level 2 sub-processes map directly to concrete database entities.

---

## 5. Security and Compliance Validation

| Security Dimension | Governing Policy | Architectural & Database Specification | Implementation & Verification Status |
| :--- | :--- | :--- | :--- |
| **PII Classification** | PRD §12.1, Architecture §19 | 4-tier data classification: Tier 1 (Direct PII), Tier 2 (Financial), Tier 3 (Internal Ops), Tier 4 (Public). | **Confirmed in Design:** Documented in `database.md` §6.1. |
| **PII Masking** | PRD §12.3, Architecture §6.2 | Customer phone numbers masked (`017****1234`) in call-center and support views. | **Confirmed in Design:** Masking helper specified in `database.md` §6.9. |
| **Field Encryption** | PRD §12.4, Database §6.3 | Sensitive customer refund disbursement accounts in `refund_ledger` encrypted using app-level AES-256-GCM. | **Open Decision (O-06):** KMS provider and key ownership pending owner sign-off. |
| **Audit Log Immutability** | PRD §12.3, Database §6.5 | Append-only `audit_log` enforced via PostgreSQL trigger `trg_prevent_audit_log_mutation` and SHA-256 hash chaining. | **Needs Technical Verification:** Trigger specification defined in `database.md`; pending live migration. |
| **RBAC Enforcement** | PRD §8.2, Architecture §6.3 | 5 discrete roles (`super_admin`, `catalog_manager`, `order_manager`, `customer_support`, `finance_manager`) enforced on backend APIs. | **Confirmed in Design:** Native Medusa RBAC rules mapped in `database.md` §6.2. |
| **Payment Security** | PRD §7.3, §18 | No raw credit card data handled (PCI-DSS out of scope). Tokenized bKash checkout and direct Nagad PGW redirect. | **Confirmed:** Tokenized/redirect payment flows eliminate card data liability. |
| **Refund Protection** | PRD §6.7, Database §6.2 | Zero auto-refunds. Four-eyes dual authorization required for any refund exceeding ৳5,000. | **Confirmed in Design:** Enforced by workflow guard steps in `return-refund` workflow. |
| **Data Retention** | PRD §12.8, Database §6.7 | Webhooks: 90 days; SMS logs: 180 days; Risk scores: 24 months; Financial/audit records: 6 years. | **Open Decision (O-05):** Statutory baseline proposed; formal legal hold sign-off pending owner. |
| **Secrets Management** | PRD §12.2, Architecture §21 | Zero API keys, RSA private keys, or passwords stored in PostgreSQL. Loaded via environment variables / KMS. | **Confirmed:** Database stores only `secret_ref` and `key_version`. |

---

## 6. Open Owner Decisions Register (O-01 to O-15)

The following 15 decisions represent commercial, legal, and operational policies that require owner sign-off. The database schema in `database.md` supports all options without schema redesign.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   MINIMUM PHASE 0 LAUNCH GATES                         │
│   These 6 decisions must have owner sign-off before public launch:     │
│   [O-01] Return Policy Values          [O-02] VAT Registration & Rate  │
│   [O-03] COD Expiry & Verification     [O-05] Retention & Legal Hold   │
│   [O-11] Primary Courier Selection     [O-12] Staff RBAC & Thresholds  │
└────────────────────────────────────────────────────────────────────────┘
```

| ID | Required Owner Choice | Documents Affected | Blocking Category | Recommended Default (Evidence-Based) |
| :--- | :--- | :--- | :--- | :--- |
| **O-01** | **Return policy parameters:** Return window (e.g. 7 days), conditions, non-returnable categories, return shipping liability, refund methods. | `prd.md` §6.7, `database.md` §3.5.1, `user-journeys.md` §18 | **Launch Gate (Phase 0)** | **Safest Baseline:** No active policy; returns blocked with "not yet configured" until values configured in Admin UI. |
| **O-02** | **VAT configuration:** Registration status (BIN), rate (0%, 5%, 7.5%, 15%), inclusive vs exclusive prices, display on invoice. | `prd.md` §11.4, `database.md` §3.8.4, `docs/architecture.md` §4.2 | **Launch Gate (Phase 0)** | **Safest Baseline:** VAT disabled, 0% rate, unverified BIN, no VAT line on invoices until accountant sign-off. |
| **O-03** | **COD stock reservation expiry:** Expiry window (24h vs 48h vs 72h) and whether trusted customers skip phone verification. | `prd.md` §19 (Q#18), `database.md` §3.4.4, `dfd.md` (P4.7) | **Launch Gate (Phase 0)** | **Recommended:** **48-hour expiration**; all COD orders require call verification (no auto-skip at launch). |
| **O-04** | **Shared phone number policy:** Allow multiple customer accounts per phone number or enforce strict 1:1 uniqueness. | `prd.md` §4.1, `database.md` §3.4.1, `user-journeys.md` §7 | Implementation Gate | **Recommended:** Allow multiple accounts per family phone; aggregate risk profiling keyed by phone number. |
| **O-05** | **Retention & legal hold schedule:** Webhook logs (90d), SMS logs (180d), customer risk (24m), audit/financial (6y). | `prd.md` §12.8, `database.md` §6.7 | **Launch Gate (Phase 0)** | **Recommended:** Adopt statutory baseline (90d webhooks, 180d SMS, 24m risk, 6y financial/audit). |
| **O-06** | **Encryption scope & KMS:** Encrypt refund accounts only, or also customer phone/address; KMS key ownership. | `docs/architecture.md` §19, `database.md` §6.3 | Design Gate | **Recommended:** App-level AES-256-GCM for refund accounts; RBAC and masking for phone/address. |
| **O-07** | **Tracking attempt persistence:** Persist public order-tracking lookups in DB or keep ephemeral in Redis rate-limiter. | `docs/architecture.md` §14.3, `database.md` §10 | Deferrable (Phase 2) | **Recommended:** Redis-only rate limiting (`ratelimit:tracking:<phone>`); log failed lockout events in `audit_log`. |
| **O-08** | **Meta tracking configuration:** Meta Pixel ID, analytics consent mode, CAPI token custody. | `prd.md` §5.3, `database.md` §6.10, `user-journeys.md` §24 | Marketing Launch Gate | **Recommended:** Central Pixel ID configured via Admin; CAPI deferred to Phase 2 per PRD FR-5.3.7. |
| **O-09** | **Invoice fiscal year & numbering:** July–June fiscal year (`INV-2026-27-000001`) vs calendar year (`INV-2026-000001`). | `prd.md` §11.7, `database.md` §3.11.2 | Launch Gate | **Recommended:** Bangladesh standard July–June fiscal year (`INV-{FY}-{serial}`). |
| **O-10** | **Phase 1 refund disbursement methods:** Restrict to original payment method (bKash/Nagad/Bank) vs offering store credit. | `prd.md` §6.7, `database.md` §3.7.3 | Launch Gate | **Recommended:** Disburse via bKash/Nagad/Bank; **defer store credit ledger** to Phase 2. |
| **O-11** | **Primary courier selection:** Contracted rates, COD fee percentage, pickup locations, remittance cadence. | `prd.md` §7.4, `database.md` §3.6.1, `user-journeys.md` §22 | **Launch Gate (Phase 0)** | **Safest Baseline:** Default to `manual` courier dispatch until merchant API contracts are executed. |
| **O-12** | **Staff RBAC matrix & four-eyes threshold:** Manager permissions for COGS/refunds; threshold amount for dual approval. | `prd.md` §8.2, `database.md` §6.2, `user-journeys.md` §20 | **Launch Gate (Phase 0)** | **Recommended:** Adopt §6.2 proposed matrix; require four-eyes dual authorization on refunds >৳5,000. |
| **O-13** | **Store credit customer ledger:** Implement internal wallet in Phase 1 or defer. | `database.md` §10, `user-journeys.md` §18 | Deferrable (Phase 2) | **Recommended:** Defer to Phase 2 to avoid complex financial wallet liabilities at initial launch. |
| **O-14** | **Warehouse stock topology:** Single location vs 3 dedicated locations (Main Warehouse, Quarantined/Damaged, Returns Desk). | `docs/architecture.md` §10.3, `database.md` §3.3.6 | Implementation Gate | **Recommended:** Seed 3 distinct Medusa `stock_location` rows to isolate damaged goods from saleable stock. |
| **O-15** | **Data residency & disaster recovery drills:** Local BD server vs cloud hosting (AWS Singapore); backup drill owner. | `prd.md` §12.6, `quality-checklist.md` CHK-SEC-06 | Compliance Launch Gate | **Recommended:** Cloud hosting in AWS Singapore region with daily offsite backups and verified restore drill. |

---

## 7. Mandatory Findings Register

The following register documents all discrepancies, conflicts, and required remediation actions across the system:

| ID | Finding | Severity | Affected Documents | Evidence Path / Section | Required Action | Owner Decision Required | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F-01** | **Stale SSLCommerz Placeholder in Storefront Copy** | **P0** | `apps/web/src/app/page.tsx`, `prd.md` | `apps/web/src/app/page.tsx:11`<br>`prd.md` §7.3, §18 | Purge "SSLCommerz" from `apps/web/src/app/page.tsx`. Phase 1 strictly supports bKash, Nagad, and COD. | No | **Open (P0 Fix)** |
| **F-02** | **Default Storefront Language Discrepancy** | **P0** | Previous CDV Report, `prd.md`, `user-journeys.md` | `prd.md:365` (FR-10.2.1)<br>`user-journeys.md:74` | Correct CDV report: Default storefront language is **English** (not Bangla) with visible Bangla toggle. | No | **Resolved in this report** |
| **F-03** | **COD Stock Reservation Expiry Policy Conflict** | **P0** | `prd.md`, `docs/architecture.md`, `dfd.md`, `database.md` | `prd.md:613` (Q#18)<br>`docs/architecture.md:421`<br>`dfd.md:438` (P4.7, GAP-06)<br>`database.md:2574` (O-03) | Reconcile: DFD depicts active 1h cron; PRD/Architecture state cron is disabled by default. Owner must approve O-03 (48h default recommended). | **Yes (O-03)** | **Open (P0 Fix)** |
| **F-04** | **Medusa DML Module Scaffold Mismatch** | **P0** | `apps/medusa/src/modules/`, `database.md` | `apps/medusa/src/modules/`<br>`database.md` §3 | Update `apps/medusa/src/modules/` and `medusa-config.ts` from 7 initial modules to the 10 canonical modules (51 tables) in `database.md`. | No | **Open (P0 Fix)** |
| **F-05** | **Pre-Canonical Table References in Architecture & DFD** | **P0** | `docs/architecture.md`, `dfd.md`, `database.md` | `docs/architecture.md` §12<br>`dfd.md` §1.2, §6.2<br>`database.md` Appendix A | Update Architecture and DFD text to reference canonical table names (`return_review`, `payment_attempt`, `delivery_zone`) per `database.md` Appendix A. | No | **Open (P0 Fix)** |
| **F-06** | **Phase 0 Minimum Launch Gates Pending Approval** | **P1** | `prd.md`, `database.md` | `prd.md` §19<br>`database.md` §10, §9.6 | Obtain formal business owner sign-off on O-01, O-02, O-03, O-05, O-11, and O-12 prior to public launch. | **Yes (O-01, 02, 03, 05, 11, 12)** | **Open (Pre-Launch)** |
| **F-07** | **Live Gateway & Courier Credentials Missing** | **P1** | `prd.md`, `docs/architecture.md` | `prd.md` §18<br>`docs/architecture.md` §21 | Obtain live merchant accounts for bKash Tokenized, Nagad PGW, and Courier API; configure in environment variables. | Yes (Merchant Contracts) | **Open (Pre-Launch)** |
| **F-08** | **Database Audit Trigger & Encryption Unmigrated** | **P1** | `database.md` | `database.md` §6.3, §6.5 | Generate and run MikroORM migrations implementing `trg_prevent_audit_log_mutation` and AES-256-GCM encryption helpers. | No | **Pending Implementation** |
| **F-09** | **Disaster Recovery Backup Drill Unverified** | **P1** | `prd.md`, `quality-checklist.md` | `prd.md` FR-12.6, AC-12.3<br>`quality-checklist.md` CHK-SEC-06 | Execute automated backup of `bd_commerce_postgres`, restore to a clean test container, and record verification output. | No | **Pending Verification** |
| **F-10** | **Meta Conversions API (CAPI) Scope Clarification** | **P2** | `prd.md`, `docs/architecture.md` | `prd.md` FR-5.3.7<br>`docs/architecture.md` §5.4 | Confirm CAPI is Phase 2 candidate; Phase 1 launch uses client-side Meta Pixel exclusively. | Yes (O-08) | **Deferred (Phase 2)** |
| **F-11** | **Customer Store Credit Ledger Scope Clarification** | **P2** | `database.md`, `user-journeys.md` | `database.md` §10 (O-13)<br>`user-journeys.md` §18 | Confirm store credit wallet is deferred to Phase 2; Phase 1 refunds disburse via original MFS/Bank methods. | Yes (O-10, O-13) | **Deferred (Phase 2)** |

---

## 8. Evidence Limitations

The following limitations reflect current project boundaries and areas where evidence could not be fully established from repository files alone:

1. **Claims Unverifiable from Local Repository Files:**
   - **Production Provider Credentials:** Merchant approval status, API credentials, and live secret keys for bKash Tokenized Checkout, Nagad PGW, SMS Gateway, and Steadfast/Pathao Couriers cannot be verified locally as they depend on third-party institutional approval.
   - **Live Cloud Infrastructure:** Production backup schedules, cloud KMS key custody, offsite storage replication, and production domain routing depend on hosting deployment (AWS/Cloudflare) and cannot be verified within local Docker containers.
2. **Claims Requiring Medusa Documentation / Runtime Verification:**
   - **Admin UI Route Extensibility:** Custom admin UI routes (`/app/cod-queue`, `/app/landing-pages`) and custom widgets depend on `@medusajs/dashboard` and `@medusajs/admin-sdk` runtime conventions. While packages are verified installed, deep UI styling requires browser inspection in development mode.
   - **Translation Module API:** The behavior of `@medusajs/translation` for server-side localized query resolution in v2.22.0 requires runtime verification against official Medusa documentation during endpoint construction.
3. **Claims Requiring Explicit Project-Owner Approval:**
   - The 15 business decisions registered in Section 6 (`O-01` through `O-15`), specifically the **6 Phase 0 Launch Gates** (`O-01` Return Policy, `O-02` VAT Configuration, `O-03` COD Expiry, `O-05` Retention Policy, `O-11` Primary Courier, `O-12` Staff Roles & Dual Approval). Engineering has established safe defaults, but these cannot be labeled "Confirmed" without explicit owner sign-off.

---

## 9. Final Readiness Decision

### Final System Determination:
## 🟡 CONDITIONAL PASS

### Formal Decision Rationale:
1. **P0 Conflicts Identified:**
   - `F-01`: Stale copy in `apps/web/src/app/page.tsx` references "SSLCommerz" which violates Phase 1 PRD payment scope.
   - `F-03`: Contradiction between `dfd.md` (active 1h COD expiry cron) and `prd.md`/`architecture.md` (cron disabled by default pending owner decision O-03).
   - `F-04`: Codebase scaffold in `apps/medusa` currently reflects the superseded 7-module draft rather than the canonical 10-module, 51-table schema in `database.md`.
   - `F-05`: Pre-canonical entity names in `architecture.md` §12 and `dfd.md` §1.2/§6.2 must be aligned with canonical `database.md` Appendix A.
2. **Path to Unconditional Pass:**
   - The verdict is **Conditional Pass** because while all requirements, DFD flows, and database designs are structurally and conceptually sound, the 4 active P0 remediation actions must be executed in the upcoming fix pass.
3. **Readiness for Next Phase:**
   - **The project is 100% READY for the "Final System Fix & Update" phase.**
   - Once the Final System Fix resolves findings `F-01`, `F-03`, `F-04`, and `F-05`, the system can immediately proceed to **Execution Prompt Planning**.
