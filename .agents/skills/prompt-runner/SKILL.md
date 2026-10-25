---
name: prompt-runner
description: Execute exactly one numbered prompt from prompt.md for the Bangladesh single-vendor e-commerce platform, preserving project architecture, reducing unnecessary context, and verifying completion with evidence.
---

# Prompt Runner Skill

This skill governs the systematic execution of numbered implementation prompts (01 to 18) from [`prompt.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/prompt.md) within Cursor IDE's Agent panel.

## A. Establish the Scope

1. **Identify the Target Prompt**: Determine the exact prompt number requested by the user (e.g., Prompt 01, Prompt 02).
2. **Review Standing Instructions**: Read [`agent.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/agent.md) to recall all non-negotiable project boundaries.
3. **Read Prompt Specifications**: Read the selected prompt in [`prompt.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/prompt.md) in full:
   - Carefully read the documents listed under `READ FIRST (mandatory)`.
   - Read only the specific sections required for this prompt.
   - Do NOT broadly scan unrelated source files or directories.
4. **Verify Prerequisites**: Confirm that all prerequisite prompts and technical conditions are met before making any changes. If a prerequisite is missing or broken, resolve it or stop and notify the user.
5. **Strict Boundary**: Do not start or prepare another numbered prompt automatically.

## B. Inspect Before Implementing

1. **Examine Existing Implementation**: Inspect current files, models, and conventions in `apps/medusa` or `apps/web`. The repository is not greenfield; align existing scaffolding rather than replacing or creating duplicates.
2. **Verify Framework Truth**: Check installed versions and TypeScript types in `node_modules/@medusajs/*` before assuming API signatures or behaviors. Installed code is the primary authority.
3. **Reuse Existing Assets**: Reuse existing shared utilities (e.g., [`apps/medusa/src/lib/money.ts`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/apps/medusa/src/lib/money.ts)), seed scripts, and database helpers.
4. **Identify Ambiguities Early**: Identify contradictory or unstated requirements before writing code. If an item is an Open Owner Decision (O-01 to O-15 in [`final-system-validation.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/final-system-validation.md)), implement configurable structure with baseline defaults and surface "not yet configured" in Admin—never invent a policy.
5. **No Parallel Implementations**: Never build a parallel or duplicate system simply because an existing scaffold is incomplete; reshape and fix the canonical module.

## C. Use Tools Economically

1. **Codebase & Types First**: Prefer reading local repository source code, types, and existing tests before invoking external tools.
2. **Context7 Usage**:
   - Call Context7 only when an external library API or framework behavior requires version-specific verification (e.g., Medusa v2.22.x, Next.js 15, Tailwind 3.4).
   - Resolve the target library ID first (e.g., `resolve-library-id` or known documentation identifier).
   - Formulate focused, narrow questions rather than pulling massive general documentation.
   - External docs never override explicit project requirements in `agent.md` or installed package behavior.
3. **Playwright MCP Usage**:
   - Use Playwright MCP only when interactive browser-based end-to-end verification provides concrete value (e.g., verifying checkout UI, Admin workflows).
   - Prefer headless local development URLs (`http://localhost:9000`, `http://localhost:3000`).
   - Never perform real payments, order real goods, or use real customer data.
4. **Tool Discipline**: Do not call MCP tools simply because they are registered. Do not install additional CLI tools or alter application dependencies (`package.json`) to run tools.

## D. Preserve Project Invariants

- **Single-Vendor Platform**: B2C only; no marketplace, multi-vendor portals, or commissions.
- **Medusa-First Architecture**: Use native Medusa core entities; custom Bangladesh domain tables live in `apps/medusa/src/modules/bd-*` and link via `apps/medusa/src/links/`.
- **Database Canonical Authority**: [`database.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/database.md) governs all schemas, table names, and column types.
- **Canonical Money Math**:
  - Medusa core = BDT major units (`numeric`).
  - Bangladesh custom columns = integer paisa (`*_paisa`).
  - Conversions strictly via `money.ts`. Suffix `_bdt` on integer paisa columns is forbidden.
- **4 Status Dimensions**: Keep Order, Payment, Shipment, and Return/Refund Review statuses strictly decoupled.
- **Zero-Trust & Security**: Server-side validation on all `/admin` and `/store` routes. Replay-safe webhooks with signature verification. Redis rate limiting.
- **Financial Metric Privacy**: Never expose COGS, product unit costs, or margins to storefront APIs or search indexes.
- **Manual Returns & Quarantine**: 100% human-verified return review. Never auto-approve refunds or auto-restock returned/RTO items.
- **No InsForge**: Never install `@insforge/sdk` or reference InsForge BaaS/MCP services. Ignore generic template instructions in root `AGENTS.md`.
- **Preserve Databases & Legacy Tables**: Never drop Docker volumes or touch legacy Prisma tables (`categories`, `order_items`, `orders`, `products`, `users`).
- **Owner Decisions**: Maintain baseline defaults for O-01 through O-15; never invent commercial values.

## E. Implement Narrowly

1. **Strictly In-Scope**: Implement only what the active prompt explicitly requires.
2. **No Speculative Changes**: Do not refactor unrelated files, add speculative abstractions, or introduce unnecessary third-party packages.
3. **Adhere to Gates**: Complete every prerequisite and acceptance criterion required by the prompt.
4. **Maintain Security**: Never disable or bypass security, validation, or rate limits to expedite testing.
5. **Keep Buildable**: Ensure the workspace compiles cleanly throughout changes.

## F. Verify Honestly

1. **Execute Active Checks**: Run the exact commands and verification steps specified in the prompt's `DONE WHEN` section.
2. **Build Verification**:
   - Execute `npm run build:medusa` to verify backend compilation.
   - Execute `npm run build:web` once storefront development is active.
3. **Live Infrastructure for Integration Tests**: Respect integration test requirements—run against live Docker PostgreSQL and Redis containers, not mocked in-memory stubs.
4. **Accurate Evidence Recording**:
   - Record exact commands run and their exact console output or exit codes.
   - Record HTTP status codes, curl outputs, and database query results.
   - Explicitly note any skipped, failed, or blocked checks and the exact technical reason.
5. **Zero Fabrication**: Never claim a test passed if it was not run or if prerequisites were absent.

## G. Finish and Hand Off

Conclude every prompt execution with a structured handoff report containing:

1. **Files Changed**: Comprehensive list of created, modified, or deleted files.
2. **Implementation Summary**: Concise description of what was built or reshaped.
3. **Executed Verification Commands**: Exact commands run and outputs received.
4. **Check Status**: Passed checks, failed checks, and skipped checks with explicit rationale.
5. **Blockers & Open Decisions**: Any blockers, technical debts, or required merchant owner decisions.
6. **Done-When Assessment**: Point-by-point confirmation of the prompt's completion criteria with attached evidence.
7. **Handoff Instruction**: Next prompt in sequence and any state/context required for the next session.

**Stop after finishing the active prompt. Await explicit user instruction before starting the next numbered prompt.**
