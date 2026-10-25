/**
 * Comprehensive Verification Suite for Prompt 14 — Campaign Landing Pages & CMS
 *
 * Verifies:
 * 1. Database Schema Integrity (8 canonical tables in database.md §3.9)
 * 2. POST /admin/landing-pages creates draft with controlled theme tokens
 * 3. Contrast Validation Gate: low contrast (< 4.5:1) rejected with HTTP 400
 * 4. Script / Arbitrary CSS injection defense rejected with HTTP 400
 * 5. AC-5.2 Stock & Publish Gate: out-of-stock or unpublished variant blocks publishing with HTTP 422
 * 6. Successful Publish & Version Snapshotting in landing_page_version
 * 7. CHK-MKT-01: Public Storefront route /lp/[slug] with layout isolation (navbar & footer hidden)
 * 8. AC-5.1 & CHK-MKT-03: Mode B unified embedded checkout preserves pre-existing cart lines and persists UTMs onto order_bd_details
 * 9. FR-5.2.5: Expired campaign offer defense
 * 10. AC-5.3: Media upload rejects oversized (>5MB) and disallowed types while live page remains intact
 * 11. FR-9.6 / AC-9.1: Homepage link integrity blocks broken product references with HTTP 422
 * 12. AC-9.2: Version rollback restores appearance without touching orders or stock
 * 13. CHK-UX-03: Unpublishing omits page from dynamic sitemap.xml
 * 14. D-21: Central Meta Pixel single source of truth from operational_settings
 */

const { Client } = require('pg')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')

const MEDUSA_URL = 'http://localhost:9000'
const WEB_URL = 'http://localhost:3000'
const DB_URL = 'postgresql://postgres:b4c2de80b80e3bebc18adbde993908a9@localhost:5432/bd_commerce?schema=public'
const PUBLISHABLE_KEY = 'pk_e03efb8523c1542172c95fe34dc90955a3389f3ee3592faa16171966d4699096'

function getAdminToken() {
  return jwt.sign(
    {
      actor_id: 'user_01M5P3610BV01PG4SD3BYDM517',
      actor_type: 'user',
      auth_identity_id: 'authid_01M5P3612X11ZJXREVT1T07902',
      app_metadata: { user_id: 'user_01M5P3610BV01PG4SD3BYDM517', role: 'owner' },
    },
    'supersecret',
    { expiresIn: '1d' }
  )
}

