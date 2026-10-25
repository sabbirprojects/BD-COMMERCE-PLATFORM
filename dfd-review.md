# Data Flow Diagram (DFD) Critique & Gap Analysis
## Bangladesh Single-Vendor E-commerce Platform

**Document Type:** Formal Technical Review & Critique  
**Status:** Read-Only Review Feedback  
**Reviewed Documents:**
- [`docs/dfd.md`](dfd.md) / [`dfd.md`](../dfd.md) — Version 1.0
- [`docs/architecture.md`](architecture.md) — Version 2.0 (Reconciled)
- [`prd.md`](../prd.md) — v2 (Reconciled)
- [`quality-checklist.md`](../quality-checklist.md) — QA Reference

**Review Date:** 2026-10-24  
**Scope:** Missing data flows, broken processes, security gaps, duplicate flows, payment/COD race conditions, inventory concurrency issues, courier exceptions, and admin workflow omissions.

---

## Executive Summary

The newly drafted Data Flow Diagram specification ([`docs/dfd.md`](dfd.md)) establishes a solid foundation for the Bangladesh Single-Vendor E-commerce Platform. It successfully incorporates the zero-orphan payment redirect architecture, the 4-tier Bangladesh address structure, the 4-status independent lifecycle model, and the strict Meilisearch COGS allowlist.

However, a thorough end-to-end verification against [`prd.md`](../prd.md) and [`docs/architecture.md`](architecture.md) reveals **18 distinct architectural, procedural, and diagrammatic gaps** across eight functional categories:

| Category | Gap Count | Max Severity | Primary Risk Area |
|---|---|---|---|
| **1. Payment & Stock Concurrency** | 3 | 🔴 Critical | Post-payment stockout race conditions & orphan captures |
| **2. COD & Call Center Workflow** | 3 | 🟠 High | Missing escalation paths & pre-dispatch cancellations |
| **3. Courier Logistics & Delivery** | 3 | 🟠 High | Conflation of delivery failure vs RTO & partial collection |
| **4. Returns, Inspection & Refunds** | 3 | 🟠 High | Missing return parcel tracking & damaged stock quarantine |
| **5. Admin CMS & Operations** | 3 | 🟡 Medium | Missing manual order flow & invoice download endpoints |
| **6. Search & Dynamic Attributes** | 2 | 🟡 Medium | Category dynamic filters omitted from search sync |
| **7. SMS Outbox & Reliability** | 2 | 🟡 Medium | Synchronous depiction & missing manual resend control |
| **8. Draw.io / mxGraph XML** | 3 | 🟡 Medium | Missing D5 store, E7 entity, and P6->P7 connectors in XML |
| **TOTAL** | **18** | 🔴 Critical | — |

---

## Summary Matrix of Findings

