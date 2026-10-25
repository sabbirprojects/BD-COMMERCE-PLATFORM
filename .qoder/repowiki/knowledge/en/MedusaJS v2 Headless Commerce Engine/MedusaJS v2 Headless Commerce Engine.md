---
kind: external_dependency
name: MedusaJS v2 Headless Commerce Engine
slug: medusa-js-v2
category: external_dependency
category_hints:
    - vendor_identity
    - framework_behavior
scope:
    - '**'
---

### Identity

### Role & Integration
- Backend & Admin workspace: `apps/medusa`, running on port 9000 with embedded Medusa Admin at `/app`.
- Custom Bangladesh domain modules registered via `medusa-config.ts`: `bd-catalog`, `bd-orders`, `bd-courier`, `bd-payments`, `bd-campaigns`, `bd-settings`, `bd-audit`.
- Next.js storefront (`apps/web`) communicates with Medusa over REST via `@medusajs/js-sdk` (planned per architecture decision doc).
- Uses its own DML (`model.define`) and MikroORM — Prisma under `apps/api` is slated for retirement.

### Stable Usage Model
- Workflows (`createWorkflow` / `createStep` with compensation) are the prescribed integration point for multi-step pipelines such as COD verification, courier dispatch, and payment flows.
- Environment wiring goes through root `.env` loaded by `loadEnv` in `medusa-config.ts`; secrets include `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `COOKIE_SECRET`, and CORS origins.

### Migration Status
The project is in Phase 1–4 of the documented migration from Express+Prisma to Medusa v2; the custom Express API (`apps/api`) remains as a temporary scaffold until Phase 7.

verify exact API/params against official Medusa v2 docs