---
name: prompt-runner
description: Execute exactly one numbered prompt from prompt.md for the Bangladesh single-vendor e-commerce project, using focused context and evidence-based verification.
---

# Prompt Runner — Bangladesh Single-Vendor E-commerce Platform

Execute exactly one numbered prompt from [`prompt.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/prompt.md). Do not chain prompts automatically.

## 1. Identify the target prompt

- Identify the exact numbered prompt requested by the user (e.g., "Prompt 01", "Prompt 02").
- Confirm the user wants to run that prompt before proceeding.

## 2. Read governing context

- Read [`agent.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/agent.md) for standing project rules.
- Read the selected prompt in [`prompt.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/prompt.md) in full, including:
  - `READ FIRST` documents
  - `PREREQUISITE`
  - `SCOPE`
  - `DONE WHEN`
  - `HANDOFF`
- Read the reference documents listed under `READ FIRST` for that prompt.

## 3. Inspect existing code

- Inspect relevant files in `apps/medusa`, `apps/web`, or shared configuration.
- Align with existing conventions and canonical `database.md` table names.
- Do not assume a greenfield state; reshape existing scaffolds rather than duplicating them.

## 4. Resolve framework uncertainty

- Prefer installed Medusa v2.22.x code and TypeScript types in `node_modules/@medusajs/*` as the primary authority.
- Use Context7 only for focused, version-relevant documentation lookup when installed source is unclear.
- Use Playwright/browser automation only when it adds genuine verification value (e.g., UI workflows, checkout flows).

## 5. Implement narrowly

- Implement only the active prompt's scope.
- Avoid unrelated refactors, speculative abstractions, or new dependencies.
- Preserve single-vendor scope, Medusa-first architecture, canonical `database.md` rules, and the money boundary (`apps/medusa/src/lib/money.ts`).
- Preserve the 4 independent order, payment, shipment/fulfillment, and return-review status dimensions.
- Protect COGS and margin information; keep them out of storefront APIs, logs, and search indexes.
- Never auto-approve returns or automatically issue refunds.

## 6. Verify

- Run the exact checks listed in the prompt's `DONE WHEN`.
- Run `npm run build:medusa` (and `npm run build:web` if storefront work is active) after changes.
- Run relevant tests against live Docker PostgreSQL/Redis containers where required.
- Record real commands, exit codes, HTTP statuses, and database query results.
- Explicitly report any skipped, failed, or blocked checks and the reason.

## 7. Report and hand off

At the end of the active prompt, report:

1. Files changed, created, or deleted.
2. Implementation summary.
3. Commands run and their results.
4. Passed, failed, and skipped checks with rationale.
5. Blockers, open decisions, or technical debt.
6. Point-by-point `DONE WHEN` assessment with evidence.
7. Next prompt in sequence and any state/context needed.

Stop after the active prompt. Await explicit user instruction before starting the next numbered prompt.
