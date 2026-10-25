---
kind: external_dependency
name: Redis 7 In-Memory Cache & Message Broker
slug: redis-7
category: external_dependency
category_hints:
    - vendor_identity
    - client_constraint
scope:
    - '**'
---

### Identity
Redis 7 Alpine image, container name `bd_commerce_redis`, used as cache, session broker, and event bus backing for Medusa workflows.

### Role
- Medusa v2 requires Redis for event streaming, pub/sub messaging, and distributed workflow locking.
- Legacy `apps/api` also connects via `ioredis`.

### Client Constraint
- Default port `6379` (overridable via `REDIS_PORT`).
- Optional password via `REDIS_PASSWORD` passed as `--requirepass` when set.
- Connection URL consumed as `REDIS_URL` (shape `redis://:password@host:port`).
- Persistent data volume `redis_data`.
- Healthcheck uses `redis-cli ping`.