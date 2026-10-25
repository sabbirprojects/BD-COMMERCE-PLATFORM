# Product Requirements Document — Bangladesh Single-Vendor E-commerce Platform

**Status:** Draft v2 (updated from v1)
**Based on:** approved `ideaproposition.md`
**Scope:** Single-vendor, multi-category, multi-variant B2C store for Bangladesh. Mobile-first storefront + centralized Admin Panel.

**Change summary (v1 → v2):**
- Added a full configurable Return & Refund Management system — manual approval/processing only (Section 6.7).
- bKash/Nagad: direct Merchant API integration confirmed as the planned approach; actual setup remains a post-build dependency on merchant approval/credentials (Section 7).
- Courier/delivery: separate configurable Inside Dhaka / Outside Dhaka charges confirmed; specific courier and exact rates remain Open (Section 7, 11).
- Staff accounts, roles, permissions and login security expanded (Section 8.2, 12).
- Translation: added a configurable automatic-translation option with mandatory review and failure flagging (Section 10.3).
- VAT & invoicing: added printable invoices and editable invoice templates (Section 11.7, new).
- SMS notifications moved from "Open / Phase 2" to **Confirmed, required in Phase 1** (Section 11.6, Section 15).
- Meta Ads/analytics expanded: Marketing API sync, distinct-metric reporting, sync-failure handling (Section 5.3).
- Landing pages & media/storage requirements expanded (Section 5.1).
- Privacy, data retention and audit-log requirements expanded (Section 12.8, new).
- Section 17 edge cases expanded (30 new cases merged in, duplicates consolidated).
- Section 19 Open Questions updated — some items narrowed/resolved, new items added.

> **Tags used throughout (standardized):**
> - **[Confirmed]** — explicitly decided requirement.
> - **[Recommended]** — sensible default/recommendation; still needs owner approval before being treated as final.
> - **[Open]** — unresolved; see Section 19 Unresolved Questions Register. Do not implement without a decision.
> - **[Out of Scope]** — excluded from the current phase.

---

## 1. Overview & Goals

### 1.1 Vision
A practical, trustworthy, mobile-first e-commerce platform for a single Bangladeshi B2C business. Customers shop in Bangla or English, see accurate price/stock/delivery information before ordering, and complete checkout without losing cart contents. Staff manage catalog, orders, delivery, payments, returns/refunds and storefront content from one Admin Panel.

### 1.2 Business Goals **[Confirmed]**
- G1 — Launch a functioning, revenue-generating storefront with COD, bKash and Nagad.
- G2 — Keep product, price, stock, cart and order data consistent across storefront, category pages and campaign landing pages (single source of truth).
- G3 — Let non-technical staff manage products, orders, delivery, returns/refunds, content and campaigns without code changes.
- G4 — Support campaign landing pages with direct checkout, reusing the same catalog/order system.
- G5 — Provide Bangla/English support throughout, without layout breakage.
- G6 — Present sales/cost figures honestly — never label an incomplete number as "Net Profit."
- G7 — Never automatically approve or execute a return/refund; every return/refund outcome is a deliberate, authorized, logged staff decision.

### 1.3 User Types
| User | Description |
|---|---|
| Guest Customer | Browses and orders without an account; tracks order via order reference + phone. |
| Registered Customer | Optional account; saved addresses, order history. |
| Owner | Full access including finance, return/refund authorization and system configuration. |
| Manager | Daily operations: orders, catalog, inventory, customers, marketing, and permission-dependent return review. No credentials/high-risk settings unless granted. |
| Staff | Assigned operational tasks only (e.g., order confirmation, fulfillment). No finance/integration secrets or return/refund authorization unless explicitly granted. |

---

## 2. Scope Boundaries

### 2.1 In Scope **[Confirmed]**
- Single-vendor B2C store, multiple categories, product variants.
- Bangladesh delivery and business operations (BDT, local address structure, COD/bKash/Nagad).
- Mobile-first storefront + centralized Admin Panel, Bangla + English.
- Campaign landing pages built on the same catalog/cart/order system.
- Configurable, manually-processed Return & Refund Management.
- SMS notifications for key order/payment/return events.
- One warehouse/stock location, physical products only **[Recommended]**.

### 2.2 Out of Scope **[Out of Scope]**
- Multi-vendor marketplace, vendor registration, vendor dashboards, vendor commission/payout. **Not to be introduced at any phase of this PRD.**
- Card payments.
- Unrestricted visual design/CSS editor (templates + configurable sections only).
- Fully automated order creation from private/social messages without a verified, supported integration — manual Admin order entry is the fallback.
- Digital products, pre-orders, backorders, multi-warehouse inventory (unless a real business need is confirmed later).
- Automatic return/refund approval or automatic refund execution of any kind (see Section 6.7).
- Meta Conversions API (CAPI) in Phase 1 — **[Recommended] Phase 2** candidate only.

---

## 3. Catalog Model

### 3.1 Categories & Category-Specific Attributes
- FR-3.1.1 Products belong to one or more categories; each category can define its own relevant attribute set (e.g., Fashion: size/fit/size-guide; Electronics: brand/model/spec/warranty; Grocery: weight/pack-size; Beauty: shade/type/ingredients). **[Confirmed]**
- FR-3.1.2 Category filters and the variant selector on a PDP show only attributes relevant to that product's category — a grocery item must not show a "Size: S/M/L" selector. **[Confirmed]**
- FR-3.1.3 Brand is a product-level catalog entity (not a variant option) wherever brand filtering is needed. **[Recommended]**

### 3.2 Variants
- FR-3.2.1 A product may define up to **3 variant option types** (e.g., Size, Colour, Pack Size). **[Recommended]**
- FR-3.2.2 Each variant combination has its own SKU, price, stock quantity and (optionally) image. **[Confirmed]**
- FR-3.2.3 Deactivating/discontinuing a variant must not delete historical order line references to it (see Section 6.4, 6.7).

**Acceptance criteria**
- AC-3.1 Creating a 4th option type on a product is blocked with a clear Admin error.
- AC-3.2 Two variants cannot share the same SKU within a product.
- AC-3.3 A category's PDP only renders attribute/filter fields configured for that category.

---

## 4. Storefront — Browsing, Search, PDP, Cart, Checkout

### 4.1 Browsing, Search & Filters **[Confirmed]**
- FR-4.1.1 Category and search listing pages support pagination/infinite scroll, sort (price, newest, popularity), and category-relevant filters (price range, variant attributes, brand, availability).
- FR-4.1.2 Search matches product title, SKU, category and (where set) tags; out-of-stock items are shown but clearly marked, not hidden by default.
- FR-4.1.3 Filters reflect only values that exist among currently listed products (no dead filter options).

### 4.2 Product Detail Page (PDP) **[Confirmed]**
- FR-4.2.1 PDP shows price, selected variant, stock state, delivery charge estimate and any extra charge before Add to Cart/Buy Now.
- FR-4.2.2 Selecting a variant updates price/image/stock live; an out-of-stock variant is selectable to view but cannot be added to cart.
- FR-4.2.3 Category-specific fields (e.g., size guide, specs, ingredients) render per Section 3.1.

### 4.3 Cart, Buy Now & Checkout **[Confirmed]**
One shared cart, product, pricing, inventory and order system is used for every entry point (standard storefront and campaign pages). No entry point may create a separate/inconsistent version of product or stock data.

- FR-4.3.1 **Add to Cart** adds the selected variant/quantity to the customer's cart.
- FR-4.3.2 **Buy Now** adds the selected variant to the *existing* cart (preserving all other items) and takes the customer directly to checkout/order review. It must never silently remove or overwrite existing cart contents.
- FR-4.3.3 **Buy Now when the exact variant is already in cart:** the existing quantity is kept as-is (not auto-incremented, no duplicate line created); the item is shown once in the combined order review; the customer can change the quantity there. **[Confirmed]**
  - Example: cart already has Variant A × 2. Customer clicks Buy Now on Variant A → checkout shows Variant A × 2 (unchanged), editable.
