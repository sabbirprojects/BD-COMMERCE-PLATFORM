# Development Tooling & Cursor IDE Setup Report

**Date:** 2026-10-24  
**Project:** Bangladesh Single-Vendor E-Commerce Platform (`bd-commerce-platform`)  
**Scope:** Tooling bootstrap and environment configuration for Cursor IDE  

---

## 1. Purpose of This Tooling Setup

This setup prepares the repository for development using **Cursor IDE's built-in Agent panel**. The actual implementation of the application features (numbered Prompts 01 through 18 in [`prompt.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/prompt.md)) will be carried out sequentially inside Cursor.

To ensure consistency, adherence to architecture specifications, and safety during development, this setup establishes:
- Project-level Model Context Protocol (MCP) server definitions in [`.cursor/mcp.json`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/.cursor/mcp.json).
- Permanent, project-wide engineering and safety constraints in [`.cursor/rules/bd-commerce-platform.mdc`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/.cursor/rules/bd-commerce-platform.mdc).
- A reusable Agent Skill in [`.agents/skills/prompt-runner/SKILL.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/.agents/skills/prompt-runner/SKILL.md) to manage single-prompt execution.
- Clear manual verification instructions for validating MCP tools and skills inside Cursor IDE.

---

## 2. Configured MCP Servers & Status

Two MCP servers are configured at the project level in [`.cursor/mcp.json`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/.cursor/mcp.json):

| Server Name | Type / Command | Intended Role | Status |
|---|---|---|---|
| **`context7`** | Remote HTTP/SSE: `https://mcp.context7.com/mcp/oauth` | Provides current library documentation for Medusa v2.22, Next.js 15, and Tailwind CSS. Used only to resolve specific framework API questions when installed source/types are ambiguous. | **Configured**, **Syntax validated**, **Not yet verified** (requires Cursor IDE OAuth) |
| **`playwright`** | Local: `npx -y @playwright/mcp@latest` | Browser automation and verification for interactive UI and end-to-end flows in local environments (`http://localhost:3000`, `http://localhost:9000`). Launched on-demand by Cursor. | **Configured**, **Syntax validated**, **Not yet verified** (requires Cursor IDE execution) |

### Intentionally Excluded MCPs
Per project guidelines, the following MCPs were explicitly excluded:
- Database administration MCPs with write access (to protect shared PostgreSQL container and legacy Prisma tables).
- Generic filesystem/shell MCPs (native IDE tools already provide this).
- InsForge MCPs (InsForge is not used on this platform; `agent.md` supersedes `AGENTS.md`).
- GitHub MCP with embedded personal access tokens.
- Redundant search or browser tools.

---

## 3. Project Configuration & Agent Skills Created

### A. Cursor Project MCP Configuration: [`.cursor/mcp.json`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/.cursor/mcp.json)
Configures the `context7` and `playwright` servers within the `mcpServers` object.
- **Status:** **Configured**, **Syntax validated**.
- **Credentials:** No secrets, tokens, or private keys are embedded in this file.

### B. Permanent Cursor Project Rule: [`.cursor/rules/bd-commerce-platform.mdc`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/.cursor/rules/bd-commerce-platform.mdc)
Defines mandatory constraints automatically applied to every Cursor Agent session:
- **Rule Authority:** Enforces document precedence (Installed Medusa v2.22 > `database.md` > `prd.md` > `dfd.md` > `docs/architecture.md` > `prompt.md` > `agent.md`). Rejects generic InsForge instructions in `AGENTS.md`.
- **Scope Discipline:** One numbered prompt per session; mandatory verification before starting subsequent prompts.
- **Money Invariants:** Medusa core = BDT major units; custom tables = integer paisa (`*_paisa`); conversions strictly through `apps/medusa/src/lib/money.ts`.
- **Operational Status:** Decoupled 4-dimension status model (Order, Payment, Shipment, Return/Refund Review).
- **Security & Data Safety:** Never drop Docker volumes or legacy Prisma tables (`categories`, `order_items`, `orders`, `products`, `users`). Never expose COGS or margins publicly. Never commit secrets.
- **Manual Operations:** No auto-approval for returns, no automatic refund disbursement, and no automatic restock into sellable inventory.
- **Status:** **Configured**, **Syntax validated**.

### C. Cursor Agent Skill: [`.agents/skills/prompt-runner/SKILL.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/.agents/skills/prompt-runner/SKILL.md)
Defines a standardized workflow for executing implementation prompts:
- **Phase A (Scope):** Target identification, standing rules review, prerequisites check.
- **Phase B (Inspection):** Read installed code and existing schema before coding.
- **Phase C (Tool Economy):** Local types first; narrow Context7 queries; Playwright only for concrete UI validation.
- **Phase D (Invariants):** Enforce single-vendor, Medusa-first, canonical tables, and privacy rules.
- **Phase E (Narrow Implementation):** Scope-bound coding without speculative refactoring.
- **Phase F (Honest Verification):** Real command execution and evidence collection against live containers.
- **Phase G (Handoff):** Standardized reporting format (Files changed, Summary, Executed checks, Blockers, Done-when status, Handoff).
- **Status:** **Configured**, **Syntax validated**.

### D. Existing Configuration Preserved
- Root [`.cursorrules`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/.cursorrules) was inspected and preserved intact.
- Root [`package.json`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/package.json), [`apps/medusa/package.json`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/apps/medusa/package.json), and [`apps/web/package.json`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/apps/web/package.json) were inspected and left unmodified. No dependencies were added.

---

## 4. Verification Status & Distinctions

To maintain absolute accuracy, the status of each component is categorized using the required distinctions:

- **Configured:** The relevant configuration file was created or merged into the repository.
- **Syntax validated:** The syntax, schema, and frontmatter formatting were validated locally.
- **Connected:** The MCP server connection was tested and established in Cursor IDE.
- **Not yet verified:** The connection or runtime behavior requires interactive verification inside Cursor IDE.

| Item | Status | Verification Detail |
|---|---|---|
| [`.cursor/mcp.json`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/.cursor/mcp.json) | **Configured** & **Syntax validated** | JSON syntax validated via Node.js JSON parser. Zero parse errors. |
| [`.cursor/rules/bd-commerce-platform.mdc`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/.cursor/rules/bd-commerce-platform.mdc) | **Configured** & **Syntax validated** | YAML frontmatter validated. All 16 required constraints incorporated. |
| [`.agents/skills/prompt-runner/SKILL.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/.agents/skills/prompt-runner/SKILL.md) | **Configured** & **Syntax validated** | YAML frontmatter validated. 7-phase execution protocol defined. |
| Context7 MCP Connection | **Not yet verified** | Remote OAuth endpoint configured; must be authorized inside Cursor IDE. |
| Playwright MCP Connection | **Not yet verified** | Local `npx` command configured; will be spawned on-demand by Cursor IDE. |

---

## 5. Prerequisites & Manual Verification in Cursor IDE

When opening this repository in **Cursor IDE**, complete the following manual checks:

### Step 1: Open Project in Cursor
Launch Cursor IDE and open the repository folder:
```bash
cursor "/Users/sabbir/Desktop/All projects/bd-commerce-platform"
```

### Step 2: Verify MCP Servers in Cursor Settings
1. Navigate to **Cursor Settings** (Gear icon) -> **Features** -> **MCP**.
2. Confirm that both servers appear under the project MCP configuration:
   - `context7`
   - `playwright`
3. **Context7 Authentication**:
   - If Cursor prompts for authentication, complete the OAuth flow in your default browser.
   - **Manual Fallback**: If your Cursor IDE version does not support remote OAuth MCP endpoints directly, you can configure Context7 through Cursor's MCP interface using your personal Context7 API key:
     1. Open Cursor Settings -> Features -> MCP -> Add new MCP server.
     2. Set Type to `command`.
     3. Command: `npx -y @context7/mcp@latest`.
     4. Environment Variable: Set `CONTEXT7_API_KEY` to your Context7 key within Cursor's secure UI settings (never commit this key to any repository file).
4. **Playwright MCP**:
   - Cursor will show `playwright` configured with command `npx -y @playwright/mcp@latest`.
   - Cursor spawns this on demand when browser testing is requested. Ensure Node.js 20+ and npm are available in your system path.

### Step 3: Verify the Rule
1. Navigate to **Cursor Settings** -> **Rules for AI** (or open `.cursor/rules/bd-commerce-platform.mdc`).
2. Verify that the rule is recognized and marked active with `alwaysApply: true`.

### Step 4: Verify the Skill
1. In Cursor's Agent chat panel, type `/prompt-runner` or reference the skill.
2. Confirm that Cursor recognizes the prompt-runner skill from `.agents/skills/prompt-runner/SKILL.md`.

---

## 6. Next Steps

With tooling bootstrap complete:
1. Open the repository in **Cursor IDE**.
2. Verify MCP server statuses in Cursor Settings.
3. Initiate implementation of **Prompt 01** (`PROMPT 01 — Medusa v2 foundation setup`) using Cursor's Agent panel and `/prompt-runner`.
