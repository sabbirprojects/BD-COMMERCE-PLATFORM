# Idea Proposition v4 — Bangladesh E-commerce Platform

> **Document status:** Updated proposition for owner review; not yet the final PRD.
>
> This document uses four status tags:
>
> - **[Confirmed]** — explicitly stated or approved by the project owner.
> - **[Recommended]** — a practical proposal, not a final business decision.
> - **[Open]** — the owner must decide, or technical/provider verification is still needed.
> - **[Out of Scope]** — intentionally excluded from the initial product scope.
>
> **Important rule:** An item without a status tag is not automatically confirmed. If its status is unclear, treat it as `[Open]` and resolve it before implementation. Recommendations must not silently become requirements.

---

## 1. Project Overview

**[Confirmed]** I want to build a modern, mobile-first, single-vendor, multi-category and multi-variant B2C e-commerce platform for the Bangladesh market. It will have a customer storefront and a centralized Admin Panel so the business owner and authorized staff can manage products, orders, delivery, marketing and supported storefront content.

**[Confirmed]** The platform should take inspiration from the useful parts of established commerce systems, without copying any one platform:

- **[Confirmed]** Shopify-inspired commerce basics: products, categories, variants, inventory, orders, payments and customers.
- **[Confirmed]** Saleecom-inspired campaign workflow: landing pages, campaign offers, direct customer journeys and advertising attribution.
- **[Confirmed]** WooCommerce-inspired modularity: integrations that can be added or changed when needed.

**[Confirmed]** The product should be practical for a small business in Bangladesh. Customer shopping should feel simple and trustworthy, while administration should be clear enough for non-technical staff. Avoid unnecessary complexity, expensive dependencies and features that do not support the first release.

## 2. Business Scope and Boundaries

### 2.1 Platform scope

- **[Confirmed]** Single-vendor B2C e-commerce store.
- **[Confirmed]** Multiple product categories and support for product variants.
- **[Confirmed]** Bangladesh-focused delivery and business operations.
- **[Confirmed]** Mobile-first customer storefront and centralized Admin Panel.
- **[Confirmed]** Storefront and Admin Panel must both support Bangla and English.
- **[Confirmed]** Campaign and landing-page support is part of the product vision.
- **[Recommended]** Start with one warehouse/stock location and physical products only; keep the design understandable rather than building multi-warehouse complexity early.

### 2.2 Out of scope for the initial release

- **[Out of Scope]** Multi-vendor marketplace, vendor registration, vendor dashboard, vendor approval, vendor commission and vendor payout.
- **[Out of Scope]** Card payments in the initial scope.
- **[Out of Scope]** An unrestricted visual design editor comparable to professional design software. Use manageable templates, sections and approved settings instead.
- **[Out of Scope]** Fully automated order creation from private/social messages where no supported and approved integration is available. Provide a simple manual Admin order-entry workflow for these cases.
- **[Recommended]** Keep digital products, pre-orders, backorders and multi-warehouse inventory out of the first release unless a real business requirement appears.

## 3. Main Product Goals

- **[Confirmed]** Make shopping simple, fast, mobile-friendly and trustworthy.
- **[Confirmed]** Support category-appropriate product information and shopping journeys.
- **[Confirmed]** Keep product, variant, stock, order and payment information consistent across the whole platform.
- **[Confirmed]** Let authorized staff manage the business through a clear Admin Panel.
- **[Confirmed]** Allow the owner to manage supported storefront content, banners, homepage sections and theme settings without editing code.
- **[Confirmed]** Support campaign landing pages and basic campaign attribution.
- **[Confirmed]** Present useful sales and business-cost information without presenting estimates as final profit.
- **[Confirmed]** Support Bangla and English throughout the storefront and Admin Panel with a polished, stable interface.
- **[Confirmed]** Keep the architecture modular enough to add integrations later without overengineering the first release.

## 4. Core Platform Modules

### 4.1 Commerce core

- **[Confirmed]** Product and category management.
- **[Confirmed]** Product attributes, variants, SKU and inventory.
- **[Confirmed]** Pricing, discount and offer management.
- **[Confirmed]** Cart, checkout and order management.
- **[Confirmed]** Payment records and customer information.
- **[Confirmed]** Delivery, courier, cancellation, return and refund workflows appropriate to supported providers.
- **[Recommended]** Maintain one authoritative product, price and inventory record. Product pages, category pages, campaign pages and checkout must use the same underlying data rather than separate copies.

### 4.2 Products, attributes and variants

- **[Confirmed]** Product structures should be suitable for different categories rather than forcing every category to use identical fields.
- **[Recommended]** A product may have attributes such as size, colour, weight, pack size, model or material when relevant.
- **[Recommended]** Treat Brand as a product-level catalog entity, not a variant option, where brand filtering is needed.
- **[Open]** Maximum number of variant options per product. Suggested default: up to three options, such as Size, Colour and Pack Size, but validate against expected products before locking it.
- **[Recommended]** Where needed, each variant should have its own SKU, price, stock quantity and image.
- **[Confirmed]** Category filters and variant selectors should only show information relevant to that category.

Examples, not a mandatory category list:

