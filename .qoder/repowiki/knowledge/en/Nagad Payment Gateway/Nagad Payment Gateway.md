---
kind: external_dependency
name: Nagad Payment Gateway
slug: nagad-pgw
category: external_dependency
category_hints:
    - vendor_identity
    - auth_protocol
scope:
    - '**'
---

### Identity
Nagad Remote Payment Gateway sandbox (`http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0/api/dfs`), second planned Bangladesh payment provider.

### Role
Sandbox merchant credentials seeded in `.env.example` for the `bd-payments` module's payment provider.

### Auth Protocol
Merchant identity via `NAGAD_MERCHANT_ID` and asymmetric signing via `NAGAD_PUBLIC_KEY` / `NAGAD_PRIVATE_KEY`, with a callback URL (`NAGAD_CALLBACK_URL`). Verify exact request/signature format against Nagad's official sandbox docs.