| ID | Severity | Category | Affected Component | PRD / Arch Reference | Core Issue Summary |
|---|---|---|---|---|---|
| **GAP-01** | 🔴 Critical | Payment & Stock | P3.0, P4.0, Level 2.1 | PRD FR-6.3.2, AC-6.1 | No exception flow for post-payment stock depletion during gateway redirect window. |
| **GAP-02** | 🔴 Critical | Payment & Stock | P3.0, Level 2.1 | PRD FR-7.3.4, FR-7.3.7 | No reconciliation or polling flow for dropped browser callbacks on successful gateway payments. |
| **GAP-03** | 🟠 High | Payment & Stock | P2.0, D3 (Redis) | Arch §7.1, §7.2 | Redis stock lock TTL (30s) expires while customer is still completing 4-tier address checkout. |
| **GAP-04** | 🟠 High | COD Workflow | P4.0, Level 2.2 | PRD FR-6.6.2, Arch §12.2 | No state transition from 3 failed call attempts to `cod_status = 'escalated'`. |
| **GAP-05** | 🟠 High | COD Workflow | P4.0, Level 1 | PRD FR-6.7.15 | Missing cancellation data flow for already-confirmed COD orders prior to courier handover. |
| **GAP-06** | 🟡 Medium | COD Workflow | P4.0, Level 2.2 | PRD Q#18, Arch §7.2 | Background COD reservation expiry cron (`cron.cod-expiry-check`) omitted from DFD. |
| **GAP-07** | 🟠 High | Courier Logistics | P5.0, Level 2.3 | PRD FR-7.4.5, Arch §10.2 | Missing courier consignment cancellation and re-booking flow when parcel cannot be dispatched. |
| **GAP-08** | 🟠 High | Courier Logistics | P5.0, P9.0, Level 2.3 | Arch §9.2 (D-3), PRD FR-14.9 | Partial COD delivery remittance disconnected from return creation and finance variance ledger. |
| **GAP-09** | 🟠 High | Courier Logistics | P5.0, Level 2.3 | Arch §10.2, §12.2 | Conflation of transient `delivery_failed` (re-attempt tomorrow) with `rto_initiated` (return to merchant). |
| **GAP-10** | 🟠 High | Returns & Refunds | P6.0, Level 2.4 | PRD FR-6.7.1, FR-6.7.10 | Missing return parcel tracking data flow from customer to warehouse. |
| **GAP-11** | 🟠 High | Returns & Refunds | P6.0, D1 (Inventory) | PRD FR-6.7.14, AC-6.3 | Physical segregation of damaged returned items missing from inventory location data store. |
| **GAP-12** | 🟡 Medium | Returns & Refunds | P1.0, P6.0, DF-04 | PRD FR-4.4.2, FR-6.7.10 | Customer order tracking flow (`/track-order`) omits independent return status read. |
| **GAP-13** | 🟡 Medium | Admin Operations | P4.0, Level 1 | Arch §15.3 (D-1) | Dedicated custom route `/app/manual-order` phone-first flow completely missing from Level 1 DFD. |
| **GAP-14** | 🟡 Medium | Admin Operations | P8.0, D5 (S3) | PRD FR-11.7.1, Arch §17.1 | S3 compiled invoice PDF download flows for Customer and Warehouse staff missing. |
| **GAP-15** | 🟡 Medium | Admin Operations | P8.0, D2 (Audit) | PRD FR-8.2.7, Arch §6.2 | Staff authentication security events (failed logins, lockouts) not linked to audit logger. |
| **GAP-16** | 🟡 Medium | Search & Catalog | P1.0, P8.0, Level 2.5 | Arch §4.2, §8.1 | Category dynamic attributes (`category_attribute`) omitted from Meilisearch indexing pipeline. |
| **GAP-17** | 🟡 Medium | SMS Outbox | P7.0, Level 1 | PRD FR-11.6.1, FR-11.6.3 | Admin manual SMS resend flow from delivery log missing; synchronous flow instead of BullMQ queue. |
| **GAP-18** | 🟡 Medium | Draw.io XML | Section 7 (XML) | DFD §1.1, §1.2 | Draw.io XML omits Data Store D5 (S3), External Entity E7 (Meta), and P6->P7 connector. |

---

## Detailed Findings & Impact Analysis

---

### Category 1: Payment & Stock Concurrency (Critical)

#### GAP-01 🔴 CRITICAL — Post-Payment Stockout Race Condition (Gateway Redirect Window)
- **Documented Flow:** In Level 2.1 (Sequence Diagram), Scenario B shows that when bKash/Nagad redirects the customer back with a completed transaction, the backend executes `POST /checkout/payment/execute` (Step 15), verifies payment success, and then runs the `order-placement` workflow (Step 16) to atomically decrement inventory and create the order.
- **The Defect:** In a high-demand scenario (e.g. Flash Sale with 1 unit remaining), Customer A clicks bKash and redirects to the bKash payment screen (taking 2–3 minutes to enter wallet number and OTP). Because stock is NOT locked during the redirect (to prevent orphan reservations per B-2), Customer B selects COD for the same unit. Customer B's order is confirmed immediately, decrementing stock to 0. 30 seconds later, Customer A finishes entering their bKash PIN; bKash debits Customer A's wallet ৳2,500; the callback executes successfully. The Medusa workflow then attempts to decrement inventory in `D1` and fails with an out-of-stock exception!
- **Business & Technical Impact:** Customer A's money has been captured by the merchant account, but NO order can be created because stock is exhausted. In `dfd.md`, there is **no exception flow, compensation branch, or dead-letter queue** for this condition. If unhandled, the system throws an uncaught 500 error, leaving the customer without an order receipt while their wallet is debited.
- **Required Resolution:**
  1. Add an explicit exception branch in Level 2.1: `If stock decrement fails after executePayment() succeeds`.
  2. The workflow must NOT fail silently or roll back the captured payment record; it must create an exception order: `order_status = 'unfulfillable_stockout'`, `payment_status = 'captured'`, flag an immediate high-priority alert on the Admin Dashboard, record the incident in `audit_log`, and queue an emergency SMS to the customer explaining the stockout and initiating a manual refund.

