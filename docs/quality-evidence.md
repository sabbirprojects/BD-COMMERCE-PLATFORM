# Quality Assurance & Release Gate Evidence Document

**Document:** `docs/quality-evidence.md`  
**System:** Bangladesh B2C Single-Vendor E-Commerce Platform  
**Verification Date:** 2026-10-25  
**Governing Document:** [`quality-checklist.md`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/quality-checklist.md)  
**Test Command:** `npm run test:p0` (alias for `node tests/run-all-p0-tests.js`)

---

## 1. Executive Summary

All ten (10) critical Release Gate (P0) security and integration test suites were executed against live infrastructure (Docker PostgreSQL 16, Redis 7, Meilisearch 1.11, Medusa v2 server, and Next.js 15 storefront).

- **Total Test Suites Executed:** 10
- **Suites Passing:** 10 (100%)
- **Suites Failing:** 0 (0%)
- **Total Assertions Verified:** 149
- **Total Execution Time:** ~2.1 seconds
- **Production Compilation:**
  - `npm run build:medusa` — Exit Code 0 (Backend build 7.5s, Admin frontend build 26.4s)
  - `npm run build:web` — Exit Code 0 (Next.js production build 7.7s, 18 static & dynamic routes)

---

## 2. Test Execution Results Matrix

| # | Suite Name | Check IDs / Architecture Gates | Test File Path | Assertions | Status |
|---|---|---|---|---|---|
| 1 | Money Math & Rounding | `database.md §1.6` | [`tests/money-rounding.test.js`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/tests/money-rounding.test.js) | 13 | ✅ PASS |
| 2 | Audit Log Immutability | `CHK-AUD-01`, `D-15`, `database.md §6.5` | [`tests/audit-log-immutability.test.js`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/tests/audit-log-immutability.test.js) | 7 | ✅ PASS |
| 3 | Meilisearch Public Allowlist | `CHK-CAT-08`, `C-1`, `Architecture §19` | [`tests/meilisearch-allowlist.test.js`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/tests/meilisearch-allowlist.test.js) | 21 | ✅ PASS |
| 4 | Concurrent Stock Locking | `CHK-CHK-08`, `AC-6.1` | [`tests/concurrent-stock.test.js`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/tests/concurrent-stock.test.js) | 13 | ✅ PASS |
| 5 | Webhook & Order Idempotency | `CHK-PAY-03`, `AC-7.2`, `AC-G8` | [`tests/idempotency-webhooks.test.js`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/tests/idempotency-webhooks.test.js) | 18 | ✅ PASS |
| 6 | Buy Now 3 Canonical Cases | `CHK-CHK-02`, `CHK-CHK-03`, `CHK-CHK-04`, `AC-4.1`, `AC-4.2` | [`tests/buy-now-cases.test.js`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/tests/buy-now-cases.test.js) | 22 | ✅ PASS |
| 7 | Returns Manual Review & Quarantine | `CHK-FUL-05`, `AC-6.3`, `AC-6.5`, `AC-G7` | [`tests/returns-manual-review.test.js`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/tests/returns-manual-review.test.js) | 20 | ✅ PASS |
| 8 | RBAC 403 Security Matrix | `CHK-SEC-01`, `AC-8.1` | [`tests/rbac-security-matrix.test.js`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/tests/rbac-security-matrix.test.js) | 19 | ✅ PASS |
| 9 | Input Sanitization & SQL/XSS Defense | `CHK-OPS-05` | [`tests/xss-sql-sanitization.test.js`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/tests/xss-sql-sanitization.test.js) | 22 | ✅ PASS |
| 10 | Secret Hygiene & Key Protection | `AC-12.4`, `CHK-OPS-01`, `CHK-SEC-03` | [`tests/secret-hygiene.test.js`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/tests/secret-hygiene.test.js) | 4 | ✅ PASS |

---

## 3. Detailed Verification Evidence

### Suite 1: Canonical Money Math & Integer Paisa Precision
- **File:** [`tests/money-rounding.test.js`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/tests/money-rounding.test.js)
- **Verified Behaviors:**
  - `toPaisa()` accurately converts BDT major units to integer paisa: ৳2500 -> 250000 paisa; ৳1250.50 -> 125050 paisa.
  - Floating point drift absorption: `toPaisa(0.1 + 0.2)` produces exact `30` paisa (not 30.000000000000004).
  - Rounding algorithm strictly follows `ROUND_HALF_UP`: ৳12.345 -> 1235 paisa; ৳12.344 -> 1234 paisa.
  - `toMajor()` converts integer paisa back to decimal BDT with exact 2 decimal places (250000 paisa -> "2500.00").
  - `paisaToBdtNumber()` returns exact float (250000 -> 2500).