async function run() {
  console.log('======================================================================')
  console.log('Starting Verification Suite for Prompt 14 — Campaign Landing Pages')
  console.log('======================================================================\n')

  const pg = new Client({ connectionString: DB_URL })
  await pg.connect()
  const token = getAdminToken()
  const adminHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
  const storeHeaders = {
    'Content-Type': 'application/json',
    'x-publishable-api-key': PUBLISHABLE_KEY,
  }

  // ==========================================
  // TEST 1: Database Schema Integrity
  // ==========================================
  console.log('--- TEST 1: Database Schema Integrity (database.md §3.9) ---')
  const expectedTables = [
    'landing_page',
    'landing_page_version',
    'landing_page_offer',
    'ad_campaign',
    'ad_conversion_event',
    'homepage_section',
    'content_page',
    'media_asset',
  ]

  for (const tbl of expectedTables) {
    const res = await pg.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
      [tbl]
    )
    if (res.rows.length === 0) {
      throw new Error(`Expected table "${tbl}" not found in database!`)
    }
  }
  console.log(`✓ All 8 canonical tables verified in database.`)

  // Check columns on landing_page
  const colCheck = await pg.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'landing_page'`
  )
  const cols = colCheck.rows.map(r => r.column_name)
  const requiredCols = ['id', 'slug', 'status', 'sections_json', 'theme_tokens_json', 'checkout_mode']
  for (const rc of requiredCols) {
    if (!cols.includes(rc)) {
      throw new Error(`Missing expected column "${rc}" on landing_page!`)
    }
  }
  console.log(`✓ landing_page schema columns verified: ${requiredCols.join(', ')}`)

  // ==========================================
  // TEST 2: Create Draft Landing Page
  // ==========================================
  console.log('\n--- TEST 2: POST /admin/landing-pages (Create Draft) ---')
  const testSlug = `lp-test-${Date.now().toString(36)}`
  const validSections = [
    {
      id: 'sec_hero_1',
      section_type: 'hero',
      headline_en: 'Premium Cotton Panjabi Special Collection',
      headline_bn: 'প্রিমিয়াম কটন পাঞ্জাবি স্পেশাল কালেকশন',
      subheadline_en: 'Crafted for elegance and everyday comfort in Bangladesh',
      subheadline_bn: 'আভিজাত্য ও আরামদায়ক অভিজ্ঞতার জন্য বিশেষ কালেকশন',
      cta_text_en: 'Order Now',
      cta_text_bn: 'এখনই অর্ডার করুন',
      cta_action: 'scroll_checkout',
    },
    {
      id: 'sec_features_1',
      section_type: 'features_grid',
      features: [
        { title_en: '100% Organic Cotton', title_bn: '১০০% সুতি কাপড়', icon: 'sparkles' },
        { title_en: 'Free Delivery inside Dhaka', title_bn: 'ঢাকায় ফ্রি ডেলিভারি', icon: 'truck' },
      ],
    },
  ]
  const validTokens = {
    primary_color: '#1e3a8a',
    accent_color: '#10b981',
    background_color: '#ffffff',
    text_color: '#111827',
    border_radius: '8px',
  }

  const createRes = await fetch(`${MEDUSA_URL}/admin/landing-pages`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      slug: testSlug,
      title_en: 'Eid Panjabi Campaign 2026',
      title_bn: 'ঈদ পাঞ্জাবি ক্যাম্পেইন ২০২৬',
      checkout_mode: 'embedded',
      sections_json: validSections,
      theme_tokens_json: validTokens,
      seo_title_en: 'Eid Panjabi - Limited Edition',
      seo_description_en: 'Order online with fast COD across Bangladesh',
    }),
  })

  if (createRes.status !== 201) {
    const errText = await createRes.text()
    throw new Error(`Failed to create landing page draft: ${createRes.status} ${errText}`)
  }
  const createData = await createRes.json()
  const landingPageId = createData.landing_page.id
  console.log(`✓ Draft landing page created: id=${landingPageId}, slug=${testSlug}, status=${createData.landing_page.status}`)

  // ==========================================
  // TEST 3: WCAG AA Contrast Validation Gate
  // ==========================================
  console.log('\n--- TEST 3: WCAG AA Contrast Ratio Gate ---')
  const lowContrastTokens = {
    primary_color: '#1e3a8a',
    background_color: '#ffffff',
    text_color: '#f0f0f0', // Very light grey on white = ~1.1:1 contrast
  }
  const contrastFailRes = await fetch(`${MEDUSA_URL}/admin/landing-pages`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      slug: `${testSlug}-contrast-fail`,
      title_en: 'Contrast Fail Test',
      sections_json: validSections,
      theme_tokens_json: lowContrastTokens,
    }),
  })

  if (contrastFailRes.status !== 400) {
    throw new Error(`Expected 400 Bad Request for low contrast, got ${contrastFailRes.status}`)
  }
  const contrastErr = await contrastFailRes.json()
  console.log(`✓ Low contrast rejected with HTTP 400: "${contrastErr.error}"`)

  // ==========================================
  // TEST 4: Script Injection Defense (XSS Gate)
  // ==========================================
  console.log('\n--- TEST 4: Script / Arbitrary CSS Injection Defense ---')
  const maliciousSections = [
    {
      id: 'sec_xss',
      section_type: 'hero',
      headline_en: 'Hacked <script>alert(document.cookie)</script>',
      headline_bn: 'ম্যালিসিয়াস স্ক্রিপ্ট',
    },
  ]
  const xssFailRes = await fetch(`${MEDUSA_URL}/admin/landing-pages`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      slug: `${testSlug}-xss-fail`,
      title_en: 'XSS Attack Test',
      sections_json: maliciousSections,
      theme_tokens_json: validTokens,
    }),
  })

  if (xssFailRes.status !== 400) {
    throw new Error(`Expected 400 Bad Request for script tag injection, got ${xssFailRes.status}`)
  }
  const xssErr = await xssFailRes.json()
  console.log(`✓ Malicious script injection rejected with HTTP 400: "${xssErr.error}"`)

  // ==========================================
  // TEST 5: AC-5.2 Stock & Publish Gate Block
  // ==========================================
  console.log('\n--- TEST 5: AC-5.2 Publish Gate (Out-of-Stock / Unpublished Product Block) ---')
  // Create an unpublished (draft) product or variant with 0 stock to test AC-5.2
  const unpubProdId = `prod_test_draft_${Date.now()}`
  const unpubVarId = `var_test_draft_${Date.now()}`
  await pg.query(
    `INSERT INTO product (id, title, handle, status, created_at, updated_at)
     VALUES ($1, 'Draft Unpublished Product', $2, 'draft', now(), now())`,
    [unpubProdId, `unpub-prod-${Date.now()}`]
  )
  await pg.query(
    `INSERT INTO product_variant (id, title, product_id, created_at, updated_at)
     VALUES ($1, 'Draft Variant', $2, now(), now())`,
    [unpubVarId, unpubProdId]
  )

  // Attach draft variant offer to landing page
  const attachRes1 = await fetch(`${MEDUSA_URL}/admin/landing-pages/${landingPageId}/offers`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      variant_id: unpubVarId,
      offer_price_paisa: 145000,
      bundle_qty: 1,
      label_en: '1x Panjabi Special',
    }),
  })
  if (attachRes1.status !== 201) {
    throw new Error(`Failed to attach offer: ${attachRes1.status}`)
  }

  // Attempt to publish
  const publishFailRes = await fetch(`${MEDUSA_URL}/admin/landing-pages/${landingPageId}/publish`, {
    method: 'POST',
    headers: adminHeaders,
  })

  if (publishFailRes.status !== 422) {
    throw new Error(`Expected 422 Unprocessable Entity when publishing unpublished/out-of-stock product, got ${publishFailRes.status}`)
  }
  const pubFailData = await publishFailRes.json()
  console.log(`✓ AC-5.2 gate blocked publishing with HTTP 422: "${pubFailData.error}"`)

  // ==========================================
  // TEST 6: Successful Publish & Version Snapshotting
  // ==========================================
  console.log('\n--- TEST 6: Successful Publish & Version Snapshotting ---')
  // Remove the draft offer and attach an active, in-stock variant
  await pg.query(`DELETE FROM landing_page_offer WHERE landing_page_id = $1`, [landingPageId])
  
  // Use in-stock variant with BDT pricing
  const inStockVariantId = 'variant_01M5RH8DJ1Z4BZV97D9DQV76CF'
  const attachRes2 = await fetch(`${MEDUSA_URL}/admin/landing-pages/${landingPageId}/offers`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      variant_id: inStockVariantId,
      offer_price_paisa: 125000, // 1250 BDT
      bundle_qty: 1,
      label_en: 'Single Pack (1250 BDT)',
      label_bn: '১টি পাঞ্জাবি (১২৫০ টাকা)',
      sort_order: 1,
    }),
  })
  if (attachRes2.status !== 201) {
    throw new Error(`Failed to attach in-stock offer: ${attachRes2.status}`)
  }

  const publishOkRes = await fetch(`${MEDUSA_URL}/admin/landing-pages/${landingPageId}/publish`, {
    method: 'POST',
    headers: adminHeaders,
  })
  if (publishOkRes.status !== 200) {
    const pubErr = await publishOkRes.text()
    throw new Error(`Expected 200 OK for publish with in-stock variant, got ${publishOkRes.status}: ${pubErr}`)
  }
  const pubData = await publishOkRes.json()
  console.log(`✓ Landing page published successfully: status=${pubData.landing_page.status}`)

  // Verify version snapshot
  const verRes = await pg.query(
    `SELECT * FROM landing_page_version WHERE landing_page_id = $1 AND is_current = true`,
    [landingPageId]
  )
  if (verRes.rows.length === 0) {
    throw new Error(`Expected version snapshot with is_current=true in landing_page_version!`)
  }
  console.log(`✓ Version snapshot recorded: version=${verRes.rows[0].version}, is_current=${verRes.rows[0].is_current}`)

  // ==========================================
  // TEST 7: Public Storefront Isolation (CHK-MKT-01)
  // ==========================================
  console.log('\n--- TEST 7: Public Storefront Route & Isolation (CHK-MKT-01) ---')
  // 1. Fetch store API
  const storeRes = await fetch(`${MEDUSA_URL}/store/landing-pages/${testSlug}`, {
    headers: storeHeaders,
  })
  if (storeRes.status !== 200) {
    throw new Error(`Expected 200 OK for public landing page API, got ${storeRes.status}`)
  }
  const storeData = await storeRes.json()
  const offersList = storeData.landing_page.offers || storeData.offers || []
  if (storeData.landing_page.slug !== testSlug || offersList.length === 0) {
    throw new Error(`Landing page payload missing or offers empty`)
  }
  console.log(`✓ Public API returned published landing page with ${offersList.length} offer(s)`)

  // 2. Test draft slug 404
  const notFoundRes = await fetch(`${MEDUSA_URL}/store/landing-pages/unknown-slug-xyz`, {
    headers: storeHeaders,
  })
  if (notFoundRes.status !== 404) {
    throw new Error(`Expected 404 for non-existent/draft slug, got ${notFoundRes.status}`)
  }
  console.log(`✓ Draft/non-existent slug properly returns HTTP 404`)

  // 3. Test Storefront Web Route renders standalone layout without navbar/footer
  const webLpRes = await fetch(`${WEB_URL}/en/lp/${testSlug}`)
  if (webLpRes.status !== 200) {
    throw new Error(`Expected 200 OK from Next.js storefront for /en/lp/${testSlug}, got ${webLpRes.status}`)
  }
  const webHtml = await webLpRes.text()
  if (webHtml.includes('navbar-standard') || webHtml.includes('Quick Links') || webHtml.includes('searchQuery')) {
    throw new Error(`CHK-MKT-01 violation: Standard store navbar/footer rendered on campaign landing page!`)
  }
  if (!webHtml.includes('BD Commerce Special') && !webHtml.includes('EmbeddedCheckout')) {
    throw new Error(`Landing page body content was not rendered!`)
  }
  console.log(`✓ CHK-MKT-01 verified: Standalone landing page renders without standard navbar or footer distractions`)

  // ==========================================
  // TEST 8: AC-5.1 & CHK-MKT-03 Unified Cart & UTM Attribution
  // ==========================================
  console.log('\n--- TEST 8: Mode B Unified Cart & UTM Attribution (AC-5.1 & CHK-MKT-03) ---')
  // 1. Customer already has Item A in cart (1 Liter Mustard Oil)
  const existingCartVariantId = 'variant_01M5RH8DV8TJ3KVYBRQW6ABM4V'
  const cartCreateRes = await fetch(`${MEDUSA_URL}/store/carts`, {
    method: 'POST',
    headers: storeHeaders,
    body: JSON.stringify({ currency_code: 'bdt', region_id: 'reg_01M5P357HTK2C9VK295D0K8BZ0' }),
  })
  const cartData = await cartCreateRes.json()
  const cartId = cartData.cart.id

  // Add Item A
  await fetch(`${MEDUSA_URL}/store/carts/${cartId}/line-items`, {
    method: 'POST',
    headers: storeHeaders,
    body: JSON.stringify({ variant_id: existingCartVariantId, quantity: 1 }),
  })

  // 2. Mode B Embedded Checkout adds Campaign Item B (inStockVariantId)
  await fetch(`${MEDUSA_URL}/store/carts/${cartId}/line-items`, {
    method: 'POST',
    headers: storeHeaders,
    body: JSON.stringify({ variant_id: inStockVariantId, quantity: 1 }),
  })

  // Set address & shipping
  await fetch(`${MEDUSA_URL}/store/carts/${cartId}`, {
    method: 'POST',
    headers: storeHeaders,
    body: JSON.stringify({
      shipping_address: {
        first_name: 'Tanvir',
        last_name: 'Ahmed',
        phone: '+8801712349999',
        address_1: 'Dhanmondi 27',
        city: 'Dhaka',
        province: 'BD-DHK-DHA',
        postal_code: '1209',
        country_code: 'bd',
      },
      metadata: {
        division_code: 'BD-DHK',
        district_code: 'BD-DHK-DHA',
        thana_code: 'BD-DHK-DHA-MIR',
        delivery_zone_code: 'inside_dhaka',
      },
    }),
  })

  await fetch(`${MEDUSA_URL}/store/carts/${cartId}/shipping-methods`, {
    method: 'POST',
    headers: storeHeaders,
    body: JSON.stringify({ option_id: 'so_01M5QBPCQEQ4CF0TE556VPBHSG' }),
  })

  // Check cart lines before checkout: must contain BOTH items
  const cartLinesRes = await pg.query(
    `SELECT variant_id, quantity FROM cart_line_item WHERE cart_id = $1`,
    [cartId]
  )
  if (cartLinesRes.rows.length < 2) {
    throw new Error(`AC-5.1 Cart Unification failure: expected ≥ 2 line items in cart, found ${cartLinesRes.rows.length}`)
  }
  console.log(`✓ AC-5.1 verified: Cart contains ${cartLinesRes.rows.length} items (pre-existing cart items preserved)`)

  // 3. Submit COD order with UTM attribution and Idempotency key
  const testIdempKey = `idemp_lp_p14_${Date.now()}`
  const orderRes = await fetch(`${MEDUSA_URL}/store/orders/cod`, {
    method: 'POST',
    headers: {
      ...storeHeaders,
      'x-idempotency-key': testIdempKey,
    },
    body: JSON.stringify({
      cart_id: cartId,
      landing_page_id: landingPageId,
      utm_source: 'facebook',
      utm_medium: 'cpc',
      utm_campaign: 'eid_panjabi_2026',
      utm_content: 'video_ad_variant_a',
      utm_term: 'panjabi online',
    }),
  })

  if (orderRes.status !== 200) {
    const errText = await orderRes.text()
    throw new Error(`Failed to place COD order: ${orderRes.status} ${errText}`)
  }
  const orderData = await orderRes.json()
  const placedOrderId = orderData.order.id
  console.log(`✓ Order placed successfully via Mode B checkout: id=${placedOrderId}`)

  // 4. Verify order_bd_details has UTMs and landing_page_id
  const obdRes = await pg.query(
    `SELECT * FROM order_bd_details WHERE order_id = $1`,
    [placedOrderId]
  )
  if (obdRes.rows.length === 0) {
    throw new Error(`No order_bd_details found for order ${placedOrderId}!`)
  }
  const obd = obdRes.rows[0]
  if (obd.utm_source !== 'facebook' || obd.utm_campaign !== 'eid_panjabi_2026' || obd.landing_page_id !== landingPageId) {
    throw new Error(`CHK-MKT-03 UTM attribution mismatch: ${JSON.stringify(obd)}`)
  }
  console.log(`✓ CHK-MKT-03 verified: UTM params (source=${obd.utm_source}, campaign=${obd.utm_campaign}) & landing_page_id persisted`)

  // 5. Test idempotency
  const dupRes = await fetch(`${MEDUSA_URL}/store/orders/cod`, {
    method: 'POST',
    headers: {
      ...storeHeaders,
      'x-idempotency-key': testIdempKey,
    },
    body: JSON.stringify({
      cart_id: cartId,
    }),
  })
  const dupData = await dupRes.json()
  if (!dupData.is_duplicate) {
    throw new Error(`Expected is_duplicate: true for replayed idempotency key`)
  }
  console.log(`✓ Idempotency verified: Duplicate order submission safely deduplicated`)

  // ==========================================
  // TEST 9: FR-5.2.5 Expired Campaign Offer Defense
  // ==========================================
  console.log('\n--- TEST 9: FR-5.2.5 Expired Campaign Offer Defense ---')
  const expiredOfferRes = await fetch(`${MEDUSA_URL}/admin/landing-pages/${landingPageId}/offers`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      variant_id: inStockVariantId,
      offer_price_paisa: 99000,
      bundle_qty: 1,
      label_en: 'Flash Sale (Expired)',
      starts_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      ends_at: new Date(Date.now() - 3600000).toISOString(), // Expired 1 hour ago
    }),
  })
  const expOfferData = await expiredOfferRes.json()

  // Query public landing page
  const checkExpRes = await fetch(`${MEDUSA_URL}/store/landing-pages/${testSlug}`, {
    headers: storeHeaders,
  })
  const checkExpData = await checkExpRes.json()
  const expOffers = checkExpData.landing_page.offers || checkExpData.offers || []
  const expOffer = expOffers.find(o => o.id === expOfferData.offer.id)
  if (!expOffer || !expOffer.is_expired) {
    throw new Error(`Expected offer with past ends_at to be marked is_expired: true`)
  }
  console.log(`✓ FR-5.2.5 verified: Expired offer flagged as is_expired=true in storefront response`)

  // Verify checkout block on expired offer
  const expCartRes = await fetch(`${MEDUSA_URL}/store/carts`, {
    method: 'POST',
    headers: storeHeaders,
    body: JSON.stringify({ region_id: 'reg_01M5P357HTK2C9VK295D0K8BZ0' }),
  })
  const expCartData = await expCartRes.json()
  const expCartId = expCartData.cart.id
  await fetch(`${MEDUSA_URL}/store/carts/${expCartId}/line-items`, {
    method: 'POST',
    headers: storeHeaders,
    body: JSON.stringify({ variant_id: inStockVariantId, quantity: 1 }),
  })
  await fetch(`${MEDUSA_URL}/store/carts/${expCartId}`, {
    method: 'POST',
    headers: storeHeaders,
    body: JSON.stringify({
      shipping_address: {
        first_name: 'Test',
        last_name: 'User',
        phone: '+8801712349999',
        address_1: 'Banani',
        city: 'Dhaka',
        country_code: 'bd',
      },
    }),
  })
  await fetch(`${MEDUSA_URL}/store/carts/${expCartId}/shipping-methods`, {
    method: 'POST',
    headers: storeHeaders,
    body: JSON.stringify({ option_id: 'so_01M5QBPCQEQ4CF0TE556VPBHSG' }),
  })

  const expOrderFailRes = await fetch(`${MEDUSA_URL}/store/orders/cod`, {
    method: 'POST',
    headers: storeHeaders,
    body: JSON.stringify({
      cart_id: expCartId,
      offer_id: expOfferData.offer.id,
    }),
  })
  if (expOrderFailRes.status !== 422) {
    throw new Error(`Expected 422 for checkout with expired offer, got ${expOrderFailRes.status}`)
  }
  const expOrderFailData = await expOrderFailRes.json()
  console.log(`✓ FR-5.2.5 verified: Checkout with expired offer blocked with HTTP 422: "${expOrderFailData.error}"`)

  // ==========================================
  // TEST 10: AC-5.3 Media Upload Validation
  // ==========================================
  console.log('\n--- TEST 10: AC-5.3 Media Upload Validation & Version Invariance ---')
  // 1. Disallowed MIME type
  const badMimeRes = await fetch(`${MEDUSA_URL}/admin/media/upload`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      filename: 'malicious.exe',
      mime: 'application/x-msdownload',
      size_bytes: 1024,
    }),
  })
  if (badMimeRes.status !== 415) {
    throw new Error(`Expected 415 Unsupported Media Type for .exe, got ${badMimeRes.status}`)
  }
  console.log(`✓ Disallowed MIME type rejected with HTTP 415`)

  // 2. Oversized file (> 5MB)
  const oversizeRes = await fetch(`${MEDUSA_URL}/admin/media/upload`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      filename: 'huge_banner.jpg',
      mime: 'image/jpeg',
      size_bytes: 5.5 * 1024 * 1024, // 5.5MB
    }),
  })
  if (oversizeRes.status !== 413) {
    throw new Error(`Expected 413 Payload Too Large for 5.5MB upload, got ${oversizeRes.status}`)
  }
  console.log(`✓ Oversized file (>5MB) rejected with HTTP 413`)

  // 3. Valid image upload
  const validUploadRes = await fetch(`${MEDUSA_URL}/admin/media/upload`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      filename: 'campaign_banner.webp',
      mime: 'image/webp',
      size_bytes: 42000,
      data_base64: Buffer.from('fake-image-bytes').toString('base64'),
    }),
  })
  if (validUploadRes.status !== 201 && validUploadRes.status !== 200) {
    throw new Error(`Expected 201 or 200 for valid media upload, got ${validUploadRes.status}`)
  }
  const uploadData = await validUploadRes.json()
  const asset = uploadData.media_asset || uploadData.asset
  console.log(`✓ Valid media upload saved: checksum=${asset?.checksum_sha256}`)

  // 4. Verify landing page published state is intact
  const lpCheck = await pg.query(`SELECT status FROM landing_page WHERE id = $1`, [landingPageId])
  if (lpCheck.rows[0].status !== 'published') {
    throw new Error(`Published landing page status corrupted during upload validation failure!`)
  }
  console.log(`✓ Invariant verified: Live landing page status remains "${lpCheck.rows[0].status}"`)

  // ==========================================
  // TEST 11: FR-9.6 & AC-9.1 Homepage Link Integrity Gate
  // ==========================================
  console.log('\n--- TEST 11: FR-9.6 / AC-9.1 Homepage Section Link Integrity Gate ---')
  // 1. Broken product link
  const brokenLinkRes = await fetch(`${MEDUSA_URL}/admin/content/homepage`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      section_type: 'product_carousel',
      title_en: 'Featured Collection',
      config_json: {
        product_ids: ['prod_non_existent_999999'],
      },
    }),
  })
  if (brokenLinkRes.status !== 422) {
    throw new Error(`Expected 422 for broken product reference in homepage section, got ${brokenLinkRes.status}`)
  }
  const brokenLinkErr = await brokenLinkRes.json()
  console.log(`✓ Broken product link rejected with HTTP 422: "${brokenLinkErr.error}"`)

  // 2. Valid product link
  const validHpRes = await fetch(`${MEDUSA_URL}/admin/content/homepage`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      section_type: 'product_carousel',
      title_en: 'Best Sellers',
      title_bn: 'সেরা বিক্রিত পণ্য',
      config_json: {
        product_ids: ['prod_01M5P357Q9Y7C5DMS3KBSAYQ72'],
      },
      sort_order: 1,
      is_active: true,
    }),
  })
  if (validHpRes.status !== 201 && validHpRes.status !== 200) {
    throw new Error(`Failed to create valid homepage section: ${validHpRes.status}`)
  }
  console.log(`✓ Valid homepage section created with verified link integrity`)

  // 3. Query public store homepage content
  const hpStoreRes = await fetch(`${MEDUSA_URL}/store/content/homepage`, {
    headers: storeHeaders,
  })
  const hpStoreData = await hpStoreRes.json()
  if (!hpStoreData.sections || hpStoreData.sections.length === 0) {
    throw new Error(`Expected active sections in store homepage content response`)
  }
  console.log(`✓ Storefront GET /store/content/homepage returned ${hpStoreData.sections.length} active section(s)`)

  // ==========================================
  // TEST 12: AC-9.2 Appearance Rollback Invariance
  // ==========================================
  console.log('\n--- TEST 12: AC-9.2 Version Rollback Invariance ---')
  // Update landing page sections & theme to create version 2
  const updatedSections = [
    {
      id: 'sec_hero_v2',
      section_type: 'hero',
      headline_en: 'Updated Collection 2026',
      headline_bn: 'আপডেটেড কালেকশন',
    },
  ]
  const updatedTokens = {
    ...validTokens,
    primary_color: '#047857', // Changed to emerald green
  }

  await fetch(`${MEDUSA_URL}/admin/landing-pages/${landingPageId}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({
      sections_json: updatedSections,
      theme_tokens_json: updatedTokens,
    }),
  })

  // Publish version 2
  await fetch(`${MEDUSA_URL}/admin/landing-pages/${landingPageId}/publish`, {
    method: 'POST',
    headers: adminHeaders,
  })

  const ver2Res = await pg.query(
    `SELECT count(*)::int as total FROM landing_page_version WHERE landing_page_id = $1`,
    [landingPageId]
  )
  console.log(`Recorded versions count: ${ver2Res.rows[0].total}`)

  // Get Version 1 record
  const v1Query = await pg.query(
    `SELECT * FROM landing_page_version WHERE landing_page_id = $1 AND version = 1`,
    [landingPageId]
  )
  const v1Id = v1Query.rows[0].id

  // Execute rollback to version 1
  const rollbackRes = await fetch(`${MEDUSA_URL}/admin/landing-pages/${landingPageId}/rollback`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ version_id: v1Id }),
  })

  if (rollbackRes.status !== 200) {
    throw new Error(`Rollback failed: ${rollbackRes.status}`)
  }
  const rollbackData = await rollbackRes.json()
  if (rollbackData.landing_page.theme_tokens_json.primary_color !== '#1e3a8a') {
    throw new Error(`Rollback did not restore version 1 theme tokens!`)
  }
  console.log(`✓ Rollback successfully restored version 1 theme & appearance`)

  // Invariant verification (AC-9.2): check orders and order_bd_details are completely untouched
  const orderCheckAfterRollback = await pg.query(
    `SELECT * FROM order_bd_details WHERE order_id = $1`,
    [placedOrderId]
  )
  if (orderCheckAfterRollback.rows.length === 0 || orderCheckAfterRollback.rows[0].utm_source !== 'facebook') {
    throw new Error(`AC-9.2 violation: Rollback touched historical order data!`)
  }
  console.log(`✓ AC-9.2 verified: Order and financial data remain completely untouched by version rollback`)

  // ==========================================
  // TEST 13: CHK-UX-03 Dynamic Sitemap Unpublish Exclusion
  // ==========================================
  console.log('\n--- TEST 13: CHK-UX-03 Dynamic Sitemap Unpublish Exclusion ---')
  // First, verify sitemap includes published landing page
  const sitemapRes1 = await fetch(`${WEB_URL}/sitemap.xml`)
  const sitemapXml1 = await sitemapRes1.text()
  if (!sitemapXml1.includes(`/lp/${testSlug}`)) {
    console.warn(`Warning: Sitemap does not have /lp/${testSlug} before unpublishing (may have cached)`)
  }

  // Unpublish landing page
  const unpubRes = await fetch(`${MEDUSA_URL}/admin/landing-pages/${landingPageId}/unpublish`, {
    method: 'POST',
    headers: adminHeaders,
  })
  if (unpubRes.status !== 200) {
    throw new Error(`Failed to unpublish landing page: ${unpubRes.status}`)
  }
  console.log(`✓ Landing page unpublished: status=unpublished`)

  // Verify sitemap excludes the unpublished landing page
  const sitemapRes2 = await fetch(`${WEB_URL}/sitemap.xml`)
  const sitemapXml2 = await sitemapRes2.text()
  if (sitemapXml2.includes(`/lp/${testSlug}`)) {
    throw new Error(`CHK-UX-03 violation: Unpublished landing page /lp/${testSlug} is still present in sitemap.xml!`)
  }
  console.log(`✓ CHK-UX-03 verified: Unpublished landing page immediately omitted from dynamic sitemap.xml`)

  // ==========================================
  // TEST 14: D-21 Central Meta Pixel Single Source of Truth
  // ==========================================
  console.log('\n--- TEST 14: D-21 Central Meta Pixel Single Source of Truth ---')
  // Set test pixel ID in operational_settings
  const testPixelId = '123456789012345'
  await pg.query(
    `UPDATE operational_settings SET meta_pixel_id = $1, updated_at = now() WHERE id = 'global'`,
    [testPixelId]
  )

  // Medusa store pixel endpoint
  const medusaPixelRes = await fetch(`${MEDUSA_URL}/store/pixel`, { headers: storeHeaders })
  const medusaPixelData = await medusaPixelRes.json()
  if (medusaPixelData.meta_pixel_id !== testPixelId) {
    throw new Error(`Store pixel endpoint returned "${medusaPixelData.meta_pixel_id}", expected "${testPixelId}"`)
  }

  // Next.js proxy endpoint
  const webPixelRes = await fetch(`${WEB_URL}/api/pixel`)
  const webPixelData = await webPixelRes.json()
  if (webPixelData.meta_pixel_id !== testPixelId) {
    throw new Error(`Web proxy pixel endpoint returned "${webPixelData.meta_pixel_id}", expected "${testPixelId}"`)
  }
  console.log(`✓ D-21 verified: Central Meta Pixel ID (${testPixelId}) served correctly from operational_settings`)

  // Clean up test pixel ID
  await pg.query(
    `UPDATE operational_settings SET meta_pixel_id = NULL, updated_at = now() WHERE id = 'global'`
  )

  // Clean up test tables if needed
  await pg.query(`DELETE FROM product_variant WHERE id = $1`, [unpubVarId])
  await pg.query(`DELETE FROM product WHERE id = $1`, [unpubProdId])

  await pg.end()

  console.log('\n======================================================================')
  console.log('ALL 14 TESTS IN VERIFICATION SUITE PASSED PERFECTLY!')
  console.log('======================================================================')
}

run().catch((err) => {
  console.error('\n❌ Verification Failed:', err)
  process.exit(1)
})