---

#### GAP-02 🔴 CRITICAL — Dropped Browser Callback Handling (Orphan Payment Session)
- **Documented Flow:** Level 2.1 relies on the customer's browser completing the redirect from the payment gateway to `/hooks/{provider}/callback`.
- **The Defect:** In Bangladesh, mobile network instability is common. A customer enters their PIN on bKash; bKash processes the debit; but before the gateway can redirect the browser to the merchant callback URL, the user's 4G drops, or the user closes their mobile browser thinking "payment is done". 
- **Business & Technical Impact:** The server never receives the browser callback! The payment was captured on bKash, but the Medusa backend never runs `executePayment` or `order-placement`. The cart remains open and no order is placed. The customer is debited, but the merchant platform has no record of the purchase.
- **Required Resolution:**
  1. Add an asynchronous worker process in Level 1 (e.g. `P3.5 Payment Session Polling / Status Query Worker`).
  2. For online payment sessions in `D1/D3` that remain in `pending` status for >10 minutes, the worker calls the bKash `queryPayment` API or Nagad transaction verification API.
  3. If the gateway reports the transaction was completed, the worker executes the order placement workflow automatically (as an outbox background task), linking the captured payment to a new order.

---

#### GAP-03 🟠 HIGH — Redis Stock Lock Scope vs Checkout Duration Mismatch
- **Documented Flow:** In Level 1 (Process 2.0) and Table 5.2 (DF-20), P2.0 acquires a Redis mutex `stock:lock:{variant_id}` with a 30-second TTL during checkout.
- **The Defect:** When does P2.0 acquire this lock? If it acquires the lock when the customer visits `/checkout`, entering a 4-tier Bangladesh address (Division, District, Thana, Street) and mobile phone typically takes 45 to 90 seconds on a mobile keypad. The 30s TTL will expire before the customer clicks "Submit Order", releasing the mutex prematurely. Conversely, if the lock is held across the entire checkout session, it locks inventory against other buyers while a user is merely typing their address.
- **Required Resolution:**
  1. Clarify that P2.0 acquires `stock:lock:{variant_id}` **only at the instant of order submission** (`POST /store/orders` or `POST /store/payment-sessions`), holding it for <2 seconds while database inventory balances are checked and atomically reserved.
  2. Address entry itself must never hold a distributed lock; it must validate stock availability optimistically.

---

### Category 2: COD Verification & Call Center Pipeline (High)

#### GAP-04 🟠 HIGH — Missing Transition to "escalated" Status After 3 Failed Call Attempts
- **Documented Flow:** In Level 2.2, Process 4.4 ("Log Unreachable Attempt") shows: `PhoneCall -> Unreachable / Busy -> Increment call attempt (1, 2, or 3) -> Keep cod_status = 'unconfirmed'`.
- **The Defect:** In `architecture.md` §12.2 and `prd.md` §6.6.2, `CodStatus` explicitly defines the enum value `ESCALATED = "escalated"`. If a customer cannot be reached after 3 consecutive phone calls across 24–48 hours, leaving the order as `unconfirmed` keeps it stuck in the primary Call Center queue indefinitely and locks inventory without resolution.
- **Required Resolution:**
  1. Add a conditional branch in Level 2.2: `If attempt_count >= 3 -> Transition cod_status to 'escalated'`.
  2. Route escalated orders to a separate Admin Escalation Queue for supervisor review, WhatsApp outreach, or final cancellation.

---

