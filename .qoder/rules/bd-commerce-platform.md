---
name: bd-commerce-platform
description: Mandatory project authority, implementation scope, and safety constraints for the Bangladesh single-vendor e-commerce platform.
alwaysApply: true
---

# Bangladesh Commerce Platform — Core Engineering Rules

## 1. Execution Protocol

1. **Read before implementing**: Always read [`agent.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/agent.md) and the exact selected prompt in [`prompt.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/prompt.md) first.
2. **Read prompt boundaries**: For the active prompt, read `READ FIRST`, `PREREQUISITE`, `SCOPE`, `DONE WHEN`, and `HANDOFF` before any code changes.
3. **One prompt at a time**: Execute exactly one numbered prompt per session. Do not start the next prompt until the current prompt's completion criteria are verified with concrete evidence.
4. **Honest verification**: Report real test/build evidence without fabricating results. Record real terminal output, HTTP statuses, DB queries, and build/test results.

## 2. Document Authority Order

When documents conflict:

1. Installed Medusa v2.22.x behavior in `node_modules/@medusajs/*`
2. [`database.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/database.md) — canonical schema, money rules, constraints
3. [`prd.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/prd.md) — business requirements
4. [`dfd.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/dfd.md) — data flows
5. [`docs/architecture.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/docs/architecture.md) — topology
6. [`prompt.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/prompt.md) — execution sequence
7. [`agent.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/agent.md) — standing policy

> **InsForge**: Do NOT install `@insforge/sdk`, call InsForge MCP tools, or apply InsForge patterns from root `AGENTS.md`. `agent.md` governs this project.

## 3. Architecture & Business Invariants

- **Single-vendor only.** No marketplace, vendor portals, commissions, or split payouts.
- **Medusa-first.** Use native Product, Pricing, Inventory, Cart, Order, Payment, Fulfillment, Tax, Translation, RBAC, Notification. BD-specific facts live in `apps/medusa/src/modules/bd-*` and links in `apps/medusa/src/links/`.
- **Money boundary**: Medusa core amounts = BDT major units; custom BD columns = integer paisa (`*_paisa`). Convert only via [`apps/medusa/src/lib/money.ts`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/apps/medusa/src/lib/money.ts). The suffix `_bdt` on paisa columns is banned.
- **4 independent status dimensions**: Order status, Payment status, Shipment status (derived from native fulfillment + courier), and Return/Refund Review status (`return_review`). Never collapse them into one field or badge.
- **Financial privacy**: Never expose COGS, `cost_per_unit_paisa`, supplier identities, or margins in storefront APIs, logs, or Meilisearch.
- **Manual returns/refunds**: Never auto-approve returns, never auto-execute refund payouts, and never auto-restock returned or RTO items without physical warehouse inspection.
- **Phase 1 payments**: COD + direct bKash + direct Nagad only. No SSLCommerz, Shurjopay, Foster, or card gateways.
- **Unified cart**: Add to Cart, Buy Now, and campaign Mode B share one cart. Never silently clear it; never auto-increment quantity when the same variant is already present.

## 4. Safety & Persistence Constraints

- Never drop or alter Docker volumes.
- Never `DROP`, truncate, or alter legacy Prisma tables: `categories`, `order_items`, `orders`, `products`, `users`.
- Never commit secrets, tokens, passwords, private keys, or `.env` files.
- Nagad private key must remain filesystem-referenced (`NAGAD_PRIVATE_KEY_PATH`, mode 0600), never in env or DB.
- Keep the repo buildable: `npm run build:medusa` (and `npm run build:web` once storefront work is active) must pass after changes.
- Do not weaken security, validation, CSRF, or rate limits to make tests pass.