- **[Recommended]** Fashion: size, colour, fit, size guide and variant stock.
- **[Recommended]** Electronics: brand, model, specifications and warranty information.
- **[Recommended]** Grocery/food: weight, quantity, pack size and relevant freshness information.
- **[Recommended]** Beauty/personal care: shade, size, type and relevant ingredients.

## 5. Customer Storefront and Shopping Journeys

### 5.1 General experience

- **[Confirmed]** The storefront should be mobile-first, easy to understand and responsive.
- **[Confirmed]** Product price, selected variant, delivery charge and any applicable extra charge should be clear before the customer places an order.
- **[Confirmed]** Guest checkout and order tracking should be supported.
- **[Recommended]** Use short forms and avoid unnecessary checkout steps. Ask only for the information needed to deliver and manage the order.
- **[Recommended]** Provide clear order confirmation, tracking details and cancellation/return policy information.

### 5.2 Cart, Buy Now and checkout rules

The same cart, product, pricing, inventory and order system must be used for every shopping journey. A different entry point must not create a separate or inconsistent version of the product or stock.

- **[Confirmed]** Add to Cart adds the selected product variant to the customer’s cart.
- **[Confirmed]** Clicking Buy Now must not silently remove or overwrite products already in the cart.
- **[Confirmed]** Checkout must support multiple products and allow the customer to review and adjust quantities before placing the order.
- **[Confirmed]** The system must validate variant, current price, stock and delivery charge on the server before order placement.
- **[Recommended]** **Buy Now default:** add the selected variant to the existing cart, preserve all other cart items, and take the customer directly to the checkout/review step. If that exact variant is already in the cart, do not silently create a duplicate line or unexpectedly increase its quantity; show it in the combined order and let the customer change quantity.
- **[Recommended]** The checkout should make it clear that the order includes the existing cart items as well as the Buy Now item. The customer can remove an item or edit its quantity before confirming the order.
- **[Recommended]** If the customer is not ready to place the order, their cart should remain available when they return to shopping.
- **[Recommended]** When stock has changed or a price is no longer current, show the updated state and ask the customer to review it instead of silently accepting an invalid order.
- **[Recommended]** Prevent duplicate orders caused by repeated taps, browser refreshes or slow network responses.

**[Recommended] Standard flow:** Product page or listing → Add to Cart / Buy Now → Order review and checkout → Order confirmation → Order tracking. Buy Now skips unnecessary navigation but does not bypass review or remove existing cart items.

### 5.3 Campaign and landing-page checkout

- **[Confirmed]** Landing pages must use the same catalog, stock, price and order records as the standard storefront.
- **[Recommended]** Default campaign checkout: add the selected campaign product/variant to the current cart, preserve existing cart items and take the customer to checkout. Show the order contents clearly, including any campaign discount and its conditions.
- **[Recommended]** Keep campaign ID, landing-page ID and UTM parameters with the checkout/order where available, without changing the actual cart contents or price rules.
- **[Recommended — not in first release; shared cart is the default]** A separate “campaign-only order” that excludes regular cart items is not included in the first release. Campaign checkout uses the shared cart and must preserve existing cart items by default (confirmed in Decision Register Item 5 and Section 9.1). If added later, it must be a clearly distinct, intentional option and must never delete the regular cart.
- **[Recommended]** A campaign must not promise an unavailable product, an expired offer or a discount that fails validation at checkout.

### 5.4 Customer trust and convenience

- **[Confirmed]** Support COD, bKash and Nagad from launch, using the selected provider/merchant integrations that are available and approved.
- **[Confirmed]** Orders placed through the website must be created automatically by the system; staff should not need to re-enter them manually.
- **[Confirmed]** Admin staff must be able to create orders manually for orders received through phone calls, Facebook/WhatsApp or other personal messages when they are not created through a supported integration.
- **[Confirmed]** Customers should be able to track an order using a suitable order reference and phone verification, without being forced to register first.
- **[Recommended]** Provide order notifications for the statuses the business can reliably confirm.
- **[Open]** The exact notification channels (SMS, email or other providers) and their launch budget must be confirmed before implementation.

## 6. Admin Panel and Staff Workflows

The Admin Panel should help staff understand what needs attention, complete common tasks quickly and avoid changing unrelated settings by mistake.

### 6.1 Proposed navigation

These are proposed module groupings, not a final locked menu. Review them during PRD creation and remove unnecessary duplication.

1. **Dashboard** — **[Recommended]** sales and orders overview, low-stock alerts, pending tasks and recent activity.
2. **Orders** — **[Confirmed]** order details, order status, delivery status, cancellations, returns and refunds. **[Recommended]** COD confirmation status and risk flags.
3. **Catalog** — **[Confirmed]** products, categories, attributes, variants, brands where needed, images and media.
4. **Inventory** — **[Confirmed]** stock by variant, manual adjustments, low-stock alerts and inventory history.
5. **Customers** — **[Confirmed]** contact details, order history and relevant support information, with access limited by staff permissions.
6. **Marketing** — **[Confirmed]** campaigns, landing pages, offers, discounts, attribution and campaign reporting.
7. **Payments and Finance** — **[Confirmed]** payment records, COD settlement tracking, refunds, product costs and business expenses when those features are enabled. **[Confirmed]** Payment methods and supported merchant account/integration settings must be manageable from Admin Panel.
8. **Delivery** — **[Confirmed]** delivery zones, shipping charges, courier settings, tracking, failed delivery and RTO records.
9. **Reports** — **[Recommended]** sales, products, inventory, customers, campaigns, expenses and contribution-profit reports.
10. **Content and Storefront** — **[Confirmed]** homepage sections, hero banners, category presentation, informational pages and navigation menus.
11. **Settings** — **[Confirmed]** store information, appearance, localization, delivery, payment, marketing, SEO, staff access and system settings.