- FR-4.3.4 Checkout supports multiple product lines and lets the customer edit quantity or remove a line before confirming.
- FR-4.3.5 Server validates current price, variant availability and stock for every line at order placement — not just client-side state.
- FR-4.3.6 If stock or price has changed since the item was added, checkout shows the updated state and requires the customer to acknowledge the change before proceeding — it must never silently accept a stale price/stock.
- FR-4.3.7 Duplicate-submission protection: repeated taps, refresh, or slow network must not create duplicate orders or duplicate payment charges (idempotent order submission, e.g., via a client-generated idempotency token honored server-side).
- FR-4.3.8 If the customer abandons checkout, cart contents persist for their return (guest: browser-persisted; registered: account-persisted).

**Acceptance criteria**
- AC-4.1 Add Variant A (qty 2) to cart → click Buy Now on Variant A → checkout shows exactly one line, Variant A × 2, editable.
- AC-4.2 Add to cart Product X, then Buy Now Product Y → checkout shows both X and Y as separate lines.
- AC-4.3 Submit order twice within 2 seconds (double-tap) → exactly one order is created.
- AC-4.4 Admin reduces stock to 0 for an item sitting in a customer's cart → at checkout the customer sees "out of stock," cannot proceed with that line, and can remove/adjust it.
- AC-4.5 Admin changes price while item is in cart → checkout shows the new price before order placement, not the stale price.

### 4.4 Guest Checkout & Order Tracking **[Confirmed]**
- FR-4.4.1 Guest checkout requires no account creation.
- FR-4.4.2 Orders are trackable via order reference + phone verification, without forced registration, and show return/refund request status where applicable (see Section 6.7).

---

## 5. Campaigns & Landing Pages