#### GAP-05 🟠 HIGH — Pre-Shipment Order Cancellation for Confirmed COD Orders Missing
- **Documented Flow:** In Level 2.2, cancellation (Process 4.5) is only depicted as an outcome of the initial call attempt.
- **The Defect:** Per PRD FR-6.7.15, customers are legally and operationally permitted to cancel an order at any point **before shipment**. If an order was confirmed at 10:00 AM (`cod_status = "confirmed"`, `shipment_state = "ready_to_ship"`), but the customer calls back at 02:00 PM to cancel before courier pickup at 05:00 PM:
  - There is no data flow in Level 1 or Level 2.2 for pre-shipment cancellation of a confirmed order.
  - The warehouse could print the manifest and hand the parcel to Steadfast/Pathao, creating an inevitable, costly RTO delivery fee!
- **Required Resolution:**
  1. Add a process `4.6 Pre-Shipment Cancellation` in Level 1 / Level 2.2.
  2. Input: Customer call or staff action on a `ready_to_ship` order.
  3. Action: Sets `order_status = 'canceled'`, releases reserved inventory in `D1`, notifies warehouse packing station to pull parcel from dispatch batch, and logs reason in `audit_log`.

---

#### GAP-06 🟡 MEDIUM — Scheduled COD Reservation Expiry Cron Flow Omitted
- **Documented Flow:** In `dfd.md` Section 3.1 and 3.2, all order processes are depicted as reactive (triggered by customer or staff HTTP requests).
- **The Defect:** `architecture.md` §7.2 and §22 (ADR-019) document a scheduled workflow `cron.cod-expiry-check`. While disabled by default pending owner policy on Q#18, the architecture states that the cron code exists in `apps/medusa/src/workflows/cod-expiry-cron.ts`. The DFD should illustrate how this scheduled timer interacts with `D2` (`order_bd_details`) and `D1` (`inventory_item`) when activated.
- **Required Resolution:**
  - Add an automated timer input to P4.0: `Timer: cron.cod-expiry-check (Interval: Configurable, default 48h)`.
  - Process scans `D2` for `cod_status = 'unconfirmed' AND created_at < NOW() - cod_expiry_hours`, auto-transitions status to `escalated` or `canceled`, and triggers stock release in `D1`.

---

### Category 3: Courier Logistics & Delivery (High)

#### GAP-07 🟠 HIGH — Courier Consignment Cancellation & Re-booking Flow Missing
- **Documented Flow:** In Level 2.3, Process 5.2 calls `createParcel()` -> obtains `consignment_id` -> sets `shipment_state = 'dispatched'`.
- **The Defect:** In daily Bangladesh warehouse operations, parcels frequently need courier cancellation before physical hand-off:
  1. Customer requests an urgent delivery address change or item swap after the parcel sticker was printed.
  2. Merchant decides to switch courier from Steadfast to Pathao because the Steadfast rider did not arrive for pickup.
  3. The packaging was damaged during packing and must be repacked with a different weight.
- **Impact:** Level 2.3 has no reverse data flow to cancel a consignment with the courier API (`courier.cancelParcel(consignment_id)`), reset `consignment_id = null`, and revert `shipment_state` back to `ready_to_ship`.
- **Required Resolution:**
  - Add Process `5.8 Cancel Consignment & Re-route Courier` in Level 2.3.
  - Flow: Staff action -> call `courier.cancelParcel(consignment_id)` -> clear consignment tracking fields in `D2` -> set `shipment_state = 'ready_to_ship'` -> log in `audit_log`.

---

#### GAP-08 🟠 HIGH — Partial Delivery Remittance Disconnected from Return & Variance Ledgers
- **Documented Flow:** In Level 2.3 (Process 5.6) and Table 5.2 (DF-27, DF-28), on `DELIVERED`, the flow captures COD payment in Medusa Core (`D1`) and records `cod_remittance_received` in `D2`.
- **The Defect:** In a partial delivery (e.g. customer ordered 3 kurtis for ৳3,000, rejects 1 damaged kurti at doorstep, pays ৳2,000 to rider):
  - Courier remits ৳2,000 minus delivery fee.
  - If P5.6 blindly calls Medusa `CodProvider.capturePayment()`, Medusa captures the full authorized ৳3,000! This corrupts the accounting ledger by ৳1,000.
  - Furthermore, the 1 returned kurti must be routed to the Return & Inspection pipeline (P6.0) to evaluate whether it is restockable.