### 6.2 Staff access and security

- **[Recommended]** Start with Owner, Manager and Staff roles if more than one person will operate the store.
- **[Recommended]** Owner: full business access, including finance and system configuration.
- **[Recommended]** Manager: daily orders, catalog, inventory, customers and marketing; restricted access to credentials, staff administration and high-risk settings.
- **[Recommended]** Staff: assigned operational tasks only; no access to sensitive finance information or integration secrets unless specifically approved.
- **[Open]** Final roles and permissions depend on the actual team. Confirm them before implementation.
- **[Recommended]** Require stronger login protection such as 2FA for privileged users if practical for the chosen authentication system. Check setup and recovery experience before making it mandatory for every staff member.

## 7. Central Settings, Theme and Storefront Management

### 7.1 Global design settings

- **[Confirmed]** Storefront appearance should use shared design tokens rather than hardcoding the same colours, fonts and component styles separately on different pages.
- **[Recommended]** Allow the owner to configure approved options such as primary/secondary colours, backgrounds, text, accents, buttons, borders, font choices and typography scale.
- **[Recommended]** Accept colour values such as `#043915` only after validation. Warn about poor text/background contrast and prevent obviously unreadable theme combinations from being published where technically feasible.
- **[Recommended]** Keep the Admin Panel itself readable and consistent even when the storefront theme changes.
- **[Recommended]** Show a storefront preview before publishing theme changes. Provide a way to restore the previous published theme if the new one causes a problem.
- **[Open]** Confirm how much theme customization the owner needs. Suggested default: controlled design tokens and supported component styles, not arbitrary CSS or unrestricted page styling.

### 7.2 Homepage and section manager

- **[Confirmed]** The owner should be able to add, edit, hide/show and reorder supported homepage sections without changing code.
- **[Confirmed]** Supported settings should include hero banners/slides, images, headings, descriptions, button labels and destination links.
- **[Confirmed]** The owner should be able to select featured products/categories and manage promotional sections.
- **[Recommended]** Each section should use a small set of tested layouts instead of arbitrary positioning.
- **[Recommended]** Preview the homepage on desktop and mobile before publishing.
- **[Recommended]** Validate required fields, images and destination links before publishing. Warn if a banner links to a missing page, unpublished campaign or unavailable product.
- **[Recommended]** Keep the last published version so the owner can restore it if a change breaks the homepage.

### 7.3 Category and content settings

- **[Confirmed]** The owner should be able to manage category names, descriptions, images, banners, filters and supported presentation settings.
- **[Confirmed]** Informational content should be manageable without editing code. Examples include About Us, Contact Us, FAQ, Privacy Policy, Terms and Conditions, Shipping Policy, and Return/Refund Policy.
- **[Recommended]** Allow pages to be drafted, previewed, published or unpublished, with basic SEO metadata where required.
- **[Recommended]** Keep settings for the same purpose in one obvious location; avoid duplicate controls that can contradict each other.
- **[Recommended]** Changes to content and theme must not accidentally change historical orders, stock or payment records.

## 8. Bangla and English Language Support

This is a core product requirement for both the customer-facing storefront and the Admin Panel, not a later enhancement.

### 8.1 Language switch

- **[Confirmed]** Both the storefront and Admin Panel must support Bangla and English.
- **[Confirmed]** Provide a simple, visible language-switch control, such as `বাংলা | English`, in the storefront header and in a consistent place in the Admin Panel.
- **[Confirmed]** Users must be able to change language without being forced to leave the current page or restart their workflow.
- **[Recommended]** After switching language, keep the user on the same page and preserve useful state such as the current product, cart, selected variants, checkout inputs and Admin Panel screen where safe.
- **[Recommended]** Do not translate or mutate product identifiers, order numbers, SKU values, phone numbers or other reference data. Only translate their labels where needed.

### 8.2 Save language preference

- **[Recommended]** For guest storefront users, remember the selected language using a suitable browser preference mechanism. If the user has an account, sync it to their profile when appropriate.
- **[Recommended]** Remember the Admin Panel user’s language preference separately from the storefront preference, so an admin can work in Bangla while a customer-facing preview is set to English, or vice versa.
- **[Confirmed]** Default language for first-time storefront visitors is **English**. The Bangla switch is immediately visible and the preference can be changed at any time; this may be revisited based on usage data. Admin users have a separately stored language preference from the storefront preference.
- **[Recommended]** If a saved preference cannot be read, use the configured default and keep the switch functional.

### 8.3 Interface and content translations

