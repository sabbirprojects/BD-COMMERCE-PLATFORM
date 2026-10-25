# Quality Assurance & Release Verification Checklist: Bangladesh E-commerce Platform

**Document:** `quality-checklist.md`  
**System Foundation:** MedusaJS v2 (`@medusajs/medusa@^2.0` with `@medusajs/ui`) & Next.js Storefront  
**Governing Documents:**  
- [`prd.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/prd.md)  
- [`user-journeys.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/user-journeys.md)  
- [`technical-plan.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/technical-plan.md)  
- [`docs/medusa-admin-reference-audit.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/docs/medusa-admin-reference-audit.md)  

---

## 1. Quality Assurance Protocol & Classification

### 1.1 Priority Tiers
* **P0 — Critical Release Blocker:** Must pass with documented evidence before public launch or merchant onboarding. Any failure in this tier halts deployment.
* **P1 — High Priority (Phase 1 Post-Launch):** Important operational features that must pass before scaling traffic or aggressive marketing spend.
* **P2 — Operational Polish (Phase 2):** Minor usability, reporting refinements, and optimization items.

### 1.2 Verification Rules
1. **Evidence-Based Sign-off:** No check may be marked as passed `[x]` based on assumptions. Every pass requires terminal output, API logs, database records, or visual test confirmation.
2. **Initial State:** Because this repository is in the pre-implementation phase, all items are initialized to `[ ] Pending Verification (Pre-Build)`.
3. **Idempotency & Regression:** Re-run P0 checks whenever database schemas, checkout workflows, or payment modules are modified.

---

## 2. Section 1: Medusa Admin Navigation & Reference-Aligned UI (`@medusajs/ui`)