### 5.1 Landing Page Builder **[Confirmed]**
- FR-5.1.1 Staff can create, edit, preview, publish and unpublish campaign pages using a fixed set of tested templates/sections — no free-form code per campaign.
- FR-5.1.2 Landing pages use the live catalog, price, stock and order system — never a separate/duplicated product or stock record.
- FR-5.1.3 Core controls: reusable sections, mobile preview, page duplication, basic SEO fields, publish validation, rollback to last published version.
- FR-5.1.4 No arbitrary small cap on the number of landing pages an admin may create; the practical ceiling is the actual hosting/storage/provider capacity, not an artificial product limit. **[Confirmed]**
- FR-5.1.5 Media/content volume (images, sections) may grow within the real hosting and storage limits in force; the system must never promise literally unlimited storage. **[Confirmed]**
- FR-5.1.6 All uploads (landing-page media, product images, invoice-template assets) are validated for file type, file size and basic security (e.g., rejecting executable/script content) before acceptance. **[Confirmed]**
- FR-5.1.7 When a storage or provider limit is reached, the admin sees a clear warning/error naming the limit — the system does not fail silently or accept a corrupt partial upload. **[Confirmed structure; specific limit values dependent on Section 19 Q#11 — actual hosting plan.]** The warning infrastructure is built generically to accept configurable thresholds; limit values are sourced from the confirmed hosting plan.
- FR-5.1.8 A failed upload or failed edit on one landing page must not damage, corrupt or unexpectedly unpublish any other existing, working page. **[Confirmed]**

### 5.2 Checkout Entry Modes
- FR-5.2.1 **Mode A — Product-first:** Landing page → PDP → shared cart/checkout. **[Recommended]**
- FR-5.2.2 **Mode B — Direct checkout:** Landing page → combined checkout/order review → confirmation, showing selected product/variant, quantity, offer conditions, delivery charge and total before submission. **[Confirmed]**
- FR-5.2.3 Campaign checkout adds to the existing shared cart by default and must never silently clear it (same rule as FR-4.3.2). Campaign purchases use the exact same underlying product, inventory, order and payment records as normal storefront purchases — never a parallel/duplicated record. On Mode B embedded checkout pages, the embedded checkout block binds to the single unified cart (displaying the campaign item alongside any pre-existing items with clear removal and quantity controls) and submits using the standard server-side order workflow with an `X-Idempotency-Key` header to eliminate duplicate submissions. **[Confirmed]**
- FR-5.2.4 Campaign ID, landing-page ID and UTM parameters are attached to the resulting order where available, without altering cart contents or price rules.
- FR-5.2.5 A campaign offer that is expired, unpublished, sold out, or fails validation at checkout is blocked with a clear message — checkout at a stale promotional price is never allowed. **[Confirmed]**
- FR-5.2.6 A single, separate "campaign-only" checkout that excludes the regular cart has **not** been confirmed and is not built in this release; the single-vendor unified cart/order system and cart-preservation rule (FR-5.2.3) remain the approach unless the owner confirms otherwise. **[Recommended; see Open Q#5 in Section 19]**

**Acceptance criteria**
- AC-5.1 Customer has 2 items in cart, visits a campaign landing page, and completes Mode B checkout for the campaign product → final order contains all 3 lines, cart was not cleared.
- AC-5.2 Publishing a landing page that links to an unpublished/out-of-stock product is blocked with a validation warning.
- AC-5.3 Uploading an oversized or disallowed file type to a landing page is rejected with a clear error; the page's previously published version remains intact and live.

### 5.3 Meta Ads, Pixel & Campaign Analytics **[Recommended, partly Open]**
- FR-5.3.1 One centrally managed Meta Pixel configuration serves the storefront and all published landing pages, subject to privacy review, consent requirements, secure handling and event deduplication planning. **[Recommended — Phase 1 foundation]**
- FR-5.3.2 Standard events (ViewContent, AddToCart, InitiateCheckout, Purchase) are tracked and tested for correct firing.
- FR-5.3.3 Campaign ID/landing-page ID/UTM data is preserved with the order record for later attribution reporting.
- FR-5.3.4 Meta Marketing API integration retrieves supported campaign/ad-spend data once Meta access and credentials are available; until then, this remains a configuration dependency, not an assumed-working integration. **[Recommended]**
- FR-5.3.5 Reporting shows campaign spend, Meta-attributed purchases, cost per attributed purchase, and store-verified orders as **distinct, separately labeled metrics** — never merged into one number, and Meta's attributed results are never represented as guaranteed true per-order advertising cost. **[Confirmed]**
- FR-5.3.6 If Meta data synchronization fails, the dashboard shows the last successful sync time and a visible error/status indicator; missing spend data is never silently shown as zero. **[Confirmed]**
- FR-5.3.7 Meta Conversions API (server-side, CAPI) is **[Recommended] Phase 2** — not a Phase 1 launch blocker, and only pursued after a privacy/consent review.

---

## 6. Orders, Inventory & Fulfillment

### 6.1 Order Creation
- FR-6.1.1 Website orders are created automatically by the system — no staff re-entry. **[Confirmed]**
- FR-6.1.2 Staff can manually create an order in Admin for phone/Facebook/WhatsApp/personal-message orders not captured by a supported integration. **[Confirmed]**

### 6.2 Status Model, Updates & Notifications **[Recommended, partly Open]**
Order status, payment status and shipment status are tracked as **three separate fields** — never collapsed into one status. A fourth, independent status tracks each return/refund request (Section 6.7) and never overwrites the original order/payment status.

| Field | Example states |
|---|---|
| Order status | Pending → Confirmed → Processing → Ready to Ship → Completed/Delivered, with exceptions Cancelled / Failed Delivery |
| Payment status | Unpaid, Pending, Paid, Partially Refunded, Refunded |
| Shipment status | Booked, Shipped, Out for Delivery, Delivered, Failed Delivery, RTO, RTO Received |
| Return/Refund status | Pending Manual Review, Approved, Rejected, In Progress, Completed (see Section 6.7) |

This exact state list and the allowed transitions between states are a **recommendation for implementation planning only** and are not final. Final names/transitions must be signed off (Section 19, Open Q#3) before being locked as "Confirmed." **This non-final caveat applies to the specific names and allowed transitions for order status, payment status and shipment status only. The existence of a fourth, independent return/refund status field is [Confirmed] (FR-6.7.9). The specific state names for return/refund status (e.g., “Pending Manual Review,” “Approved,” “Rejected,” “In Progress,” “Completed”) are [Recommended] and will become [Confirmed] once Open Q#3 is signed off.**

- FR-6.2.1 For every transition, the system defines whether stock, customer notification, finance totals and courier action change — this mapping must be completed and approved before build (tracked as an Open item, not invented silently).
- FR-6.2.2 Authorized staff can manually update permitted statuses from the Admin Panel, within their granted permissions. **[Confirmed]**
- FR-6.2.3 Every status change records who changed it, when, and (where appropriate) why — written to the audit log (Section 12.2). **[Confirmed]**
- FR-6.2.4 Staff see Admin-facing notifications/alerts for important order events requiring action (new order, payment failure, low stock, return/refund request awaiting review, failed delivery/RTO). **[Confirmed]**
- FR-6.2.5 The same webhook, staff action or customer request processed more than once (e.g., network retry) must not duplicate order creation, status changes, stock adjustment or payment processing. **[Confirmed]**
- FR-6.2.6 An order's historical financial data (prices, discounts, delivery charge, VAT, totals) stays consistent even when product prices, delivery charges or VAT settings change later (restates FR-6.4.1, FR-11.7.3). **[Confirmed]**

### 6.3 Inventory Integrity **[Confirmed]**
- FR-6.3.1 Price, variant and stock are validated server-side at order placement (restates FR-4.3.5).
- FR-6.3.2 Concurrent purchases cannot oversell stock (atomic stock decrement at order confirmation, not at cart-add).
- FR-6.3.3 Stock reservation/expiry rules (if used) are explicit: when stock is reserved for an unconfirmed order and when it's released. **[Open — see Section 19 Q#18]**

### 6.4 Order-Time Snapshot **[Confirmed]**
- FR-6.4.1 Each order line stores a snapshot of product title, SKU, variant, unit price, discount, delivery charge, VAT and relevant product cost at order time. Later catalog, pricing, VAT or invoice-template edits must never rewrite historical order data.

### 6.5 Discounts & Coupons **[Recommended]**
- FR-6.5.1 One coupon per order; no discount stacking unless an explicit rule allows it.

### 6.6 COD Risk Handling **[Recommended, partly Open]**
- FR-6.6.1 Bangladesh phone numbers are validated at checkout with a clear error for invalid formats.
- FR-6.6.2 COD confirmation is tracked as its own state: Unconfirmed / Confirmed / Unreachable.
- FR-6.6.3 Staff see warnings for customers with prior failed deliveries/RTOs where that history exists.
- FR-6.6.4 Phone OTP, address blocklist and mandatory advance payment are **not** built in Phase 1; manual confirmation + risk flags are used instead. OTP/blocklist is reconsidered after real RTO/abuse data is available. **[Open — see Section 19]**

### 6.7 Return & Refund Management **[Confirmed structure; policy values Open]**
A configurable Return & Refund Management system lives inside the Admin Panel. Policy **values** are owner decisions and remain **[Open]**; the fact that these settings are Admin-configurable and that all review/approval/processing is manual is **[Confirmed]** and must not be built any other way.

**6.7.1 Admin-configurable policy settings [Confirmed structure, values Open]**
- FR-6.7.1 Admin can **Add, Edit and Remove** return/refund policy settings, including:
  - Return eligibility period (return window), conditions, and the product categories it applies to. **[Open value]**
  - Refund eligibility conditions, available refund methods, and processing rules. **[Open value]**
  - Return shipping responsibility (who pays) and related charges. **[Open value]**
  - Non-returnable product categories or individual products. **[Open value]**
  - Any additional policy field the business later needs (extensible, not hardcoded). **[Confirmed structure]**
  - Enable/disable toggle for each return or refund option where appropriate. **[Confirmed]**
- FR-6.7.2 Removing a policy setting that is already referenced by an active/recent return or refund request requires explicit confirmation and does not retroactively change already-recorded requests. **[Confirmed]**
- FR-6.7.3 The system must not assume the business has already finalized its return window, return conditions, or refund rules — until the owner sets these, the relevant Admin fields are shown as "not yet configured," not silently defaulted. **[Confirmed]**

**6.7.2 Manual processing only [Confirmed — hard requirement]**
- FR-6.7.4 Return requests are **never** automatically approved.
- FR-6.7.5 Refunds are **never** automatically approved, initiated, or marked completed — not by order-status change, payment callback, or courier update.
- FR-6.7.6 An authorized staff member or admin must manually review each return/refund request and choose: approve, reject, request more information, or another permitted action.
- FR-6.7.7 Only users holding the specific Admin-assigned permission (return review / refund authorization / mark-as-processed) may perform the corresponding action (Section 8.2).
- FR-6.7.8 Every return/refund action records the responsible user, the action taken, a timestamp, the stated reason, and the resulting status change in the audit log (Section 12.2, 12.8).
- FR-6.7.9 Return/refund request status is tracked **independently** from the original order and payment statuses — never overwrites them (restates part of the status model, Section 6.2).
- FR-6.7.10 The customer can see the request status and staff-provided updates wherever customer-facing order tracking is supported (FR-4.4.2).
- FR-6.7.11 Refund completion is never claimed to the customer or in reporting until it has been manually verified and recorded by an authorized user.
- FR-6.7.12 If an external payment provider supports automated refunds, that capability is treated as a **separate, configurable integration** requiring setup and verification — never assumed available or auto-enabled (consistent with Section 7.3).

**6.7.3 Suggested workflow [Recommended — adjust only if incompatible with a better existing flow; manual approval/processing stays Confirmed]**
Return/refund request submitted → Pending Manual Review → Staff/Admin reviews the request → Approved or Rejected → If approved, authorized staff manually handles the return/refund → Staff verifies the outcome and records it → Request marked Completed.

- FR-6.7.13 A rejected request retains the decision, reason, responsible user and timestamp for later reference. **[Confirmed]**
- FR-6.7.14 On RTO or physical return receipt, staff record the item's condition (sellable / damaged / not restockable) before any stock adjustment; a damaged or unreviewed item is never automatically returned to sellable stock. **[Confirmed]**
- FR-6.7.15 Cancellation is allowed before shipment. After shipment, the order is routed through Refused / Failed Delivery / RTO via the staff-managed workflow above — never marked as if it had never been sent, and never silently adjusted in stock or payment records outside that workflow. **[Confirmed]**
- FR-6.7.16 COD RTO normally has no customer payment to refund; prepaid-order refunds follow the approved refund policy once the owner sets one (Section 19, Open Q#4).

**Acceptance criteria**
- AC-6.1 Two concurrent checkouts for the last unit of a variant → exactly one succeeds; the other sees an out-of-stock message.
- AC-6.2 Editing a product's price today does not change the price shown on an order placed last month.
- AC-6.3 A delivered-then-returned item marked "damaged" on return does not get added back to sellable stock.
- AC-6.4 Cancelling an order after it has shipped is blocked; the UI routes staff to the RTO/failed-delivery flow instead.
- AC-6.5 A newly submitted return request sits in "Pending Manual Review" and is never auto-approved, regardless of elapsed time.
- AC-6.6 A payment-provider webhook reporting a refund-capable event does not, by itself, change a return/refund request's status — only a manual staff action does.
- AC-6.7 A staff user without return-review permission cannot approve, reject, or mark a return/refund request as processed, even via direct API/URL access.
- AC-6.8 Deleting a return policy field that is referenced by an open return request requires explicit admin confirmation before removal.

---

## 7. Payments

### 7.1 Supported Methods **[Confirmed]**
- COD, bKash and Nagad are required at launch. **COD is available for customer transactions from launch. bKash and Nagad infrastructure (direct Merchant API integration) is built at launch; actual customer transactions require merchant approval and credential setup, which are post-build dependencies — never presented as operational until configured and verified (FR-7.3.2).** Card payments are out of scope.
- BDT (৳) is the only currency.

### 7.2 Admin Payment Management **[Confirmed]**
- FR-7.2.1 Admin provides a Payment Settings area to add/edit/enable/disable/remove payment methods and manage supported merchant account/integration configuration.
- FR-7.2.2 Disabling a method hides it from checkout immediately without altering historical orders/payment records.
- FR-7.2.3 Integration secrets are stored securely server-side, never shown in full after initial save, and never written to application logs (restates/links Section 12.3, 12.8).

### 7.3 bKash & Nagad Integration Approach **[Confirmed direction; setup = Open dependency]**
- FR-7.3.1 The platform is built for **direct Merchant API integration** with bKash and Nagad (not an aggregator). **[Confirmed]** This resolves the previous provider-neutral open item on *connection mode*; provider onboarding mechanics remain dependent on real merchant approval.
- FR-7.3.2 Actual integration setup (merchant approval, live credentials, endpoint configuration, testing) happens **after the application is built**, once the business obtains bKash/Nagad merchant approval and access. Until then, this is a **setup dependency**, not a completed integration — it is never presented to the business or customers as already operational. **[Confirmed]**
- FR-7.3.3 Admin Panel includes configuration for each supported payment method's enabled/disabled state and the credential/config fields that provider's actual Merchant API onboarding requires. If required credentials/configuration are missing, the method must be disabled in Admin, not shown as available and failing at checkout. **[Confirmed]**
- FR-7.3.4 Online payment success is verified using trusted server-side/provider verification (signature-checked callback or server-to-server status check) — never a screenshot, client-side redirect alone, or unverified customer claim. Checkout redirect callback routes (`/hooks/bkash/callback`, `/hooks/nagad/callback`) must never trust incoming query or body parameters alone; they must strictly execute a server-to-server query/execute API verification (`executePayment` or status query) before capturing payment or completing order creation. **[Confirmed]**
- FR-7.3.5 Repeated callbacks/webhooks/requests for the same payment event are handled idempotently — never creating duplicate payments or duplicate order processing (restates FR-7.3.2 of v1 as FR-7.3.6 below; consistent with FR-6.2.5). **[Confirmed]**
- FR-7.3.6 Payment status and order status are kept as separate fields at all times (restates Section 6.2 status model). **[Confirmed]**
- FR-7.3.7 For online payments (bKash/Nagad), the Medusa Order is NOT created before the customer is redirected to the gateway. During redirect, only a payment session exists and the customer's cart remains open and preserved. If the customer cancels on the gateway or payment fails, they return to `/checkout` with an informative message, cart intact, and no orphan order or orphan inventory reservation is created. Order creation and stock deduction only occur upon verified server-to-server payment capture. **[Confirmed]**

### 7.4 Courier & Delivery Configuration **[Confirmed direction; specific courier Open]**
- FR-7.4.1 Admin Panel provides settings for supported courier services and their configuration (name, service areas, credential fields, enabled/disabled state). **[Confirmed]**
- FR-7.4.2 Actual courier API integration (booking, tracking, COD settlement) is configured **after the application is built**, once the required courier credentials/access are available — treated as a setup dependency, same pattern as payments. **[Confirmed]**
- FR-7.4.3 Delivery charges are configurable in Admin as **separate rates for Inside Dhaka and Outside Dhaka** at minimum, with room to add finer zones later; rates are never hardcoded in application logic. **[Confirmed]**
- FR-7.4.4 A manual operational fallback (staff manually books/tracks shipments and enters consignment ID/status) is always available when a courier API is unavailable or not yet connected — order operations are never blocked by a missing courier integration (restates FR-7.3.4 of v1). **[Confirmed]**
- FR-7.4.5 If a shipped order is cancelled or delivery fails, it is handled through the staff-managed cancellation/RTO workflow (Section 6.7.3) — never a silent stock or payment-record change. **[Confirmed]**
- FR-7.4.6 No courier is claimed as "integrated" in Admin or customer-facing tracking until that integration is actually configured and tested. **[Confirmed]**

**Acceptance criteria**
- AC-7.1 Disabling bKash in Admin immediately removes it from checkout; an order paid earlier via bKash still displays its original payment method and amount.
- AC-7.2 A payment webhook delivered twice (network retry) results in one recorded payment, not two.
- AC-7.3 With no courier API connected, staff can still book a shipment by manually entering a consignment ID and update its status manually.
- AC-7.4 A payment method with incomplete Merchant API credentials is shown as disabled/unavailable at checkout, never as a selectable option that then fails.
- AC-7.5 A customer-submitted payment screenshot alone does not mark an order "Paid" — only a verified server-side/provider check does.
- AC-7.6 Selecting "Inside Dhaka" vs. "Outside Dhaka" at checkout applies the correct configured delivery charge and displays it before order confirmation.

---

## 8. Admin Panel

### 8.1 Navigation Modules **[Confirmed]**
Dashboard · Orders · Returns & Refunds · Catalog · Inventory · Customers · Marketing · Payments & Finance · Delivery · Reports · Content & Storefront · Settings.

| Module | Core capability |
|---|---|
| Dashboard | Sales/orders overview, low-stock alerts, pending tasks (incl. return/refund requests awaiting review), recent activity |
| Orders | Order detail, status (3-field model + independent return/refund status), cancellations, COD confirmation/risk flags |
| Returns & Refunds | Configurable return/refund policy settings; manual review/approve/reject queue; refund processing record; permission-gated actions |
| Catalog | Products, categories, attributes, variants, brand, images/media |
| Inventory | Stock by variant, manual adjustment, low-stock alerts, history |
| Customers | Contact info, order history, return/refund history, support info — access limited by role |
| Marketing | Campaigns, landing pages, offers, discounts, Meta attribution, campaign reporting |
| Payments & Finance | Payment records, COD settlement tracking, refund records (manually recorded), costs, expenses, payment method management |
| Delivery | Zones (Inside/Outside Dhaka +), charges, courier settings, tracking, failed delivery/RTO records |
| Reports | Sales, products, inventory, customers, campaigns, expenses, contribution-profit |
| Content & Storefront | Homepage sections, banners, category presentation, policy pages (incl. Return/Refund policy page), navigation menus |
| Settings | Store info, appearance, localization, translation service, delivery, payment, SMS gateway, marketing, SEO, invoice templates, staff access, security, system |

### 8.2 Staff Accounts, Roles, Permissions & Login Security **[Confirmed structure; some defaults Recommended/Open]**
| Role | Access |
|---|---|
| Owner | Full access, incl. finance, return/refund authorization and system config |
| Manager | Orders, catalog, inventory, customers, marketing, and granted return/refund review. No credentials/staff admin/high-risk settings unless granted |
| Staff | Assigned operational tasks only. No finance, integration secrets, or return/refund authorization unless explicitly granted |

- FR-8.2.1 Admin can create staff accounts, set an initial password, assign roles, and configure fine-grained permissions. **[Confirmed]**
- FR-8.2.2 Admin can grant specific permissions for: order management, return review, refund authorization, mark-refund-as-processed, payment management, invoice management, and other sensitive operations — independently of each other. **[Confirmed]**
- FR-8.2.3 Access is enforced on the server/backend for every sensitive action — never by hiding a button in the UI alone. **[Confirmed]**
- FR-8.2.4 Passwords are never displayed in readable form once set, to anyone including Owner/Admin. **[Confirmed]**
- FR-8.2.5 Staff are required to change their initial password at first login. **[Recommended]**
- FR-8.2.6 Sessions are invalidated for the affected account after a password change or a role/permission change. **[Confirmed]**
- FR-8.2.7 Temporary account lockout after 5 consecutive failed login attempts, for 15 minutes, is the default login-security mechanism, unless the chosen authentication system/provider already offers an equivalent or stronger mechanism (in which case that is used instead and documented). **[Recommended]**
- FR-8.2.8 Relevant security events (failed logins, lockouts, permission changes, password resets) are logged, and the appropriate administrator is notified where the system supports it. **[Confirmed]**
- FR-8.2.9 2FA is required for Owner/Manager (privileged) accounts where the authentication system supports it; rollout to all staff is evaluated after checking setup/recovery UX. **[Recommended]**
- FR-8.2.10 Final role list and permission matrix are confirmed against the real team before go-live (Section 19, Open Q#6).

**Acceptance criteria**
- AC-8.1 A Staff-role user without return/refund permission cannot view or action return/refund approval, even via direct URL.
- AC-8.2 A Manager can edit a product price but cannot change system-level payment credentials unless explicitly granted.
- AC-8.3 6 consecutive failed login attempts on one account triggers a lockout per the configured policy; the lockout and the preceding failures are both logged.
- AC-8.4 Changing a staff member's role immediately invalidates their existing active session(s).
- AC-8.5 No UI screen, export, or API response ever renders a stored password in plain, readable form.

---

## 9. Content, Theme & Homepage Management

- FR-9.1 Owner/authorized staff manage homepage sections (hero banners, featured products/categories, promo blocks) via add/edit/hide/reorder — no code changes. **[Confirmed]**
- FR-9.2 Theme settings (colors, fonts, buttons, spacing) use a controlled design-token set, not arbitrary CSS. **[Confirmed]**
- FR-9.3 Color input is validated; the system warns on poor text/background contrast and blocks publishing clearly unreadable combinations where technically feasible. **[Recommended]**
- FR-9.4 Homepage/theme changes have a Preview step before Publish, and the last published version can be restored. **[Confirmed]**
- FR-9.5 Policy/informational pages (About, Contact, FAQ, Privacy, Terms, Shipping, Return/Refund Policy) are editable without code, with draft/preview/publish/unpublish states. **[Confirmed]**
- FR-9.6 Publishing content/banner changes with a missing/unpublished link target is blocked with a warning, not silently published broken. **[Recommended]**
- FR-9.7 Content/theme changes never alter historical order, stock, payment, or return/refund records. **[Confirmed]**

**Acceptance criteria**
- AC-9.1 Publishing a homepage banner linked to a now-deleted product is blocked until the link is fixed or removed.
- AC-9.2 Rolling back a theme change restores the previous published appearance without affecting product/order/return data.

---

## 10. Bangla/English Localization

### 10.1 Language Switch **[Confirmed]**
- FR-10.1.1 A visible switch (e.g., `English | বাংলা`) is present in the storefront header and in a consistent Admin location.
- FR-10.1.2 Switching language keeps the user on the same page/state: current product, cart, selected variant, checkout inputs (storefront) and current screen/unsaved-safe state (Admin).
- FR-10.1.3 Identifiers — SKU, order ID, phone numbers, prices — are never translated or mutated; only their surrounding labels are. **[Confirmed]**

### 10.2 Default & Preference **[Confirmed]**
- FR-10.2.1 Default language for first-time storefront visitors is English. The Bangla switch is immediately visible and the preference can be changed at any time; this may be revisited later based on usage data.
- FR-10.2.2 Guest language preference is remembered via a browser-level mechanism; a registered account syncs it to the customer profile.
- FR-10.2.3 Admin users have a separately stored language preference from the storefront preference.
- FR-10.2.4 If a saved preference can't be read, the system falls back to the default (English) and the switch stays functional.

### 10.3 Translation Coverage **[Recommended, partly Open]**
- FR-10.3.1 All core interface text (nav, buttons, forms, validation, statuses, empty states, dialogs, checkout, tracking, Admin actions) exists in both languages. **[Confirmed]**
- FR-10.3.2 Admin-managed bilingual content (product names/descriptions, categories, banners, menus, FAQ, policies incl. Return/Refund Policy, landing pages) has separate Bangla/English fields. **[Confirmed]**
- FR-10.3.3 Where practical, an admin-configurable automatic translation service/API can draft a translation for review; the system does **not** assume such a service is already configured — until one is set up and verified, drafting falls back to manual entry only. **[Recommended]**
- FR-10.3.4 The original source content is always preserved; an authorized user can review or edit any machine-drafted translation before it is published — no silent auto-publish of machine translation. **[Confirmed]**
- FR-10.3.5 A failed or incomplete translation (manual or automatic) is flagged to an authorized admin, never silently treated as complete. **[Confirmed]**
- FR-10.3.6 Checkout, legal, payment and Return/Refund Policy content is never published with a missing or failed required translation — publishing is blocked until it is resolved for that critical content; other, non-critical content may fall back to the source language with a visible warning. **[Recommended; Section 19 Open Q#7]**

### 10.4 Visual Stability **[Confirmed]**
- FR-10.4.1 Switching language causes no layout break: no overlapping text, clipped content, distorted buttons, broken cards, or unusable forms/tables.
- FR-10.4.2 Fonts support reliable Bangla + Latin rendering with fallbacks (e.g., Noto Sans Bengali / Hind Siliguri + Latin fallback — to be validated, not locked).
- FR-10.4.3 Components tolerate variable text length (flexible width/wrapping) for both languages, tested at mobile/tablet/desktop breakpoints.
- FR-10.4.4 Where feasible, the Admin warns about likely layout overflow or missing translated content before a page is published. **[Recommended]**

**Acceptance criteria**
- AC-10.1 Switching from English to Bangla mid-checkout preserves cart contents and all entered checkout fields.
- AC-10.2 A product published with only an English description shows a clear Admin warning before go-live; it cannot be published as a "complete" listing.
- AC-10.3 The longest realistic Bangla product title does not clip or overflow its card on a 360px-wide mobile viewport.
- AC-10.4 If the automatic translation service fails or is unavailable, the original content is preserved unchanged and an admin is notified — nothing is silently blanked or mistranslated.

---

## 11. Bangladesh-Specific Business Rules

- FR-11.1 Prices and financial reports use BDT (৳). **[Confirmed]**
- FR-11.2 Address structure: 4-tier administrative hierarchy: **Division** (8 administrative divisions: Dhaka, Chattogram, Rajshahi, Khulna, Barishal, Sylhet, Rangpur, Mymensingh) → **District** (64 zillas) → **Upazila/Thana** → **Area / Street Address**. Capturing Division ensures unambiguous courier API integration (essential for Pathao city_id/zone mapping) as well as Steadfast and RedX. **[Confirmed]**
- FR-11.3 Delivery zones at minimum separate **Inside Dhaka** and **Outside Dhaka**, each with an independently configurable charge; finer zone detail and weight-based rules can be added later if the business needs them. Final exact rates remain **[Open — Section 19 Q#2]**; the two-zone structure itself is **[Confirmed]**.
- FR-11.4 VAT settings are admin-configurable (enable/disable, rate, display rules); the system does not assume VAT applies until the business's actual VAT registration/obligation is confirmed (Section 19, Open Q#8). **[Confirmed structure, value Open]**
- FR-11.5 A basic order invoice/summary (order number, items, discounts, delivery charge, total) is always available; VAT lines appear only once FR-11.4 is confirmed. **[Confirmed]**

### 11.6 SMS Notifications **[Confirmed — required in Phase 1; gateway choice Open]**
SMS notifications are a **Phase 1 requirement**, not deferred.

- FR-11.6.1 Admin provides configurable SMS gateway settings (provider, sender ID, API credentials), supported message templates, a delivery log, and manual resend controls. **[Confirmed]**
- FR-11.6.2 SMS is sent for, at minimum: order placed/confirmed, order shipped, order delivered or delivery exception, important payment updates, and return/refund request updates with manually recorded outcomes where applicable. **[Confirmed]**
- FR-11.6.3 An SMS sending failure never silently cancels an order or corrupts its order/payment/return status — it is logged with a safe retry or manual resend option. **[Confirmed]**
- FR-11.6.4 Duplicate SMS for the same event are prevented where practical (consistent with the general duplicate-processing rule, FR-6.2.5). **[Confirmed]**
- FR-11.6.5 SMS integration is never claimed as operational in Admin or to customers until a gateway is actually configured and tested. **[Confirmed]**
- FR-11.6.6 The specific SMS gateway provider, cost, sender ID, and expected volume are **[Open — Section 19 Q#9]**; the requirement for SMS capability itself in Phase 1 is **[Confirmed]**.

### 11.7 Invoices & Templates **[Confirmed structure; legal specifics Open]**
- FR-11.7.1 The system generates a printable invoice for each applicable order, built from the order-time snapshot (FR-6.4.1). **[Confirmed]**
- FR-11.7.2 Authorized admins can edit invoice templates and upload supported template assets/files, subject to file-type/size/security validation (Section 5.1.6) and access restriction to authorized roles. **[Confirmed]**
- FR-11.7.3 Changing VAT settings or invoice templates never retroactively alters historical order totals or previously recorded financial facts — each invoice reflects the snapshot from its own order time. **[Confirmed]**
- FR-11.7.4 Any legal or tax rule requiring business/accountant verification (VAT obligation, mandatory invoice fields, consumer-protection disclosures) is explicitly flagged in Admin rather than assumed or invented. **[Confirmed; Section 19 Open Q#8, Q#12]**

---

## 12. Security, Privacy & Reliability **[Confirmed basis; some defaults Recommended]**

- FR-12.1 Secure authentication, server-side validation on every state-changing action, role-appropriate permissions, safe handling of personal data.
- FR-12.2 Audit history for price/stock changes, return/refund decisions and processing, refunds, role/permission changes, order/payment/shipment status changes, theme and content publishing — who, what, when, and (where applicable) why.
- FR-12.3 Integration secrets (payment, courier, SMS, translation service, Meta) stored encrypted at rest; never shown in full after initial save.
- FR-12.4 Payment/courier webhook signatures verified where the provider supports it; duplicate events handled safely (FR-6.2.5, FR-7.3.5).
- FR-12.5 Rate limiting on login, OTP (if later added) and other abuse-prone endpoints.
- FR-12.6 Backups with a tested, documented recovery procedure before launch; restore capability is verified, not assumed, as part of launch readiness. **[Confirmed]**
- FR-12.7 Integration failures (payment/courier/SMS/translation/Meta) are surfaced to authorized staff, with a manual fallback path for critical order and delivery work.

### 12.8 Privacy & Data Retention **[Confirmed structure; legal specifics Open]**
- FR-12.8.1 The system collects only the customer and staff data actually necessary for business operations. **[Confirmed]**
- FR-12.8.2 Role-based access applies to customer data, payment information, staff accounts and financial/return records — restated and enforced consistently with Section 8.2. **[Confirmed]**
- FR-12.8.3 Credentials, passwords, API secrets and sensitive payment data are never written to application logs in readable form. **[Confirmed]**
- FR-12.8.4 Retention rules for order, payment, return/refund, invoice and audit records are configurable or explicitly documented. **[Recommended]**
- FR-12.8.5 Financial, order, invoice and audit records are never automatically deleted without considering operational and legal (incl. tax) requirements — deletion, where it exists at all, is a deliberate, permission-gated, logged action. **[Confirmed]**
- FR-12.8.6 Applicable Bangladesh privacy, consumer-protection, tax, and data-retention obligations for this business are flagged for owner/legal verification — this PRD does not invent legal conclusions on their behalf (Section 19 Open Q#12). **[Confirmed]**
- FR-12.8.7 Sensitive admin/staff actions (return/refund decisions, role changes, credential changes, data exports, record deletions) are recorded in the audit log (restates FR-12.2, FR-6.7.8). **[Confirmed]**

**Acceptance criteria**
- AC-12.1 A staff price change is visible in the audit log with user, old value, new value, timestamp.
- AC-12.2 Simulated courier API outage does not block order placement or shipment booking (manual fallback works).
- AC-12.3 A restore-from-backup drill successfully recovers a known test dataset before go-live sign-off.
- AC-12.4 Searching application logs for a known API secret or password value returns no match.

---

## 13. Performance, Accessibility, SEO

### 13.1 Performance **[Recommended]**
- FR-13.1.1 Storefront pages (PDP, category, landing page) target a mobile Largest Contentful Paint under ~2.5s on a typical 4G connection, with images responsive/lazy-loaded.
- FR-13.1.2 Admin list/table views (orders, products, returns) support pagination and remain responsive with realistic data volumes (thousands of orders/products).

### 13.2 Accessibility **[Recommended]**
- FR-13.2.1 Key customer flows (browse, PDP, cart, checkout, order tracking) meet basic WCAG 2.1 AA practices: sufficient color contrast, keyboard navigability, labeled form fields, visible focus states.
- FR-13.2.2 Theme contrast validation (FR-9.3) supports this requirement at the content-management level.

### 13.3 SEO **[Recommended]**
- FR-13.3.1 PDP, category and landing pages support editable title, meta description, canonical URL and structured data (product schema) where applicable.
- FR-13.3.2 Clean, human-readable URLs for products/categories/landing pages.
- FR-13.3.3 Sitemap and robots.txt are generated/maintained automatically as content is published/unpublished.

**Acceptance criteria**
- AC-13.1 A published PDP has a unique title tag and meta description, editable from Admin.
- AC-13.2 Unpublishing a landing page removes it from the sitemap.

---

## 14. Finance & Contribution Reporting **[Recommended; pending bookkeeping validation]**

> These are proposed reporting definitions, to be validated against the business's actual bookkeeping before being treated as official.

- FR-14.1 **Gross merchandise sales** = Σ(selling price × qty) before discounts, for delivered orders; pending/unconfirmed orders are shown separately as pipeline. Cancelled/failed-delivery/RTO orders are excluded from delivered sales, but incurred costs are still recorded.
- FR-14.2 **Net merchandise sales** = gross sales − discounts − completed (manually verified) refunds/credits.
- FR-14.3 **Order contribution before advertising** = net sales + delivery charge collected − product cost (COGS) − packaging/fulfillment cost − actual courier cost − payment fees − return/RTO costs.
- FR-14.4 **Contribution profit after advertising** = contribution before advertising − allocated ad spend for the period/campaign.
- FR-14.5 **"Net Profit" is never shown** unless overhead, payroll, rent, tax and other required costs are included and validated. Otherwise reports are labeled "Contribution Profit" or "Estimated Contribution Profit."
- FR-14.6 Any report with a missing cost input is visibly flagged as estimated, naming which cost is missing.
- FR-14.7 Ad spend is recorded manually against campaign + date range at launch; allocation across orders uses net merchandise value and is labeled an estimate, not causation. **[Open — Section 19 Q#10]**
- FR-14.8 Store-recorded sales are always shown separately from Meta-reported attribution/ROAS — never merged into one figure (restates FR-5.3.5).
- FR-14.9 The customer-paid **delivery charge collected** and the **courier cost charged to the business** are tracked as **separate, independently labeled figures** in financial records and reports — never collapsed into a single “delivery” line. This distinction is essential for COD settlement reconciliation, where the courier remits collected delivery charges separately from the business’s courier costs. **[Confirmed — per IP v4 Section 13.2]**

**Acceptance criteria**
- AC-14.1 A report missing courier-cost data displays "Estimated Contribution Profit" with a note identifying the missing input, not a blank or misleading "Net Profit" label.
- AC-14.2 A cancelled, undelivered order does not appear in delivered-sales totals, but a courier fee already paid on it still appears in cost totals.

---

## 15. Essential vs. Optional (Phase 1 vs. Later)

### Phase 1 — Essential (launch-blocking) **[Confirmed]**
- Auth + role-based Admin access control; staff account creation with initial password and forced change at first login
- Catalog: categories, attributes, variants, inventory
- Bangla/English support (switch, core translations, stable layout)
- Shared cart, Buy Now (cart-preserving), guest checkout, order review, confirmation
- COD, bKash, Nagad (direct Merchant API direction) + Admin payment method management — actual provider credentials are a post-build setup dependency
- Automatic website order creation + manual Admin order entry
- Campaign landing-page builder (Mode B direct checkout minimum), shared catalog/cart/order
- Delivery: Inside Dhaka / Outside Dhaka configurable charges, 3-field order/payment/shipment status + independent return/refund status
- Server-side price/stock validation, duplicate-order and duplicate-payment prevention
- **Configurable, manual-only Return & Refund Management** (Section 6.7)
- **SMS notification infrastructure** — Admin configuration UI, message templates, delivery log, manual resend controls — built and configurable at launch (Section 11.6). Actual SMS delivery is operational only after a gateway provider is selected and tested (Section 19 Q#9). Launch is not blocked by unresolved gateway selection.
- Printable invoices with order-time financial snapshot (Section 11.7)
- Storefront theme + homepage/content management with preview/publish/rollback
- Security baseline: audit logs, secret handling (never logged), backups with tested restore, login lockout policy

### Phase 2 — Post-launch enhancements **[Recommended]**
- Advanced theme/page customization beyond initial templates
- Expanded campaign reporting, improved attribution/cost allocation
- Meta Conversions API (after privacy/consent review)
- Meta Marketing API ad-spend sync — once Meta credentials and access are available and after validating it saves meaningful manual entry work (FR-5.3.4). **[Recommended]**
- Additional couriers/payment providers, ad-spend APIs, social-message automation — only once verified and justified
- [Future consideration — requires explicit owner approval before design or build begins] Staff-triggered payment-provider API execution for manually authorized refunds: not approved for this roadmap. The rule that refunds are never automatically approved, initiated, executed, or marked completed (FR-6.7.5, Section 2.2) stands in all phases until explicitly overridden by the owner.

### Phase 3 — Reporting/operational maturity **[Recommended]**
- Expanded expense capture, COD settlement reconciliation, RTO cost tracking, contribution-profit reporting depth
- Campaign-performance reporting improvements

---

## 16. Cross-Cutting Acceptance Criteria (Summary)

| ID | Criterion |
|---|---|
| AC-G1 | Product, price and stock shown on category pages, PDP, campaign pages and checkout always match the same underlying record — never a cached/duplicated copy. |
| AC-G2 | No customer flow (Add to Cart, Buy Now, campaign checkout) ever silently empties an existing cart. |
| AC-G3 | Every order-placing request is validated server-side for price, stock and variant availability, regardless of entry point. |
| AC-G4 | Switching language never discards in-progress cart/checkout/admin-form state. |
| AC-G5 | No financial report labels an incomplete figure as final "Net Profit." |
| AC-G6 | Disabling any payment method or courier never corrupts or alters historical order/payment records. |
| AC-G7 | No return or refund request is ever approved, initiated, or marked completed without an explicit, permission-checked, logged staff action. |
| AC-G8 | No webhook, callback, or duplicate request (payment, SMS, courier, order submission) is ever processed more than once. |

---

## 17. Edge Cases Requiring Explicit Handling

### Cart, Product & Stock
- A product becomes out of stock before checkout → block purchase of that line with a clear message; preserve other valid cart lines (FR-4.3.6, AC-4.4).
- The price changes after a product enters the cart → show the updated price and require the customer to acknowledge it before proceeding (FR-4.3.6, AC-4.5).
- Clicking Buy Now for a product/variant already in the cart → no duplicate line, no silent quantity increment; existing quantity preserved and editable (FR-4.3.3, AC-4.1).
- Two Buy Now clicks in quick succession on the same variant → no duplicate line, no duplicate order (FR-4.3.3, FR-4.3.7).
- Concurrent checkouts for the last unit of a variant → exactly one succeeds via atomic server-side stock validation (FR-6.3.2, AC-6.1).
- Repeated/duplicate order submissions (double-tap, refresh, slow network) → exactly one order is created (FR-4.3.7, AC-4.3).

### Campaigns & Translation
- Expired, unpublished, or sold-out campaign offer at checkout → blocked, never honored at a stale promotional price (FR-5.2.5).
- Campaign purchases → always use the same underlying product, inventory, order and payment records as normal storefront purchases, never a parallel record (FR-5.2.3).
- Automatic or manual translation fails → original content is preserved and the failure is visibly flagged to an authorized admin, never silently treated as complete (FR-10.3.5, AC-10.4).
- Where feasible, Admin warns about likely layout overflow or missing translated content before publishing (FR-10.4.4).

### Payments, Orders & SMS
- A payment method with incomplete/unverified credentials → never represented as operational; disabled in Admin and hidden/blocked at checkout (FR-7.3.3, AC-7.4).
- Duplicate payment callbacks/webhooks → never create duplicate payments, orders, or fulfillment actions (FR-7.3.5, AC-7.2).
- A payment screenshot or browser redirect alone → never establishes that an online payment succeeded; only verified server-side/provider confirmation does (FR-7.3.4, AC-7.5).
- SMS gateway failure → never corrupts order/payment/return status; logged with a safe retry/manual resend option (FR-11.6.3).
- Duplicate SMS for the same event → prevented where practical (FR-11.6.4).

### Courier, Returns & Refunds
- Courier API is unavailable → authorized staff use the documented manual fallback; order operations are not blocked (FR-7.4.4, AC-7.3).
- Delivery charge calculation → always uses the configured Inside/Outside Dhaka (or finer) zone rate and shows it before order confirmation (FR-7.4.3, AC-7.6).
- A return/refund request → remains "Pending Manual Review" until a staff member or admin reviews it; never auto-approved regardless of elapsed time (FR-6.7.4, AC-6.5).
- No refund → is ever automatically initiated or marked completed by a webhook, courier update, or order-status transition (FR-6.7.5, AC-6.6).
- A staff user without the specific return/refund permission → cannot approve, reject, or mark a request as processed, even via direct URL/API access (FR-6.7.7, AC-6.7).
- A rejected return/refund request → retains the decision, reason, responsible user and timestamp (FR-6.7.13).
- A damaged or unreviewed returned product → is never automatically marked saleable stock; requires staff condition review first (FR-6.7.14, AC-6.3).
- The business has not yet configured a required return/refund policy field → Admin clearly shows "not yet configured"; the system never invents a policy value on its own (FR-6.7.3).
- A shipped order that is cancelled or fails delivery → routed through the staff-managed RTO/cancellation workflow, never a silent stock/payment change (FR-7.4.5, FR-6.7.15, AC-6.4).

### Security, VAT, Analytics & Storage
- Login lockout policy (5 failed attempts / 15 minutes, or an equivalent/stronger mechanism) is applied and all related events are logged (FR-8.2.7, FR-8.2.8, AC-8.3).
- Sensitive financial, policy, return/refund and permission actions → enforced on the backend for every role, not just hidden in the UI (FR-8.2.3, AC-8.1, AC-8.2).
- A VAT setting or product price change → never rewrites a historical order's recorded financial snapshot (FR-6.4.1, FR-11.7.3, AC-6.2).
- An invoice-template change → never retroactively alters a previously recorded order's totals (FR-11.7.3).
- A failed Meta data synchronization → shows the last successful sync time and an error/status indicator, never silently displays missing spend data as zero (FR-5.3.6).
- An upload or storage-limit failure (landing page media, product image, invoice template asset) → preserves existing, already-published content untouched (FR-5.1.7, FR-5.1.8, AC-5.3).
- Backup and restore capability → is verified through an actual test restore as part of launch readiness, not merely assumed configured (FR-12.6, AC-12.3).

---

## 18. Out-of-Scope Reminders (do not implement)

- No vendor dashboard, vendor registration/approval, vendor commission or vendor payout — at any phase referenced in this PRD.
- No card payment processing or payment aggregators (e.g., SSLCommerz, Shurjopay, Foster) in Phase 1. Direct bKash & Nagad Merchant APIs and COD only.
- No unrestricted CSS/design editor (unrestricted `custom_css` is prohibited to prevent stored XSS; theme tokens and sanitized CSS only).
- No automatic return/refund approval or automatic refund execution of any kind, in any phase, under any trigger (webhook, status change, elapsed time).
- No assumption that bKash/Nagad Merchant API credentials, courier API access, SMS gateway, translation service, or Meta Marketing API/CAPI access already exist — each is a configuration dependency until actually set up and tested.
- No automatic creation of orders from personal/social messages without a verified, approved integration.
- Meta Conversions API (CAPI) is not a Phase 1 requirement (client-side Meta Pixel is used for Phase 1 launch).

---

## 19. Unresolved Questions Register (Cross-Referenced to Owner Decisions O-01 to O-15)

These are **not resolved by this PRD** and must be decided by the owner (with technical/provider verification where noted) before the related feature is finalized for build. Items resolved or narrowed in v2 are marked accordingly. In `cross-document-verification.md` and `database.md` §10, these are tracked as **O-01 through O-15**.

| # | Question | Decision ID | Why it matters | Current PRD Position & Recommended Baseline |
|---|---|---|---|---|
| 1 | bKash/Nagad: merchant approval timeline, final credential set, settlement/refund-API support? | **O-10** | Needed to complete the already-chosen direct Merchant API integration | **Narrowed in v2:** connection mode (direct Merchant API) is now [Confirmed]; merchant approval/credentials remain an [Open] setup dependency. Refunds in Phase 1 disbursed via original MFS/Bank methods. |
| 2 | Which courier(s), real API support for booking/tracking/COD/RTO, and exact Inside/Outside Dhaka (and any finer-zone) rates? | **O-11** | Determines automation level and delivery cost accuracy | **Narrowed in v2:** two-zone structure (Inside/Outside Dhaka) is [Confirmed]; primary courier selection (Steadfast recommended first with manual fallback) and exact rates remain [Open — Phase 0 Launch Gate]. |
| 3 | Final order/payment/shipment/return status names and allowed transitions, and their stock/notification/finance effects per transition | — | Core to Orders and Returns module build | Reconciled across Architecture, DFD, and Canonical Database with 4 independent status dimensions: Order, Payment, Shipment, and Return/Refund. |
| 4 | Return window, return conditions, non-returnable categories, who pays return shipping, refund method(s) | **O-01** | Needed to set actual values in the now-built configurable Return & Refund system | Admin-configurable structure is [Confirmed]; values themselves are [Open — Phase 0 Launch Gate]. **Recommended Baseline:** 7-day return window, customer pays return shipping unless defective, manual review only. |
| 5 | Should a separate "campaign-only" checkout (excluding regular cart) ever be offered? | — | Would require a deliberate, clearly distinct flow if added | Not built in Phase 1; shared cart/order approach stands [Confirmed] (FR-5.2.6, Journeys 4–6). |
| 6 | Final staff roles/permissions matrix for the actual team; mandatory 2FA scope | **O-12** | Matches access control to real operations | [Open — Phase 0 Launch Gate]. Role-based matrix (Owner, Manager, Call Center, Dispatch, Finance) with threshold restrictions (FR-8.2). |
| 7 | Must all customer-facing content be translated before publishing, or is a temporary single-language fallback acceptable for non-critical content? | — | Avoids blank/confusing bilingual content | Block only for checkout/policy/legal-critical content [Recommended] (FR-10.3.6). |
| 8 | VAT registration status and legal invoice requirements for this business | **O-02** | Avoids incorrect tax/compliance claims | [Open — Phase 0 Launch Gate]. **Recommended Baseline:** VAT disabled, 0% rate, unverified BIN, no VAT line on invoices until accountant sign-off. |
| 9 | Which SMS gateway, sender ID, cost, and expected volume? | — | Affects notification budget and build scope | **Changed in v2:** SMS capability itself is now [Confirmed] / required in Phase 1; gateway selection remains [Open] (Section 11.6.6). |
| 10 | Ad-spend allocation method approval (by attributed delivered order value, manual entry) | — | Needed before "Contribution Profit after advertising" is shown as more than a rough estimate | Default allocation method proposed (FR-14.7), labeled as estimate until confirmed. |
| 11 | Actual hosting/storage/provider limits for landing pages and media | — | Prevents unbounded resource promises; needed to set real warning thresholds | Not set; to be based on actual hosting plan (FR-5.1.4–5.1.5). |
| 12 | Applicable Bangladesh privacy, consumer-protection, tax and data-retention obligations for this business | **O-05** | Needed before any compliance claim is made | [Open — Phase 0 Launch Gate]. **Recommended Baseline:** 90d webhooks, 180d SMS logs, 24m customer risk, 6y financial/audit logs. |
| 13 | Meta Conversions API (CAPI) feasibility given consent/privacy requirements | **O-08** | Determines if/when Phase 2 adds server-side tracking | [Open]. **Recommended Baseline:** Client-side Meta Pixel only for Phase 1 launch; CAPI deferred to Phase 2 (FR-5.3.7). |
| 14 | Translation service/API provider selection, cost, and language-pair quality for Bangla ↔ English | — | Needed before automatic-translation drafting (FR-10.3.3) can be enabled | Not selected; manual translation entry is the Phase 1 baseline. |
| 15 | Does the chosen authentication provider already offer login lockout/abuse protection equivalent to or stronger than 5-attempts/15-minutes? | — | Determines whether FR-8.2.7's specific default is built or an existing equivalent is used instead | Default 5 attempts / 15 minutes lockout enforced via Redis. |
| 16 | Invoice template upload restrictions (allowed file types/sizes, who may upload) beyond the general upload-validation baseline | — | Needed to finalize FR-11.7.2 security rules | General validation rule stated (Section 5.1.6); SVG scripts prohibited. |
| 17 | Meta Marketing API access/credentials and reporting cadence | — | Needed to complete FR-5.3.4 ad-spend sync | Not yet available; manual ad-spend entry supported in Phase 1. |
| 18 | COD stock reservation expiry policy (e.g., 24h/48h auto-escalate/auto-cancel vs manual staff cancellation only) | **O-03** | Determines whether unconfirmed COD orders lock inventory indefinitely and whether scheduled expiry cron/workflow runs | [Open — Phase 0 Launch Gate]. **Recommended Baseline:** 48-hour expiration window; 3 call attempts before transition to `escalated`; cron process active. |

**Rule for all Open items above:** none may be silently decided during implementation. Each requires explicit owner sign-off (and, where marked, provider/technical verification) before the corresponding feature is built as final. Phase 0 Launch Gates (O-01, O-02, O-03, O-05, O-11, O-12) must be signed off prior to public store launch.