- **[Confirmed]** Core interface text in both areas must be available in Bangla and English: navigation, buttons, forms, field labels, validation messages, statuses, empty states, dialogs, checkout, order tracking and Admin Panel actions.
- **[Recommended]** Keep interface translations in a consistent localization system rather than scattering language conditions throughout components.
- **[Recommended]** Admin-managed content that appears in both languages—such as product names/descriptions, categories, banners, menus, FAQ, policies and landing pages—should have separate Bangla and English fields where translation is needed.
- **[Recommended]** Clearly show the admin when one language version is missing. Do not silently publish blank text; offer a safe fallback or a warning according to the content type.
- **[Open]** Decide whether all customer-facing content must be translated before publishing or whether one language may temporarily use a fallback. Suggested default: warn for missing translations and prevent publishing critical checkout/policy content if its required translation is missing.
- **[Recommended]** Do not silently machine-translate published business, legal or product content. The owner/editor should review translations before publishing.

### 8.4 Stable visual design across languages

- **[Confirmed]** Switching language must not cause major layout shifts, overlapping text, clipped content, distorted buttons, broken cards or unusable forms/tables.
- **[Recommended]** Use fonts that render Bangla and Latin text reliably, with appropriate fallback fonts. Test font weight, line height, punctuation and numerals in both languages.
- **[Recommended]** A possible font setup is a Bangla-supporting family such as Noto Sans Bengali or Hind Siliguri with a reliable Latin fallback; final font choice should be checked against performance, legibility and brand direction.
- **[Recommended]** Design components for different text lengths. Buttons and navigation may need flexible width, wrapping or responsive spacing; avoid fixed heights that clip Bangla or longer English labels.
- **[Recommended]** Test mobile, tablet and desktop layouts in both languages, including long product titles, error messages, cart rows, checkout fields, admin tables and dialogs.
- **[Recommended]** Check that language switching does not reset cart contents, checkout state, filters, page context or unsaved admin edits. Warn before leaving a form only when unavoidable.
- **[Recommended]** Use a small visual regression checklist for the key pages in each language before release.

## 9. Campaign Workflow and Landing Page Builder

- **[Confirmed]** The first release must include a template- and section-based landing-page builder using the existing product catalog; this is not deferred to a later phase.
- **[Confirmed]** Authorized staff must be able to create, edit, preview, publish and unpublish campaign pages from Admin Panel without writing code for each campaign.
- **[Confirmed]** Launch scope includes campaign product selection, offer/discount details, responsive sections, Bangla/English content and direct checkout/order review.
- **[Recommended]** Core controls should include reusable sections, mobile preview, page duplication, basic SEO settings, validation before publishing and rollback to the last published version.
- **[Confirmed]** Use a controlled set of tested templates and configurable sections rather than an unrestricted visual design editor.
- **[Open]** Landing-page quantity and media limits should be based on hosting and operational capacity rather than promising “unlimited” usage without validation.

### 9.1 Checkout entry modes

- **[Recommended] Mode A — Product detail first:** Landing page → Product detail page → combined cart/checkout.
- **[Confirmed] Mode B — Direct checkout:** Landing page → combined checkout/order review → order confirmation.
- **[Confirmed]** Direct checkout must clearly show the selected product/variant, quantity, offer conditions, delivery charge and order total before order submission.
- **[Confirmed]** Campaign checkout uses the same shared cart, catalog, inventory, pricing and order system as the standard storefront. It must preserve existing cart items by default and must never silently clear them.
- **[Recommended]** Keep campaign ID, landing-page ID and UTM parameters with the checkout/order where available.
- **[Confirmed]** Do not create duplicate stock or a separate order system for campaign pages.
## 10. Marketing, Meta Tracking and Attribution

- **[Recommended]** Use one centrally managed Meta Pixel configuration for the storefront and published landing pages.
- **[Recommended]** Track relevant standard events, test that events fire correctly and deduplicate browser/server events when Conversions API is used.
- **[Recommended]** Preserve campaign ID, landing-page ID and UTM information with an order where available.
- **[Recommended]** Keep Meta Ads Manager campaign creation outside this project; the platform should provide store-side tracking, attribution and reporting.
- **[Recommended]** Separate Meta-reported results from store-verified orders and financial calculations because attribution methods can produce different numbers.
- **[Open]** Confirm whether Meta Conversions API is practical for launch based on technical setup, consent/privacy requirements and available resources.
- **[Recommended]** Use manual advertising-spend entry at launch if no reliable spend integration is ready; add a spend API later only if it saves meaningful work.
- **[Open]** Review applicable consent and privacy requirements before turning on tracking. Tracking must respect the final approved privacy approach.

## 11. Bangladesh-Specific Operations

### 11.1 Currency, payments and address

- **[Confirmed]** Use BDT (৳) for store prices and financial reports.
- **[Confirmed]** Support Bangladesh delivery addresses and delivery charges.
- **[Confirmed]** COD, bKash and Nagad must be available at launch, subject to the chosen provider's supported methods and completed merchant onboarding.
- **[Confirmed]** Admin Panel must provide a Payment Settings/Payment Methods area where authorized users can add, edit, enable/disable and remove payment methods, and manage supported merchant account/integration configuration.
- **[Confirmed]** Disabling a payment method must hide it from checkout without corrupting historical orders or payment records.
- **[Confirmed]** Card payments are out of the initial scope.
- **[Recommended]** Use a practical address structure such as division, district, upazila/thana, area and address line, but keep fields appropriate for the selected courier.
- **[Confirmed]** The platform is built for direct Merchant API integration with bKash and Nagad. Actual setup requires merchant approval and valid credentials, which are post-build dependencies — not a reason to defer the launch requirement. See Section 18.3 for provider verification tasks.
- **[Recommended]** Store API secrets securely and never expose them in ordinary Admin forms or client-side code. Verify online payment callbacks/webhooks on the server and process duplicate notifications safely.

