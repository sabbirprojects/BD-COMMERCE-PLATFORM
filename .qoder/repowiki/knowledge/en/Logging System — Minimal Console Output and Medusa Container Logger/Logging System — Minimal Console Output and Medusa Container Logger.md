---
kind: logging_system
name: Logging System — Minimal Console Output and Medusa Container Logger
category: logging_system
scope:
    - '**'
source_files:
    - apps/api/src/main.ts
    - apps/medusa/src/migration-scripts/initial-data-seed.ts
    - apps/medusa/src/migration-scripts/region-store-policies.ts
    - apps/medusa/src/scripts/seed-demo-products.ts
    - apps/medusa/instrumentation.ts
    - apps/medusa/medusa-config.ts
---

## Overview

The BD Commerce Platform monorepo does not implement a dedicated logging framework. Logging is ad-hoc and split across the two backend apps:

- **`apps/api` (Express)**: uses bare `console.log` for startup messages.
- **`apps/medusa` (Medusa v2)**: resolves the framework's built-in logger from the DI container via `ContainerRegistrationKeys.LOGGER` and calls its `.info()` method.

There is no shared logger module, no log-level configuration file, no structured-log library (e.g. pino, winston, bunyan), and no custom sinks or formatters. The only observability hook present is a fully commented-out OpenTelemetry registration in `apps/medusa/instrumentation.ts`, which is disabled by default.

## Key Files

- `apps/api/src/main.ts` — Express entrypoint; the only place that emits output, using `console.log` to print server URL and health-check endpoint.
- `apps/medusa/src/migration-scripts/initial-data-seed.ts` — seed script that resolves `ContainerRegistrationKeys.LOGGER` from the Medusa container and logs seeding progress with `logger.info(...)`.
- `apps/medusa/src/migration-scripts/region-store-policies.ts` — migration helper using the same `container.resolve(ContainerRegistrationKeys.LOGGER)` pattern.
- `apps/medusa/src/scripts/seed-demo-products.ts` — demo product seeder using `logger.info(...)`.
- `apps/medusa/instrumentation.ts` — placeholder for OpenTelemetry instrumentation; all code is commented out, so it has no runtime effect.
- `apps/medusa/medusa-config.ts` — project config; no logging-related options are configured.

## Architecture and Conventions

1. **No centralized logger abstraction.** Each app handles its own output independently. There is no `lib/logger.ts`, no Winston/Pino setup, and no environment-driven log level switch.

2. **Medusa modules use the framework logger via DI.** In Medusa scripts, the logger is obtained through:
   ```ts
   const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
   ```
   and invoked as `logger.info(message)`. This is the only structured usage of a logger in the codebase.

3. **Only one log level is used:** `logger.info(...)`. No `debug`, `warn`, or `error` calls appear in the application source. Errors are surfaced through Medusa's exception handling rather than explicit log statements.

4. **Express API uses raw stdout.** `apps/api/src/main.ts` writes human-readable startup lines directly to stdout via `console.log`. There is no request/response logging middleware (no morgan, no helmet, no custom Express middleware).

5. **Structured fields are absent.** Log messages are plain strings (e.g. `"Seeding store data..."`, `"Finished seeding regions."`). No JSON-structured payloads, no correlation IDs, no request-scoped context.

6. **OpenTelemetry is documented but disabled.** `instrumentation.ts` contains a commented template showing how to register `registerOtel` with HTTP/workflow/query instrumentation and a Zipkin exporter, but it is not wired into `medusa-config.ts` and remains inactive.

7. **Audit/courier/payment "logs" are database entities, not console logs.** The `bd-audit`, `bd-courier`, and `bd-payments` modules define models named `audit-log`, `courier-shipment-log`, `courier-webhook-log`, and `payment-webhook-log`. These persist operational events to PostgreSQL via Prisma/Medusa migrations rather than writing to stdout/stderr. They represent an audit trail, not a general-purpose logging sink.

## Conventions and Constraints

- **Observed convention:** Application startup and seed operations in Medusa use `container.resolve(ContainerRegistrationKeys.LOGGER).info(...)` for progress reporting.
- **Observed convention:** The Express API (`apps/api`) uses `console.log` for human-readable startup messages only.
- **Observed constraint:** No third-party logging library is declared in any `package.json`; the only dependencies related to observability are the commented-out OpenTelemetry references in `instrumentation.ts`.
- **Observed constraint:** There is no configuration for log levels, destinations, or formatting anywhere in `medusa-config.ts`, `apps/api/package.json`, or root configuration files.
- **Documented intent (not enforced):** `instrumentation.ts` comments state that uncommenting the file enables OpenTelemetry instrumentation for HTTP, workflows, and queries, pointing to Medusa docs at `https://docs.medusajs.com/learn/debugging-and-testing/instrumentation`. This is a template, not active behavior.

## Summary

The repository has no production-grade logging system. It relies on two minimal patterns: raw `console.log` in the Express API and Medusa's built-in container-resolved logger used only in seed/migration scripts. Audit-like event persistence exists as database tables under the custom modules, but there is no unified logging framework, no structured logging, and no configurable sinks.