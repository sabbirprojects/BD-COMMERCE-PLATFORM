# User Journeys — Bangladesh Single-Vendor E-Commerce Platform

**Based on:** approved `ideaproposition.md` (v4) and `prd.md` (v2)
**Date:** 2026-10-23
**Status:** Draft v1 — for owner review. No code has been written or modified.

---

## Document Conventions

| Tag | Meaning |
|---|---|
| **[Native Medusa]** | Feature already present in stock Medusa v2 Admin; prefer it over rebuilding. |
| **[Custom]** | Does not exist in stock Medusa Admin; must be built or extended. |
| **[Unclear — decide before build]** | A decision must be made by the owner or confirmed technically before this journey can be implemented. |
| **[Confirmed]** / **[Recommended]** / **[Open]** | Inherited directly from `prd.md` v2. |

---

## Admin UX Research Disclaimer

**What was actually accessed:**

- `https://demo.medusajs.com/app/orders` was fetched via HTTP. It returned only an empty HTML shell (`<div id="medusa"></div>`). The Medusa Admin demo is a JavaScript Single-Page Application; rendered content is not accessible without a live, JavaScript-executing browser. No rendered screen was inspected.
- `https://docs.medusajs.com/user-guide/orders/manage` was fetched. The page title **"Manage Order Details in Medusa Admin"** was confirmed from the HTML `<title>` tag. The page preloads several screenshot images from Cloudinary, but their content is not text-readable via HTTP. The doc sidebar shows top-level links for "Introduction" and "Reset Password." Additional sidebar navigation loaded dynamically and was not accessible via HTTP.
- The current Medusa release confirmed in the documentation: **v2.22.1**.
- Browser automation (Playwright) was unavailable in this environment — a Playwright driver download error (HTTP 404 from Azure CDN) prevented the browser subagent from launching.

**What admin journey descriptions are based on:**

All admin journey descriptions in this document are derived from the official Medusa v2 public documentation, the Medusa v2 API reference, and publicly described Medusa v2 Admin behavior. No live screen was fabricated or assumed. Where a specific Admin behavior could not be verified from documentation, it is flagged as **[Unclear — verify during implementation]**.

---

## Table of Contents