### 11.2 COD risk management

- **[Recommended]** Validate Bangladesh phone number formats and provide a clear error message for invalid numbers.
- **[Open]** Phone OTP before COD order, a phone/address blocklist and risk-based advance payment rules add cost and friction. Suggested practical default: manual order confirmation and risk flags first; add OTP/blocklist after validating delivery loss and abuse levels. If the owner wants OTP at launch, confirm the SMS provider and budget.
- **[Recommended]** Track COD confirmation as a separate operational state, such as unconfirmed, confirmed or unreachable.
- **[Recommended]** Warn staff about previous failed deliveries/RTOs and detect obvious duplicate orders where practical.
- **[Recommended]** Define when stock is reserved for an unconfirmed order and when it is released.

### 11.3 Delivery zones and courier integration

- **[Recommended]** Start with a small, understandable set of delivery zones, such as Dhaka city and outside Dhaka, if that fits the actual courier pricing. Add district-level detail only when useful.
- **[Open]** Final zone structure and delivery prices need owner and courier confirmation.
- **[Recommended]** Support zone-based flat charges first. Add weight-based rules or free-delivery thresholds only when the business needs them.
- **[Open]** Choose the first courier only after checking real API capabilities, onboarding, tracking, COD settlement and return/RTO support.
- **[Recommended]** Launch with one courier integration if it is ready; otherwise provide a documented manual fallback for consignment ID and shipment status. Do not block all order operations on an unavailable API.
- **[Recommended]** Track courier-collected, settled and pending COD amounts separately when the courier provides the necessary data.

### 11.4 Order, payment and shipment statuses

- **[Recommended]** Keep order status, payment status and shipment status as separate fields. They describe different things and must not be collapsed into one confusing status.
- **[Recommended]** Example order flow: Pending → Confirmed → Processing → Ready to Ship → Completed/Delivered. Allow controlled exceptions such as Cancelled or Failed Delivery.
- **[Recommended]** Shipment states may include Booked, Shipped, Out for Delivery, Delivered, Failed Delivery, Return to Origin (RTO) and RTO Received, depending on courier capability.
- **[Recommended]** Payment states may include Unpaid, Pending, Paid, Partially Refunded and Refunded where applicable.
- **[Open]** The final status names and allowed transitions must be settled in the PRD. For every transition, define whether stock, customer notifications, finance totals and courier actions change.

### 11.5 Failed delivery, RTO, returns and refunds

- **[Recommended]** Record failed-delivery reason, attempt count, redelivery decision and whether the parcel is returned to the warehouse.
- **[Recommended]** When an RTO item returns, staff should record whether it is sellable, damaged or not restockable before updating inventory.
- **[Recommended]** Record outbound delivery and return/RTO costs against the order whenever the real cost is available.
- **[Recommended]** A COD RTO normally has no customer payment to refund; a prepaid order must follow the approved refund rules.
- **[Open]** Return window, who pays return shipping, non-returnable categories and the refund method need owner approval. Suggested starting point: a clear, configurable return policy; handle faulty or incorrect items separately; record any manual refund in the system.
- **[Recommended]** Support cancellation before shipment. After shipment, route the case through refusal, failed delivery or RTO rather than pretending the parcel was never sent.
- **[Recommended]** Track return approval, returned quantity, item condition, stock disposition and refund status independently.

### 11.6 VAT, invoices and notifications

- **[Open]** VAT registration, VAT display and legal invoice requirements must be verified for the business. Do not assume a tax treatment is legally correct without checking it.
- **[Recommended]** Provide a basic order invoice/summary with order number, items, discounts, delivery charge and total. Show VAT fields only according to confirmed requirements.
- **[Confirmed]** SMS notification infrastructure is required in Phase 1 — including Admin-configurable gateway settings, message templates, delivery logging, and manual resend controls. Actual SMS delivery is not operational and must not be described as operational until a suitable gateway is selected, configured, and tested. Launch is not blocked by unresolved gateway selection, but the infrastructure must be built and configurable at launch. See Section 18.3 for gateway verification tasks.
- **[Recommended]** Email can be optional when the customer supplies an email address and the business has email delivery configured.

## 12. Inventory, Checkout and Order Reliability

- **[Confirmed]** Validate current price, selected variant and available stock on the server during checkout.
- **[Recommended]** Ensure concurrent purchases cannot oversell stock.
- **[Recommended]** Prevent duplicate orders and duplicate payment processing when the customer taps repeatedly, refreshes or experiences a slow connection.
- **[Recommended]** Define stock reservation and expiry only where needed; release reserved stock on cancellation, timeout or failed payment according to explicit rules.
- **[Recommended]** Define inventory changes for cancellation, partial return, full return, damaged return and RTO.
- **[Recommended]** Save an order-time snapshot of product title/SKU, variant, unit price, discount, delivery charge and relevant product cost. Later edits to the catalog must not rewrite old order history.
- **[Recommended]** Define how product discounts, campaign offers and coupons combine. Suggested default: one coupon per order and no discount stacking unless a rule explicitly allows it.
- **[Confirmed]** Keep cart, Buy Now and campaign checkout behavior consistent with Section 5; never silently clear the existing cart.

