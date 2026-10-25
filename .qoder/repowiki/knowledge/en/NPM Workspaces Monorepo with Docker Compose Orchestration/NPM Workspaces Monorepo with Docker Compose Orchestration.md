---
kind: build_system
name: NPM Workspaces Monorepo with Docker Compose Orchestration
category: build_system
scope:
    - '**'
source_files:
    - package.json
    - docker-compose.yml
    - apps/web/package.json
    - apps/api/package.json
    - apps/medusa/package.json
---

## Build System Overview

The BD Commerce Platform is an **NPM workspaces monorepo** that builds three Node.js applications — a Next.js storefront (`apps/web`), an Express API (`apps/api`), and a Medusa v2 commerce backend (`apps/medusa`) — orchestrated via `docker-compose.yml`. There is no Makefile, no custom build scripts, no CI pipeline (no `.github/workflows`, no `Jenkinsfile`, no `bitbucket-pipelines.yml`, no `Dockerfile` at the repo root), and no release automation in this repository.

## Root Workspace Wiring

`package.json` at the repo root declares:
- `workspaces: ["apps/*", "packages/*"]` — all apps are auto-discovered under `apps/`.
- Top-level convenience scripts that delegate to workspace packages using `npm run <script> --workspace=apps/<app>`:
  - `dev:web`, `dev:api`, `dev:medusa`
  - `build:web`, `build:api`, `build:medusa`
  - `start:medusa`
  - `medusa:migrate`
  - `prisma:generate`, `prisma:migrate`, `prisma:studio`
  - `docker:up`, `docker:down`, `docker:logs`, `docker:ps`

This is the single entry point for building or running any app from the repo root.

## Per-App Build Conventions

| App | Builder | Dev command | Build command | Start command |
|---|---|---|---|---|
| `apps/web` (Next.js) | `next` (v15.1.0) | `next dev -p 3000` | `next build` | `next start -p 3000` |
| `apps/api` (Express + Prisma) | `tsc` (TypeScript) | `tsx watch src/main.ts` | `tsc` → `dist/main.js` | `node dist/main.js` |
| `apps/medusa` (Medusa v2) | `medusa build` / `medusa develop` | `medusa develop --port 9000` | `medusa build` | `medusa start --port 9000` |

Each app has its own `package.json`, `tsconfig.json`, and dependency graph. The Medusa package pins `@medusajs/*` ecosystem at `2.22.0` and requires `node >= 22.0.0` via an `engines` field; it also declares `packageManager: npm@10.9.8`.

## Database & Infrastructure Orchestration

`docker-compose.yml` defines three infrastructure services on a shared bridge network `bd_commerce_network`:
- `postgres:16-alpine` — healthchecked via `pg_isready`, data volume `postgres_data`.
- `redis:7-alpine` — optionally password-protected via `REDIS_PASSWORD`, data volume `redis_data`.
- `getmeili/meilisearch:v1.11` — healthchecked via `/health`, data volume `meilisearch_data`.

All ports, credentials, and database names are driven by environment variables with defaults (e.g. `${POSTGRES_PORT:-5432}`, `${REDIS_PASSWORD:-redis_secure_pass}`).

## Testing

- Medusa uses Jest with three test suites gated by `TEST_TYPE`:
  - `test:integration:http` (`--runInBand --forceExit`)
  - `test:integration:modules`
  - `test:unit`
- All Medusa tests run with `NODE_OPTIONS=--experimental-vm-modules` and use `@swc/jest` as the transformer.
- No test scripts exist in `apps/web` or `apps/api`.

## Environment & Configuration

- `.env.example` at the repo root provides default values consumed by both `docker-compose.yml` and the apps.
- `apps/medusa/.env` and `apps/medusa/.env.template` provide per-app overrides.
- The API layer loads env via `dotenv` and connects to PostgreSQL, Redis (`ioredis`), and Meilisearch.

## Notable Absences

- **No Dockerfiles**: the repo does not containerize the application code itself; only the infrastructure services are defined.
- **No CI/CD**: no GitHub Actions, GitLab CI, Bitbucket Pipelines, or Jenkinsfile found at the repo root.
- **No Makefile or shell build scripts**: all orchestration goes through NPM scripts.
- **No versioning/release tooling**: no `changesets`, `semantic-release`, `lerna`, or similar — each app carries its own static `version` field in its `package.json`.
- **No cross-compilation**: everything targets Node.js on Linux/macOS via standard TypeScript compilation.

## Conventions Observed

1. New apps should be placed under `apps/<name>/` so they are picked up by the root `workspaces` glob.
2. Each app follows the same script shape: `dev`, `build`, `start` (and optional `lint`).
3. Infrastructure is always started via `npm run docker:<cmd>` rather than invoking `docker compose` directly.
4. Database migrations for the API layer go through Prisma (`prisma generate` / `prisma migrate dev`); Medusa uses its own `medusa db:migrate`.
5. The Medusa app is the only workspace that ships integration/unit tests via Jest.