- **Required Resolution:**
  - In Level 2.3, add a conditional branch in Process 5.6: `If parcel collection amount < authorized COD amount`:
    1. Capture actual cash collected (`payment_status = 'partially_paid'` or captured with immediate partial refund credit).
    2. Automatically instantiate an `order_return_request` in `D2` for the unaccepted item with status `item_received_evaluating`.
    3. Route the cash variance to `P9.0 Financial Reconciliation` under `disputed_remittance_variance`.

---

#### GAP-09 🟠 HIGH — Conflation of Transient `delivery_failed` (Retry) with `rto_initiated` (Return)
- **Documented Flow:** In Level 2.3 (Process 5.5 / 5.7), courier webhook events `DELIVERY_FAILED / RTO` are grouped together, immediately transitioning `shipment_state -> 'rto_initiated'` and alerting the warehouse team of an incoming return.
- **The Defect:** This misrepresents courier operational mechanics. In Bangladesh (Steadfast and Pathao):
  - When a rider cannot reach a customer on Day 1, the courier posts status `delivery_failed` (Reason: Customer phone off / Unreachable). The courier **holds the parcel at the local delivery hub** and will attempt delivery again on Day 2 and Day 3.
  - Only after 3 failed delivery attempts does the courier status change to `rto_initiated` (Return to Merchant).
  - Transitioning an order directly to `rto_initiated` on the first failed attempt prematurely alarms the customer and warehouse, and prevents normal delivery re-attempts.
- **Required Resolution:**
  - Split Process 5.7 into two distinct webhook handlers:
    1. Webhook `delivery_failed`: `shipment_state -> 'delivery_failed'`. Actions: Notify Call Center to call customer and arrange convenient re-delivery time; do NOT alert warehouse return desk.
    2. Webhook `rto_initiated`: `shipment_state -> 'rto_initiated'`. Actions: Alert warehouse of incoming return parcel; increment customer RTO risk counter in `customer_risk_profile`.

---

### Category 4: Returns, Inspection & Manual Refund (High)

#### GAP-10 🟠 HIGH — Customer Return Shipping & Inbound Tracking Flow Missing
- **Documented Flow:** In Level 2.4, Step 6.4 approves the return, and Step 6.5 jumps directly to `Warehouse Receives Physical Item`.
- **The Defect:** How does the returned item physically travel from the customer's home to the merchant warehouse?
  - In Bangladesh e-commerce, the customer drops the parcel at a local courier branch (e.g. Sundarban or Steadfast reverse) or the merchant books a reverse courier pickup.
  - The customer receives a courier receipt/consignment tracking code.
  - If the customer does not provide this tracking code, the merchant cannot track incoming return parcels, and fraudulent claims ("I already shipped it 5 days ago, give me my refund") cannot be verified.
- **Required Resolution:**
  - Add intermediate Step `6.4b Ingest Return Tracking Code` between 6.4 and 6.5.
  - Customer or Call Center staff inputs `return_courier_name` and `return_tracking_code` into `order_return_request`.
  - Warehouse staff scans this tracking code upon physical parcel arrival to unlock Process 6.6 (Condition Evaluation).

---

#### GAP-11 🟠 HIGH — Physical Damaged Goods Inventory Quarantine Missing
- **Documented Flow:** In Level 2.4 (Process 6.7), when an item is evaluated as `damaged`, the flow states: `item_condition = 'damaged' -> DO NOT RESTOCK INVENTORY`.
- **The Defect:** If the physical item is returned to the warehouse, it exists as physical matter in the building. If it is simply ignored by the inventory database, physical warehouse inventory audits will show an unexplained surplus of items. Furthermore, if staff mistakenly places the damaged item back on the shelf, it could be picked and shipped to another customer.
- **Required Resolution:**
  - Process 6.7 must execute an inventory update in `D1`: Move item to a designated `Quarantine / Damaged Goods Location` (or increment `damaged_stock_counter` in `D2`).
  - This marks the unit as physically present in the warehouse but excluded from sellable stock.

---

