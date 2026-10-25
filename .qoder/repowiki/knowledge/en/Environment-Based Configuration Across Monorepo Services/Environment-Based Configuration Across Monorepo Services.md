---
kind: configuration_system
name: Environment-Based Configuration Across Monorepo Services
category: configuration_system
scope:
    - '**'
source_files:
    - .env.example
    - apps/medusa/.env
    - apps/medusa/.env.template
    - apps/medusa/medusa-config.ts
    - apps/api/src/main.ts
    - apps/api/src/lib/prisma.ts
    - apps/web/next.config.mjs
---

## Approach

The BD Commerce Platform uses a flat, environment-variable-driven configuration system. There is no centralized config loader, feature-flag framework, or secrets manager. Each service reads its own runtime configuration from `process.env`, with `.env` files providing defaults and templates.

## Key Files

- `.env.example` — root-level template covering all services (API, Medusa, Web, PostgreSQL, Redis, Meilisearch, payment gateways).
- `apps/medusa/.env` — per-service overrides for the Medusa backend (CORS, JWT, cookies, database, Redis).
- `apps/medusa/.env.template` — minimal Medusa starter template shipped with the app.
- `apps/medusa/medusa-config.ts` — Medusa's `defineConfig` entry point; loads env via `loadEnv` and wires `projectConfig.http.*` from `process.env`.
- `apps/api/src/main.ts` — Express API bootstrap; calls `dotenv.config()` twice (root `.env` then local) and reads `API_PORT` / `PORT`.
- `apps/web/next.config.mjs` — Next.js config; no env loading here (Next.js injects `NEXT_PUBLIC_*` vars at build time).
- `apps/api/src/lib/prisma.ts` — Prisma client configured with `NODE_ENV`-based log level.

## Architecture & Conventions

### Two-tier `.env` layout

1. **Root `.env.example`** documents every variable across the monorepo: application ports (`API_PORT`, `WEB_PORT`, `MEDUSA_PORT`), service URLs (`NEXT_PUBLIC_API_URL`, `MEDUSA_BACKEND_URL`), CORS origins per service (`STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS`), infrastructure (`POSTGRES_*`, `REDIS_*`, `MEILISEARCH_*`), cryptographic keys (`JWT_SECRET`, `COOKIE_SECRET`, `SESSION_SECRET`, `ENCRYPTION_KEY`, `NEXTAUTH_SECRET`), and Bangladesh payment gateway credentials (`BKASH_*`, `NAGAD_*`, `SSLCOMMERZ_*`).
2. **Per-app `.env`** files override values for that service only (e.g. `apps/medusa/.env` contains Medusa-specific `DATABASE_URL` and `REDIS_URL`).

### Service-specific loaders

- **Medusa**: `medusa-config.ts` calls `loadEnv(process.env.NODE_ENV || 'development', path.resolve(__dirname, '../../'))` to load the root `.env`, then `loadEnv(..., __dirname)` to layer the app-local `.env`. All runtime values are read directly from `process.env` inside `defineConfig`.
- **Express API**: `main.ts` calls `dotenv.config({ path: path.resolve(__dirname, '../../../.env') })` to explicitly load the repo root `.env`, followed by a second `dotenv.config()` for any process-level overrides. Port falls back through `API_PORT` → `PORT` → `4000`.
- **Next.js web**: No explicit env loader in `next.config.mjs`; relies on Next.js built-in `NEXT_PUBLIC_*` injection at build time (see `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`, `NEXTAUTH_SECRET` in `.env.example`).

### Environment-scoped behavior

- `NODE_ENV` controls Prisma query logging: `['query','error','warn']` in development, `['error']` otherwise (`apps/api/src/lib/prisma.ts`).
- Payment gateways use an `*_SANDBOX` flag pattern (e.g. `SSLCOMMERZ_IS_SANDBOX=true`) to toggle between sandbox and production endpoints.

### Secrets classification

Variables in `.env.example` are grouped into six sections: Application & Ports, PostgreSQL, Redis, Meilisearch, Cryptographic Keys & Authentication, and Bangladesh Payment Gateways. Secret-bearing variables include `JWT_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET`, `SESSION_SECRET`, `ENCRYPTION_KEY`, `NEXTAUTH_SECRET`, `BKASH_APP_SECRET`, `NAGAD_PRIVATE_KEY`, and `REDIS_PASSWORD`.

## Conventions & Constraints

- **No typed config object**: Configuration is consumed as raw strings from `process.env` throughout the codebase; there is no schema validation or type-safe config module.
- **Defaults in code**: Where a value is optional, fallback defaults are provided inline (e.g. Medusa CORS origins, JWT secret `'supersecret'`, cookie secret `'supersecret'`, API port `4000`). This means the app can start without a `.env`, but with insecure defaults.
- **Layering order**: Medusa layers root `.env` first, then app-local `.env` (later file wins). The Express API loads the root `.env` explicitly before falling back to `dotenv.config()` for process overrides.
- **Secrets must not be committed**: `.env` files are gitignored (inherited from root `.gitignore`); only `.env.example` and `.env.template` are tracked as reference.
- **Service URL coupling**: Frontend `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_APP_URL` mirror the backend `API_PORT`/`MEDUSA_PORT` so the storefront points at the correct local dev server.
- **No feature flags or remote config**: Runtime toggles are absent; behavior changes require code changes or new environment variables.