### Suite 2: Audit Log Immutability & Hash Chaining
- **File:** [`tests/audit-log-immutability.test.js`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/tests/audit-log-immutability.test.js)
- **Verified Behaviors:**
  - Active triggers on `audit_log`: `trg_audit_log_immutable` and `trg_audit_log_chain`.
  - Append operation (`INSERT`) succeeds cleanly with cryptographic SHA-256 `record_hash`.
  - Mutation attack 1 (`UPDATE audit_log SET action = 'tampered'`): Strictly aborted with PostgreSQL exception `PL/pgSQL function bd_reject_audit_mutation() line 3 at RAISE: audit_log is append-only (attempted UPDATE)`.
  - Mutation attack 2 (`DELETE FROM audit_log`): Strictly aborted with PostgreSQL exception `audit_log is append-only (attempted DELETE)`.
  - Verification query confirms zero rows modified or removed.

### Suite 3: Meilisearch Public Allowlist & Margin Stripping
- **File:** [`tests/meilisearch-allowlist.test.js`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/tests/meilisearch-allowlist.test.js)
- **Verified Behaviors:**
  - `isFieldAllowed()` rejects `cogs_paisa`, `cost_per_unit_paisa`, `packaging_cost_paisa`, `supplier_name`, `margin`, `minimum_margin_percent`, and regex `*_paisa`.
  - Deep document sanitizer (`sanitizeSearchDocument`) strips all cost and supplier metadata from nested objects and arrays.
  - Live Meilisearch catalog scan inspected 17 indexed products (351 document keys) and confirmed zero occurrences of confidential cost, supplier, or margin fields.

### Suite 4: Concurrent Stock Locking & Flash-Sale Race Defense
- **File:** [`tests/concurrent-stock.test.js`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/tests/concurrent-stock.test.js)
- **Verified Behaviors:**
  - Redis distributed mutex (`acquireStockLock`) acquires lock with unique token. Concurrent acquire attempts while lock is held receive `acquired: false`.
  - Attempting release with incorrect token fails (`return 0`); correct token successfully releases lock.
  - PostgreSQL concurrent reservation race: Two simultaneous checkout threads competed for the last 1 available unit in `inventory_level`.
  - Thread 1 updated 1 row (success); Thread 2 updated 0 rows (rejected).
  - Final database state: Stocked = 1, Reserved = 1, Available = 0. Available quantity never dropped below 0 or into negative numbers.

### Suite 5: Idempotent Webhook Replay & Order Completion Defense
- **File:** [`tests/idempotency-webhooks.test.js`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/tests/idempotency-webhooks.test.js)
- **Verified Behaviors:**
  - Payment callback `/hooks/bkash/callback` with `trx_id` was called 3 consecutive times.
  - All 3 calls returned HTTP 200 OK with `already_processed: true` and `payment_status: "captured"`.
  - Database verification confirmed exactly 1 `payment_attempt` record and 1 order created; zero duplicate orders or captures.
  - Checkout idempotency replay on `/store/orders/cod` with existing `x-idempotency-key` returned HTTP 200 OK with `is_duplicate: true` and the original order ID without inserting duplicate records.

### Suite 6: Buy Now 3 Canonical Cases
- **File:** [`tests/buy-now-cases.test.js`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/tests/buy-now-cases.test.js)
- **Verified Behaviors:**
  - **Case A (Empty Cart):** Adds variant (qty 1), returns `case: "A_EMPTY_CART_ADDED"`, redirects to `/bn/checkout`, cart item count = 1.
  - **Case B (Existing Cart with Other Items):** Preserves original items, adds new Buy Now variant, returns `case: "B_OTHER_ITEMS_PRESERVED"`, total lines = 2, redirects to `/bn/checkout`.
  - **Case C (Same Variant Already in Cart):** Detects existing line, keeps quantity unchanged at 1, creates NO duplicate row, does NOT increment, returns `case: "C_EXISTING_PRESERVED"`, redirects to `/bn/checkout`.