#### GAP-12 🟡 MEDIUM — Customer Order Tracking Lacks Return Status Read
- **Documented Flow:** In Level 1, Flow DF-04 defines customer order tracking lookup via `order_id` and phone.
- **The Defect:** Process 1.0 reads order details from `D1` and `D2`, but Table 5.1 (DF-04) and Level 2.4 omit the return status link to the customer storefront.
- **PRD Requirement:** PRD FR-4.4.2 and FR-6.7.10 explicitly mandate: "The customer can see the request status and staff-provided updates wherever customer-facing order tracking is supported."
- **Required Resolution:**
  - Update Process 1.0 and Flow DF-04 to explicitly query `D2: order_return_request` and return `return_status`, inspection condition, and staff notes to the customer's `/track-order` interface.

---

### Category 5: Admin CMS, Operations & Audit Logging (Medium)

#### GAP-13 🟡 MEDIUM — Phone-First Manual Order Custom Route Missing from Level 1
- **Documented Flow:** In Level 1 DFD, Process 4.0 only shows an incoming flow from Admin: `E2 <--> COD queue, Confirm/Cancel order | P4`.
- **The Defect:** In `architecture.md` §15.3 and review finding D-1, a custom Admin Route `/app/manual-order` was specifically designed to overcome Medusa's email-centric draft orders limitation. This is a core operational workflow used daily by social media / phone sales staff.
- **Required Resolution:**
  - Add an explicit flow to Level 1 and Process 4.0: `E2 -> Manual Order Submit (Phone, 4-tier Address, Variant IDs, Delivery Zone, Payment mode) -> P4.0`.
  - Process 4.0 must query `D2: customer_risk_profile` by phone, atomically reserve inventory in `D1`, snapshot prices, and log `created_by_staff_id` in `D2: audit_log`.

---

#### GAP-14 🟡 MEDIUM — S3 Invoice PDF Download Data Flows Missing
- **Documented Flow:** In Level 1, Process 8.0 shows `P8 --> Generate PDF invoice to S3 (D5)`.
- **The Defect:** There is no corresponding download flow for users to retrieve the invoice!
  1. Warehouse packing staff needs to download and print the invoice as a packing slip.
  2. Customers need to download their invoice PDF from the storefront order confirmation / tracking page.
- **Required Resolution:**
  - Add Outbound Flows in Level 1:
    - `P8.0 --> Signed S3 Invoice URL / PDF Stream --> E2 (Warehouse Staff)`
    - `P8.0 --> Tokenized S3 Invoice URL / PDF Stream --> E1 (Customer via /store/orders/:id/invoice)`

---

#### GAP-15 🟡 MEDIUM — Staff Auth Security Events Missing from Audit Logger Pipeline
- **Documented Flow:** Process 8.0 (Audit Logger) captures product price updates, stock changes, COD confirmations, and return decisions into `D2: audit_log`.
- **The Defect:** Per PRD FR-8.2.8 and Quality Checklist CHK-SEC-01: "Relevant security events (failed logins, lockouts, permission changes, password resets) are logged."
- **Required Resolution:**
  - Add an input flow to Process 8.0: `Medusa Auth Module -> Security Event (failed_login, account_lockout, password_reset, role_change) -> P8.0 -> D2: audit_log`.

---

### Category 6: Search & Catalog Localization (Medium)

#### GAP-16 🟡 MEDIUM — Category Dynamic Attributes Missing from Meilisearch Sync Pipeline
- **Documented Flow:** In Level 2.5, Process 8.2 fetches core products and Bangla translations: `Fetch core product & Bangla translations`.
- **The Defect:** In `architecture.md` §4.2, `bd-catalog` owns `category_attribute` (e.g. Fabric, Size Chart, Sleeve, Warranty) and `product_attribute_value`. The Meilisearch index configuration (§8.1) explicitly defines `attribute_*` as filterable attributes. If Process 8.2 only fetches product title and description, the indexed document will lack dynamic category attributes, breaking faceted filtering in the storefront.
- **Required Resolution:**
  - Update Process 8.2 in Level 2.5: `Fetch product, variants, Bangla localization, AND category_attribute values from D2`.
  - Process 8.3 must flatten these attributes into `attribute_{code}` before indexing to `D4 (Meilisearch)`.

---

