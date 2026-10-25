---
kind: dependency_management
name: NPM Workspaces Monorepo Dependency Management
category: dependency_management
scope:
    - '**'
source_files:
    - package.json
    - package-lock.json
    - apps/medusa/package.json
    - apps/web/package.json
    - apps/api/package.json
---

## System Overview

The BD Commerce Platform uses **npm workspaces** as its dependency management system. The repository is a Node.js monorepo with three application packages (`apps/web`, `apps/api`, `apps/medusa`) sharing a single lockfile at the repository root.

## Key Files

- `package.json` (root) — declares workspaces and top-level orchestration scripts
- `package-lock.json` (root) — single lockfile for all workspace dependencies
- `apps/medusa/package.json` — Medusa v2 commerce backend, pinned to `@medusajs/*` 2.22.0
- `apps/web/package.json` — Next.js 15 storefront using React 19
- `apps/api/package.json` — Express + Prisma API layer
- `.gitignore` — excludes `node_modules/` from version control

## Architecture and Conventions

### Workspace Layout

The root `package.json` configures two workspace globs:

```json
"workspaces": ["apps/*", "packages/*"]
```

This resolves `apps/web`, `apps/api`, and `apps/medusa`. A `packages/*` glob is declared but no `packages/` directory currently exists in the tree.

### Package Naming

All workspace packages use the `@bd-commerce/` scope:
- `@bd-commerce/web` (Next.js frontend)
- `@bd-commerce/api` (Express API)
- `@bd-commerce/medusa` (Medusa commerce backend)

### Version Pinning Strategy

There are two distinct patterns across the apps:

- **Exact pinning**: The Medusa app pins every `@medusajs/*` package to exactly `2.22.0` (no semver range), ensuring the framework, admin SDK, dashboard, caching, CLI, draft-order module, and test-utils stay in lockstep.
- **Caret ranges**: The web and api apps use caret ranges (`^`) for most dependencies (e.g., `next ^15.1.0`, `express ^4.21.2`, `prisma ^5.22.0`), allowing minor/patch updates within the major version.

### Shared Tooling

TypeScript, `@types/node`, and `zod` appear as dependencies in multiple apps rather than being hoisted into a shared `packages/` directory. Zod appears twice with different versions: `zod 4.2.0` in the Medusa app and `zod ^3.24.1` in the API app — these are separate copies resolved by npm.

### Orchestration Scripts

The root `package.json` exposes unified scripts that delegate to workspace members via `--workspace=<pkg>`:

- `dev:web`, `dev:api`, `dev:medusa` — per-app development servers
- `build:web`, `build:api`, `build:medusa` — per-app builds
- `start:medusa` — production Medusa server on port 9000
- `medusa:migrate` — database migrations
- `prisma:generate`, `prisma:migrate`, `prisma:studio` — Prisma tooling for the API app
- `docker:*` — compose lifecycle commands

### Runtime Constraints

The Medusa app declares an `engines` field requiring `node >=22.0.0`, and pins the package manager to `npm@10.9.8` via the `packageManager` field, which enforces the exact npm version used during installs.

### Lockfile Policy

A single `package-lock.json` lives at the repository root and is committed to version control. There is no `.npmrc` file visible in the tree, so private registries or custom scopes are not configured at the npm level. Dependencies come from the public npm registry.

### Vendoring / Private Packages

No vendored third-party code was found under a `vendor/` or similar directory. No `GOPRIVATE`, `.npmrc`, or private registry configuration was detected. Internal packages would be published to a private registry and consumed like any other npm package; none exist yet since the `packages/*` workspace is empty.

## Conventions and Constraints

- All third-party dependencies are declared in each app's own `package.json`; there is no central dependency manifest beyond the root workspaces declaration.
- The Medusa app requires exact version pins for all `@medusajs/*` ecosystem packages to keep the framework and its extensions compatible.
- The repository enforces Node.js ≥22 and npm 10.9.8 through the Medusa app's `engines` and `packageManager` fields.
- `node_modules/` directories are gitignored and not committed; dependency resolution is delegated entirely to npm's workspace resolver against the root `package-lock.json`.
- Top-level scripts are the canonical entry point for building, developing, and running any workspace — direct invocation of workspace binaries is discouraged in favor of the root script surface.