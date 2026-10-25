---
kind: external_dependency
name: PostgreSQL 16 Relational Database
slug: postgresql-16
category: external_dependency
category_hints:
    - vendor_identity
    - client_constraint
scope:
    - '**'
---

### Identity
PostgreSQL 16 Alpine image, container name `bd_commerce_postgres`, default database `bd_commerce`.

### Role
Primary relational store for both the legacy Prisma schema (`apps/api/prisma/schema.prisma`) and the Medusa v2 core/custom module schemas. The Medusa migration path explicitly reuses this container rather than introducing a new DB.

### Client Constraint
- Default port `5432` (overridable via `POSTGRES_PORT`).
- Credentials supplied via `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` environment variables.
- Persistent data volume `postgres_data`.
- Healthcheck uses `pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}`.
- Connection string shape expected by both Prisma and Medusa: `postgresql://user:pass@host:port/bd_commerce?schema=public`.