---
kind: external_dependency
name: bKash Tokenized Payment Gateway
slug: bkash-tokenized-checkout
category: external_dependency
category_hints:
    - vendor_identity
    - auth_protocol
scope:
    - '**'
---

### Identity
bKash Tokenized Checkout sandbox (`https://tokenized.sandbox.bka.sh/v2.0`), one of three planned Bangladesh payment providers alongside Nagad PGW and SSLCommerz.

### Role
Sandbox credentials are pre-seeded in `.env.example` for local development of the `bd-payments` Medusa module's payment provider implementation.

### Auth Protocol
Requires app-level OAuth-style credentials: `BKASH_APP_KEY`, `BKASH_APP_SECRET`, `BKASH_USERNAME`, `BKASH_PASSWORD`, plus a callback endpoint (`BKASH_CALLBACK_URL`). Exact token exchange flow should be verified against bKash's official sandbox documentation.