### Suite 7: Return Manual Review, Quarantine Routing & Refund RBAC
- **File:** [`tests/returns-manual-review.test.js`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/tests/returns-manual-review.test.js)
- **Verified Behaviors:**
  - Return requests initialize in `pending_manual_review` with condition `uninspected` and refund status `pending` (NEVER auto-approved).
  - Condition evaluation is mandatory before restocking; invalid condition rejected with HTTP 400.
  - Evaluating returned item as `damaged` automatically routes it to Damaged Quarantine location `sloc_01M5QBBQZDHM08KE9AWDF3KKDV`; returns `is_restocked_to_sellable: false` (never restored to Central Warehouse sellable stock).
  - Refund execution RBAC: Call Center staff receive HTTP 403 Forbidden (`unauthorized_role`); Warehouse staff receive HTTP 403 Forbidden.
  - Authorized Finance staff executes refund payout with external transaction ID; sets `refund_status: "paid"` and records amount in paisa (250,000 paisa / 2,500 BDT).

### Suite 8: Granular RBAC 403 Permission Matrix
- **File:** [`tests/rbac-security-matrix.test.js`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/tests/rbac-security-matrix.test.js)
- **Verified Behaviors:**
  - `/admin/reports/contribution-profit`: Owner (200), Finance (200), Manager (403), Warehouse (403), Call Center (403).
  - `/admin/settings/gateways`: Owner ONLY (200), Finance (403), Warehouse (403), Call Center (403).
  - `/admin/audit-logs`: Owner (200), Finance (200), Warehouse (403), Call Center (403).
  - `/admin/settings/bangladesh` (POST): Owner (200/201), Manager (403), Warehouse (403), Call Center (403).
  - Public `/store/products` endpoint verified: All internal COGS, variant unit costs, and supplier names are scrubbed.

### Suite 9: Input Sanitization & SQL/XSS Injection Defense
- **File:** [`tests/xss-sql-sanitization.test.js`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/tests/xss-sql-sanitization.test.js)
- **Verified Behaviors:**
  - Customer name and street address text sanitization (`sanitizeInputText`) strips `<script>`, `<iframe>`, and dangerous HTML elements.
  - Tested 4 XSS attack vectors; all script tags safely eliminated while preserving readable customer names and addresses.
  - Tested 5 classic SQL injection vectors (`' OR 1=1 --`, `'; DROP TABLE ...`, etc.) in parameterized PostgreSQL queries. All executed safely without syntax errors or database modification.

### Suite 10: Secret Hygiene & Key Protection
- **File:** [`tests/secret-hygiene.test.js`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/tests/secret-hygiene.test.js)
- **Verified Behaviors:**
  - Git repository scanned for raw RSA/OpenSSH private key blocks: 0 private keys committed to Git.
  - Nagad RSA private key untracked from Git (`git rm --cached config/keys/nagad_private.pem`), referenced strictly via filesystem path `NAGAD_PRIVATE_KEY_PATH`, and protected with `chmod 0600`.
  - `.gitignore` updated with exclusion patterns for `*.pem`, `*.key`, `*.crt`, and `config/keys/`.
  - Zero live `.env` files tracked in Git.

---

## 4. Security Controls Summary

1. **Security Headers (Storefront Next.js):**
   - Configured in [`apps/web/next.config.mjs`](file:///Users/sabbir/Desktop/All%20projects/bd-commerce-platform/apps/web/next.config.mjs):
     - `X-Frame-Options: SAMEORIGIN` (Clickjacking defense)
     - `X-Content-Type-Options: nosniff` (MIME sniffing defense)
     - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (HSTS)
     - `X-XSS-Protection: 1; mode=block`
     - `Referrer-Policy: origin-when-cross-origin`
     - `poweredByHeader: false` (Removes `X-Powered-By: Next.js`)

2. **Rate Limiting & Abuse Defense:**
   - Admin Login lockout: 5 consecutive failed logins -> 15 min lockout in Redis (`apps/medusa/src/api/middleware-utils/auth-lockout.ts`).
   - Storefront checkout completion: 5 requests/min per IP (`apps/web/src/lib/rate-limit.ts`).
   - Storefront track order: 10 requests/min per IP (`apps/medusa/src/api/store/orders/track/route.ts`).
   - Recipient mobile phone masking: `+88017****5678`.

3. **Phase 2 Status Notice:**
   - `CHK-MKT-02` (Meta Conversions API) is formally classified as Phase 2 Post-Launch enhancement per PRD §5.3.7 and Prompt 17 guidelines. It is not an active P0 blocker.
