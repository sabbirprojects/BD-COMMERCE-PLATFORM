/**
 * Master P0 Verification & Integration Test Runner
 *
 * Executes the complete suite of P0 security and integration tests:
 * 1. Money Math & Rounding (database.md §1.6)
 * 2. Audit Log Immutability Triggers (database.md §6.5, D-15)
 * 3. Meilisearch Allowlist & COGS Stripping (CHK-CAT-08, C-1)
 * 4. Concurrent Stock Locking & Overselling Prevention (CHK-CHK-08, AC-6.1)
 * 5. Idempotent Order Completion & Webhook Replay Defense (CHK-PAY-03, AC-7.2, AC-G8)
 * 6. Buy Now 3 Canonical Cases (CHK-CHK-02, CHK-CHK-03, CHK-CHK-04, AC-4.1, AC-4.2)
 * 7. Return Manual Review, Quarantine Routing & Refund RBAC (CHK-FUL-05, AC-6.3, AC-6.5, AC-G7)
 * 8. RBAC 403 Security Matrix & Margin Privacy (CHK-SEC-01, AC-8.1)
 * 9. Input Sanitization & SQL/XSS Defense (CHK-OPS-05)
 * 10. Secret Hygiene & Key Protection (AC-12.4)
 */

const { spawnSync } = require('child_process')
const path = require('path')

const TEST_SUITES = [
  { name: '1. Money Math & Rounding', file: 'money-rounding.test.js', gate: 'database.md §1.6' },
  { name: '2. Audit Log Immutability', file: 'audit-log-immutability.test.js', gate: 'CHK-AUD-01 / D-15' },
  { name: '3. Meilisearch Allowlist Scrubbing', file: 'meilisearch-allowlist.test.js', gate: 'CHK-CAT-08 / C-1' },
  { name: '4. Concurrent Stock Locking', file: 'concurrent-stock.test.js', gate: 'CHK-CHK-08 / AC-6.1' },
  { name: '5. Webhook & Order Idempotency', file: 'idempotency-webhooks.test.js', gate: 'CHK-PAY-03 / AC-7.2' },
  { name: '6. Buy Now 3 Canonical Cases', file: 'buy-now-cases.test.js', gate: 'CHK-CHK-02, 03, 04' },
  { name: '7. Returns Manual Review & Quarantine', file: 'returns-manual-review.test.js', gate: 'CHK-FUL-05 / AC-6.3' },
  { name: '8. RBAC 403 Security Matrix', file: 'rbac-security-matrix.test.js', gate: 'CHK-SEC-01 / AC-8.1' },
  { name: '9. Input Sanitization & XSS/SQL Defense', file: 'xss-sql-sanitization.test.js', gate: 'CHK-OPS-05' },
  { name: '10. Secret Hygiene & Key Exclusion', file: 'secret-hygiene.test.js', gate: 'AC-12.4' },
]

async function runAllTests() {
  console.log('\n=====================================================================')
  console.log('       BANGLADESH COMMERCE PLATFORM — P0 INTEGRATION TEST RUNNER')
  console.log('=====================================================================\n')

  const results = []
  const startTime = Date.now()

  for (const suite of TEST_SUITES) {
    const suiteFilePath = path.join(__dirname, suite.file)
    console.log(`▶ Running Suite: ${suite.name} (${suite.file})...`)
    const suiteStart = Date.now()

    const proc = spawnSync('node', [suiteFilePath], {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..'),
    })

    const durationMs = Date.now() - suiteStart
    const passed = proc.status === 0

    results.push({
      ...suite,
      passed,
      exitCode: proc.status,
      durationMs,
    })

    if (!passed) {
      console.error(`\n❌ FAILED: ${suite.name} exited with code ${proc.status}\n`)
    }
  }

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2)
  const passedCount = results.filter((r) => r.passed).length
  const failedCount = results.length - passedCount

  console.log('\n=====================================================================')
  console.log('                    P0 TEST EXECUTION SUMMARY')
  console.log('=====================================================================\n')

  console.log('| Suite Name | Gate / Check | Status | Duration |')
  console.log('|---|---|---|---|')
  for (const r of results) {
    const statusText = r.passed ? '✅ PASS' : '❌ FAIL'
    console.log(`| ${r.name} | ${r.gate} | ${statusText} | ${r.durationMs}ms |`)
  }

  console.log(`\nTotal Suites: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount} | Time: ${totalDuration}s\n`)

  if (failedCount > 0) {
    console.error('❌ One or more P0 verification test suites failed!')
    process.exit(1)
  } else {
    console.log('🎉 ALL P0 SECURITY & INTEGRATION TEST SUITES PASSED CLEANLY!\n')
    process.exit(0)
  }
}

runAllTests()
