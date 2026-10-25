/**
 * Unit Test Suite: Canonical Money Precision & Conversion
 *
 * Implements Prompt 17 (Scope 1, money.ts rounding, database.md §1.6):
 * - Validates toPaisa and toMajor conversions via bignumber.js
 * - Confirms ROUND_HALF_UP rounding behavior
 * - Proves zero float drift across fractional amounts
 */
const { toPaisa, toMajor } = require('../apps/medusa/.medusa/server/src/lib/money');

function runMoneyTests() {
  console.log('\n--- 1. Testing Canonical Money Precision (money.ts) ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Basic conversions
  assert(toPaisa(2500) === 250000, 'toPaisa(2500) === 250000 paisa');
  assert(toPaisa('2500.00') === 250000, 'toPaisa("2500.00") === 250000 paisa');
  assert(toPaisa(0) === 0, 'toPaisa(0) === 0');
  assert(toPaisa('0.01') === 1, 'toPaisa("0.01") === 1 paisa');

  // 2. Rounding half up rule
  assert(toPaisa(120.555) === 12056, 'toPaisa(120.555) rounds half up to 12056');
  assert(toPaisa(120.554) === 12055, 'toPaisa(120.554) rounds down to 12055');
  assert(toPaisa('99.999') === 10000, 'toPaisa("99.999") rounds to 10000 paisa');

  // 3. toMajor conversions
  assert(toMajor(250000) === 2500, 'toMajor(250000) === 2500 BDT');
  assert(toMajor(12056) === 120.56, 'toMajor(12056) === 120.56 BDT');
  assert(toMajor(1) === 0.01, 'toMajor(1) === 0.01 BDT');
  assert(toMajor(0) === 0, 'toMajor(0) === 0 BDT');

  // 4. Float drift prevention test (e.g. 0.1 + 0.2 in JS float arithmetic is 0.30000000000000004)
  const sumMajor = 0.1 + 0.2; // 0.30000000000000004 in raw JS
  const cleanPaisa = toPaisa(sumMajor);
  assert(cleanPaisa === 30, 'toPaisa absorbs JavaScript floating point drift (0.1 + 0.2 -> 30 paisa)');

  // 5. Symmetric round-trip integrity
  const original = 1450.75;
  const roundTrip = toMajor(toPaisa(original));
  assert(roundTrip === original, `Round-trip conversion is lossless (${original} -> ${toPaisa(original)} -> ${roundTrip})`);

  return { passed, failed };
}

if (require.main === module) {
  const result = runMoneyTests();
  process.exit(result.failed > 0 ? 1 : 0);
}

module.exports = { runMoneyTests };
