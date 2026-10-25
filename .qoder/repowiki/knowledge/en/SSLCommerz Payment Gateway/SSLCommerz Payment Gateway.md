---
kind: external_dependency
name: SSLCommerz Payment Gateway
slug: sslcommerz
category: external_dependency
category_hints:
    - vendor_identity
    - auth_protocol
scope:
    - '**'
---

### Identity
SSLCommerz payment gateway sandbox, third planned Bangladesh payment provider.

### Role
Sandbox store credentials and redirect/IPN URLs pre-seeded in `.env.example` for the `bd-payments` module.

### Auth Protocol
Store identity via `SSLCOMMERZ_STORE_ID` / `SSLCOMMERZ_STORE_PASSWD`, with separate Session API, Validation API, success/fail/cancel redirect URLs, and an IPN webhook (`SSLCOMMERZ_IPN_URL`). Confirm exact payload/signing spec against SSLCommerz's official sandbox documentation.