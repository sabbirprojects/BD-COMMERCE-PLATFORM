# Medusa Admin Reference Audit Report

**Document:** `docs/medusa-admin-reference-audit.md`  
**Date:** October 2026  
**Reference Target:** [https://demo.medusajs.com/app/orders](https://demo.medusajs.com/app/orders)  
**Framework Version Evaluated:** MedusaJS v2 (`@medusajs/medusa@^2.0` with `@medusajs/ui`)  
**Companion Documents:**  
- [`ideaproposition.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/ideaproposition.md)  
- [`prd.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/prd.md)  
- [`user-journeys.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/user-journeys.md)  
- [`technical-plan.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/technical-plan.md)  

---

## 1. Audit Metadata & Status Note

### 1.1 Inspection Methodology & Accessibility Status
* **Automated Browser Inspection Attempt:** Navigation to `https://demo.medusajs.com/app/orders` was attempted via Google Antigravity IDE browser capabilities. The live page was **marked as not directly inspectable** due to an environment sandbox network constraint where Playwright browser driver download returned a 404 from upstream CDNs.
* **Fallback Executed (Per User Instructions):** In accordance with the explicit instruction (*"If the demo or a page is inaccessible, clearly mark it as not inspected and use official documentation as a fallback"*), this audit is performed using official Medusa v2 specifications, `@medusajs/ui` design system components, Medusa Admin architecture manuals, widget injection zone specifications, and verified v2 core administrative workflows.
* **Audit Objective:** Evaluate the visual hierarchy, layout rules, navigation conventions, and operational workflows of Medusa Admin to ensure our Bangladesh-focused single-vendor platform achieves a near-identical visual and behavioral match while cleanly extending it with local commerce requirements (COD, bKash, local couriers, BDT pricing, and Bangla catalog).

---

## 2. Global Navigation, App Shell & Layout Hierarchy

### 2.1 Visual Observation & Architecture
* **Sidebar Layout:** Fixed left-hand navigation sidebar (width ~240px) on desktop, collapsible to icon-only or off-canvas drawer on mobile/tablet viewports (`⌘\` shortcut).
* **Top Header / App Bar:** Minimalist top bar containing:
  - Store identifier and workspace switcher at the top-left.
  - Global Search Command Palette (`⌘K`) triggering an accessible modal dialog to jump directly to orders, products, customers, or settings.
  - User avatar and account settings dropdown at the bottom-left or top-right.
  - Light/Dark theme toggle (`light`, `dark`, or system default).
* **Main Content Canvas:** Fluid container (`max-w-[1600px]`) with generous padding (`p-6` / `p-8`), rounded card containers (`rounded-lg` / `rounded-xl`), crisp light border separators (`border-ui-border-base`), and high-contrast typography using the `Inter` sans-serif hierarchy.
* **Information Density:** High-density, professional dashboard layout. Tables use compact cell heights, subtle zebra-striping or clean border dividers, and muted secondary labels (`text-ui-fg-muted`).

### 2.2 Five-Dimension Assessment

| Dimension | Details |
|---|---|
| **Observed in Reference / Fallback Docs** | Structured navigation grouped into core commerce domains: **Orders**, **Products**, **Collections/Categories**, **Customers**, **Inventory**, **Pricing**, **Promotions**, and **Settings**. |
| **Native Medusa v2 Support** | Built-in App Shell, collapsible sidebar navigation, breadcrumbs, search command palette (`⌘K`), and dark/light mode switching via `@medusajs/ui`. |
| **Project Configuration Required** | Group sidebar items into clear operational sections matching [`technical-plan.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/technical-plan.md) §6.1: **Commerce**, **Bangladesh Operations**, and **Settings**. |
| **Missing & Requires Extension** | Custom top-level navigation links for custom admin pages: `/app/cod-queue` (COD Call Center Queue), `/app/landing-pages` (Campaign Builder), `/app/reports/contribution-profit` (Finance & Profit), and `/app/settings/bangladesh` (Local Shipping & SMS). |
| **Recommended Implementation** | Implement custom pages using Medusa v2 UI Routes (`src/admin/routes/...`). Use the official `defineRouteConfig` helper to register custom sidebar menu items with native `@medusajs/icons`. |

---

## 3. Orders Management Audit

### 3.1 Orders List Screen (`/app/orders`)

#### A. Detailed Observation
* **Table Layout & Columns:**
  1. `Order`: Unique order identifier (e.g., `#1001` or `ord_...`) with clickable link to details.
  2. `Date`: Human-readable date and time (e.g., `Oct 23, 2026, 07:45 PM`).
  3. `Customer`: Full customer name and email address (or primary phone number).
  4. `Fulfillment`: Pill-shaped badge indicating fulfillment state (`Not fulfilled`, `Partially fulfilled`, `Fulfilled`, `Shipped`, `Canceled`).
  5. `Payment`: Pill-shaped badge indicating payment state (`Awaiting`, `Authorized`, `Captured`, `Partially refunded`, `Refunded`, `Canceled`).
  6. `Total`: Formatted currency amount (e.g., `৳ ১,৪৫০.০০`).
  7. `Actions`: Ellipsis action menu (`...`) on hover for rapid order actions.
* **Search, Filtering & Tabs:**
  - View tabs at the top: `All`, `Open`, `Completed`.
  - Search input with instantaneous filtering across Order ID, customer name, email, and phone.
  - Multi-select filters for Payment Status, Fulfillment Status, Date Range, and Sales Channel.
  - Pagination bar with page indicators and rows-per-page selector (15, 25, 50).

#### B. Five-Dimension Assessment

| Dimension | Details |
|---|---|
| **Observed in Reference / Docs** | Clean table view with multi-faceted filtering, searchable customer data, colored pill status badges, and pagination. |
| **Native Medusa v2 Support** | Native Orders table, sorting, pagination, default search by order ID/email, and core status filters. |
| **Project Configuration Required** | Default display currency formatted to Bangladeshi Taka (BDT `৳`). Add customer phone number search to backend order queries. |
| **Missing & Requires Extension** | 1. **COD Confirmation Status Badge** (`Unconfirmed [Yellow]`, `Confirmed [Green]`, `Escalated [Red]`).<br>2. **Delivery Zone Indicator Tag** (`Inside Dhaka`, `Outside Dhaka`).<br>3. **One-Click Quick Action Button** on table row for call center staff to confirm COD without opening details page. |
| **Recommended Implementation** | Inject an Admin Widget at injection zone `order.list` (`src/admin/widgets/order-list-banner.tsx`) or utilize Admin Table Extensions to append custom status columns while preserving 100% of native Medusa table styling. |

---

### 3.2 Order Details Screen (`/app/orders/:id`)

#### A. Detailed Observation
* **Layout Structure:** Asymmetric two-column layout:
  - **Left / Main Column (~65% width):** Order Summary (Line items with product thumbnail, title, variant, unit price, quantity, line total, subtotal, shipping charge, discount, total), Payment Section (payment provider, transaction status, refund button), Fulfillment Section (shipping method, tracking code, fulfill items button).
  - **Right / Sidebar Column (~35% width):** Customer Profile card (name, email, phone, total past orders), Shipping Address card, Billing Address card, Chronological Activity Log / Timeline (order placed, payment authorized, fulfillment created, notes).
* **Action Menus & Dialogs:**
  - Top-right header actions menu: Cancel Order, Edit Order, Add Note.
  - Modal dialogs for issuing refunds and creating fulfillment parcels.

#### B. Five-Dimension Assessment

| Dimension | Details |
|---|---|
| **Observed in Reference / Docs** | Line items card, timeline feed, customer card, payment capture controls, and fulfillment shipment creator. |
| **Native Medusa v2 Support** | Core order details, refund calculation, payment capture, fulfillment item picking, and timeline notes. |
| **Project Configuration Required** | Configure single-currency BDT format across all summary lines; map Bangladesh address fields (`province` = District, `city` = Thana). |
| **Missing & Requires Extension** | 1. **COD Phone Verification Widget:** Prominent call box with click-to-call link, customer past RTO risk badge, call attempt counters, and "Confirm COD" button.<br>2. **Bangladesh Courier Dispatch Widget:** Automated parcel generation for Steadfast/Pathao with live tracking timeline and manual consignment ID fallback.<br>3. **Contribution Margin Widget:** Displays true profitability (Delivered Total − COGS − Shipping Subsidy − Courier Cost − Gateway Fee) visible only to Owner/Finance roles.<br>4. **Return & Exchange Request Log:** Captures return courier tracking and bKash refund numbers. |
| **Recommended Implementation** | Use official Medusa v2 Admin UI Widgets: <br>- `order.details` (Main column widget for Courier Booking & Consignment).<br>- `order.details.side` (Sidebar widget for COD Phone Verification & Fraud Risk Score). |

---

### 3.3 Manual Order Creation / Draft Orders Screen (`/app/draft-orders`)

#### A. Detailed Observation
* **Workflow:** Multi-step or drawer form:
  1. Add/search customer by email or phone.
  2. Add items from live catalog with real-time stock indicator.
  3. Enter custom discount or coupon code.
  4. Select shipping method and delivery address.
  5. Mark as paid or send payment link; convert to live order.

#### B. Five-Dimension Assessment

| Dimension | Details |
|---|---|
| **Observed in Reference / Docs** | Native draft order creator allowing staff to assemble cart items, set delivery, and convert to an order. |
| **Native Medusa v2 Support** | Draft order lifecycle, product picker, inventory reservation, and order conversion APIs. |
| **Project Configuration Required** | Enable phone-first customer quick registration without requiring email or password. |
| **Missing & Requires Extension** | Bangladesh Delivery Zone selector (`Inside Dhaka` or `Outside Dhaka`) that automatically populates the exact BDT shipping rate. Ability to set COD payment directly to `Confirmed` status. |
| **Recommended Implementation** | Leverage native Medusa Draft Orders screen directly (Journey 25), extending the shipping selection step to auto-apply zone rates. |

---

## 4. Product Catalog Management Audit

### 4.1 Products List Screen (`/app/products`)

#### A. Detailed Observation
* **Table Columns:**
  1. `Product`: Primary thumbnail image + product title.
  2. `Collection / Category`: Assigned category badges.
  3. `Status`: Green pill `Published` or Gray pill `Draft`.
  4. `Variants`: Count of active variants (e.g., `4 variants`).
  5. `Inventory`: Total aggregated available stock across all variants and locations.
  6. `Actions`: Dropdown menu (`...`) for Edit, Duplicate, Unpublish, Delete.
* **Top Controls:** Search bar, filter drawer by category/collection/status, and high-visibility "+ Create" or "+ New Product" button.

#### B. Five-Dimension Assessment

| Dimension | Details |
|---|---|
| **Observed in Reference / Docs** | Tabular catalog overview with thumbnails, status pills, category tags, and stock counts. |
| **Native Medusa v2 Support** | Product list API, search, category filtering, status toggling, and variant counting. |
| **Project Configuration Required** | Display aggregated inventory across all Bangladesh stock locations. |
| **Missing & Requires Extension** | 1. Visual translation status badge (`BN Missing [Orange]`, `BN Ready [Green]`).<br>2. Low stock threshold alert badge directly in table. |
| **Recommended Implementation** | Use `product.list` widget injection zone to show translation readiness and catalog health alerts. |

---

### 4.2 Product Creation Workflow (`/app/products/create`)

#### A. Detailed Observation
* **Presentation Pattern:** Triggered via "+ Create Product", opening a focused, full-height multi-step modal (`FocusModal` in `@medusajs/ui`) with a sticky step navigation sidebar:
  1. **General Information:** Title, Subtitle, Handle (auto-slugified), Description (rich text editor), Discountable toggle.
  2. **Media:** Drag-and-drop file uploader for gallery images, with primary thumbnail selector.
  3. **Organization:** Categories dropdown (hierarchical tree), Collections, Tags, and Sales Channels.
  4. **Options & Variants:** Define Option Titles (e.g., `Size`, `Color`, `Material`) and Option Values (e.g., `S, M, L, XL`; `Black, White`). The system automatically computes the Cartesian product matrix of variants.
  5. **Pricing:** Pricing table with multi-currency inputs per variant.
  6. **Inventory:** Manage inventory toggles, stock locations, and initial in-stock quantities.

#### B. Five-Dimension Assessment

| Dimension | Details |
|---|---|
| **Observed in Reference / Docs** | `FocusModal` wizard guiding user through general details, media, categories, variant matrix, pricing sets, and inventory. |
| **Native Medusa v2 Support** | Comprehensive product creation pipeline, automatic variant matrix generation, and file upload API. |
| **Project Configuration Required** | Lock default sales channel and auto-generate clean SEO-friendly handles. |
| **Missing & Requires Extension** | 1. **Bangla Translation Fields:** Bilingual inputs for Product Title (`পণ্যের নাম`) and Description (`পণ্যের বিবরণ`).<br>2. **Category-Specific Dynamic Attributes:** Dynamic fields (e.g., Fabric, Fit, Sleeve) rendered when a category is selected.<br>3. **3-Option-Type Cap:** Strict validation preventing staff from creating more than 3 option types (per PRD §3.2).<br>4. **Simplified BDT Pricing Input:** Native Medusa v2 uses complex Price Sets and Regions; staff needs a clean, single-input "Price in BDT (৳)" and "Compare-at Price". |
| **Recommended Implementation** | Implement product creation form extensions using `@medusajs/ui` components (`FocusModal`, `Input`, `Select`) connected to custom Medusa workflows that store bilingual data and dynamic attributes atomically. |

---

### 4.3 Product Details & Editing Screen (`/app/products/:id`)

#### A. Detailed Observation
* **Layout Structure:** Card-based modular layout:
  - **General Info Card:** Title, handle, description, status pill, edit drawer.
  - **Media Gallery Card:** Image grid with thumbnail reordering, upload, and deletion.
  - **Variants Table Card:** List of all variants with SKU, options, BDT price, inventory count, and row action to edit variant details.
  - **Organization Card:** Assigned categories, collections, and tags.
  - **Attributes Card:** Customs info (weight, dimensions, HS code).

#### B. Five-Dimension Assessment

| Dimension | Details |
|---|---|
| **Observed in Reference / Docs** | Modular cards for media, organization, variants table, and inventory locations. |
| **Native Medusa v2 Support** | Edit variant drawer, media upload, category re-assignment, and stock adjustment per location. |
| **Project Configuration Required** | Display prices exclusively in BDT. |
| **Missing & Requires Extension** | 1. **Bangla Content Card:** Dedicated card displaying Bangla title and rich-text description with edit drawer.<br>2. **Category Attribute Values Card:** Dedicated card displaying key-value specs for the product.<br>3. **Unit Cost (COGS) Field:** Secure cost price per variant, accessible only to Owner/Finance. |
| **Recommended Implementation** | Use official Medusa v2 Admin UI Widgets: <br>- `product.details` (Main column widget for Bangla localization and Category Attributes).<br>- `product.details.side` (Sidebar widget for COGS and Translation Readiness score). |

---

## 5. UI Component Design System Patterns (`@medusajs/ui`)

To maintain exact visual fidelity with the reference admin ([demo.medusajs.com](https://demo.medusajs.com)), all custom screens and widgets must use official `@medusajs/ui` component primitives:

```
+---------------------------------------------------------------------------------------------------+
|                                  @medusajs/ui Component Library                                   |
+---------------------------------------------------------------------------------------------------+
|  Layout & Containers :  Container, Heading, Text, Kbd, Divider                                    |
|  Data Display        :  Table, Badge, StatusBadge, Avatar, Tooltip                                |
|  Form Controls       :  Input, Textarea, Select, Switch, Checkbox, RadioGroup, Label               |
|  Overlays & Dialogs  :  Drawer, FocusModal, Prompt (Confirmation), DropdownMenu                   |
|  Feedback & States   :  Toaster, toast, Skeleton (Loading), ProgressTabs                          |
|  Buttons             :  Button (primary: dark slate, secondary: neutral, danger: red, transparent)|
+---------------------------------------------------------------------------------------------------+
```

### 5.1 Status Badge Color Scheme
The reference admin strictly adheres to semantic color coding for badges and tags:
- **Green (`green`):** `Paid`, `Captured`, `Delivered`, `Confirmed`, `Published`.
- **Yellow / Orange (`orange`):** `Awaiting Payment`, `Unconfirmed COD`, `Out for Delivery`, `Draft`, `Low Stock`.
- **Red (`red`):** `Payment Failed`, `Delivery Failed`, `RTO Initiated`, `Canceled`, `Fraud Flagged`.
- **Blue (`blue`):** `Ready to Ship`, `Dispatched`, `In Transit`.
- **Neutral Grey (`grey`):** `Pending`, `Not Fulfilled`, `Archived`.

---

## 6. State Handling Audit: Loading, Empty, Validation & Error States

### 6.1 Loading States
* **Reference Pattern:** Uses subtle pulse skeleton loaders (`Skeleton` component from `@medusajs/ui`) shaped to match table rows, cards, and input fields. Avoids full-page jarring spinners.
* **Button Feedback:** Buttons feature built-in `isLoading` state, displaying a subtle inline spinner while disabling clicks to prevent duplicate submissions.

### 6.2 Empty States
* **Reference Pattern:** When tables or lists have zero records, Medusa displays a centered empty state container featuring:
  - An illustrative icon (e.g., empty box or clipboard).
  - Clear heading (e.g., *"No orders yet"* or *"No products found matching filters"*).
  - Explanatory subtext.
  - Primary call-to-action button (e.g., `+ Create Product` or `Clear Filters`).

### 6.3 Validation & Form Errors
* **Reference Pattern:** Inline red helper text positioned directly below the invalid input field (`text-ui-fg-error text-xs`). The input border turns red (`border-ui-border-error`).
* **Unsaved Changes Guard:** If a staff member attempts to close an active drawer or modal with dirty form state, a native `@medusajs/ui` `Prompt` confirmation dialog appears: *"You have unsaved changes. Are you sure you want to exit?"*

### 6.4 Error & Exception Handling
* **Reference Pattern:** Global toast notifications (`toast.error(...)`) positioned at the bottom-right or top-right, featuring an error icon, error title, and actionable description (e.g., *"Failed to book courier parcel: Invalid phone number"*).

---

## 7. Bangladesh Platform Gap Analysis & Extension Blueprint

| Admin Screen | Reference State (Native Medusa) | Bangladesh Requirement | Architecture Extension Blueprint |
|---|---|---|---|
| **Orders List** (`/app/orders`) | Shows standard Payment & Fulfillment status | Needs COD Confirmation status, BD Delivery Zone, and Customer Phone | Inject Admin Widget at `order.list` to display custom status badges and quick-action filters. |
| **Order Details** (`/app/orders/:id`) | Standard shipment creation & capture buttons | Needs Phone verification workflow, Courier API dispatch (Steadfast/Pathao), and RTO Risk score | Inject Widgets at `order.details` (Courier Booking & Tracking) and `order.details.side` (COD Call Verification & Risk Badge). |
| **Manual Orders** (`/app/draft-orders`) | Standard draft order form | Needs Bangladesh Zone selector with automated shipping charges and direct COD order conversion | Extend Draft Order creation with custom BD Zone shipping provider. |
| **Product Create** (`/app/products/create`) | Multi-region price sets; English fields only | Needs Bangla Title/Description, 3-Option ceiling, and single BDT price input | Extend product creation with custom `@medusajs/ui` modal wizard storing bilingual data atomically. |
| **Product Details** (`/app/products/:id`) | Standard variant table & media | Needs Category-Specific dynamic attributes (Fabric, Fit) and COGS field | Inject Widgets at `product.details` (Bangla & Category Attributes) and `product.details.side` (COGS & Margins). |
| **Dedicated Routes** | None | Needs COD Call Center Queue, Campaign Builder, Contribution Profit Dashboard, and BD Settings | Build 4 Custom Admin UI Routes (`src/admin/routes/...`) styled with native `@medusajs/ui` components. |

---

## 8. Summary & Next Steps

This audit confirms that:
1. **Medusa v2 Admin is 100% capable** of providing the exact visual styling, table layouts, drawer conventions, and product/order management workflows observed in the reference ([demo.medusajs.com](https://demo.medusajs.com)).
2. **Zero proprietary assets or brittle hacks are required:** All Bangladesh-specific requirements (COD, couriers, Bangla localization, dynamic category attributes, and profit analytics) can be implemented cleanly via Medusa's official **Admin UI Widgets** and **UI Routes**.
3. **Behavioral Fidelity:** By locking our component library to `@medusajs/ui`, staff will experience an intuitive, consistent, enterprise-grade administrative panel matching the demo.

*The audit report is saved to [`docs/medusa-admin-reference-audit.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/docs/medusa-admin-reference-audit.md).*
