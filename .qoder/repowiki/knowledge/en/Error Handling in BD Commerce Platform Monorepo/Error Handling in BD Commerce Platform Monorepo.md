---
kind: error_handling
name: Error Handling in BD Commerce Platform Monorepo
category: error_handling
scope:
    - '**'
source_files:
    - apps/api/src/main.ts
    - apps/medusa/src/scripts/seed-demo-products.ts
    - apps/medusa/src/api/middlewares.ts
---

## Overview

The monorepo has **no centralized error-handling framework** (no shared `errors/` directory, no custom exception hierarchy, no global middleware for error serialization). Error handling is fragmented across the three apps and follows each app's own conventions.

## Apps/api — Express API layer

- `apps/api/src/main.ts` is a minimal Express server with only two routes (`/health`, `/api/v1`).
- The only `try/catch` is around the Prisma health-check query; on failure it sets `dbStatus = 'error_or_offline'` and still returns HTTP 200. There is no global error handler middleware (`app.use((err, req, res, next) => ...)`), so unhandled promise rejections or thrown errors will crash the process.
- No custom error types or sentinel values are defined.

## apps/medusa — Medusa v2 backend

- Custom business logic lives in `apps/medusa/src/modules/*/service.ts`. A grep of those files returned zero matches for `throw`, `catch`, `error`, or `Error`, indicating the service implementations currently do not perform explicit error handling beyond relying on Medusa's built-in validation and Prisma exceptions.
- The only place that raises application-level errors is `apps/medusa/src/scripts/seed-demo-products.ts`, which uses **Medusa's built-in `MedusaError`** from `@medusajs/framework/utils`:
  ```ts
  throw new MedusaError(MedusaError.Types.NOT_FOUND, 'No sales channel or shipping profile found...')
  ```
  It is used to signal missing prerequisites (no sales channel/shipping profile, no supported currencies, no shared "Size" option).
- `apps/medusa/src/api/middlewares.ts` defines route middlewares via `defineMiddlewares` but contains **no error-handling middleware**; it only configures store search filtering.
- Medusa's default HTTP error serializer handles `MedusaError` instances, so these script errors surface as standard Medusa API responses when invoked through the framework.

## apps/web — Next.js frontend

- The Next.js App Router entry points (`src/app/layout.tsx`, `src/app/page.tsx`) contain no `try/catch` blocks and no client-side error boundary components. Errors in data fetching would propagate as Next.js default error pages.

## Conventions observed

1. **Script-level validation errors use `MedusaError`** with `MedusaError.Types.NOT_FOUND` to indicate missing prerequisite data in seed scripts. This is the only user-facing error type used in the codebase.
2. **Service modules do not define custom error classes** and do not wrap underlying exceptions — they rely on Medusa / Prisma to raise their own errors.
3. **No global Express error middleware** exists in the API server; unhandled errors terminate the process.
4. **No React error boundaries** are implemented in the Next.js app.
5. **Health checks swallow errors silently** — the `/health` endpoint catches all Prisma exceptions and reports them as a status string rather than returning an error response.
6. **Seed scripts batch operations** (`BATCH_SIZE = 10`, `INGEST_CHUNK_SIZE = 25`) so that one failure does not roll back the entire run, but there is no retry or dead-letter mechanism.

## Rules enforced by the codebase

- None are formally enforced by lint rules, build steps, or tests. The patterns above are descriptive observations of current implementation.
- The only hard constraint is that Medusa-specific errors must be raised via `MedusaError` from `@medusajs/framework/utils` (as seen in the seed script); using a bare `throw new Error(...)` is not present in the production code paths.