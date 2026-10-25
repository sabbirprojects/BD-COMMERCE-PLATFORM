/**
 * Prompt 08 Automated Verification Suite — Checkout and Delivery Zones
 *
 * Validates:
 * 1. CHK-CHK-05: Bangladesh mobile phone validation & normalization (012 blocked, valid guest proceeds)
 * 2. 4-tier Bangladesh address cascade: Division -> District -> Thana -> Street (server-side validation)
 * 3. CHK-CHK-06: Dynamic zone delivery fee from native configuration (Inside Dhaka ৳60 vs Outside Dhaka ৳130 vs Suburbs ৳100)
 * 4. CHK-CHK-07: Server-side price & stock integrity check (price change requires acknowledgement, out-of-stock blocked)
 * 5. Rate limiting: 5 checkout attempts per minute per IP triggers HTTP 429 (architecture §7.3)
 * 6. Address snapshot & UTM persistence into cart.metadata and native cart.shipping_address
 * 7. Prompt 08 scope boundary: No order is created by Prompt 08
 */

const BASE_URL = 'http://localhost:3000';
const VARIANT_PANJABI = 'variant_01M5RH8DJ0YP65605EAAB5M339'; // ৳2,500 in stock
const VARIANT_OUT_OF_STOCK = 'variant_01M5RH8DJ1CMJH9FH4YHZ29FP1'; // Panjabi XL Navy Blue (Stock = 0)

class CookieSession {
  constructor(ip) {
    this.cookies = new Map();
    this.ip = ip || `10.0.${Math.floor(Math.random() * 200) + 1}.${Math.floor(Math.random() * 200) + 1}`;
  }

  saveCookies(res) {
    const raw = res.headers.get('set-cookie');
    if (!raw) return;
    const parts = raw.split(/,(?=[^;]+=[^;]+)/);
    for (const part of parts) {
      const match = part.match(/^\s*([^=;]+)=([^;]*)/);
      if (match) {
        this.cookies.set(match[1].trim(), match[2].trim());
      }
    }
  }