## 13. Finance and Contribution-Profit Reporting

The reports should help the owner understand business performance, not display a misleading “profit” number when important costs are missing.

### 13.1 Definitions and basic formulas

These are proposed reporting definitions. They must be reviewed in the PRD and matched to the business’s actual bookkeeping practices.

- **[Recommended] Gross merchandise sales** = sum of item selling prices × quantities before discounts for orders that qualify as sales under the approved reporting rule. Suggested default for actual sales/contribution reports: count delivered orders, and show pending/unconfirmed orders separately as an operational pipeline. Exclude cancelled, failed-delivery and RTO orders from delivered sales, but still record costs already incurred.
- **[Recommended] Discounts** = product discounts + eligible campaign/coupon discounts recorded for the order.
- **[Recommended] Net merchandise sales** = gross merchandise sales − discounts − completed item refunds/credit adjustments.
- **[Recommended] Delivery charge collected** = the amount charged to the customer for delivery, less any delivery-charge refund.
- **[Recommended] Product cost (COGS)** = recorded cost of the quantities actually sold and not subsequently returned to sellable stock. For partial returns, adjust by returned quantity and item condition.
- **[Recommended] Order contribution before advertising** = net merchandise sales + delivery charge collected − product cost − packaging/fulfillment cost − actual delivery/courier cost paid by the store − payment fees − return/RTO costs and other directly attributable variable costs.
- **[Recommended] Contribution profit after advertising** = order contribution before advertising − the allocated advertising cost for the selected reporting period/campaign.
- **[Recommended] Net profit must not be shown unless appropriate overhead, payroll, rent, tax and other required cost categories are included and the calculation has been validated.** If they are not included, label the report “Contribution Profit” or “Estimated Contribution Profit,” not “Net Profit.”

### 13.2 Reporting rules

- **[Recommended]** Show refunds as completed financial events. A return request that has not been approved or refunded must not be counted as if money has already been refunded.
- **[Recommended]** Cancelled orders that were never delivered or paid should not inflate delivered sales. Any costs already incurred, such as courier or RTO fees, should still be recorded.
- **[Recommended]** For partial returns, update the returned quantity, refund amount, recoverable stock and associated costs without deleting the original order history.
- **[Recommended]** Track customer-paid delivery charges separately from the courier cost charged to the business.
- **[Recommended]** Store payment fees, packaging costs, product costs, delivery costs and RTO costs separately where data is available. Do not use a guessed cost as if it were actual.
- **[Recommended]** If a cost is missing, clearly flag the report as incomplete or estimated and identify which cost is missing.
- **[Recommended]** Record advertising spend against a campaign and date range. Keep the source and date of any manual entry.
- **[Open]** Advertising allocation method needs approval. Suggested initial method: distribute manually entered campaign spend across attributed delivered orders by their net merchandise value, and label the result as an allocation estimate rather than exact causation.
- **[Recommended]** Keep store-recorded orders/sales separate from Meta-reported attribution and ROAS.

### 13.3 When is a figure estimated versus final?

- **[Recommended] Estimated:** one or more material inputs are missing, such as final delivery cost, courier settlement, payment fee, return outcome, product cost or ad-spend allocation.
- **[Recommended] Operationally reconciled contribution:** the order has a known delivery/return outcome and the relevant payment, product cost, delivery/courier cost, refund and other direct-cost records have been entered or reconciled.
- **[Recommended]** Even a reconciled contribution figure is not automatically the business’s full net profit. Fixed overhead and applicable tax/accounting treatment may remain outside the calculation.
- **[Open]** Final accounting definitions and VAT handling must be checked against the owner’s bookkeeping and applicable rules before financial reports are treated as official accounts.

## 14. Security and System Reliability

- **[Confirmed]** Use secure authentication, server-side validation, role-appropriate permissions and safe handling of personal data.
- **[Recommended]** Maintain audit history for important actions such as price/stock adjustments, refunds, role changes, order status changes and theme publishing.
- **[Recommended]** Store integration secrets securely and never display full secret values in the Admin Panel after saving.
- **[Recommended]** Verify payment/courier webhook signatures when provided by the provider and handle duplicate events safely.
- **[Recommended]** Apply rate limits to login, OTP and other abuse-prone endpoints where appropriate.
- **[Recommended]** Set up backups and test a practical recovery procedure before launch.
- **[Recommended]** Make integration failures visible to authorized staff and provide a manual fallback for critical delivery work.
- **[Open]** Review which Bangladesh e-commerce, privacy and data-retention rules apply to this business before launch. Do not make a legal-compliance claim without verification.

## 15. Practical Implementation Phases

Phases are recommendations, not a promise that every listed feature is automatically required. The final PRD should confirm scope, dependencies, cost and effort.

### Phase 1 — Core Store, Payments, Admin Controls and Campaigns