#### GAP-17 🟡 MEDIUM — Language Preference Synchronization Missing
- **Documented Flow:** Level 1 Process 1.0 shows language toggle (`en` / `bn`).
- **The Defect:** Per PRD FR-10.2.2: "Guest language preference is remembered via a browser-level mechanism; a registered account syncs it to the customer profile." If a registered customer switches language to Bangla, this preference is not shown flowing into `D1: customer.metadata.locale`.
- **Required Resolution:**
  - Add flow from P1.0 to D1: `Update customer language preference in customer metadata`.

---

### Category 7: SMS Outbox & Reliability (Medium)

#### GAP-18 🟡 MEDIUM — Manual SMS Resend Flow Missing & Synchronous Representation
- **Documented Flow:** In Level 1, Process 7.0 is shown as a synchronous process called directly by P4.0, P5.0, and P6.0.
- **The Defect:**
  1. Per PRD FR-11.6.1: Admin staff must have "manual resend controls" for failed SMS in the delivery log. This flow is absent.
  2. Depicting P7.0 as a direct synchronous dependency of P4.0 (Order Placement) implies that an SMS gateway timeout could delay HTTP order response times or block workflow execution.
- **Required Resolution:**
  - Show P7.0 as an asynchronous consumer of an outbox BullMQ queue in `D3 (Redis: sms_outbox_queue)`.
  - Add an inbound data flow to P7.0: `E2 (Admin Staff) -> POST /admin/sms/resend/{log_id} -> P7.0`.

---

### Category 8: Draw.io / mxGraph XML Discrepancies (Medium / Low)

#### GAP-19 🟡 MEDIUM — Missing Data Store D5 (S3 Object Storage) in XML Model
- **The Defect:** In Section 1.2 and Level 1 diagram, `D5: Cloudflare R2 / S3 Object Store` is an official data store. In Section 7 (the Draw.io XML block), `store_d1`, `store_d2`, `store_d3`, and `store_d4` exist, but `store_d5` was omitted.

#### GAP-20 🟡 MEDIUM — Missing External Entity E7 (Meta Graph API) in XML Model
- **The Defect:** In Section 1.1 and Level 0 diagram, `E7: Meta Graph API` is an external entity. In Section 7 (the Draw.io XML block), `ent_meta` is missing.

#### GAP-21 🟡 MEDIUM — Missing Process P6 -> P7 Connector in XML Model
- **The Defect:** When a manual refund is recorded in P6.0, an SMS is sent via P7.0 (`e_p6_p7`). In the Draw.io XML, connectors exist for `e_p4_p7` and `e_p5_p7`, but `e_p6_p7` is missing.

---

## Actionable Recommendations & Remediation Plan

To bring [`docs/dfd.md`](dfd.md) to complete structural and operational perfection, the following updates are recommended:

1. **Immediate Priority (Fix GAP-01 & GAP-02):**
   - In Level 2.1, insert an explicit failure branch for post-payment stock exhaustion (`unfulfillable_stockout` order creation with immediate finance alert).
   - Add background status-polling worker (`P3.5`) to recover dropped browser callbacks on successful gateway transactions.
2. **High Priority (Fix GAP-04, GAP-05, GAP-07, GAP-08, GAP-09):**
   - Update Level 2.2 with `cod_status = 'escalated'` transition after Attempt 3 and pre-shipment order cancellation (`4.6`).
   - Update Level 2.3 to separate transient `delivery_failed` (re-attempt tomorrow) from `rto_initiated` (return to merchant).
   - In Level 2.3, connect partial COD collections to return request instantiation and finance variance ledgers.
   - Add courier consignment cancellation and re-routing flow (`5.8`).
3. **Medium Priority (Fix GAP-10, GAP-11, GAP-13, GAP-14, GAP-16):**
   - Add return tracking code ingestion (`6.4b`) and physical damaged goods inventory quarantine (`6.7b`) in Level 2.4.
   - Add `/app/manual-order` phone-first flow and S3 PDF invoice download flows to Level 1.
   - Include category dynamic attributes in Meilisearch indexing pipeline (Level 2.5).
4. **Diagrammatic Cleanup (Fix GAP-19, GAP-20, GAP-21):**
   - Update Draw.io XML model to include `store_d5`, `ent_meta`, and the `e_p6_p7` connector.

---

*Review completed: 2026-10-24*  
*Author: Antigravity Architecture & QA Review Subsystem*