### CHK-ADM-01 [P0] — Sidebar Layout & Operational Grouping
* **Scope:** Admin App Shell & Sidebar Navigation
* **Expected Behavior:** The sidebar displays clean grouping matching [`technical-plan.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/technical-plan.md) §6.1:
  - **Commerce:** Orders, Products, Categories, Inventory, Customers, Promotions.
  - **Bangladesh Operations:** COD Confirmations (`/app/cod-queue`), Courier Manifest, Returns & Refunds, Campaign Pages (`/app/landing-pages`), Financial Analytics (`/app/reports/contribution-profit`).
  - **Settings:** Store Settings, Bangladesh Config (`/app/settings/bangladesh`), Payment Gateways, Team & Permissions.
* **How to Test:** Log into Admin (`/app`), inspect sidebar menu hierarchy on desktop (width ~240px) and mobile. Toggle sidebar collapse (`⌘\`).
* **Passing Criteria:** All links navigate to their respective routes; sidebar collapses smoothly; active route is highlighted; no broken routes or 404s.
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

### CHK-ADM-02 [P1] — Global Search Command Palette (`⌘K`)
* **Scope:** Navigation & Search Overlay
* **Expected Behavior:** Pressing `⌘K` (or clicking search) opens an accessible modal dialog searching across Orders, Products, and Customers in real-time.
* **How to Test:** Press `⌘K`, type an order number (e.g. `1001`), customer phone (e.g. `01711000000`), and product title. Press `Enter` to navigate.
* **Passing Criteria:** Modal opens instantaneously; search queries return accurate results within 300ms; pressing `Esc` closes modal cleanly.
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

### CHK-ADM-03 [P0] — Reference Visual Hierarchy, Typography & Theme Tokens
* **Scope:** `@medusajs/ui` Design System Fidelity
* **Expected Behavior:** Admin UI strictly adheres to Medusa reference styling ([demo.medusajs.com](https://demo.medusajs.com)):
  - Sans-serif typography (`Inter`).
  - Dark primary buttons (`bg-ui-button-inverted`).
  - Crisp light borders (`border-ui-border-base`).
  - Semantic status pill badges (`green`, `orange`, `red`, `blue`, `grey`).
  - Support for Light and Dark mode.
* **How to Test:** Inspect DOM elements across `/app/orders` and `/app/products`; toggle Theme switcher in Admin profile menu.
* **Passing Criteria:** CSS classes match official `@medusajs/ui` design tokens; theme toggle updates background, borders, and text contrast without unreadable elements.
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

### CHK-ADM-04 [P1] — Loading, Empty & Unsaved Changes Guard States
* **Scope:** UI Feedback & Defensive Guards
* **Expected Behavior:**
  - Table and card data loading displays pulse skeletons (`Skeleton` from `@medusajs/ui`), not layout-shifting blank pages.
  - Empty tables display centered illustrative icon, explanatory heading, and call-to-action button.
  - If a user modifies a form drawer and clicks outside or cancel, a `Prompt` confirmation modal warns: *"You have unsaved changes. Are you sure you want to exit?"*
* **How to Test:** Throttle network in devtools; view an empty orders table; open Product Edit drawer, change title, and press `Esc`.
* **Passing Criteria:** Skeletons appear during network fetch; empty state explains how to add data; prompt successfully prevents accidental loss of edits.
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

## 3. Section 2: Catalog, Product Creation, Variants, BDT Pricing & Inventory

### CHK-CAT-01 [P0] — Product Creation Workflow & Bilingual Fields
* **Scope:** Product Management (`/app/products/create`)
* **Expected Behavior:** The product creation wizard (`FocusModal`) provides inputs for Title, Subtitle, Handle, Description, and **Bangla Translation Fields** (Bangla Title `পণ্যের নাম`, Bangla Description `পণ্যের বিবরণ`).
* **How to Test:** Create a product with English title "Men's Panjabi" and Bangla title "মেনস পাঞ্জাবি". Submit the form.
* **Passing Criteria:** Product is created successfully; database record in `product_localization` contains matching Bangla strings; storefront displays the correct language based on active locale.
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

### CHK-CAT-02 [P0] — 3-Option-Type Variant Cap Enforcement
* **Scope:** Variant Matrix Validation (PRD §3.2)
* **Expected Behavior:** A product may have at most 3 option types (e.g., Option 1: Size, Option 2: Color, Option 3: Material). The admin form prohibits adding a 4th option.
* **How to Test:** In the product creator, add Size, Color, and Material. Attempt to click "+ Add Option" to add a 4th option.
* **Passing Criteria:** The "+ Add Option" button is disabled or an inline validation message appears: *"Maximum 3 option types allowed per product."* Backend API rejects payloads with >3 option types.
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

### CHK-CAT-03 [P0] — Simplified BDT Variant Pricing & Compare-at Price
* **Scope:** Pricing Module Extension
* **Expected Behavior:** Admin staff enters a single "Regular Price (BDT ৳)" and optional "Discount/Sale Price (BDT ৳)" per variant. The system programmatically syncs these values with Medusa's underlying BDT Region Price Set without exposing multi-currency complexity to staff.
* **How to Test:** Enter Regular Price: ৳1,500 and Discount Price: ৳1,200 on Variant A. Save product. Query database and view storefront PDP.
* **Passing Criteria:** Medusa Price Set contains BDT amount `120000` (poisha) or `1200` (BDT); storefront PDP renders `৳ ১,২০০` with strike-through `৳ ১,৫০০` and "২০% ছাড়" badge.
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

### CHK-CAT-04 [P0] — Category-Specific Dynamic Attributes
* **Scope:** Category Attribute Extension
* **Expected Behavior:** Assigning a product to a category (e.g. "Footwear") dynamically displays its assigned attributes (e.g., "Shoe Size", "Sole Material") with required/optional validation.
* **How to Test:** Assign product to "Footwear"; select values for attributes; save product. Switch product category to "Clothing".
* **Passing Criteria:** Attribute values save in `product_attribute_value`; storefront displays specs table on PDP; switching categories refreshes displayed attribute form.
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

### CHK-CAT-05 [P0] — Media Asset Validation & Drag-and-Drop Reordering
* **Scope:** Image Upload Security & Gallery Management
* **Expected Behavior:**
  - File uploader accepts JPG, PNG, WebP up to 5MB.
  - Rejects `.exe`, `.svg` with scripts, `.php`, or non-image MIME types.
  - Allows drag-and-drop thumbnail reordering; primary thumbnail is designated as main product photo.
* **How to Test:** Upload 3 valid WebP photos; drag photo #3 to position #1; attempt to upload a renamed `.exe` or 15MB file.
* **Passing Criteria:** Invalid files are rejected with a clear toast error; reordered primary thumbnail persists and displays on catalog cards.
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

### CHK-CAT-06 [P0] — Inventory Tracking, Stock Deduction & Out-of-Stock Badge
* **Scope:** Inventory Management & Variant Availability
* **Expected Behavior:** When variant inventory reaches 0 and `allow_backorder=false`:
  - Variant chips on storefront PDP display an "Out of Stock" (স্টক শেষ) badge.
  - "Buy Now" and "Add to Cart" are disabled for that variant.
  - Completing an order for 2 units decrements inventory by exactly 2.
* **How to Test:** Set Variant X stock to 2 in Admin. Purchase 2 units through checkout. Return to PDP.
* **Passing Criteria:** Admin inventory shows 0 available; PDP disables ATC button; attempting to force-submit API payload for variant returns `400 Out of Stock`.
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

### CHK-CAT-07 [P1] — Cost of Goods Sold (COGS) Access Restriction
* **Scope:** Financial Data Security
* **Expected Behavior:** Unit Cost (COGS) field on variant editing is visible and editable only to `Super Admin (Owner)` and `Finance` roles. Hidden from `Order Call Center` and `Warehouse` staff.
* **How to Test:** Log in as Call Center user; open product variant detail drawer. Log in as Super Admin; inspect same drawer.
* **Passing Criteria:** COGS input field and values are completely absent from DOM and network responses for unauthorized staff; visible and editable for Super Admin.
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

### CHK-CAT-08 [P0] — Meilisearch Confidential COGS & Margin Exclusion
* **Scope:** Search Engine Security & Data Leak Prevention (C-1 Resolved)
* **Expected Behavior:** Product synchronization pipeline (`POST /indexes/products/documents`) strips all internal financial data (`cogs_unit_bdt`, `cogs_total`, `cost_per_unit_paisa`, gross margin). The public search index must contain only customer-facing attributes.
* **How to Test:** Add a product with price ৳2,000 and COGS ৳1,200. Query Meilisearch directly via `GET /indexes/products/documents` and storefront search API.
* **Status:** `[x] Verified (Prompt 15)`
* **Evidence:** Public index dump verification (`GET /indexes/products/documents`) across 17 indexed products confirms zero presence of COGS (`cogs_paisa`, `cogs_unit_bdt`, `cogs_total`), unit costs (`cost_per_unit_paisa`), supplier info (`supplier_name`, `supplier_sku`), or margin percentages. Validated via `scratch/verify-prompt15.js` (Test 6) with 0 leaks found.

---

## 4. Section 3: Cart, Buy Now, Checkout & Concurrency Integrity

### CHK-CHK-01 [P0] — Standard Multi-Item Cart Behavior
* **Scope:** Shopping Cart (User Journey 3)
* **Expected Behavior:**
  - Clicking "Add to Cart" increments existing line item or creates a new line without leaving the PDP.
  - Cart count badge in navbar updates immediately.
  - Slide-out mini-cart toast appears with "View Cart" and "Checkout" actions.
* **How to Test:** On PDP, select Variant S, click "Add to Cart". Select Variant M, click "Add to Cart". Select Variant S again, click "Add to Cart".
* **Passing Criteria:** Cart contains Variant S (qty 2) and Variant M (qty 1); total lines = 2; customer remains on PDP.
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

### CHK-CHK-02 [P0] — Buy Now Case 1: Empty Cart Direct Checkout
* **Scope:** Buy Now Engine (User Journey 4)
* **Expected Behavior:** When cart is empty, clicking "Buy Now" on a PDP variant:
  1. Adds variant (qty 1) to cart.
  2. Bypasses intermediate cart review page and navigates immediately to `/checkout`.
  3. If customer navigates away or abandons checkout, the item remains safely in their cart.
* **How to Test:** Clear browser cookies/cart. Select Variant A on PDP. Click "Buy Now". Check current URL. Click logo to return home. Check cart badge.
* **Passing Criteria:** Browser navigates directly to `/checkout`; order summary displays 1 item; returning to home shows cart count badge `1`.
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

### CHK-CHK-03 [P0] — Buy Now Case 2: Cart Contains Other Items (Preservation Rule)
* **Scope:** Buy Now Engine (User Journey 5, PRD FR-4.3.2)
* **Expected Behavior:** If cart already contains Product X, clicking "Buy Now" on Product Y:
  1. Product Y is added to the **existing cart**. Product X is **NOT** deleted or overwritten.
  2. Customer is routed directly to `/checkout`.
  3. Checkout Order Review displays **both** Product X and Product Y as separate lines with quantities, unit prices, delivery charge, and order total.
  4. Customer can modify quantities or remove any line item directly inside the checkout review section.
* **How to Test:** Add Product X to cart. Go to PDP of Product Y, click "Buy Now". Inspect `/checkout` page line items. Click trash icon on Product X.
* **Passing Criteria:** Checkout displays both items initially; cart was never wiped; removing Product X recalculates subtotal and delivery charge cleanly; order places with Product Y.
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

### CHK-CHK-04 [P0] — Buy Now Case 3: Same Variant Already in Cart
* **Scope:** Buy Now Engine (User Journey 6, PRD FR-4.3.3)
* **Expected Behavior:** If cart already contains Variant A × 2, clicking "Buy Now" on the same Variant A:
  1. Detects exact same variant is already present.
  2. Keeps quantity unchanged at × 2 (does not silently add another 1; does not create a duplicate row).
  3. Navigates directly to `/checkout` showing Variant A × 2 editable.
* **How to Test:** Add Variant A × 2 to cart. Navigate to Variant A PDP. Click "Buy Now". Check checkout lines.
* **Passing Criteria:** Exactly one line item exists for Variant A with qty 2; no duplicate row; no automatic increase to 3.
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

### CHK-CHK-05 [P0] — Bangladesh Mobile Number & Guest Checkout Validation
* **Scope:** 1-Page Checkout Identity Form
* **Expected Behavior:** Customer completes checkout as a guest without mandatory password creation. Phone number must match standard Bangladesh mobile format:
  - Valid: `017XXXXXXXX`, `018...`, `019...`, `013...`, `014...`, `016...`, `015...` (11 digits, with or without `+88`).
  - Invalid: `012...`, 10 digits, 12 digits, letters.
* **How to Test:** Enter `01234567890` (invalid operator) and submit. Enter `01712345678` (valid) and submit.
* **Passing Criteria:** Invalid number blocks submission with error: *"সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন"*; valid number allows order placement without asking for password.
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

### CHK-CHK-06 [P0] — Bangladesh Delivery Zone Dynamic Rate Calculation
* **Scope:** Shipping Option Resolver
* **Expected Behavior:**
  - Selecting "Inside Dhaka" (ঢাকার ভেতরে) applies the configured flat rate (e.g. ৳60).
  - Selecting "Outside Dhaka" (ঢাকার বাইরে) applies the configured flat rate (e.g. ৳130).
  - Order subtotal + Delivery charge = Total Order Amount.
* **How to Test:** On checkout, switch radio button between Inside Dhaka and Outside Dhaka.
* **Passing Criteria:** Total updates immediately; order summary displays delivery charge as a separate line item; historical orders retain their recorded delivery charge even if store admin later changes zone rates.
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

### CHK-CHK-07 [P0] — Server-Side Stock & Price Integrity Check at Order Placement
* **Scope:** Anti-Tampering & Checkout Finalization
* **Expected Behavior:** Even if a customer manipulates client-side JavaScript or leaves a cart open for hours:
  - Server recalculates line totals using official database prices at checkout completion.
  - Server verifies that every item has available stock before confirming the order.
* **How to Test:** Add item at ৳1,000. In another window, change product price to ৳1,200 in admin. In the customer window, click "Place Order".
* **Passing Criteria:** Server rejects order or prompts customer with updated price: *"মূল্য পরিবর্তিত হয়েছে: ৳ ১,২০০"*; order is never placed with stale or manipulated price.
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

### CHK-CHK-08 [P0] — Concurrency Stock Reservation Locking (Flash-Sale Race Condition)
* **Scope:** High-Traffic Inventory Integrity
* **Expected Behavior:** When 1 unit of stock remains and two customers click "Place Order" at the exact same millisecond:
  - Redis distributed lock ensures exactly one customer successfully places the order.
  - The second customer receives a polite error: *"দুঃখিত, পণ্যটি মাত্র স্টক শেষ হয়ে গেছে।"*
* **How to Test:** Set variant inventory to 1. Run automated concurrency test script firing 10 simultaneous cart completion requests.
* **Passing Criteria:** Database records exactly 1 placed order; remaining inventory is 0; 9 requests return 400 Out of Stock; inventory never drops to -1.
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

## 5. Section 4: Cash on Delivery (COD) & Online Payment Gateways

### CHK-PAY-01 [P0] — Cash on Delivery (COD) Authorization & Lifecycle
* **Scope:** COD Payment Provider (`pp_cod`)
* **Expected Behavior:**
  - Selecting COD authorizes payment with ৳0 processing fee.
  - Initial payment status is `Awaiting` / `Pending Collection`.
  - Payment is marked as `Captured` (Paid) only when parcel is delivered and money is collected.
* **How to Test:** Complete checkout selecting COD. Check order in Admin.
* **Passing Criteria:** Order is placed; payment status is `Awaiting`; COD status is `Unconfirmed`; order total reflects full cash amount to be collected.
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

### CHK-PAY-02 [P0] — bKash Merchant API Payment Flow
* **Scope:** bKash Payment Provider (`pp_bkash`)
* **Expected Behavior:**
  - Customer selecting bKash is redirected to secure bKash payment gateway.
  - Entering PIN and OTP redirects to callback URL.
  - Backend executes `executePayment`, verifies transaction status `Completed`, verifies `currency === "BDT"` and exact amount.
* **How to Test:** In sandbox/test environment, complete bKash checkout with test wallet credentials.
* **Passing Criteria:** Payment status updates to `Captured`; transaction ID (`trxID`) and wallet number are recorded on order payment session; customer sees order confirmation screen.
* **Status:** `[x] Verified (Prompt 11)` — Automated in `scratch/verify-prompt11.js`. Amount tamper (1 BDT) and currency tamper (USD) rejected with HTTP 400. Genuine transaction captures order, sets payment status, creates 1:1 `order_bd_details`, and stores immutable `order_line_snapshot` with write-once COGS.

---

### CHK-PAY-03 [P0] — Duplicate Callback & Idempotency Protection
* **Scope:** Payment Webhook & Replay Defense
* **Expected Behavior:** If bKash/Nagad sends duplicate callback requests or a customer refreshes the callback URL:
  - Backend checks if `payment_id` or `trxID` is already processed.
  - Prevents double-capturing or creating duplicate order records.
* **How to Test:** Capture a successful bKash callback payload and replay it 3 times via curl/Postman to the webhook endpoint.
* **Passing Criteria:** First request processes payment; subsequent duplicate requests return HTTP `200 OK` (idempotent) with no duplicate order or ledger entries.
* **Status:** `[x] Verified (Prompt 11)` — Automated in `scratch/verify-prompt11.js`. Replaying callback 3x returns HTTP 200 with `already_processed: true` and 0 duplicate order records or stock changes.

---

### CHK-PAY-04 [P0] — Payment Failure, Cancellation & Cart Recovery
* **Scope:** Failed Online Payment Flow
* **Expected Behavior:**
  - If a customer cancels on bKash/Nagad gateway or payment fails due to insufficient balance:
  - Customer is redirected back to `/checkout` with a clear message: *"পেমেন্ট সম্পন্ন হয়নি। আবার চেষ্টা করুন অথবা ক্যাশ অন ডেলিভারি বেছে নিন।"*
  - Cart items and entered address details remain preserved.
* **How to Test:** On bKash sandbox gateway screen, click "Close" or "Cancel".
* **Passing Criteria:** Customer returns to checkout; cart items remain intact; no orphan placed order is created in database.
* **Status:** `[x] Verified (Prompt 11)` — Automated in `scratch/verify-prompt11.js`. Cancellation at mock gateway preserves cart, results in 0 placed orders, redirects to `/checkout?payment_error=cancelled`, and displays bilingual recovery toast and fallback to COD.

---

## 6. Section 5: Orders, Filters, Order Details & COD Confirmation Workflow

### CHK-ORD-01 [P0] — Orders List Table, Status Filtering & Search
* **Scope:** Orders List (`/app/orders`)
* **Expected Behavior:**
  - Displays Order ID, Date, Customer Name, Phone, Delivery Zone, Fulfillment Status, Payment Status, COD Confirmation Status, and Total Amount.
  - Supports filtering by COD Status (`Unconfirmed`, `Confirmed`, `Escalated`, `Canceled`).
  - Search by mobile number returns all matching orders within 300ms.
* **How to Test:** Filter table by "Unconfirmed COD"; search for a known mobile number `018XXXXXXXX`.
* **Passing Criteria:** Table displays only matching records; pagination controls navigate cleanly; order count reflects active filter.
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

### CHK-ORD-02 [P0] — COD Phone Verification Widget & Confirmation State Machine
* **Scope:** Order Details Admin Extension (`order.details.side`)
* **Expected Behavior:**
  - Call box displays customer phone number with `tel:` link and RTO risk badge (e.g. `New Customer`, `Trusted (5/5 Delivered)`, `High Risk (2 RTO)`).
  - Staff clicks "Confirm Order" -> COD status transitions to `Confirmed [Green]`; shipment state transitions to `Ready to Ship`.
  - Staff clicks "Call Attempt #1" -> Logs timestamp in timeline; status remains `Unconfirmed`.
  - Staff clicks "Cancel Fraud" -> Order transitions to `Canceled`; inventory reservations are immediately released.
* **How to Test:** Open an unconfirmed COD order; click "Call Attempt #1", then click "Confirm Order". Inspect order timeline and inventory.
* **Passing Criteria:** Status updates in database immediately; staff user ID is logged; cancelled order restores inventory back to stock.
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

### CHK-ORD-03 [P0] — Order-Time Immutable Snapshot Integrity
* **Scope:** Historical Data Protection (PRD FR-6.4)
* **Expected Behavior:**
  - Changing a product's price, title, or deleting a category in Admin **NEVER** alters past completed orders.
  - Order details view displays the exact item price, title, and delivery charge captured at the moment of order placement.
* **How to Test:** Place order for Product A at ৳1,000 with ৳60 shipping. Change Product A price to ৳1,800 and shipping to ৳100 in Admin. Reload the past order.
* **Passing Criteria:** Past order continues to show item at ৳1,000 and shipping at ৳60; order subtotal remains unchanged.
* **Status:** `[x] Verified (Prompt 12: verified catalog price & title updates never alter historical order line snapshots or financial totals)`

---

### CHK-ORD-04 [P0] — Manual Order Creation via Native Draft Orders
* **Scope:** WhatsApp/Phone Customer Orders (User Journey 25)
* **Expected Behavior:** Support staff can create manual orders using Medusa Draft Orders (`/app/draft-orders`):
  - Enter customer phone number; select product & variant from live catalog.
  - Select delivery zone (`Inside Dhaka` or `Outside Dhaka`) to apply shipping.
  - Choose payment method (COD or bKash).
  - Click "Convert to Order" -> creates live confirmed order.
* **How to Test:** Create draft order for phone customer `01911111111`, add 1 Panjabi, select Inside Dhaka, mark COD, click convert.
* **Passing Criteria:** Order appears in Orders list with `Manual Entry` flag; inventory is decremented; parcel is queued for dispatch.
* **Status:** `[x] Verified (Prompt 12: POST /admin/manual-order with risk lookup, 4-tier address, atomic inventory deduction, and audit log)`

---

### CHK-ORD-05 [P0] — Scheduled COD Stock Reservation Expiry & Call Escalation
* **Scope:** Unconfirmed COD Inventory Protection (GAP-04, GAP-06, O-03)
* **Expected Behavior:**
  - After 3 failed call attempts, order transitions from `unconfirmed` to `escalated [Red]`.
  - Scheduled background cron (P4.7) scans unconfirmed orders exceeding the configured expiry threshold (recommended default: 48 hours).
  - If unconfirmed and expired, the workflow releases atomic inventory reservation back to sellable stock and transitions order to `canceled`.
* **How to Test:** Seed a test COD order with creation timestamp 49 hours in the past and 3 logged failed calls. Trigger cron job `workflow:expire-unconfirmed-cod`.
* **Passing Criteria:** Order status updates to `canceled`; reservation item is cleared; variant sellable stock increases by reserved quantity; audit log records automated cancellation.
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

## 7. Section 6: Fulfillment, Third-Party Couriers, Delivery & Returns/Refunds

### CHK-FUL-01 [P0] — Third-Party Courier Automated Parcel Booking
* **Scope:** Courier Module (`src/modules/bd-courier`)
* **Expected Behavior:**
  - On confirmed order, staff clicks "Send to Courier" (Steadfast or Pathao).
  - System invokes courier API with recipient name, phone, address, and COD collection amount.
  - Courier returns consignment ID and tracking code; saved to order record.
  - Order shipment state updates to `Dispatched`.
* **How to Test:** On confirmed order, click "Book Steadfast Parcel" in test environment.
* **Passing Criteria:** Order displays tracking code e.g. `STDF-892147`; link opens live courier tracking; consignment ID saved in `order_bd_details`.
* **Status:** `[x] Verified (Prompt 13: automated Steadfast booking creates active consignment, logs event, updates shipment_state, and outputs 4x6 thermal shipping label batch)`

---

### CHK-FUL-02 [P0] — Manual Courier Consignment ID Fallback
* **Scope:** Courier Resilience (PRD FR-7.4.5)
* **Expected Behavior:** If third-party courier API is down or merchant uses a local delivery rider:
  - Staff can select "Manual Courier", enter courier name (e.g. "Office Rider") and paper consignment/tracking number.
  - Status transitions to `Dispatched` without blocking fulfillment.
* **How to Test:** Select "Manual Courier" on order; enter tracking "RIDER-01"; click Fulfill.
* **Passing Criteria:** Order fulfills cleanly; tracking code is visible to customer; no external API call is attempted.
* **Status:** `[x] Verified (Prompt 13: manual courier consignment assignment fallback works for in-house riders and API downtime without blocking fulfillment)`

---

### CHK-FUL-03 [P0] — Courier Webhook Ingestion & Automated "Mark as Paid"
* **Scope:** COD Settlement Reconciliation & RTO Ingestion
* **Expected Behavior:** When courier webhook posts `status: DELIVERED` for a parcel:
  - Order shipment state updates to `Delivered`.
  - COD payment status automatically transitions from `Awaiting` to `Captured` (Paid).
  - If webhook posts `status: RTO_DELIVERED` (returned): order updates to `RTO Received`; items move to `Quarantine / Damaged Location`; items are **NEVER** automatically restocked to sellable inventory (PRD FR-6.7.14, AC-6.3). Physical inspection by authorized warehouse staff is required before any sellable stock adjustment.
* **How to Test:** Post simulated Steadfast `DELIVERED` and `RTO_DELIVERED` webhook payloads with valid HMAC signature.
* **Passing Criteria:** `DELIVERED` marks payment `Captured` and sends SMS; `RTO_DELIVERED` updates shipment state to `RTO Received`, moves units to quarantine location, and leaves sellable inventory unchanged until manual inspection.
* **Status:** `[x] Verified (Prompt 13: webhook ingestion captures COD cash, enforces payload SHA-256 idempotency, routes RTO items strictly to Damaged Quarantine without restock, handles partial delivery with return_review, and reconciles remittances with variance computation)`

---

### CHK-FUL-04 [P0] — Guest Order Tracking Portal
* **Scope:** Customer Self-Service Tracking (User Journey 12)
* **Expected Behavior:** Customer visits `/track-order`, enters 11-digit mobile number and Order ID (or tracking code).
* **How to Test:** On `/track-order`, enter `01712345678` and order number `1001`.
* **Passing Criteria:** Displays order timeline (Confirmed -> Dispatched -> Out for Delivery -> Delivered); shows courier tracking number; does not expose customer's payment credentials or other customers' orders.
* **Status:** `[x] Verified (Prompt 12: verified /store/orders/track exposes masked phone, shipment state, courier tracking, and return status)`

---

### CHK-FUL-05 [P1] — Return Request, Restocking & Staff-Approved Refunds
* **Scope:** Return & Refund Lifecycle (User Journey 19)
* **Expected Behavior:**
  - Staff logs return request specifying reason and return courier tracking.
  - When returned parcel arrives at warehouse, staff clicks "Item Received & Restock" -> restores inventory by returned quantity.
  - Finance staff enters refund amount and bKash transaction ID -> clicks "Process Refund" -> payment state updates to `Refunded`.
* **How to Test:** Create return for 1 item; approve and restock; process bKash refund of ৳1,000 with trxID `BK987X`.
* **Passing Criteria:** Inventory increments by 1; refund transaction is logged in timeline with finance staff user ID; order status reflects `Refunded`.
* **Status:** `[x] Verified (Prompt 12: manual refund processing with external trxID BK987X, refund status transition to paid, and audit log recorded)`

---

### CHK-INV-01 [P0] — Order Invoice PDF Generation & Fiscal Year Numbering
* **Scope:** Server-Side Invoice Generator (A-3 Resolved, PRD FR-11.7, O-09)
* **Expected Behavior:**
  - When an order reaches `Confirmed` or `Delivered`, system asynchronously generates an immutable PDF invoice stored in S3/R2 (`D5`).
  - Invoice numbering follows Bangladesh standard July–June fiscal year: `INV-2026-27-000001`.
  - Built strictly from order-time financial snapshot (`order_line_snapshot`).
  - Itemizes product lines, discounts, delivery fee; displays VAT line only if VAT is confirmed and active (O-02).
* **How to Test:** Confirm an order; trigger invoice download via `/store/orders/:id/invoice` and `/admin/orders/:id/invoice`. Inspect generated PDF.
* **Passing Criteria:** PDF downloads cleanly; contains correct fiscal year format; prices match order placement snapshot; VAT lines omitted when unconfigured.
* **Status:** `[x] Verified (Prompt 12: verified Bangladesh July-June fiscal year numbering e.g. INV-2026-27-000001, immutable snapshot hash, and voiding audit)`

---

## 8. Section 7: Staff Roles, Permissions & Authentication Security

### CHK-SEC-01 [P0] — Role-Based Access Control (RBAC) Enforcement
* **Scope:** Admin Permissions Matrix
* **Expected Behavior:**
  - `Order Call Center`: Can view orders, confirm COD, and add notes. Cannot change product pricing, edit settings, or view profit reports.
  - `Warehouse / Dispatch`: Can view confirmed orders and book couriers. Cannot issue refunds or access customer financial data.
  - `Finance / Accounts`: Full access to contribution reports, payment settings, and refund payouts.
  - `Super Admin (Owner)`: Full unrestricted access.
* **How to Test:** Log in with Call Center credentials; attempt to open `/app/settings/bangladesh` or `/app/reports/contribution-profit`.
* **Passing Criteria:** Admin UI hides restricted links; direct URL navigation or API requests return `403 Forbidden`.
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

### CHK-SEC-02 [P0] — Authentication Security & Brute-Force Rate Limiting
* **Scope:** Admin Login API
* **Expected Behavior:**
  - Passwords hashed using bcrypt/argon2 with high work factor.
  - 5 consecutive failed login attempts on an account locks authentication for 15 minutes.
  - Sessions expire after inactivity; JWT tokens stored in HttpOnly, Secure, SameSite cookies.
* **How to Test:** Submit 6 consecutive incorrect passwords for an admin account via script.
* **Passing Criteria:** 6th attempt returns `429 Too Many Requests` or `Account locked`; session cookies are marked `HttpOnly` and `Secure`.
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

### CHK-SEC-03 [P0] — API Key & Sensitive Credential Masking
* **Scope:** Settings Security (PRD FR-12.3)
* **Expected Behavior:** bKash App Secret, SMS Gateway API Key, and Courier tokens are masked after save (`••••••••••••1234`). Full secrets are never rendered in HTML DOM.
* **How to Test:** Save bKash credentials in `/app/settings/bangladesh`. Reload page and inspect input field attributes and network response.
* **Passing Criteria:** Inputs show masked placeholder; API returns redacted string; updating another field does not overwrite secret with stars.
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

### CHK-SEC-04 [P0] — Order Tracking Rate Limiting & Phone Enumeration Defense
* **Scope:** Customer Privacy & Anti-Scraping (C-2 Resolved, O-07)
* **Expected Behavior:**
  - Tracking endpoint `/store/orders/track` requires both Order ID AND exact matching customer mobile phone number.
  - Redis token bucket limits requests to 5 attempts per minute per IP and phone number (`ratelimit:tracking:<phone>`).
  - Response masks recipient mobile number (`017****5678`).
* **How to Test:** Send 10 rapid queries to `/store/orders/track` with varying order IDs using a test script.
* **Passing Criteria:** 6th attempt returns HTTP `429 Too Many Requests`; phone enumeration and order scraping are blocked; valid query returns masked phone number.
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

## 9. Section 8: Marketing, Campaign Landing Pages & Meta Tracking

### CHK-MKT-01 [P0] — Campaign Landing Page Dynamic Renderer & Standalone Layout
* **Scope:** Campaign Builder (`/lp/[slug]`)
* **Expected Behavior:**
  - Visiting `/lp/summer-sale` renders the custom page defined in Admin builder.
  - Standard store header and footer navigation are hidden to prevent distraction and maximize conversion.
  - Hero image, offer bundles, reviews, and embedded checkout form render cleanly.
* **How to Test:** Create landing page in Admin with embedded checkout; visit URL in mobile viewport.
* **Passing Criteria:** Page loads with 0 distractions; embedded checkout form permits placing order directly from the landing page.
* **Status:** `[x] Verified (Prompt 14)`
* **Verification Evidence:**
  - Automated test script `scratch/verify-prompt14.js` Test 7 confirmed `GET /en/lp/:slug` renders standalone layout with zero distractions.
  - Client components `Navbar` and `Footer` detect `/lp/` path and return `null`, eliminating global store navigation, search input, and multi-tier footer links.
  - Mode B direct embedded checkout (`EmbeddedCheckout.tsx`) renders inline with full bundle offer selector, live BDT price updates, district/thana cascades, and instant COD submit.

---

### CHK-MKT-02 [P2] — Dual-Layer Meta Pixel + Server Conversions API (CAPI) Deduplication (Phase 2 Candidate)
* **Scope:** Meta Ads Tracking Accuracy (Phase 2 Post-Launch Enhancement per PRD FR-5.3.7; not a Phase 1 launch blocker)
* **Expected Behavior:**
  - Browser executes Meta Pixel `Purchase` event with unique `event_id` (e.g. `ord_01J...`).
  - Medusa server simultaneously sends `Purchase` event to Meta Graph API with identical `event_id` and SHA-256 hashed customer phone/email.
  - Meta Ads Manager deduplicates both events into a single attributed purchase.
* **How to Test:** Complete purchase; inspect browser Meta Pixel Helper extension; inspect server outgoing HTTP logs to `graph.facebook.com`.
* **Passing Criteria:** Both browser and server events contain matching `event_id`; server payload includes hashed `ph` and `em`; Meta Events Manager shows "Deduplicated" status.
* **Status:** `[ ] Pending Verification (Phase 2)`

---

### CHK-MKT-03 [P0] — UTM Parameter Persistence & Campaign Attribution
* **Scope:** Contribution Profit Attribution
* **Expected Behavior:** Customer arriving via ad link with `?utm_source=facebook&utm_campaign=eid_collection`:
  - UTM values persist across navigation in session/local storage.
  - Attached to order metadata upon placement.
  - Reflected in `/app/reports/contribution-profit` under campaign analytics.
* **How to Test:** Visit store with test UTM URL; browse 3 pages; place an order. Inspect order metadata in Admin.
* **Passing Criteria:** Order record contains `utm_source: "facebook"` and `utm_campaign: "eid_collection"`; reports table attributes revenue to this campaign.
* **Status:** `[x] Verified (Prompt 14)`
* **Verification Evidence:**
  - Mode B embedded checkout captures UTM parameters (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`) and landing page / ad campaign IDs directly from client and URL search params.
  - `POST /store/orders/cod` and webhook callbacks write verbatim attribution attributes into canonical PostgreSQL table `order_bd_details` (columns `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `landing_page_id`, `ad_campaign_id`).
  - Automated test suite `scratch/verify-prompt14.js` Test 8 validated that placing a COD order through Mode B checkout persisted `utm_source='facebook'`, `utm_campaign='eid_panjabi_2026'`, and `landing_page_id` directly to `order_bd_details`.
  - Contribution profit read model and reports view (`GET /admin/reports/contribution-profit`) group revenue, ad spend, and net margins by campaign attribution.

---

### CHK-MKT-04 [P1] — Automated SMS Notifications via Gateway
* **Scope:** Customer Communication (PRD §11.6)
* **Expected Behavior:**
  - Order Placement: Customer receives SMS: *"আপনার অর্ডার #[ID] সফলভাবে গ্রহণ করা হয়েছে। মোট: ৳[Total]"*.
  - Out for Delivery: Customer receives SMS with courier tracking link.
* **How to Test:** Place order with test mobile number in staging environment configured with SMS gateway sandbox.
* **Passing Criteria:** SMS gateway HTTP log returns `status: 200 / Success`; SMS is delivered to phone within 30 seconds; message text contains dynamic order ID and total.
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

## 10. Section 9: Mobile Usability, Localization, SEO & Performance

### CHK-UX-01 [P0] — Mobile Responsiveness & Sticky Action Bar
* **Scope:** Storefront Mobile Usability (360px - 414px viewports)
* **Expected Behavior:**
  - Touch targets (buttons, variant chips) are at least 44×44px.
  - When PDP main button scrolls out of view, a sticky bottom action bar appears with variant summary, price, "Add to Cart", and "Buy Now".
* **How to Test:** Emulate iPhone 14 (390px) and Android (360px) in devtools; scroll PDP up and down.
* **Passing Criteria:** Sticky bar slides in smoothly; buttons are easily clickable with thumb; zero horizontal scrolling or cut-off text.
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

### CHK-UX-02 [P0] — Bilingual Localization & Unicode Typography Stability
* **Scope:** Language Switcher (`bn` / `en`)
* **Expected Behavior:**
  - Switching between Bangla and English updates all navigation, checkout labels, and catalog text.
  - Uses Google Font `Hind Siliguri` / `Anek Bangla` with complete Bengali unicode subset.
  - Zero layout shift (CLS < 0.1) or broken glyphs when switching languages.
* **How to Test:** Toggle language switcher in navbar from EN to BN across Home, PDP, and Checkout.
* **Passing Criteria:** Numbers format as `৳ ১,২৫০` in Bangla; dates display in Bangla; all UI strings translate accurately; no untranslated raw translation keys (e.g. `checkout.title`).
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

### CHK-UX-03 [P1] — SEO Semantic Hierarchy & OpenGraph Social Previews
* **Scope:** Search Engine & Social Media Optimization
* **Expected Behavior:**
  - Every page has exactly one `<h1>` tag with proper heading hierarchy (`h1` -> `h2` -> `h3`).
  - Product page `<meta>` tags contain canonical URL, meta description, and `og:image` pointing to primary product photo.
  - WhatsApp/Facebook link share displays rich preview card with product title, price, and thumbnail.
* **How to Test:** Inspect page source on PDP; test URL in Facebook Open Graph Object Debugger.
* **Passing Criteria:** Single `<h1>`; valid OpenGraph tags; Facebook debugger renders rich product card with no warnings.
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

### CHK-UX-04 [P1] — Performance Budgets & Core Web Vitals
* **Scope:** Page Speed on 4G Mobile Networks
* **Expected Behavior:**
  - Largest Contentful Paint (LCP) < 2.5s on simulated mobile 4G.
  - Cumulative Layout Shift (CLS) < 0.1.
  - First Input Delay (FID) / Interaction to Next Paint (INP) < 200ms.
  - Images served in WebP/AVIF format with explicit dimensions.
* **How to Test:** Run Google Lighthouse audit on Home, Category, and PDP in mobile mode.
* **Passing Criteria:** Mobile performance score >= 85; LCP <= 2.5s; zero unoptimized full-size JPGs.
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

## 11. Section 10: Technical Infrastructure, Security, Migrations & Deployment

### CHK-OPS-01 [P0] — Environment Variable & Secret Separation
* **Scope:** Configuration Security
* **Expected Behavior:**
  - No secret keys, database passwords, or JWT secrets committed to Git repository (`.env` in `.gitignore`).
  - Production environment strictly utilizes separate credentials from development.
* **How to Test:** Search Git commit history for secret patterns; verify `.gitignore` contains all `.env*` files except `.env.template`.
* **Passing Criteria:** Zero credentials in git history; backend fails to start with informative error if required env vars are missing.
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

### CHK-OPS-02 [P0] — Database Migration & Rollback Integrity
* **Scope:** PostgreSQL Schema Evolution (`npx medusa db:migrate`)
* **Expected Behavior:**
  - Migrations execute cleanly on fresh PostgreSQL database without errors.
  - Foreign key constraints, unique indexes, and JSONB columns are properly provisioned.
* **How to Test:** Run `npx medusa db:migrate` on a clean test database.
* **Passing Criteria:** Migrations exit with code 0; all tables (`product_localization`, `category_attribute`, `order_bd_details`, `landing_page`) exist with correct schemas.
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

### CHK-OPS-03 [P0] — Automated Daily Database Backup & Point-in-Time Recovery
* **Scope:** Disaster Recovery & Business Continuity
* **Expected Behavior:**
  - Automated cron job dumps encrypted PostgreSQL database backup daily to offsite cloud storage.
  - Backups older than 30 days are automatically pruned.
* **How to Test:** Trigger backup script manually; verify encrypted `.sql.gz` appears in remote storage; restore dump into a test database.
* **Passing Criteria:** Restored database matches primary database record counts exactly; restore takes < 5 minutes.
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

### CHK-OPS-04 [P0] — API Rate Limiting & Anti-Abuse Protection
* **Scope:** Storefront Endpoint Security
* **Expected Behavior:**
  - Redis token-bucket limits checkout completion attempts to 5 requests/minute per IP.
  - Public search/browse endpoints limited to 60 requests/minute.
* **How to Test:** Send 10 rapid `POST /store/carts/:id/complete` requests using a curl script.
* **Passing Criteria:** 6th request receives HTTP `429 Too Many Requests`; legitimate traffic continues unhindered after throttle window.
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

### CHK-OPS-05 [P0] — Input Sanitization & SQL/XSS Injection Defense
* **Scope:** Application Security
* **Expected Behavior:**
  - All storefront and admin API routes validate request bodies using strict Zod schemas.
  - Any raw HTML or malicious script tags (`<script>alert(1)</script>`) in customer names, addresses, or review blocks are escaped or stripped.
* **How to Test:** Attempt order placement with customer name `<script>alert('xss')</script>` and SQL payload `' OR 1=1 --`.
* **Passing Criteria:** Script payload is sanitized and rendered as plain escaped text; SQL payload is parameterized safely without database syntax errors.
* **Status:** `[ ] Pending Verification (Pre-Build)`

---

## 12. Verification Summary Dashboard

| Area | Total Checks | P0 (Blockers) | P1 (High) | P2 (Medium) | Current Status |
|---|---|---|---|---|---|
| **Admin Navigation & UI** | 4 | 2 | 2 | 0 | `[ ] All Pending Build` |
| **Catalog, Pricing & Inventory** | 8 | 7 | 1 | 0 | `[ ] All Pending Build` |
| **Cart, Buy Now & Checkout** | 8 | 8 | 0 | 0 | `[ ] All Pending Build` |
| **COD & Payment Gateways** | 4 | 4 | 0 | 0 | `[ ] All Pending Build` |
| **Orders & COD Workflow** | 5 | 5 | 0 | 0 | `[ ] All Pending Build` |
| **Fulfillment, Couriers, Invoices & Returns** | 6 | 5 | 1 | 0 | `[ ] All Pending Build` |
| **Staff Roles & Security** | 4 | 4 | 0 | 0 | `[ ] All Pending Build` |
| **Marketing & Meta Tracking** | 4 | 2 | 1 | 1 | `[ ] All Pending Build` |
| **Mobile UX, SEO & Performance** | 4 | 2 | 2 | 0 | `[ ] All Pending Build` |
| **Infrastructure & Deployment** | 5 | 5 | 0 | 0 | `[ ] All Pending Build` |
| **TOTAL** | **52** | **44** | **7** | **1** | **Ready for Execution** |

*Checklist compiled and saved to [`quality-checklist.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/quality-checklist.md).*