- **[Confirmed]** Authentication and the necessary Admin access controls.
- **[Confirmed]** Product catalog, categories, attributes/variants and inventory for the agreed initial product range.
- **[Confirmed]** Bangla/English support in storefront and Admin Panel, including visible language switching and essential interface translations.
- **[Confirmed]** Shared cart, combined Buy Now checkout, guest checkout, order review and order confirmation.
- **[Confirmed]** COD, bKash and Nagad at launch, plus Admin controls for payment methods and supported merchant/integration settings.
- **[Confirmed]** Website orders are created automatically. Provide a manual Admin order-creation form for phone and personal-message orders.
- **[Confirmed]** Campaign landing-page builder, configurable sections/offers, preview/publish controls, multilingual content and direct checkout/order review.
- **[Confirmed]** Basic delivery zones/charges and clear order/payment/shipment status handling.
- **[Recommended]** One courier integration if a suitable API is verified; otherwise manual shipment booking/status fallback.
- **[Recommended]** Essential order confirmation and guest order tracking.
- **[Confirmed]** Configurable, manual-only Return & Refund Management — including Admin-configurable policy settings, permission-gated manual review/approval/processing, independent return/refund status tracking, and full audit logging. No automatic approval, initiation, or execution of any refund (see Section 11.5). This is a Phase 1 launch requirement.
- **[Confirmed]** Storefront theme, homepage/content management, essential policy pages and safe publishing workflow.
- **[Recommended]** Server-side stock/price checks, secure credential handling, backups and basic audit logs.
- **[Open]** Any automated social-message order integration must be assessed against actual platform/API availability, permissions, cost and reliability. Keep manual Admin order creation available as a fallback.

### Phase 2 — Enhancements After Launch

- **[Recommended]** Advanced theme and page customization beyond the initial tested templates.
- **[Recommended]** Expanded campaign reporting, more advanced attribution and improved cost allocation.
- **[Recommended]** Meta Pixel/Conversions API and other tracking only after privacy/consent decisions and event testing.
- **[Recommended]** Additional couriers, additional payment providers, ad-spend APIs and social messaging automation where verified support and business value justify them.

### Phase 3 — Reporting and Operational Improvements

- **[Recommended]** Expanded expense capture, COD settlement reconciliation, return/RTO cost tracking and contribution-profit reporting.
- **[Recommended]** Campaign-performance reports and improved cost allocation.
- **[Recommended]** Add further couriers, payment providers, Meta spend APIs or other integrations only when they provide clear business value and their support has been verified.
- **[Recommended]** Advanced automation and operational improvements based on actual store activity.

## 16. Design and Implementation Principles

- **[Confirmed]** Customer experience and Admin Panel usability both matter.
- **[Confirmed]** Category-specific shopping should be created through configuration where practical, not duplicate applications or separate stock systems.
- **[Confirmed]** The product catalog, inventory, cart, orders and payments must remain consistent across storefront pages and campaigns.
- **[Confirmed]** The owner must be able to manage the agreed content and appearance settings without changing code.
- **[Confirmed]** Bangla/English support must be designed into the product and tested as part of the same interface, not bolted on later.
- **[Recommended]** Implement essential workflows before advanced automation.
- **[Recommended]** Prefer a small number of well-tested integrations and clear fallbacks over a large abstract integration framework.
- **[Recommended]** The AI coding agent should inspect the current project, identify dependencies and note unresolved requirements before starting implementation.
- **[Confirmed]** Do not start implementation from an unclear or unapproved requirement. Keep assumptions visible and request owner input when a decision materially changes customer behavior, cost, security or operations.

## 17. Instructions for Creating the PRD Later

When this proposition is approved, the PRD should:

1. **[Confirmed]** Keep confirmed decisions separate from recommendations and open questions.
2. **[Recommended]** Describe customer, admin and staff user journeys with realistic examples.
3. **[Recommended]** Define module boundaries and data relationships for products, variants, inventory, orders and payments.
4. **[Recommended]** Specify cart, Buy Now and campaign checkout behavior, including existing-cart contents, duplicate clicks, stock changes, price changes and session recovery.
5. **[Confirmed]** Define Bangla/English behavior for both storefront and Admin Panel, including saved preference, translation coverage and layout acceptance criteria.
6. **[Recommended]** Define publishing, validation, preview, rollback and permissions for themes, homepage sections and landing pages.
7. **[Recommended]** Settle order/payment/shipment status transitions, stock effects, cancellation, return, refund and RTO workflows.
8. **[Recommended]** Define financial formulas with worked examples for discounts, partial refunds, delivery costs, ad spend and missing data.
9. **[Recommended]** Provide acceptance criteria and test cases for every launch-critical requirement.
10. **[Recommended]** Confirm provider capabilities, onboarding, costs and fallback behavior instead of assuming an integration will work.
11. **[Confirmed]** Do not start coding until the owner reviews and approves the PRD and implementation plan.

## 18. Decision Register

### 18.1 Confirmed requirements