1. [Customer — Browsing and Product Discovery](#1-customer--browsing-and-product-discovery)
2. [Customer — Product Detail Page and Variant Selection](#2-customer--product-detail-page-and-variant-selection)
3. [Customer — Add to Cart](#3-customer--add-to-cart)
4. [Customer — Buy Now (empty cart)](#4-customer--buy-now-empty-cart)
5. [Customer — Buy Now (cart already contains other items)](#5-customer--buy-now-cart-already-contains-other-items)
6. [Customer — Buy Now (same variant already in cart)](#6-customer--buy-now-same-variant-already-in-cart)
7. [Customer — Cart Review and Checkout](#7-customer--cart-review-and-checkout)
8. [Customer — Payment: COD](#8-customer--payment-cod)
9. [Customer — Payment: bKash / Nagad](#9-customer--payment-bkash--nagad)
10. [Customer — Order Confirmation and Tracking](#10-customer--order-confirmation-and-tracking)
11. [Campaign — Landing Page and Mode A Checkout (Product-First)](#11-campaign--landing-page-and-mode-a-checkout-product-first)
12. [Campaign — Landing Page and Mode B Checkout (Direct)](#12-campaign--landing-page-and-mode-b-checkout-direct)
13. [Admin — Product Creation](#13-admin--product-creation)
14. [Admin — Product Editing, Variants, Pricing, Images, Categories, Inventory](#14-admin--product-editing-variants-pricing-images-categories-inventory)
15. [Admin — Order List](#15-admin--order-list)
16. [Admin — Order Detail, Payment Status, Fulfillment](#16-admin--order-detail-payment-status-fulfillment)
17. [Admin — Order Cancellation and RTO](#17-admin--order-cancellation-and-rto)
18. [Admin — Returns and Refunds](#18-admin--returns-and-refunds)
19. [Admin — Store Settings](#19-admin--store-settings)
20. [Admin — Staff Accounts and Permissions](#20-admin--staff-accounts-and-permissions)
21. [Admin — Customer Management](#21-admin--customer-management)
22. [Admin — Delivery Zones and Courier Settings](#22-admin--delivery-zones-and-courier-settings)
23. [Admin — Reporting](#23-admin--reporting)
24. [Admin — Meta Tracking and Campaign Attribution](#24-admin--meta-tracking-and-campaign-attribution)
25. [Admin — Manual Order Creation](#25-admin--manual-order-creation)
26. [Language Switch (Storefront and Admin)](#26-language-switch-storefront-and-admin)
- [Appendix A — Unresolved Decisions](#appendix-a--unresolved-decisions-that-affect-journey-implementation)
- [Appendix B — Native Medusa vs. Custom Feature Summary](#appendix-b--native-medusa-vs-custom-feature-summary)

---

## 1. Customer — Browsing and Product Discovery

**Entry points:** Homepage, category page, search results, direct URL, campaign landing page (Modes A and B).

### Steps

1. **Homepage load** — Customer arrives on the storefront. Default language is English; a visible `English | বাংলা` toggle is present in the header. **[Custom]**
2. **Hero banners / featured sections** — Customer sees hero banners, featured categories, and promotional blocks. Each section is configured from the Admin Content & Storefront module. Clicking a banner navigates to the linked category, product, or campaign page.
3. **Category navigation** — Customer clicks a category in the header menu or a homepage section. The category listing page loads.
4. **Product listing** — A paginated or infinite-scroll list of product cards: thumbnail, name, price (lowest variant price or starting price), and an out-of-stock indicator where applicable. Out-of-stock products are shown but visually distinguished.
5. **Filtering and sorting** — A filter panel or sidebar shows only filters relevant to that category (e.g., Size and Colour for Fashion; Brand and Warranty for Electronics). Filters show only values that exist among the currently listed products — no dead options. Sort controls: Newest, Price low–high, Price high–low, Popularity. **[Custom — category-specific filter rendering]**
6. **Search** — Customer types in the search bar. Results match product title, SKU, category, and tags. The results page offers the same filtering and sorting.
7. **Out-of-stock products** — Shown in listings with a clear badge ("Out of stock"). Customers can view the detail page but cannot purchase.

### Expected Screen Behavior

- Banner links pointing to an unpublished product, deleted category, or expired campaign do not show a blank broken page. A graceful redirect or informative page is shown instead. **[Custom — Admin publishes validated links; see Journey 19.]**
- Applying a filter that results in zero products shows a clear empty-state message and a "Reset filters" option.
- Switching language on a listing page keeps the category, applied filters, and scroll position — the page is not reloaded or reset. **[Confirmed — FR-10.1.2]**

### Errors

| Scenario | Customer-visible message |
|---|---|
| Category page fails to load | "Something went wrong. Please try again." with a Retry button. |
| Search service unavailable | "Search is temporarily unavailable. Please browse by category." |
| Banner links to a deleted or unavailable product | Graceful redirect to homepage or category; exact behavior **[Unclear — decide before build].** |

### Recovery Paths

- Network error on category load → Retry button.
- Zero filter results → "Reset filters" link clears all active filters.

### Acceptance Criteria

- AC-1.1 Category listing shows only filters relevant to that category (e.g., Size/Colour for Fashion; never for Grocery).
- AC-1.2 Out-of-stock products appear with a visible indicator; Add to Cart / Buy Now is disabled for them from the listing.
- AC-1.3 Switching language on a category page does not reset active filters or pagination.
- AC-1.4 Search results match product title, SKU, category, or tags.

---

## 2. Customer — Product Detail Page and Variant Selection

**Entry points:** Listing card click, search result, direct URL, campaign landing page (Mode A).

### Steps

1. **PDP load** — Product title, image gallery, price for the default/first available variant, description, and category-specific attribute fields (e.g., size guide for Fashion; spec sheet for Electronics) are displayed. **[Custom — category-specific field rendering]**
2. **Variant selector** — Customer selects variant options (e.g., Size, Colour) using buttons or dropdowns. Only option types configured for the product's category are shown. **[Custom]**
3. **Live update on variant selection:**
   - Price updates to the selected variant's price.
   - Gallery updates to the variant's image (if one exists).
   - Stock state updates: out-of-stock variant shows "Out of stock" and disables purchase buttons.
   - Delivery charge estimate for the default zone (Inside/Outside Dhaka) is displayed. **[Unclear — decide before build: whether zone is auto-detected, always defaults to one zone, or always shown as a range until the customer enters their address.]**
4. **Add to Cart button** — Enabled only when a valid, in-stock variant is selected.
5. **Buy Now button** — Enabled only when a valid, in-stock variant is selected.
6. **Price and charge transparency** — Before clicking either button, the customer sees: selected variant price, estimated delivery charge, and any applicable discount. **[Confirmed — FR-4.2.1]**
7. **Language toggle on PDP** — Interface labels, button text, and admin-entered Bangla content switch. SKU, price numerals, and reference identifiers are never changed. **[Confirmed — FR-10.1.3]**

### Expected Screen Behavior

- Selecting an out-of-stock variant disables purchase buttons and shows "Out of stock" — the variant remains selectable for price/description viewing.
- If a partial variant selection (e.g., Size selected but all Colours for that Size are out of stock) results in no purchasable option, a visible explanation is shown — buttons are not silently disabled without reason.
- Images load progressively with a placeholder shown while loading.

### Errors

| Scenario | Customer-visible message |
|---|---|
| PDP fails to load variant data | "Unable to load product details. Please refresh the page." |
| Selected variant goes out of stock while customer is on PDP | On Add-to-Cart attempt: "This variant is now out of stock." |
| Product is unpublished while customer is viewing it | On Add-to-Cart attempt: "This product is no longer available." |

### Recovery Paths

- Variant out-of-stock race condition → show updated state; suggest alternative variants if feasible.
- Network error → retry/refresh prompt.

### Acceptance Criteria

- AC-2.1 Variant selector renders only option types configured for the product's category.
- AC-2.2 Selecting a variant updates price, image, and stock state without a full page reload.
- AC-2.3 An out-of-stock variant is viewable but Add to Cart / Buy Now is disabled.
- AC-2.4 Delivery charge estimate is visible before clicking Add to Cart or Buy Now.
- AC-2.5 SKU, price, and identifiers are never changed by the language toggle.

---

## 3. Customer — Add to Cart

**Preconditions:** Customer is on a PDP with a valid, in-stock variant selected.

### Steps

1. Customer taps **Add to Cart**.
2. System performs a client-side check against the last-loaded PDP data. The definitive server-side stock/price check runs at checkout — not at cart-add.
3. If the variant is not already in the cart → a new line is added at quantity 1 (or the selected PDP quantity if a quantity selector exists). **[Unclear — decide before build: whether the PDP has a quantity input or always adds 1.]**
4. If the same exact variant is already in the cart → its quantity is incremented. **[This is standard Add-to-Cart behavior; Buy Now has different rules — see Journey 6.]**
5. The cart icon badge in the header updates immediately.
6. A confirmation toast or mini-cart panel appears: "Added to cart — [View cart] [Continue shopping]." Customer is not forcibly redirected.
7. Guest cart contents are stored in browser storage. Registered-customer cart is account-persisted.

### Errors

| Scenario | Customer-visible message |
|---|---|
| Variant sold out before server confirmation (race condition) | "Sorry, this item just sold out." No line added. Cart badge corrects. |
| Network error | "Couldn't add to cart. Check your connection and try again." Retry option. |

### Acceptance Criteria

- AC-3.1 Add to Cart adds exactly one new line (or increments an existing line) without leaving the PDP.
- AC-3.2 Cart count badge updates immediately on success.
- AC-3.3 If the server rejects the add (race condition), the cart badge corrects and an error toast is shown.
- AC-3.4 Guest cart persists in browser storage; registered-customer cart persists in the account.

---

## 4. Customer — Buy Now (Empty Cart)

**Preconditions:** Cart is empty. Customer is on a PDP with a valid, in-stock variant selected.

### Steps

1. Customer taps **Buy Now**.
2. The selected variant (qty 1) is added to the cart.
3. Customer is taken directly to the **Order Review / Checkout** page — no intermediate cart page.
4. Checkout shows: one line item (the Buy Now product), delivery details form, payment method selection, and order total.
5. Customer completes checkout (see Journeys 7–9).

### Expected Screen Behavior

- Transition to checkout is immediate.
- If the customer abandons checkout and navigates back, the item remains in the cart. **[Confirmed — FR-4.3.8]**

### Acceptance Criteria

- AC-4.1 Buy Now on an empty cart adds one line and navigates directly to checkout.
- AC-4.2 Abandoning checkout after Buy Now leaves the item in the cart.

---

## 5. Customer — Buy Now (Cart Already Contains Other Items)

**Preconditions:** Cart contains Product X. Customer is on a PDP for a **different** Product Y and clicks Buy Now.

### Steps

1. Customer taps **Buy Now** on Product Y while Product X is in the cart.
2. Product Y is added to the **existing cart** — Product X is not removed or overwritten. **[Confirmed — FR-4.3.2]**
3. Customer is taken directly to the **Order Review / Checkout** page.
4. Checkout shows **both** Product X and Product Y as separate lines with quantities, prices, delivery charge, and order total.
5. Customer can edit quantity or remove any line before placing the order.
6. Customer completes checkout.

### Expected Screen Behavior

- No confirmation dialog is shown before adding. Buy Now simply adds to the existing cart and proceeds. (A separate "campaign-only cart" mode is NOT part of Phase 1. **[Confirmed — FR-5.2.6]**)
- If the customer arrived from a campaign landing page, the same rule applies: existing cart is preserved. **[Confirmed — FR-5.2.3]**

### Errors

| Scenario | Customer-visible message |
|---|---|
| Product X became out of stock while customer was browsing | Checkout shows Product X with "Out of stock — please remove or update." Customer can remove X and buy Y. |
| Product Y became out of stock between Buy Now click and server response | "This item is now out of stock." No line added; customer remains on PDP. |

### Recovery Paths

- An item in the combined checkout is out of stock → customer removes that line and proceeds with remaining items.
- Price changed on a cart item → checkout shows the new price and requires acknowledgment. **[Confirmed — FR-4.3.6]**

### Acceptance Criteria

- AC-5.1 Buy Now on Product Y with Product X in the cart produces a checkout with both Product X and Product Y; cart was never cleared. **[AC-G2]**
- AC-5.2 The combined checkout clearly shows all lines and the total.
- AC-5.3 Removing one line does not affect remaining lines.

---

## 6. Customer — Buy Now (Same Variant Already in Cart)

**Preconditions:** Cart contains Variant A × 2. Customer is on a PDP for the **same** Variant A and clicks Buy Now.

### Steps

1. Customer taps **Buy Now** on Variant A.
2. The system detects that the exact same variant (Variant A) is already in the cart.
3. **The existing quantity (× 2) is kept unchanged. No duplicate line is created. No silent quantity increment occurs.** **[Confirmed — FR-4.3.3]**
4. Customer is taken to the **Order Review / Checkout** page.
5. Checkout shows Variant A × 2, editable. A clear presentation makes it obvious this is the same item already in the cart.
6. Customer can adjust the quantity (e.g., change to × 3 or × 1) in the checkout review step before confirming.

### Errors

| Scenario | Customer-visible message |
|---|---|
| Customer sets quantity above available stock | "Only [N] units available." Quantity is capped at the available stock level. |

### Acceptance Criteria

- AC-6.1 Buy Now on Variant A when cart already has Variant A × 2 → checkout shows exactly one line, Variant A × 2, editable. **[AC-4.1 from PRD]**
- AC-6.2 No duplicate line is created.
- AC-6.3 Quantity is not silently incremented without the customer's action.

---

## 7. Customer — Cart Review and Checkout

**Entry points:** Cart page → Proceed to Checkout; or directly via Buy Now / Campaign direct checkout (Mode B).

### Steps

1. **Cart page** (for non-Buy-Now entry) — All lines shown: thumbnail, name, variant, unit price, quantity (editable), line total. Plus: order subtotal, delivery charge, coupon discount (if applied), and order total.
2. **Quantity edit** — Customer increments/decrements or enters a quantity. Setting quantity to 0 removes the line. **[Unclear — decide before build: exact UI gesture (minus button to 0, or a trash-icon remove button).]**
3. **Remove line** — A remove control removes a single line; all other lines are unaffected.
4. **Coupon / discount code** — Customer enters a code. The system validates and applies the discount. One coupon per order; no stacking unless a rule explicitly allows it. **[Confirmed — FR-6.5.1]**
5. **Proceed to Checkout** — If any item's price has changed or stock is insufficient, the system shows the updated state and requires acknowledgment before proceeding. **[Confirmed — FR-4.3.6]**
6. **Delivery details form** — Fields: full name, Bangladesh mobile number (validated: 01XXXXXXXXX format), division, district, upazila/thana, area, address line. Guest customers require no account. **[Confirmed — FR-4.4.1, FR-11.2]**
7. **Delivery zone and charge** — Based on the entered address, the Inside Dhaka or Outside Dhaka charge is applied. The charge is visible in the order total before submission. **[Confirmed — FR-7.4.3, AC-7.6]**
8. **Payment method selection** — Only enabled, properly configured methods are shown (COD, bKash, Nagad). A method with incomplete credentials is never shown as selectable. **[Confirmed — FR-7.3.3]**
9. **Order review summary** — All lines, quantities, prices, delivery charge, coupon discount, and grand total are shown before the "Place Order" button.
10. **Place Order** — Server validates: all variant availabilities, current prices, stock quantities, delivery charge, and payment method status. **[Confirmed — FR-4.3.5, AC-G3]**
11. **Idempotency** — Repeated taps, a refresh, or a slow connection cannot create more than one order. The server uses a client-generated idempotency token. **[Confirmed — FR-4.3.7, AC-4.3]**
12. **Order confirmation** — On success, customer is redirected to the order confirmation page with the order reference number, summary, and next steps. Cart is emptied.

### Expected Screen Behavior

- If stale price or out-of-stock is detected at step 10, the order is not placed. The page shows the updated state; the customer must review and re-confirm.
- Phone number is validated in real time against the Bangladesh mobile format pattern. Invalid entries show an inline error before the form can submit.
- Delivery charge updates in the total as soon as the zone can be inferred from the address input.

### Errors

| Scenario | Customer-visible message |
|---|---|
| Item out of stock at server validation | "Sorry, [Product name] is now out of stock. Please remove it or choose another variant." Order not placed. |
| Price changed at server validation | "The price of [Product] has changed from ৳X to ৳Y. Please review and confirm." Order not placed until acknowledged. |
| Invalid phone number | "Please enter a valid Bangladesh mobile number (e.g., 01XXXXXXXXX)." |
| Payment method unavailable at submission | "This payment method is currently unavailable. Please choose another." |
| Duplicate submission detected | Server returns the existing order; customer sees the original confirmation. No second order is created. |
| Network error at submission | "Your order was not placed. Please try again." Place Order button re-enabled. |

### Recovery Paths

- Out-of-stock line at checkout → remove the line and proceed with remaining items, or return to browse.
- Payment method unavailable → choose an alternative from remaining enabled methods.
- Network error → retry (idempotency token prevents duplication if the first request had actually succeeded).

### Acceptance Criteria

- AC-7.1 Server-side validation runs on all lines regardless of entry point. **[AC-G3]**
- AC-7.2 A stale price is never silently accepted at checkout.
- AC-7.3 Double-tap / double-submit creates exactly one order. **[AC-4.3]**
- AC-7.4 Invalid Bangladesh phone number blocks submission with an inline error.
- AC-7.5 Delivery charge is correct and visible before "Place Order." **[AC-7.6 from PRD]**
- AC-7.6 Abandoning checkout leaves cart contents intact. **[FR-4.3.8]**

---

## 8. Customer — Payment: COD

**Preconditions:** Customer has reached the payment step and selected Cash on Delivery.

### Steps

1. Customer selects **Cash on Delivery**.
2. Order review summary is visible with COD selected.
3. Customer taps **Place Order**.
4. Server creates the order: payment status → **Unpaid**; COD confirmation status → **Unconfirmed**. **[Recommended — FR-6.6.2]**
5. Customer is redirected to the **Order Confirmation** page with the order reference and next steps (e.g., "Our team will call to confirm your order.").
6. An SMS notification is sent to the customer's phone number if the SMS gateway is configured and operational. **[Confirmed — FR-11.6.2; SMS is operational only after the gateway provider is selected, configured, and tested — FR-11.6.5]**
7. In Admin, a new order appears in the order list with payment status "Unpaid" and a COD confirmation flag requiring staff action.

### Errors

| Scenario | Behavior |
|---|---|
| SMS fails to send | Order is still confirmed. The failure is logged internally; staff can resend manually. Customer does not see a technical error about SMS. **[Confirmed — FR-11.6.3]** |

### Acceptance Criteria

- AC-8.1 COD order is created with payment status "Unpaid" and COD confirmation status "Unconfirmed."
- AC-8.2 An SMS failure does not cancel or alter the order.
- AC-8.3 The order reference number is prominently visible on the confirmation page.

---

## 9. Customer — Payment: bKash / Nagad

**Preconditions:** Customer is at the payment step. bKash or Nagad is enabled in Admin and merchant API credentials are configured and verified. **[Confirmed — FR-7.3.2; methods are never shown as selectable until actually configured.]**

### Steps

1. Customer selects **bKash** or **Nagad**.
2. Customer taps **Place Order**.
3. Server initiates the payment via the provider's Merchant API and returns a redirect or in-page flow. **[Unclear — exact UX (redirect, deep link, or in-page) depends on the Merchant API integration type; to be confirmed during implementation.]**
4. Customer completes the payment on the provider's interface (PIN, OTP, etc.).
5. The provider sends a server-side callback/webhook. The server verifies the callback signature and the payment status. **[Confirmed — FR-7.3.4]**
6. On verified success: payment status → **Paid**; customer is redirected to the Order Confirmation page.
7. On failed payment: customer returns to checkout with a clear error. Order is not marked Paid. Customer can retry or switch to COD.
8. Duplicate callbacks (network retries from the provider) are handled idempotently — recorded once. **[Confirmed — FR-7.3.5]**

### Expected Screen Behavior

- bKash/Nagad options are not shown at checkout if merchant credentials are not configured and verified. **[Confirmed — FR-7.3.3, AC-7.4]**
- A customer-submitted screenshot or a browser redirect alone never marks an order Paid. **[Confirmed — FR-7.3.4, AC-7.5]**

### Errors

| Scenario | Customer-visible message |
|---|---|
| Payment declined | "Payment was not successful. Please try again or choose a different payment method." |
| Payment gateway timeout | "We couldn't confirm your payment. Please check your [bKash/Nagad] app. Contact us if you were charged." (Staff alerted in Admin.) |
| Invalid callback signature | Payment rejected server-side; order remains Unpaid. Customer is told payment could not be verified. |

### Recovery Paths

- Failed online payment → customer can retry the same method or switch to COD without losing their cart or entered address.
- Timeout → Admin is alerted; staff can investigate and manually update payment status if confirmed out-of-band.

### Acceptance Criteria

- AC-9.1 bKash/Nagad options appear only when corresponding merchant credentials are configured and enabled.
- AC-9.2 Only a verified server-side/provider callback marks an order as Paid. **[AC-7.5]**
- AC-9.3 Duplicate callbacks do not create duplicate payment records.
- AC-9.4 A failed payment does not clear the cart or erase the customer's address details.

---

## 10. Customer — Order Confirmation and Tracking

**Entry points:** Checkout completion; tracking page (via confirmation link, footer "Track Order" link, or SMS link).

### Steps — Confirmation Page

1. Page shows: order reference number (prominently), all ordered items, quantities, prices, delivery charge, total, payment method selected, and expected next steps.
2. Links: "Continue Shopping" and "Track Your Order."
3. Registered logged-in customers see the order in their account order history.
4. Guest customers are shown the order reference and instructed to use it on the tracking page.

### Steps — Order Tracking Page

1. Customer navigates to the tracking page (accessible without an account).
2. **Guest:** enters order reference number and phone number for verification. No account required. **[Confirmed — FR-4.4.1, FR-4.4.2]**
3. **Registered customer:** logs in and views order history.
4. Page shows three separate status indicators:
   - **Order status** (e.g., Pending → Confirmed → Processing → Ready to Ship → Delivered)
   - **Payment status** (e.g., Unpaid, Paid, Refunded)
   - **Shipment status** (e.g., Booked, Shipped, Out for Delivery, Delivered, Failed Delivery)
5. If a return/refund request exists, its status is shown as a fourth independent indicator. **[Confirmed — FR-6.7.10]**
6. If a courier API is connected, a tracking link to the courier's own tracking page may be shown. If not, the status is as manually entered by staff. **[Confirmed — FR-7.4.6: courier tracking not claimed unless actually connected.]**

### Errors

| Scenario | Customer-visible message |
|---|---|
| Order reference not found | "No order found with this reference. Please check and try again." |
| Phone number does not match the order | "The information provided does not match our records." (No field-specific hint to prevent enumeration.) |

### Acceptance Criteria

- AC-10.1 Guest can track an order using order reference + phone without creating an account.
- AC-10.2 Tracking page shows order status, payment status, and shipment status as three separate fields.
- AC-10.3 Return/refund request status is visible on the tracking page if one exists.
- AC-10.4 No live courier tracking link is shown unless the courier integration is actually configured and working.

---

## 11. Campaign — Landing Page and Mode A Checkout (Product-First)

**[Recommended — FR-5.2.1]**

**Entry points:** Customer arrives from a Meta Ad, social share, or direct URL with UTM parameters and campaign/landing-page IDs. **[Confirmed — FR-5.2.4]**

### Steps

1. **Landing page loads** — Hero section, offer details, product highlights, and a CTA button ("Shop Now" or equivalent). Built from Admin's campaign landing-page builder using tested section templates. **[Custom — FR-5.1.1]**
2. **CTA → PDP** — The CTA button navigates to the full product detail page on the main storefront.
3. **UTM/campaign context** — Campaign ID, landing-page ID, and UTM parameters travel with the customer session (e.g., in the URL or session storage) and will be associated with any resulting order. **[Confirmed — FR-5.2.4, FR-5.3.3]**
4. **PDP interaction** — Standard PDP flow (Journeys 2–6). Same catalog, pricing, inventory, and order system used. **[Confirmed — FR-5.1.2]**
5. **Checkout** — Standard checkout flow (Journeys 7–9). Campaign ID and UTM data are stored with the resulting order.

### Expected Screen Behavior

- The landing page shows the same live product price and stock as the PDP — never a separately entered, potentially stale price. **[Confirmed — FR-5.1.2]**
- If the campaign-featured product is out of stock, the PDP reflects this accurately — the landing page must not promise availability it cannot deliver. **[Confirmed — FR-5.2.5]**

### Errors

| Scenario | Customer-visible message |
|---|---|
| Product is out of stock | Standard PDP out-of-stock state. |
| Campaign page is unpublished | "This offer is no longer available." or standard 404. |

### Acceptance Criteria

- AC-11.1 Campaign ID and UTM parameters are preserved in the resulting order record.
- AC-11.2 Price and stock on the landing page match the live catalog — not a separate cached copy.
- AC-11.3 Existing cart items are never cleared when the customer proceeds from the campaign page to checkout.

---

## 12. Campaign — Landing Page and Mode B Checkout (Direct)

**[Confirmed — FR-5.2.2]**

**Entry points:** Customer arrives from a Meta Ad or link and taps a direct CTA such as "Order Now" on the landing page.

### Steps

1. **Landing page loads** — Campaign hero, offer details, variant/quantity selector, and "Order Now" CTA.
2. **Variant and quantity selection** — Customer selects variant and quantity directly on the landing page. The selector uses only option types configured for the product's category. Live price and stock are used. **[Custom — variant selector embedded in the landing page.]**
3. **Customer taps "Order Now"** — The selected variant/quantity is added to the **shared cart** (preserving any existing items). **[Confirmed — FR-5.2.3]**
4. **Customer is taken to Order Review / Checkout** — This combined screen shows:
   - The campaign product with offer/discount conditions (if applicable and valid).
   - All existing cart items (not cleared).
   - Delivery charge and order total.
5. **Campaign offer validation** — Server validates: campaign offer is still active, product is in stock, and the discount is applicable. If the offer is expired or the product is sold out, checkout is blocked with a clear message — a stale promotional price is never honored. **[Confirmed — FR-5.2.5]**
6. **Delivery and payment** — Standard checkout steps (Journeys 7–9).
7. **Order creation** — Order is created with campaign ID, landing-page ID, and UTM data attached. The same order system and stock records are used as for all other orders. **[Confirmed — FR-5.2.3]**

### Expected Screen Behavior

- The checkout clearly labels which item(s) came from the campaign offer.
- If the customer already had items in the cart, those appear alongside the campaign product — no cart is cleared.
- A separate "campaign-only checkout that excludes the regular cart" is **not** part of Phase 1. **[Confirmed — FR-5.2.6]**

### Errors

| Scenario | Customer-visible message |
|---|---|
| Campaign offer has expired | "This offer has ended. You can still purchase this product at the regular price." |
| Campaign product out of stock | "This product is sold out. The offer cannot be applied." Order is blocked. |
| Discount fails server-side validation | "This offer is no longer available. Regular pricing applies." Customer must confirm or cancel. |

### Recovery Paths

- Expired offer → customer can purchase at regular price via the standard PDP.
- Out-of-stock → the campaign landing page should ideally be unpublished by Admin when stock runs out; the checkout block is the safety net.

### Acceptance Criteria

- AC-12.1 Customer with 2 items in cart completes Mode B checkout for a campaign product → final order has all 3 lines; cart was not cleared. **[AC-5.1 from PRD]**
- AC-12.2 An expired or invalid campaign offer is blocked at checkout with a clear message. **[FR-5.2.5]**
- AC-12.3 The campaign order uses the same underlying product, inventory, and order system as a normal storefront order.
- AC-12.4 Campaign ID and UTM data are stored with the resulting order.

---

## 13. Admin — Product Creation

**[Native Medusa for core product creation; Custom for Bangla fields, category-specific attributes, and the 3-option-type cap.]**

> **Observation note:** The Medusa Admin demo at `https://demo.medusajs.com/app/products` was not rendered in this research session (browser automation was unavailable and the demo is a JS SPA). The following describes product creation behavior as documented in Medusa v2. Any deviation from the actual demo should be verified during implementation.

### Navigation

Staff opens the Admin Panel and navigates to **Catalog → Products** in the left sidebar, then clicks **Create product**. **[Native Medusa]**

### Steps

1. **Product list page** — A table of existing products with search and filter controls. Columns include product title, status (Published / Draft / Archived), category, and date. A "Create product" button is typically in the top-right. **[Native Medusa — exact column labels per Medusa v2 documentation; verify during implementation.]**

2. **Create product form opens** — Sections:

   **General information** **[Native Medusa]**
   - Title (required)
   - Subtitle (optional)
   - Description (rich text or plain text)

   **Bangla content fields** **[Custom — Medusa does not natively support bilingual product content. These are custom extension fields.]**
   - Bangla title
   - Bangla description
   - If either Bangla field is empty, staff is warned before publishing.

3. **Organize section** **[Native Medusa — Medusa v2 Categories module]**
   - Category (required; assign to one or more categories from the category tree)
   - Collection (optional)
   - Tags
   - Sales Channel

4. **Category-specific attribute fields** **[Custom]**
   - After category selection, the form dynamically displays attribute fields relevant to that category (e.g., Size Guide URL and Fit for Fashion; Warranty Period and Specifications for Electronics; Pack Size and Weight for Grocery).
   - These fields do not appear for categories that don't need them.

5. **Variants section** **[Native Medusa — Medusa v2 variant options; Custom: 3-option-type cap enforcement]**
   - Staff defines variant option types (e.g., "Size", "Colour"). Maximum 3 option types.
   - Variant combinations are generated or added individually.
   - Attempting to add a 4th option type is blocked with a clear error. **[AC-3.1 from PRD]**

6. **Per-variant fields** — For each variant:
   - SKU (required; must be unique within the product) **[Native Medusa — uniqueness validation is a platform business rule]**
   - Price (BDT) — see step 7
   - Stock quantity — see step 8
   - Variant image (optional) **[Native Medusa]**

7. **Pricing** **[Native Medusa — Medusa v2 Pricing Module; Custom: simplified UX for non-technical staff]**
   - Staff enters the selling price in BDT for each variant.
   - **[Unclear — decide before build]** Whether Medusa's native Price Sets / Regions UI is used as-is or whether a simplified "BDT price per variant" UI is built as a custom Admin extension. The Medusa v2 pricing model is more complex than a single price field per variant.

8. **Inventory** **[Native Medusa — Medusa v2 Inventory Module; Custom: whether inventory is set during creation or only via the Inventory module after creation]**
   - Stock quantity entered per variant for the single warehouse location.
   - **[Unclear — decide before build]** Whether inventory quantity can be set during product creation or only after creation via the Inventory module.

9. **Images** **[Native Medusa — image upload; Custom: upload security validation per FR-5.1.6]**
   - Upload product images (JPEG, PNG, WebP; file-type and file-size validated; executables/scripts rejected).
   - Designate one image as the thumbnail.
   - A failed upload shows an error on that slot without breaking the rest of the form.

10. **SEO / Metadata** **[Native Medusa]**
    - URL handle (slug), page title override, meta description.

11. **Save as Draft vs. Publish** **[Native Medusa]**
    - Draft: not visible on storefront. Published: visible in configured sales channels.
    - If either Bangla field is empty when the staff attempts to Publish, a warning dialog appears before confirming. **[Custom — FR-10.3.2, FR-10.3.5]**

### Expected Screen Behavior

- Attempting to save with a duplicate SKU within the product shows an inline error on the affected variant row.
- Attempting to add a 4th variant option type is blocked immediately with a clear error.
- A missing required field (Title) blocks save with an inline validation error.
- Image uploads show a progress indicator; a failed upload shows an error on that image slot.

### Errors

| Scenario | Admin-visible message |
|---|---|
| Duplicate SKU within the product | "SKU must be unique within this product. [SKU] is already used by [Variant]." |
| 4th option type added | "A product can have at most 3 variant option types." |
| Missing Bangla title on Publish attempt | Warning dialog before publish. Staff can confirm or cancel. |
| Image upload rejected (wrong type or size) | "File rejected: [reason]. Please upload a JPEG, PNG, or WebP file under [size limit]." |

### Acceptance Criteria

- AC-13.1 Creating a 4th option type on a product is blocked with a clear error. **[AC-3.1 from PRD]**
- AC-13.2 Two variants cannot share the same SKU within a product. **[AC-3.2 from PRD]**
- AC-13.3 Publishing without a Bangla title shows a warning that staff must acknowledge.
- AC-13.4 A successful product creation appears in the product list with the correct status.
- AC-13.5 A Published product is visible on the storefront only for the configured sales channel.

---

## 14. Admin — Product Editing, Variants, Pricing, Images, Categories, Inventory

**[Largely Native Medusa for core fields; Custom for Bangla fields, category-specific attributes, variant deactivation business rules, and the audit log.]**

### Editing General Information

1. Staff navigates to **Catalog → Products**, opens a product's detail page in Admin.
2. Staff edits title, description, Bangla title, Bangla description, tags, collections, or categories.
3. Saves. **Historical orders are not affected** — editing a product name or price today does not rewrite the name or price stored in any past order snapshot. **[Confirmed — FR-6.4.1, AC-6.2]**

### Adding / Editing Variants

1. On the product detail page, staff opens the Variants section.
2. To add a new variant: fills option values, SKU, price, and stock. 3-option-type cap applies. **[Custom: cap enforcement]**
3. To edit an existing variant: opens it, updates fields, and saves.
4. **Deactivating a variant** — Staff can deactivate or discontinue a variant. This hides it from the storefront but does **not** delete historical order lines referencing it. **[Confirmed — FR-3.2.3]** **[Unclear — verify during implementation: exact Medusa v2 UI gesture for variant deactivation (status toggle, archive, soft delete).]**

### Pricing

1. Staff selects a variant and updates its BDT price.
2. The new price applies from that moment forward; existing orders retain their order-time snapshot price.
3. **[Unclear — decide before build]** Whether a simplified per-variant BDT price field is built as a custom Admin extension, or whether Medusa's native Price Sets / Regions UI is used as-is.

### Images

1. Staff adds, removes, or reorders product images.
2. An image can be set as the thumbnail.
3. Uploading an invalid file type or oversized image is rejected; existing images are unaffected. **[Confirmed — FR-5.1.6]**

### Categories and Inventory

1. **Category reassignment** — Updating the category may change which attribute fields are shown on the PDP. **[Custom]**
2. **Inventory adjustment** — Staff opens the **Inventory** section (Admin sidebar or product inventory tab) and manually adjusts stock quantities. Every adjustment is logged: quantity changed, reason, responsible staff member, timestamp. **[Native Medusa for the Inventory Module; Custom for the reason field and audit log.]**
3. **Low-stock alerts** — When stock for a variant falls below a configurable threshold, a low-stock alert is shown on the Admin Dashboard and in the Inventory section. **[Custom — Medusa v2 does not include a native low-stock alert dashboard widget; a custom Admin widget extension is required.]**

### Errors

| Scenario | Admin-visible message |
|---|---|
| Saving a variant with a duplicate SKU | Inline validation error on the SKU field. |
| Uploading an invalid image | "File rejected: [reason]." Existing images unaffected. |
| Deactivating a variant referenced by open orders | Warning: "This variant is referenced in [N] open order(s). Deactivating hides it from the storefront but does not affect existing orders." Confirm or cancel. **[Unclear — exact behavior to confirm during implementation.]** |

### Acceptance Criteria

- AC-14.1 Editing a product price today does not change the price shown on an order from last month. **[AC-6.2 from PRD]**
- AC-14.2 Deactivating a variant does not delete historical order line references to it. **[FR-3.2.3]**
- AC-14.3 A category's PDP renders only the attribute/filter fields configured for that category. **[AC-3.3 from PRD]**
- AC-14.4 Invalid image upload is rejected; previously uploaded images are unaffected.

---

## 15. Admin — Order List

**[Native Medusa for the core order list; Custom for COD confirmation status column, risk flags, and return/refund status column.]**

> **Observation note:** The Medusa Admin order list at `https://demo.medusajs.com/app/orders` was not rendered in this research session (JS SPA, browser automation unavailable). The following describes documented Medusa v2 Admin order list behavior.

### Navigation

Staff navigates to **Orders** in the left sidebar. **[Native Medusa]**

### Screen Description (based on Medusa v2 documentation)

The order list in Medusa v2 Admin is a table showing orders with columns that include (based on documentation; exact column names should be verified during implementation):
- Order ID / Reference
- Customer (name or email)
- Date (order creation date)
- Payment status (e.g., Awaiting, Captured, Refunded)
- Fulfillment status (e.g., Not fulfilled, Fulfilled, Returned)
- Total (in BDT)
- Order status

Filters available in Medusa v2 (based on documentation): by payment status, fulfillment status, date range, sales channel.

Search: by order ID, customer name, or email.

**Custom additions required for this platform:**

| Addition | Type |
|---|---|
| COD Confirmation status column (Unconfirmed / Confirmed / Unreachable) | Custom |
| COD risk flag badge (e.g., "2 RTOs" indicator on the row) | Custom |
| Return/Refund status indicator or column | Custom |
| Correct Bangla character rendering in customer name column | Custom (font/layout) |

### Steps

1. Staff opens Orders. Most-recent orders appear first.
2. Staff uses search or filters to narrow the list.
3. Staff clicks a row to open **Order Detail** (Journey 16).
4. New orders appear in the list without requiring a manual page reload — or a visible "New orders available — refresh" indicator is shown. **[Unclear — decide before build: real-time WebSocket update or polling-based refresh.]**

### Expected Screen Behavior

- List paginates; thousands of orders do not degrade performance. **[Recommended — FR-13.1.2]**
- Filters are combinable (e.g., Payment status = Unpaid AND COD Confirmation = Unconfirmed).
- COD orders awaiting confirmation are visually distinguishable (e.g., a badge or highlighted row).
- Return/Refund requests awaiting review are visible (e.g., a badge count on the module nav link or a column indicator).

### Acceptance Criteria

- AC-15.1 Order list is paginated and performs adequately with thousands of orders.
- AC-15.2 COD Unconfirmed orders are identifiable from the order list.
- AC-15.3 Return/Refund requests awaiting review are surfaced (e.g., via a dashboard alert or order list indicator).

---

## 16. Admin — Order Detail, Payment Status, Fulfillment

**[Native Medusa for core order detail; Custom for COD confirmation workflow, Bangladesh-specific shipment states, and return/refund status section.]**

> **Observation note:** The order detail page was not live-inspected. Description is based on Medusa v2 documentation.

### Navigation

Staff clicks an order row from the Order List.

### Screen Sections

**Header / Summary** **[Native Medusa]**
- Order reference, customer name, order date, order status badge, action menu (Cancel, etc.).

**Line Items / Order Summary** **[Native Medusa]**
- Each ordered line: thumbnail, product name, variant, SKU, quantity, unit price, line total. This data is from the **order-time snapshot** and never changes when the product is later edited. **[Confirmed — FR-6.4.1]**

**Payment Section** **[Partly Native Medusa; Custom for COD confirmation and Bangladesh payment methods]**
- Payment method: COD / bKash / Nagad.
- Payment status badge: Unpaid / Pending / Paid / Partially Refunded / Refunded.
- For bKash/Nagad: payment reference ID, captured amount.
- For COD: COD confirmation status (Unconfirmed / Confirmed / Unreachable). **[Custom]**
- Available actions (role- and status-dependent): "Mark as Paid" (COD, by authorized staff after cash collected); "Capture Payment" (for authorized online payments). **[Partly Native Medusa for Capture; Custom for COD Mark-as-Paid.]**

**Fulfillment Section** **[Partly Native Medusa; Custom for Bangladesh-specific shipment states]**
- Shipment status: Not Fulfilled / Booked / Shipped / Out for Delivery / Delivered / Failed Delivery / RTO / RTO Received.
  - **[Note]** Medusa v2's native fulfillment states may differ from these. These Bangladesh-specific states will need to be mapped or custom-extended during implementation.
- Available actions: Create Fulfillment, Add Tracking Number, Mark as Shipped, Mark as Delivered.
- If courier API is connected: courier booking reference and tracking link.
- If not connected: manual consignment ID entry field. **[Confirmed — FR-7.4.4]**

**Return/Refund Section** **[Custom]**
- Any open or closed return/refund requests linked to this order are listed with their current status.
- Link to the full return/refund detail in the Returns & Refunds module.

**Activity / Timeline** **[Native Medusa — Medusa v2 has an activity feed/timeline on order details]**
- Chronological log: every status change, staff note, and action — with responsible user and timestamp. **[Confirmed — FR-6.2.3]**

**Customer Section** **[Native Medusa]**
- Customer name, phone, and delivery address from the order.

### COD Confirmation Workflow

1. Staff receives a new COD order alert (Dashboard pending task or Admin notification). **[Custom]**
2. Staff opens the order detail, calls the customer, and records the outcome:
   - **Confirmed** → COD confirmation status updates; an SMS may be sent: "Your order [#] has been confirmed and will be dispatched soon."
   - **Unreachable** → COD confirmation status → Unreachable. Staff may retry later or escalate.
3. Only users with order-management permission can update COD confirmation status. **[Confirmed — FR-8.2.3]**
4. Every update is logged in the timeline. **[Confirmed — FR-6.2.3]**

### Errors

| Scenario | Admin-visible message |
|---|---|
| Cancelling a shipped order | "This order has been shipped. Please use the RTO / failed delivery workflow instead." **[Confirmed — AC-6.4]** |
| Marking as Paid without verified payment (online payment) | Not permitted. Only manual COD "Mark as Paid" is available to authorized staff. |

### Acceptance Criteria

- AC-16.1 Order detail shows order status, payment status, and shipment status as three separate, independent fields.
- AC-16.2 Every status change is logged in the activity timeline with the responsible user and timestamp.
- AC-16.3 Line items show the order-time snapshot price, not the current product price. **[AC-6.2]**
- AC-16.4 Cancelling a shipped order is blocked; the RTO/failed-delivery workflow is offered instead. **[AC-6.4]**
- AC-16.5 COD confirmation status is visible and updatable by authorized staff.

---

## 17. Admin — Order Cancellation and RTO

**[Partly Native Medusa; partly Custom for Bangladesh-specific RTO and item condition workflow.]**

### Pre-Shipment Cancellation

1. Staff opens the order detail and selects "Cancel Order" from the action menu.
2. A confirmation dialog appears before the action is taken.
3. On confirmation: order status → Cancelled; stock reservation is released (returns to available inventory). For COD: payment status remains Unpaid. For prepaid orders: a refund must be handled through the Returns & Refunds module — it is never automatically initiated. **[Confirmed — FR-6.7.15, FR-6.7.5]**
4. An SMS notification may be sent to the customer. **[Confirmed — FR-11.6.2]**
5. Cancellation is logged in the activity timeline. **[Confirmed — FR-6.2.3]**

### Post-Shipment — Cancellation Blocked

1. Staff attempts to click "Cancel Order" on a shipped order.
2. The action is **blocked**: "This order has been shipped and cannot be cancelled here. Please use the Failed Delivery or RTO workflow." **[Confirmed — AC-6.4, FR-6.7.15]**
3. Staff uses the Fulfillment section to record "Failed Delivery" or "Refused."

### RTO Workflow

1. Staff marks shipment status as "Failed Delivery" or "Refused" and records the reason.
2. Redelivery may be attempted and logged.
3. When the parcel physically returns, staff marks it "RTO Received."
4. Staff records item condition: **Sellable / Damaged / Not restockable**. **[Confirmed — FR-6.7.14]**
5. If Sellable: staff confirms the quantity to restock; stock is manually returned to inventory.
6. If Damaged or Not restockable: stock is **not** automatically adjusted. A deliberate staff action is required. **[Confirmed — AC-6.3]**
7. Any refund due (for prepaid orders) is handled through the Returns & Refunds module — never automatically initiated by the RTO workflow. **[Confirmed — FR-6.7.5]**

### Acceptance Criteria

- AC-17.1 Pre-shipment cancellation releases stock reservations.
- AC-17.2 Post-shipment cancellation is blocked; the RTO/failed-delivery workflow is offered.
- AC-17.3 An RTO item marked "damaged" is not automatically restocked. **[AC-6.3]**
- AC-17.4 No refund is initiated automatically by the cancellation or RTO workflow. **[FR-6.7.5]**

---

## 18. Admin — Returns and Refunds

**[Custom — a configurable, manual-only Return & Refund Management module. Medusa v2 has a native Returns feature, but the PRD requires a permission-gated, policy-configurable, never-automatic system. The Medusa v2 native returns flow must be assessed during implementation to determine how much can be reused.]**

### 18.1 Configuring Return/Refund Policy

1. Owner navigates to **Returns & Refunds → Policy Settings** (or **Settings → Return & Refund Policy**). **[Custom]**
2. Owner configures:
   - Return window (e.g., 7 days from delivery). **[Open — value to be decided by owner: PRD Section 19 Q#4]**
   - Eligibility conditions. **[Open]**
   - Non-returnable categories. **[Open]**
   - Refund methods. **[Open]**
   - Who pays return shipping. **[Open]**
3. All policy values show "Not yet configured" by default until the owner sets them. **[Confirmed — FR-6.7.3]**
4. Only Owner or authorized Manager can save policy settings.
5. Removing a policy setting that is referenced by an active return request requires explicit confirmation. Removal does not retroactively change already-recorded requests. **[Confirmed — FR-6.7.2, AC-6.8]**

### 18.2 Return Request Queue

1. Staff navigates to **Returns & Refunds** in the Admin sidebar.
2. A queue lists all return requests with their current status: Pending Manual Review / Approved / Rejected / In Progress / Completed.
3. Dashboard shows a pending-review count badge. **[Custom]**

### 18.3 Staff Review of a Request

1. Staff opens a return request. Details shown: order reference, customer name, items requested for return, reason, and supporting information (if any).
2. Available actions (role-dependent):
   - **Approve** → status moves to "In Progress." Stock is NOT automatically adjusted.
   - **Reject** → request marked Rejected. Decision, reason, responsible user, and timestamp are permanently recorded. **[Confirmed — FR-6.7.13]**
   - **Request more info** → stays in Pending Manual Review; staff note is added.
3. Only a user with the "return review" permission may approve or reject. **[Confirmed — FR-6.7.7, AC-6.7]**
4. Every action is written to the audit log: user, action, timestamp, reason. **[Confirmed — FR-6.7.8]**
5. The updated return/refund request status is visible to the customer on the order tracking page. **[Confirmed — FR-6.7.10]**

### 18.4 Marking a Refund as Processed

1. Authorized staff (refund-authorization permission) manually executes the refund through the external payment channel (e.g., manually sends via bKash or arranges cash return).
2. After verifying the refund out-of-band, staff returns to the Admin return request and marks it "Refunded / Completed."
3. **Refund completion is never claimed in reporting or shown to the customer until this manual verification step is recorded.** **[Confirmed — FR-6.7.11]**
4. Payment status on the original order updates (e.g., Paid → Partially Refunded / Refunded) as a logged event.

### Errors

| Scenario | Admin-visible message |
|---|---|
| Staff without "return review" permission tries to approve | "You don't have permission to approve return requests." Blocked at the API level — not just the UI. **[AC-6.7]** |
| Removing a policy referenced by active requests | Confirmation dialog required. Deletion does not retroactively alter open requests. **[AC-6.8]** |
| Payment provider webhook reports a "refund-capable event" | Webhook is received; it does not change the return/refund status. Only a manual staff action changes the status. **[Confirmed — AC-6.6]** |

### Acceptance Criteria

- AC-18.1 A newly submitted return request is always in "Pending Manual Review" — never auto-approved. **[AC-6.5 from PRD]**
- AC-18.2 A staff user without return-review permission cannot approve, reject, or process a request, even via direct URL or API. **[AC-6.7 from PRD]**
- AC-18.3 A rejected request permanently retains the reason, responsible user, and timestamp. **[FR-6.7.13]**
- AC-18.4 No refund is ever automatically initiated or marked complete by a webhook, courier update, or order-status change. **[AC-6.6 from PRD]**
- AC-18.5 A damaged returned item requires a manual condition-review step before any stock is adjusted.

---

## 19. Admin — Store Settings

**[Mix of Native Medusa (store info, currencies) and Custom (Bangla/English, payment methods, SMS, delivery zones, courier, VAT, invoice templates, Meta Pixel, theme, SEO).]**

### Navigation

Staff navigates to **Settings** in the Admin sidebar. **[Native Medusa]**

### Setting Groups

| Setting Group | Native / Custom | Key capabilities |
|---|---|---|
| Store Information | Native Medusa | Store name, support email, business address (for invoices). |
| Regions & Currencies | Native Medusa (adapted) | Single region: Bangladesh; currency: BDT only. Not multi-region for Phase 1. |
| Payment Methods | **Custom** | Add / Edit / Enable / Disable / Remove: COD, bKash, Nagad. Manage merchant API credentials (masked after initial save, never shown in full). **[Confirmed — FR-7.2.1, FR-7.2.3, FR-12.3]** |
| Delivery Zones | **Custom** | Inside Dhaka and Outside Dhaka flat-rate BDT charges. Room to add finer zones later. **[Confirmed — FR-7.4.3, FR-11.3]** |
| Courier Settings | **Custom** | Courier name, enabled/disabled toggle, API credential fields (masked after save), connection test. Manual fallback always available. **[Confirmed — FR-7.4.1, FR-7.4.4]** |
| SMS Gateway | **Custom** | Gateway provider, sender ID, API credentials, message templates, delivery log, manual resend controls. **[Confirmed — FR-11.6.1]** |
| Localization | **Custom + partly Native Medusa** | Default language: English. Bangla switch. Optional translation service configuration (requires verification before enabling). **[Confirmed — FR-10.1, FR-10.3.3]** |
| VAT & Tax | **Custom** | Enable/disable VAT, VAT rate, display rules. Shown as "not configured" by default. **[Confirmed — FR-11.4]** |
| Invoice Templates | **Custom** | Upload / edit invoice templates. Changes do not retroactively alter past invoices. File-type/size/security validation. **[Confirmed — FR-11.7.2, FR-11.7.3]** |
| Theme & Appearance | **Custom** | Controlled design tokens (colors, fonts, button styles). Color contrast warning. Preview before publish. Rollback to last published theme. **[Confirmed — FR-9.2–FR-9.4]** |
| Meta Pixel | **Custom** | Central Meta Pixel ID configuration for storefront and all landing pages. **[Recommended — FR-5.3.1]** |
| Staff Access & Security | Partly Native Medusa | Create staff accounts, assign roles, configure permissions, set login security policy. **[Confirmed — FR-8.2.1]** |
| SEO | **Custom** | Default meta description, robots.txt rules, sitemap configuration. **[Recommended — FR-13.3]** |

### Payment Settings Journey (detail)

1. Owner opens **Settings → Payment Methods**.
2. Existing methods are listed with enabled/disabled state.
3. "Add payment method" → select type (COD, bKash, Nagad) → fill required fields.
4. API credentials are masked after initial save; the full value is never displayed again. **[Confirmed — FR-7.2.3]**
5. Enable/Disable toggle: disabling immediately hides the method from checkout. Existing orders referencing the method are not affected. **[Confirmed — FR-7.2.2, AC-7.1]**
6. A method with incomplete credentials shows as Disabled/Unavailable and cannot be enabled until credentials are provided. **[Confirmed — FR-7.3.3, AC-7.4]**

### Errors

| Scenario | Admin-visible message |
|---|---|
| Saving incomplete payment credentials | "Required credential fields are missing. Please complete all fields before saving." |
| Enabling a payment method with missing credentials | Enable toggle is blocked: "Please enter all required API credentials before enabling this method." |
| Theme color combination with critically poor contrast | "This color combination may be difficult to read. Adjust before publishing?" Publishing blocked for critically unreadable combinations where technically feasible. **[Recommended — FR-9.3]** |

### Acceptance Criteria

- AC-19.1 Disabling a payment method immediately removes it from checkout without affecting historical orders. **[AC-7.1 from PRD]**
- AC-19.2 API secrets are never shown in full after initial save. **[FR-7.2.3]**
- AC-19.3 A payment method with incomplete credentials cannot be enabled. **[AC-7.4]**
- AC-19.4 Theme changes have a Preview step; the last published theme can be restored without affecting product/order/return data. **[AC-9.2]**
- AC-19.5 Invoice template changes do not retroactively alter any previously generated invoice.

---

## 20. Admin — Staff Accounts and Permissions

**[Partly Native Medusa (user management, invite); Custom for the granular Bangladesh-specific permission matrix.]**

### Navigation

Owner or authorized Manager navigates to **Settings → Team** (or equivalent). **[Native Medusa — Medusa Admin has a Team/Users section. Granular permissions below are partly native and partly custom; verify during implementation.]**

### Creating a Staff Account

1. Owner clicks "Invite" or "Create staff account."
2. Enters: name, email, role (Owner / Manager / Staff), initial temporary password.
3. Assigns specific permissions independently of the role (e.g., "Can approve return requests," "Can authorize refunds," "Can manage payment credentials"). **[Confirmed — FR-8.2.1, FR-8.2.2]**
4. Saves. Staff member must change their password at first login. **[Recommended — FR-8.2.5]**

### Editing Permissions

1. Owner opens a staff member's record.
2. Edits role or individual permission flags.
3. Saves. **The staff member's existing session is invalidated immediately.** **[Confirmed — FR-8.2.6, AC-8.4]**

### Login Security

- After 5 consecutive failed login attempts: account locked for 15 minutes (or the equivalent/stronger mechanism of the chosen auth system). **[Recommended — FR-8.2.7]**
- Security events (failed logins, lockouts, password resets, permission changes) are logged. **[Confirmed — FR-8.2.8]**
- 2FA required for Owner and Manager where the auth system supports it; evaluated for all staff after checking setup/recovery UX. **[Recommended — FR-8.2.9]**

### Errors

| Scenario | Admin-visible message |
|---|---|
| Staff without "return review" permission tries to access approvals | "You don't have permission to access this section." (Enforced server-side.) **[AC-8.1]** |
| 6th consecutive failed login | Account locked for 15 minutes. Lockout and preceding failures are logged. **[AC-8.3]** |

### Acceptance Criteria

- AC-20.1 Changing a staff member's role immediately invalidates their active sessions. **[AC-8.4 from PRD]**
- AC-20.2 No screen, export, or API response ever renders a stored password in readable form. **[AC-8.5 from PRD]**
- AC-20.3 A Staff-role user without return/refund permission cannot view or action return approvals, even via direct URL. **[AC-8.1 from PRD]**

---

## 21. Admin — Customer Management

**[Partly Native Medusa (customer list, detail); Custom for return/refund history tab and COD risk flags.]**

### Navigation

Staff navigates to **Customers** in the Admin sidebar. **[Native Medusa]**

### Customer List

- Table: name, email, phone, order count, total spend, account creation date.
- Search by name, email, or phone.
- Access to financial details is role-gated: Staff-role users without the customer-finance permission do not see payment history. **[Confirmed — FR-8.2.3]**

### Customer Detail

1. Staff clicks a customer to view their detail page.
2. Page shows: contact information, saved addresses, order history (reference, date, status, total), return/refund history. **[Native Medusa for order history; Custom for return/refund history.]**
3. **COD risk flags** — If the customer has prior RTOs or failed deliveries, a warning is displayed (e.g., "[2 RTOs — review before confirming this order]"). **[Custom]**
4. Internal notes on the customer record. **[Unclear — decide before build: whether customer notes are implemented in Phase 1.]**

### Errors

| Scenario | Admin-visible message |
|---|---|
| Staff without customer-finance permission tries to view payment history | Section is hidden or shows "Access restricted." |

### Acceptance Criteria

- AC-21.1 Customer detail shows order history and return/refund history.
- AC-21.2 COD risk flags (prior RTOs or failed deliveries) are visible on the customer detail page.
- AC-21.3 Staff access to customer financial data is role-gated.

---

## 22. Admin — Delivery Zones and Courier Settings

**[Custom — Medusa has a Shipping module, but the Bangladesh-specific zone structure and COD settlement tracking are Custom.]**

### Delivery Zone Configuration

1. Owner navigates to **Settings → Delivery Zones** (or **Delivery** module in the main nav). **[Custom]**
2. Two default zones are available: **Inside Dhaka** and **Outside Dhaka**, each with a configurable BDT flat rate. **[Confirmed — FR-7.4.3, FR-11.3]**
3. Owner edits the BDT rate for each zone. Final rates are **[Open — Section 19 Q#2]** and must be confirmed by the owner and courier.
4. Additional finer zones (e.g., district-level) can be added later.
5. Delivery charge changes are reflected in the checkout immediately after saving. Historical orders retain their recorded delivery charge. **[Confirmed — FR-6.2.6]**

### Courier Settings

1. Owner navigates to **Settings → Courier Settings**. **[Custom]**
2. Courier is listed with: enabled/disabled toggle, API credential fields (masked after save), and a "Test connection" button.
3. A courier API is never claimed as "integrated" in Admin or customer-facing tracking until actually configured, tested, and confirmed working. **[Confirmed — FR-7.4.6]**
4. If no courier API is connected: the manual fallback is always available — staff can manually enter a consignment ID and update shipment status from the order detail page. **[Confirmed — FR-7.4.4, AC-7.3]**

### Errors

| Scenario | Admin-visible message |
|---|---|
| Courier API connection test fails | "Connection test failed: [error message]. Please check your credentials." |
| Delivery charge not configured for a zone | **[Unclear — decide before build: whether checkout blocks the order for that zone or applies a fallback charge.]** |

### Acceptance Criteria

- AC-22.1 Changing an Inside Dhaka delivery rate is immediately reflected in checkout.
- AC-22.2 A historical order's delivery charge is not changed by a future zone rate change.
- AC-22.3 With no courier API connected, staff can manually enter a consignment ID and update shipment status. **[AC-7.3 from PRD]**

---

## 23. Admin — Reporting

**[Custom — Medusa v2 does not include a financial contribution-profit reporting module. All report types below are Custom Admin extensions.]**

### Navigation

Staff navigates to **Reports** in the Admin sidebar.

### Report Types

| Report | Key metrics | Notes |
|---|---|---|
| Sales Overview | Gross merchandise sales, discounts, net sales, order count, average order value (by day/week/month). | Only **delivered** orders counted as sales. Pending/unconfirmed orders shown separately as pipeline. Cancelled/failed-delivery/RTO orders excluded from delivered sales but their incurred costs are still recorded. **[Confirmed — FR-14.1]** |
| Product Performance | Units sold, revenue per product/variant, stock movement. | |
| Inventory | Current stock per variant, low-stock flags, adjustment history. | |
| Customer | New customers, repeat customers, average order frequency. | Access gated by role. |
| Campaign | Campaign-attributed orders (by campaign ID/UTM), Meta-attributed purchases, manually entered ad spend, cost per attributed order. Store-verified orders and Meta-attributed results shown as **distinct, separately labeled metrics — never merged.** **[Confirmed — FR-5.3.5, FR-14.8]** | |
| Contribution Profit | Net sales + delivery charge collected (separate from courier cost paid by the business) − COGS − packaging cost − courier cost − payment fees − return/RTO costs = **Order Contribution before advertising** → minus ad spend = **Contribution Profit after advertising.** Never labeled "Net Profit" unless all overhead is included. **[Confirmed — FR-14.3, FR-14.5, FR-14.9]** | |
| COD Settlement | COD amounts collected by courier vs. settled vs. pending — tracked as separate figures. | Requires courier data; flagged as estimated if data is unavailable. |

### Estimated vs. Final

- Any report with a missing cost input is visibly marked **"Estimated Contribution Profit"** with a note naming the missing input. **[Confirmed — FR-14.6]**
- Store-recorded sales and Meta-reported attribution always shown in separate, clearly labeled columns. **[Confirmed — FR-14.8]**

### Errors

| Scenario | Admin-visible message |
|---|---|
| Meta ad-spend data sync fails | "Meta data last synced: [date/time]. Sync currently unavailable." Missing spend data is never shown as zero. **[Confirmed — FR-5.3.6]** |
| Cost input missing for a reporting period | "Estimated Contribution Profit" badge with named missing cost. |

### Acceptance Criteria

- AC-23.1 A cancelled, undelivered order does not appear in delivered-sales totals. **[FR-14.1]**
- AC-23.2 A report missing courier-cost data shows "Estimated Contribution Profit" with a note. **[AC-14.1 from PRD]**
- AC-23.3 Meta-attributed and store-verified orders are shown as distinct, separately labeled metrics.
- AC-23.4 Customer-paid delivery charge and courier cost paid by the business are displayed as separate figures. **[FR-14.9]**

---

## 24. Admin — Meta Tracking and Campaign Attribution

**[Custom — all Meta Pixel, UTM, and attribution features are Custom extensions.]**

### 24.1 Meta Pixel Configuration

1. Owner navigates to **Settings → Meta Pixel** (or **Marketing → Meta Settings**). **[Custom]**
2. Enters the Meta Pixel ID. The pixel fires on the storefront and all published landing pages. **[Recommended — FR-5.3.1]**
3. Standard events tracked: ViewContent, AddToCart, InitiateCheckout, Purchase. These must be tested for correct firing before launch. **[Recommended — FR-5.3.2]**
4. Privacy/consent requirements must be reviewed before the pixel is activated. **[Open — PRD Section 19 Q#12]**
5. **Meta Conversions API (CAPI) is NOT a Phase 1 requirement** — it is Phase 2 only, subject to privacy/consent review. **[Confirmed — FR-5.3.7]**

### 24.2 UTM and Campaign Attribution

1. When a customer arrives from a campaign link with UTM parameters (e.g., `?utm_source=facebook&utm_campaign=eid-sale&campaign_id=C001&page_id=LP005`), the platform captures them and attaches them to the customer's session.
2. The parameters are persisted with any resulting order record. **[Confirmed — FR-5.2.4, FR-5.3.3]**
3. Attaching campaign/UTM data never alters cart contents, prices, or order logic.

### 24.3 Campaign Reporting

1. Staff navigates to **Marketing → Campaigns** or **Reports → Campaign Report**.
2. For each campaign: attributed order count, attributed revenue, Meta-reported attributed conversions, Meta-reported ad spend (manually entered or synced — see 24.4).
3. Store-verified and Meta-attributed metrics are always shown in distinct, labeled columns — never merged. **[Confirmed — FR-5.3.5]**

### 24.4 Meta Marketing API / Ad Spend

1. **Phase 1 (manual):** Staff manually enters campaign ad spend in Admin. The date and source of the entry are recorded. **[Recommended — FR-14.7]**
2. **Phase 2 (API sync):** Meta Marketing API connected once credentials are available; not assumed operational until then. **[Recommended — FR-5.3.4]**
3. If sync fails or is not connected: last successful sync time is shown; missing data is flagged — never displayed as zero. **[Confirmed — FR-5.3.6]**

### Errors

| Scenario | Admin-visible message |
|---|---|
| Meta sync failure | "Meta data sync failed. Last successful sync: [date/time]. Ad spend data may be incomplete." |
| Order with no campaign ID | Attributed to "Direct / Unknown source." |

### Acceptance Criteria

- AC-24.1 Meta Pixel fires on PDP, cart, checkout, and order confirmation with correct event names.
- AC-24.2 UTM and campaign ID parameters are stored with the resulting order.
- AC-24.3 Campaign report shows store-verified orders and Meta-attributed orders as distinct metrics.
- AC-24.4 A Meta sync failure shows a visible error with the last sync time — not zero or blank data.

---

## 25. Admin — Manual Order Creation

**[Custom — or potentially Medusa's native Draft Order feature. Assess during implementation before building a duplicate.]**

> **[Unclear — decide before build]** Medusa v2 Admin includes a "Create Draft Order" feature. Assess whether it meets this workflow's requirements before deciding to build a custom order-entry form. If it does, prefer it.

### Use Case

A customer phones in or messages via WhatsApp/Facebook. Staff must enter the order manually because no supported integration captures it automatically. **[Confirmed — FR-6.1.2]**

### Steps

1. Staff navigates to **Orders → Create Order** (or equivalent manual entry point).
2. **Search/select customer** — Staff searches for an existing customer by phone or name. If new, staff creates a minimal customer record (name, phone, optional email).
3. **Select products** — Staff searches the live catalog and selects product and variant. Current prices and current stock are used — the same as a storefront order. **[Confirmed — FR-5.1.2]**
4. **Delivery details** — Staff enters address and selects the delivery zone. The configured Inside Dhaka or Outside Dhaka charge is applied.
5. **Payment method** — COD, bKash, or Nagad. For COD: payment status starts as Unpaid.
6. **Review and confirm** — Staff sees the full order summary and confirms.
7. **Order created** — The order is flagged as "manually created by staff" (for reporting and audit purposes). Stock is decremented. **[Custom — manual-creation flag.]**
8. **Internal note** — Staff can add a note (e.g., "Order taken via phone call at 2pm, spoke with customer").

### Errors

| Scenario | Admin-visible message |
|---|---|
| Product variant is out of stock | "This variant is out of stock. Cannot add to order." |
| Required field missing | Inline validation error on each missing required field. |

### Acceptance Criteria

- AC-25.1 A manually created order uses the same product, inventory, price, and order system as a website order.
- AC-25.2 The order is flagged as manually created in Admin and in reporting.
- AC-25.3 Stock is decremented at manual order creation.

---

## 26. Language Switch (Storefront and Admin)

**[Custom — all Bangla/English support is a Custom extension. Medusa Admin is English-only in its default state.]**

### Storefront Language Switch

1. A `English | বাংলা` control is visible in the storefront header on every page.
2. Clicking the other language:
   - Interface labels, button text, navigation, form labels, error messages, status labels, checkout text, and policy pages switch.
   - The customer remains on the same page with the same product, filters, cart, variant selections, and entered form data preserved — the page is not reloaded or reset. **[Confirmed — FR-10.1.2, AC-10.1]**
   - SKU values, order reference numbers, phone numbers, and price numerals are **never** changed or translated. **[Confirmed — FR-10.1.3]**
3. Language preference is saved in browser storage (guest) or account profile (registered customer). **[Confirmed — FR-10.2.2]**

### Admin Panel Language Switch

1. A language switch control is in a consistent location in the Admin Panel (e.g., user menu or top bar).
2. Switching Admin language does not affect the storefront language preference; they are stored independently. **[Confirmed — FR-10.2.3]**
3. Admin interface labels, menus, buttons, field labels, and validation messages switch language.
4. Product data (Bangla/English product names, descriptions) entered by staff is not affected by the Admin's language switch — it is content, not interface text.

### Translation Warning Behavior

- Publishing a product with an empty Bangla title: Admin shows a warning that staff must acknowledge. **[Confirmed — FR-10.3.5]**
- Critical content (checkout copy, legal pages: Privacy Policy, Return/Refund Policy, Terms & Conditions, Shipping Policy) requires both translations before publishing. Publishing is blocked until the missing translation is provided for these content types. **[Recommended — FR-10.3.6]**
- Non-critical content (e.g., an informational blog post) may fall back to the available language with a visible Admin warning but is not blocked from publishing. **[Recommended — FR-10.3.6]**
- Machine-drafted translations (if a translation service is configured) are always submitted for human review before publishing — never silently auto-published. **[Confirmed — FR-10.3.4]**

### Layout Stability

- Switching language must not cause layout shifts, clipped text, distorted buttons, broken cards, or unusable forms at any breakpoint (360px mobile and above). **[Confirmed — FR-10.4.1, AC-10.3]**
- Bangla and Latin fonts render correctly; appropriate fallback fonts are defined. **[Confirmed — FR-10.4.2]**

### Errors

| Scenario | Behavior |
|---|---|
| Saved language preference cannot be read | System falls back to English (default); switch remains functional. **[Confirmed — FR-10.2.4]** |
| Translation service unavailable | Original content is preserved unchanged; admin is notified; nothing is silently blanked or mistranslated. **[Confirmed — FR-10.3.5, AC-10.4]** |

### Acceptance Criteria

- AC-26.1 Switching from English to Bangla mid-checkout preserves all cart contents and entered form fields. **[AC-10.1 from PRD]**
- AC-26.2 The longest realistic Bangla product title does not clip or overflow its card on a 360px-wide mobile viewport. **[AC-10.3 from PRD]**
- AC-26.3 SKU, order reference, phone numbers, and prices are never changed by a language switch.
- AC-26.4 Admin and storefront language preferences are stored and applied independently.

---

## Appendix A — Unresolved Decisions That Affect Journey Implementation

These items from the PRD and the journeys above must be decided by the owner (or confirmed technically) **before** the corresponding journey is finalized for build. Do not implement these behaviors without an explicit decision.

| # | Journey(s) affected | Open decision |
|---|---|---|
| A1 | 2, 7 | How is the delivery zone determined on the PDP — auto-detect, always show the default/lower charge, or always show a range until the address is entered at checkout? |
| A2 | 3 | Does the PDP have a quantity input, or does Add to Cart always add 1? |
| A3 | 4, 5, 6 | Exact label for the Buy Now button in English and Bangla. |
| A4 | 9 | Exact bKash/Nagad UX (redirect to provider page, deep link, or in-page) — depends on Merchant API integration type. **[Open — PRD Q#1]** |
| A5 | 13, 14 | Whether Medusa's native Price Sets / Regions UI is used as-is or replaced by a simplified BDT-per-variant Admin UI. **[Resolved — Technical Plan §6.3: Custom Admin UI Widget abstracts Price Sets into simple BDT field]** |
| A6 | 13, 14 | Whether inventory quantity can be set during product creation in Medusa v2 or only after creation via the Inventory module. **[Resolved — Technical Plan §4: Initialized during variant creation via Medusa v2 workflows]** |
| A7 | 14 | Exact Medusa v2 UI gesture for variant deactivation (status toggle, archive, or soft delete). |
| A8 | 15 | Real-time order list updates via WebSocket or polling-based refresh. |
| A9 | 18 | Whether customers can initiate return requests from the storefront tracking page or only via staff in Admin. |
| A10 | 19, 22 | Checkout behavior when a delivery charge is not configured for the customer's zone — block the order, or apply a fallback charge? **[Resolved — Technical Plan §14.1: Fallback charge applies automatically with admin warning; never blocks checkout]** |
| A11 | 25 | Whether Medusa's native Draft Order feature covers the manual order-creation workflow or a custom form is needed. **[Resolved — Technical Plan §6.5: Medusa native Draft Orders natively used with BD zone selector]** |
| A12 | All admin journeys | Final staff roles and granular permission matrix for the actual team. **[Open — PRD Q#6]** |
| A13 | 8, 7 | COD phone OTP for order confirmation — not planned for Phase 1 but must be re-evaluated after real RTO/abuse data. **[Open — PRD FR-6.6.4]** |
| A14 | 8, 10 | Which SMS gateway provider, sender ID, and cost? Launch infrastructure is built; delivery is operational only after gateway is set up and tested. **[Open — PRD Q#9]** |
| A15 | 19 | Final VAT registration status and legal invoice requirements for the business. **[Open — PRD Q#8]** |
| A16 | 23, 24 | Ad-spend allocation method approval (allocation by attributed delivered order value, labeled as estimate). **[Open — PRD Q#10]** |

---

## Appendix B — Native Medusa vs. Custom Feature Summary

| Feature Area | Native Medusa Admin (use as-is / prefer) | Custom (build or extend) |
|---|---|---|
| Product creation form (general fields, description) | ✅ | Bangla title and description fields; translation warning before publish |
| Product categories (assignment) | ✅ Medusa v2 Categories module | Category-specific attribute field rendering on PDP and Admin form |
| Variant management | ✅ | 3-option-type cap enforcement |
| Product images | ✅ | File-type / file-size / security validation (FR-5.1.6) |
| SEO handle / meta description per product | ✅ | |
| Order list | ✅ | COD confirmation status column; COD risk-flag badges; return/refund status column |
| Order detail page | ✅ | COD confirmation workflow; Bangladesh-specific shipment states; return/refund section |
| Payment capture (for authorized payments) | ✅ Medusa v2 Payment module | bKash/Nagad Merchant API integration; COD "Mark as Paid" workflow |
| Fulfillment creation | ✅ | Bangladesh-specific shipment states (Out for Delivery, Failed Delivery, RTO, RTO Received); manual consignment ID entry |
| Customer list / detail | ✅ | COD risk flags (RTO history); return/refund history tab |
| Staff / team management (basic invite and roles) | ✅ | Granular permission flags (return review, refund auth, mark-as-processed) |
| Store information, currencies | ✅ | |
| Reporting | ❌ No native financial reporting | All report types are Custom: Sales, Campaign, Contribution Profit, COD Settlement |
| Campaign landing-page builder | ❌ | Entirely Custom |
| Return & Refund module (manual, policy-configurable) | Partial — Medusa v2 has a Returns feature | Manual-only approval, permission-gated, configurable policy settings, audit log, customer-facing status visibility |
| Bangla/English language switch | ❌ | Entirely Custom for storefront and Admin |
| Meta Pixel / UTM attribution | ❌ | Entirely Custom |
| Homepage / content management | ❌ | Entirely Custom (section manager, theme design tokens, preview/publish/rollback) |
| Manual order creation | Partial — Medusa v2 Draft Orders | Assess Draft Orders first; custom extension if insufficient; manual-creation flag |
| Low-stock dashboard alerts | ❌ | Custom Admin widget extension |
| SMS notification infrastructure | ❌ | Custom: gateway config, templates, delivery log, manual resend controls |
| Payment method management (COD/bKash/Nagad) | ❌ | Custom: enable/disable per method, credential management (masked), incomplete-credentials guard |
| Delivery zone configuration (Inside/Outside Dhaka) | ❌ | Custom |
| Courier settings and manual fallback | ❌ | Custom |
| COD settlement tracking | ❌ | Custom |
| Invoice templates | ❌ | Custom |
| VAT / tax configuration | Partial (Medusa v2 Tax module) | Bangladesh-specific VAT display rules, "not configured" default, invoice integration |

---

*End of user-journeys.md — Draft v1. To be reviewed and approved by the project owner before any implementation begins.*

