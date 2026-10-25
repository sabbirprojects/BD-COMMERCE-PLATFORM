---
kind: external_dependency
name: Meilisearch Instant Search Engine
slug: meilisearch
category: external_dependency
category_hints:
    - vendor_identity
    - client_constraint
scope:
    - '**'
---

### Identity

### Role
Optional but planned: product indexing via a Medusa product mutation workflow so the Next.js storefront can query Meilisearch directly. The container is kept active even though Medusa core does not strictly require it.

### Client Constraint
- Default port `7700` (overridable via `MEILISEARCH_PORT`).
- Master key required via `MEILI_MASTER_KEY` (default template value present).
- Healthcheck hits `http://localhost:7700/health`.
- Persistent data volume `meilisearch_data`.
- `apps/api` depends on the `meilisearch` npm package (v0.44.0).