- **[Confirmed]** Bangladesh-focused single-vendor B2C store.
- **[Confirmed]** Mobile-first storefront, centralized Admin Panel, multiple categories and product variants.
- **[Confirmed]** Bangla and English support in both storefront and Admin Panel, including visible language switching.
- **[Confirmed]** COD, bKash and Nagad are required at launch; BDT is the store currency.
- **[Confirmed]** Admin Panel must allow authorized users to add, edit, enable/disable and remove payment methods and manage supported account/integration settings securely.
- **[Confirmed]** Website orders are created automatically; personal-message/phone orders can be entered manually in Admin Panel when no supported integration creates them.
- **[Confirmed]** Card payment is out of the initial scope.
- **[Confirmed]** The Buy Now action must not delete or overwrite existing cart items.
- **[Confirmed]** Checkout must support multiple products and quantity editing.
- **[Confirmed]** Campaign landing-page builder and direct checkout/order review are part of the first release.
- **[Confirmed]** Campaign pages must use the same product, price, inventory, cart and order systems as the normal store.
- **[Confirmed]** The first release should remain practical; unnecessary feature complexity should be avoided.

### 18.2 Open owner decisions

| # | Decision | Suggested default | Why it matters |
|---|---|---|---|
| 1 | Default language for first-time storefront visitors and new admin users | **[Confirmed] English** — Bangla switch is immediately visible; preference changeable at any time; may be revisited based on usage data; admin accounts have a separately stored language preference | Owner decision recorded; implementation can proceed |
| 2 | Missing translation behavior | Warn in Admin; require complete translation for critical checkout/policy content | Prevents blank or confusing customer-facing content |
| 3 | Payment provider and Admin controls | **[Confirmed]** COD, bKash and Nagad at launch via direct Merchant API integration. Actual transactions require merchant approval and credentials (post-build setup dependency). Admin provides configuration and enable/disable controls for each method. | Direct Merchant API approach confirmed; merchant onboarding is a post-build dependency |
| 4 | Buy Now when the selected variant is already in cart | Keep its current quantity; do not silently duplicate; allow editing at checkout | Avoids unexpected cart changes |
| 5 | Campaign-only checkout separate from the regular cart | Direct campaign checkout/order review is in launch scope and preserves existing cart items by default; no separate cart system | Keeps checkout consistent and avoids lost cart contents |
| 6 | Variant option limit | Start with up to three if real products fit | Limits complexity but should not block legitimate products |
| 7 | Warehouse and product types | One stock location; physical products | Simpler inventory and delivery workflows |
| 8 | COD OTP, blocklist and mandatory advance payment | Begin with phone validation, staff confirmation and risk flags; add OTP/blocklist only if justified | These controls add cost and checkout friction |
| 9 | Delivery zones and prices | Start with a small set matched to courier pricing | Prevents unnecessarily complex setup |
| 10 | First courier and API mode | One verified courier with manual fallback | Actual API features and onboarding may differ |
| 11 | Returns and refund policy | Owner-approved written policy; record manual refunds where necessary | Needs to match real operations and applicable obligations |
| 12 | SMS notifications | **[Confirmed]** SMS infrastructure required at launch (configurable gateway settings, templates, delivery log, manual resend). Gateway provider, cost and volume must be confirmed before delivery is operational (see PRD Open Q#9). Launch is not blocked pending gateway selection. | Infrastructure is a Phase 1 requirement; delivery activation is a post-setup dependency |
| 13 | Staff roles and 2FA | Owner plus only the necessary staff roles; stronger protection for privileged users | Match controls to the actual team without excess setup |
| 14 | Advertising cost allocation | Campaign/date-range spend allocated by attributed delivered order value, labelled estimate | Attribution is not proof that an ad caused the sale |
| 15 | VAT and invoice behavior | Verify the business’s actual status and requirements before finalizing | Avoid incorrect tax or compliance assumptions |

### 18.3 Verification tasks before final PRD approval

- **[Open]** Verify bKash/Nagad provider or aggregator support, merchant onboarding, settlement, refund support, fees and the exact Admin configuration options.
- **[Open]** Check the chosen courier’s real API support for booking, tracking, COD, delivery attempts and RTO/returns.
- **[Open]** Confirm delivery zones, charges and how courier fees are recorded.
- **[Open]** Verify applicable VAT, invoice, e-commerce, privacy and data-retention obligations for the actual business.
- **[Open]** Confirm SMS gateway availability, sender requirements, pricing and expected message volume if SMS is planned.
- **[Open]** Validate the Bangla font choice and test representative storefront/admin screens on mobile, tablet and desktop in both languages.
- **[Open]** Test that switching language preserves cart contents, page context, checkout inputs and safe admin state.
- **[Open]** Agree on financial formulas and review sample calculations for cancellation, full refund, partial return, RTO and missing expenses.
- **[Open]** Verify provider/API feasibility, cost and implementation details for confirmed launch features; do not silently defer confirmed requirements without owner approval.

## 19. Final Vision

**[Confirmed]** Build a practical, trustworthy and mobile-first e-commerce platform for Bangladesh where customers can shop in Bangla or English, understand what they are ordering and complete checkout without confusing cart behavior. The owner and staff should manage products, stock, orders, delivery, payment methods/accounts and storefront content through an understandable Admin Panel. COD, bKash and Nagad, automatic website order creation, manual entry for phone/personal-message orders, and a configurable campaign landing-page builder with direct checkout are all part of the first release. Integrations must be verified against actual provider/platform support without silently removing the required business capability.

**Core principle:** Simple shopping for customers, straightforward management for the business, stable Bangla/English presentation, and reliable shared product, cart, inventory, order and payment logic.