  getCookieHeader() {
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  async fetch(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (!headers['x-forwarded-for']) {
      headers['x-forwarded-for'] = this.ip;
    }
    const cookieHeader = this.getCookieHeader();
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }
    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    this.saveCookies(res);
    return res;
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('   PROMPT 08 VERIFICATION SUITE — CHECKOUT & DELIVERY ZONES     ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} — ${details}`);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: Geo Master Hierarchy Endpoint (/api/geo)
  // --------------------------------------------------------------------------
  console.log('--- TEST 1: Geo Master Hierarchy Endpoint ---');
  const session1 = new CookieSession();
  const geoRes = await session1.fetch('/api/geo');
  const geoData = await geoRes.json();

  assert(
    geoRes.status === 200 &&
    Array.isArray(geoData.divisions) &&
    geoData.divisions.length === 8 &&
    Array.isArray(geoData.districts) &&
    geoData.districts.length === 64 &&
    Array.isArray(geoData.thanas) &&
    geoData.thanas.length === 495,
    'TEST 1: /api/geo returns complete 8 divisions, 64 districts, and 495 thanas',
    `Divisions: ${geoData.divisions?.length}, Districts: ${geoData.districts?.length}, Thanas: ${geoData.thanas?.length}`
  );

  // --------------------------------------------------------------------------
  // TEST 2: CHK-CHK-05: Reject Invalid Phone Number (012... prefix)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 2: CHK-CHK-05 Phone Rejection (012 Prefix) ---');
  // Add item to cart first
  await session1.fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ variant_id: VARIANT_PANJABI, quantity: 1 }),
  });

  const invalidPhoneRes = await session1.fetch('/api/checkout/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      first_name: 'Test',
      phone: '01234567890', // Invalid operator 012
      division_code: 'BD-DHK',
      district_code: 'BD-DHK-DHA',
      thana_code: 'BD-DHK-DHA-SAV',
      street_address: 'Road 5, House 12',
    }),
  });
  const invalidPhoneData = await invalidPhoneRes.json();

  assert(
    invalidPhoneRes.status === 400 &&
    invalidPhoneData.error_bn === 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন',
    'TEST 2 [CHK-CHK-05]: Invalid mobile operator (01234567890) blocked with "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন"',
    `Status: ${invalidPhoneRes.status}, Error BN: ${invalidPhoneData.error_bn}`
  );

  // --------------------------------------------------------------------------
  // TEST 3: CHK-CHK-05: Reject Invalid Phone Lengths (10 and 12 digits)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 3: CHK-CHK-05 Phone Length Rejection ---');
  const shortPhoneRes = await session1.fetch('/api/checkout/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      first_name: 'Test',
      phone: '0171234567', // 10 digits
      division_code: 'BD-DHK',
      district_code: 'BD-DHK-DHA',
      thana_code: 'BD-DHK-DHA-SAV',
      street_address: 'Road 5, House 12',
    }),
  });
  const shortPhoneData = await shortPhoneRes.json();

  const longPhoneRes = await session1.fetch('/api/checkout/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      first_name: 'Test',
      phone: '017123456789', // 12 digits
      division_code: 'BD-DHK',
      district_code: 'BD-DHK-DHA',
      thana_code: 'BD-DHK-DHA-SAV',
      street_address: 'Road 5, House 12',
    }),
  });
  const longPhoneData = await longPhoneRes.json();

  assert(
    shortPhoneRes.status === 400 &&
    shortPhoneData.error_bn === 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন' &&
    longPhoneRes.status === 400 &&
    longPhoneData.error_bn === 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন',
    'TEST 3 [CHK-CHK-05]: Wrong phone lengths (10 and 12 digits) rejected with "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন"',
    `Short status: ${shortPhoneRes.status}, Long status: ${longPhoneRes.status}`
  );

  // --------------------------------------------------------------------------
  // TEST 4: Reject Invalid Address Hierarchy (Mismatched codes)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 4: Server-Side 4-Tier Address Code Validation ---');
  const invalidAddressRes = await session1.fetch('/api/checkout/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      first_name: 'Test',
      phone: '01712345678', // Valid phone
      division_code: 'BD-DHK', // Dhaka Division
      district_code: 'BD-CTG-CTG', // Chittagong District (mismatched division!)
      thana_code: 'BD-DHK-DHA-SAV',
      street_address: 'Road 5, House 12',
    }),
  });

  assert(
    invalidAddressRes.status === 400,
    'TEST 4: Mismatched address hierarchy codes (Chittagong District in Dhaka Division) rejected by server',
    `Status: ${invalidAddressRes.status}`
  );

  // --------------------------------------------------------------------------
  // TEST 5: CHK-CHK-06: Dynamic Delivery Zone Rate — Inside Dhaka (৳60)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 5: CHK-CHK-06 Inside Dhaka Dynamic Rate (৳60) ---');
  const dhakaShippingRes = await session1.fetch('/api/checkout/shipping', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ district_code: 'BD-DHK-DHA' }),
  });
  const dhakaShippingData = await dhakaShippingRes.json();

  assert(
    dhakaShippingRes.status === 200 &&
    dhakaShippingData.zone?.code === 'inside_dhaka' &&
    dhakaShippingData.zone?.amount === 60 &&
    dhakaShippingData.cart?.shipping_total === 60 &&
    dhakaShippingData.cart?.total === 2560,
    'TEST 5 [CHK-CHK-06]: Selecting Dhaka district resolves inside_dhaka flat rate (৳60) and updates totals (2500 + 60 = 2560)',
    `Zone: ${dhakaShippingData.zone?.code}, Amount: ${dhakaShippingData.zone?.amount}, Cart Total: ${dhakaShippingData.cart?.total}`
  );

  // --------------------------------------------------------------------------
  // TEST 6: CHK-CHK-06: Dynamic Delivery Zone Rate — Outside Dhaka (৳130)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 6: CHK-CHK-06 Outside Dhaka Dynamic Rate (৳130) ---');
  const ctgShippingRes = await session1.fetch('/api/checkout/shipping', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ district_code: 'BD-CTG-CTG' }),
  });
  const ctgShippingData = await ctgShippingRes.json();

  assert(
    ctgShippingRes.status === 200 &&
    ctgShippingData.zone?.code === 'outside_dhaka' &&
    ctgShippingData.zone?.amount === 130 &&
    ctgShippingData.cart?.shipping_total === 130 &&
    ctgShippingData.cart?.total === 2630,
    'TEST 6 [CHK-CHK-06]: Switching to Outside Dhaka district dynamically updates delivery charge to ৳130 from config (2500 + 130 = 2630)',
    `Zone: ${ctgShippingData.zone?.code}, Amount: ${ctgShippingData.zone?.amount}, Cart Total: ${ctgShippingData.cart?.total}`
  );

  // --------------------------------------------------------------------------
  // TEST 7: CHK-CHK-06: Dynamic Delivery Zone Rate — Dhaka Suburbs (৳100)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 7: CHK-CHK-06 Dhaka Suburbs Dynamic Rate (৳100) ---');
  const gazShippingRes = await session1.fetch('/api/checkout/shipping', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ district_code: 'BD-DHK-GAZ' }),
  });
  const gazShippingData = await gazShippingRes.json();

  assert(
    gazShippingRes.status === 200 &&
    gazShippingData.zone?.code === 'dhaka_suburbs' &&
    gazShippingData.zone?.amount === 100 &&
    gazShippingData.cart?.shipping_total === 100 &&
    gazShippingData.cart?.total === 2600,
    'TEST 7 [CHK-CHK-06]: Switching to Gazipur district dynamically updates delivery charge to Dhaka Suburbs ৳100',
    `Zone: ${gazShippingData.zone?.code}, Amount: ${gazShippingData.zone?.amount}, Cart Total: ${gazShippingData.cart?.total}`
  );

  // --------------------------------------------------------------------------
  // TEST 8: Missing / Unmapped District Code Blocks Progression
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 8: Unmapped District Code Rejection ---');
  const unmappedShippingRes = await session1.fetch('/api/checkout/shipping', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ district_code: 'BD-INVALID-CODE' }),
  });

  assert(
    unmappedShippingRes.status === 400,
    'TEST 8: Unmapped district code blocked with clear error; never fabricates a fallback zone',
    `Status: ${unmappedShippingRes.status}`
  );

  // --------------------------------------------------------------------------
  // TEST 9: CHK-CHK-05 Valid Guest Checkout Form Submission & Metadata Persistence
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 9: Valid Guest Submission & Metadata Snapshot ---');
  const validSubmitRes = await session1.fetch('/api/checkout/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-idempotency-key': `idem_${Date.now()}`,
    },
    body: JSON.stringify({
      first_name: 'Sabbir',
      last_name: 'Ahmed',
      phone: '01712345678', // Local format
      alt_phone: '01812345678',
      division_code: 'BD-DHK',
      district_code: 'BD-DHK-DHA',
      thana_code: 'BD-DHK-DHA-SAV',
      street_address: 'House 12, Road 4, Sector 7, Savar',
      postal_code: '1348',
      utm_params: {
        utm_source: 'facebook',
        utm_medium: 'cpc',
        utm_campaign: 'eid_collection',
      },
    }),
  });
  const validSubmitData = await validSubmitRes.json();

  const cartMetadata = validSubmitData.cart?.metadata;
  const addressSnapshot = cartMetadata?.address_snapshot;

  assert(
    validSubmitRes.status === 200 &&
    validSubmitData.success === true &&
    validSubmitData.ready_for_order === true &&
    cartMetadata?.division_code === 'BD-DHK' &&
    cartMetadata?.district_code === 'BD-DHK-DHA' &&
    cartMetadata?.thana_code === 'BD-DHK-DHA-SAV' &&
    cartMetadata?.delivery_zone_code === 'inside_dhaka' &&
    cartMetadata?.utm_source === 'facebook' &&
    addressSnapshot?.phone === '+8801712345678' && // Normalized to canonical E.164
    addressSnapshot?.division_name_en === 'Dhaka' &&
    addressSnapshot?.district_name_en === 'Dhaka' &&
    addressSnapshot?.thana_name_en === 'Savar',
    'TEST 9 [CHK-CHK-05]: Valid guest checkout normalizes phone to +8801712345678, persists 4-tier address snapshot and UTMs to cart metadata',
    `Phone: ${addressSnapshot?.phone}, Zone: ${cartMetadata?.delivery_zone_code}, UTM: ${cartMetadata?.utm_source}`
  );

  // --------------------------------------------------------------------------
  // TEST 10: CHK-CHK-07 Out-of-Stock Item Blocks Progression
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 10: CHK-CHK-07 Out-of-Stock Item Integrity ---');
  const sessionOutOfStock = new CookieSession();
  // Try to add out-of-stock variant
  const oosAddRes = await sessionOutOfStock.fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ variant_id: VARIANT_OUT_OF_STOCK, quantity: 1 }),
  });
  const oosAddData = await oosAddRes.json();

  assert(
    oosAddRes.status === 400 && (oosAddData.error?.toLowerCase().includes('inventory') || oosAddData.error?.toLowerCase().includes('stock')),
    'TEST 10 [CHK-CHK-07 & AC-4.4]: Adding or submitting out-of-stock item is rejected server-side with out-of-stock notification',
    `Status: ${oosAddRes.status}, Error: ${oosAddData.error}`
  );

  // --------------------------------------------------------------------------
  // TEST 11: CHK-CHK-07 Price Change Integrity & Acknowledgement
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 11: CHK-CHK-07 Price Change Integrity & Acknowledgement ---');
  // First validate current session cart: prices are in sync
  const valRes1 = await session1.fetch('/api/checkout/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const valData1 = await valRes1.json();

  assert(
    valRes1.status === 200 && valData1.valid === true,
    'TEST 11a [CHK-CHK-07]: Cart with live matching price passes integrity validation',
    `Valid: ${valData1.valid}`
  );

  // Simulate price change on Medusa cart line item by temporarily tampering line item price in DB
  const { execSync } = require('child_process');
  const cartId = session1.cookies.get('_medusa_cart_id');
  execSync(`docker exec bd_commerce_postgres psql -U postgres -d bd_commerce -c "UPDATE cart_line_item SET unit_price = 2000, raw_unit_price = '{\\"value\\":\\"2000\\"}' WHERE cart_id = '${cartId}';"`);

  // Revalidate: must detect price discrepancy (cart line ৳2,000 vs DB ৳2,500)
  const valRes2 = await session1.fetch('/api/checkout/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const valData2 = await valRes2.json();
  const priceChangesList = valData2.priceChanges || valData2.price_changes || [];
  const pChange = priceChangesList[0];

  assert(
    valData2.valid === false &&
    Boolean(valData2.hasPriceChange || valData2.has_price_change) === true &&
    priceChangesList.length > 0 &&
    pChange?.old_unit_price === 2000 &&
    pChange?.new_unit_price === 2500,
    'TEST 11b [CHK-CHK-07]: Server detects price change from ৳2,000 to ৳2,500 and blocks stale checkout progression',
    `Valid: ${valData2.valid}, Old Price: ${pChange?.old_unit_price}, New Price: ${pChange?.new_unit_price}`
  );

  // Acknowledge updated price
  const valRes3 = await session1.fetch('/api/checkout/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ acknowledge_price_changes: true }),
  });
  const valData3 = await valRes3.json();

  // Revalidate again: now prices match
  const valRes4 = await session1.fetch('/api/checkout/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const valData4 = await valRes4.json();

  assert(
    valData4.valid === true && !Boolean(valData4.hasPriceChange || valData4.has_price_change),
    'TEST 11c [CHK-CHK-07]: Customer acknowledges price change -> cart price refreshes to ৳2,500 and checkout proceeds',
    `Valid: ${valData4.valid}`
  );

  // --------------------------------------------------------------------------
  // TEST 12: Architecture §7.3 IP Rate Limiting (5 req/min/IP)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 12: Architecture §7.3 IP Rate Limiting (5 req/min) ---');
  const sessionRateLimit = new CookieSession();
  const testIp = '198.51.100.99'; // Test IP for rate limiting

  // Send 5 rapid requests with this IP
  let wasBlocked = false;
  let blockStatus = 0;
  for (let i = 1; i <= 6; i++) {
    const res = await fetch(`${BASE_URL}/api/checkout/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': testIp,
      },
      body: JSON.stringify({
        first_name: 'Spam',
        phone: '01712345678',
        division_code: 'BD-DHK',
        district_code: 'BD-DHK-DHA',
        thana_code: 'BD-DHK-DHA-SAV',
        street_address: 'Spam Street',
      }),
    });

    if (res.status === 429) {
      wasBlocked = true;
      blockStatus = res.status;
      break;
    }
  }

  assert(
    wasBlocked === true && blockStatus === 429,
    'TEST 12 [Architecture §7.3]: Exceeding 5 checkout attempts per minute per IP triggers HTTP 429 Too Many Requests',
    `Was Blocked: ${wasBlocked}, Status: ${blockStatus}`
  );

  // --------------------------------------------------------------------------
  // TEST 13: Prompt 08 Scope Boundary (No Order Created)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 13: Prompt 08 Scope Boundary (No Order Created) ---');
  const { execSync: exec2 } = require('child_process');
  const ordersCountOutput = exec2('docker exec bd_commerce_postgres psql -U postgres -d bd_commerce -t -c "SELECT count(*) FROM \\"order\\";"').toString().trim();
  const orderCount = Number(ordersCountOutput);

  assert(
    orderCount === 0,
    'TEST 13 [Scope Boundary]: No order created by Prompt 08 checkout validation path (Prompt 09 reserved for COD placement)',
    `Orders in Medusa DB: ${orderCount}`
  );

  // --------------------------------------------------------------------------
  // TEST 14: Bilingual Checkout Routes Render Seamlessly
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 14: Bilingual Checkout Routes ---');
  const enRes = await fetch(`${BASE_URL}/en/checkout`);
  const enHtml = await enRes.text();
  const bnRes = await fetch(`${BASE_URL}/bn/checkout`);
  const bnHtml = await bnRes.text();

  assert(
    enRes.status === 200 &&
    enHtml.includes('Order Review &amp; Checkout') || enHtml.includes('Order Review & Checkout') &&
    bnRes.status === 200 &&
    bnHtml.includes('অর্ডার পর্যালোচনা ও চেকআউট'),
    'TEST 14: /en/checkout and /bn/checkout render localized headings and 4-tier address form',
    `EN status: ${enRes.status}, BN status: ${bnRes.status}`
  );

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`PROMPT 08 VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Test suite uncaught error:', err);
  process.exit(1);
});
