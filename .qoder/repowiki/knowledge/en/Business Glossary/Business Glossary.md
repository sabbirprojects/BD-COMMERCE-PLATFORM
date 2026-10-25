---
kind: business_term
name: Business Glossary
category: business_term
scope:
    - '**'
---

### BD Commerce Platform
- Definition：The internal name of this monorepo: a high-performance single-vendor B2C e-commerce platform built for the Bangladesh market, combining a Medusa v2 headless backend, a Next.js App Router storefront, and a temporary Express/Prisma API scaffold.
- Aliases：BD Commerce、BD E-Commerce Platform

### COD
- Definition：Cash on Delivery — the dominant payment method (>80% of launch volume in Bangladesh per the architecture decision). Orders enter a custom state machine with statuses Unconfirmed → Confirmed → Escalated → Canceled, requiring call-center phone verification before inventory reservation is released.
- Aliases：Cash on Delivery

### COGS
- Definition：Cost of Goods Sold — the unit cost price stored per product variant, used to compute true contribution profit (Delivered Total − COGS − Shipping Subsidy − Courier Cost − Gateway Fee). Access restricted to Owner and Finance roles.
- Aliases：Cost of Goods Sold

### Banglish
- Definition：Romanized Bengali text used in product titles and descriptions; the storefront search must index and match Banglish keywords alongside English, powered by Meilisearch with typo tolerance.

### Inside Dhaka / Outside Dhaka
- Definition：Bangladesh delivery-zone tiers used by the shipping module to compute flat-rate delivery charges. Zones include Inside Dhaka, Suburbs, and Outside Dhaka, evaluated against the customer's district (Zilla) address field.
- Aliases：Delivery Zone

### RTO risk badge
- Definition：A visual indicator on the order details sidebar showing Return-To-Origin risk for COD orders, derived from the customer-risk profile model and call-log attempt counter.
- Aliases：RTO badge

### Landing Page Builder
- Definition：Internal campaign feature allowing creation of standalone landing pages that reuse central catalog products and expose direct Mode A/B checkout links, backed by the `bd-campaigns` module's `landing-page` DML model.
- Aliases：Campaign Landing Page

### Steadfast / Pathao / RedX
- Definition：Third-party Bangladesh courier services integrated via the `bd-courier` module. The system supports automated parcel booking and tracking synchronization, with manual consignment entry as the fallback.
- Aliases：Courier Providers

### Product Localization
- Definition：Bilingual product extension storing Bangla Title (`title_bn`) and Description (`description_bn`) fields linked to Medusa's native Product model via a module link, enabling admin editing of Bangla content alongside English.
- Aliases：Bilingual Product Fields

### 3-Option-Type Constraint
- Definition：Business rule limiting each product to a maximum of 3 option dimensions (e.g. Size, Color, Material), enforced by a validation step prepended to Medusa's `createProductsWorkflow`.
- Aliases：Option Type Limit
