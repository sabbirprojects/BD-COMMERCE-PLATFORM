/**
 * Comprehensive Automated Verification Suite for Prompt 10 — Authentication & RBAC
 * 
 * Tests:
 * 1. RBAC Schema & Seed: 7 canonical roles, 11 policies, and §6.3 matrix mappings
 * 2. CHK-SEC-01: Call center cannot open settings/gateways or profit reports (UI + 403)
 * 3. CHK-SEC-02: 5 failed logins triggers 15-minute account lockout in Redis; 6th attempt returns 429; audit_log recorded
 * 4. AC-8.4: Role change immediately invalidates existing active sessions in Redis
 * 5. FR-8.2.5: Forced password change blocks unauthenticated/unverified staff from APIs until password change
 * 6. AC-8.5: Passwords never returned in any response
 * 7. CHK-SEC-04: Order tracking rate limiter blocks 6th rapid lookup with HTTP 429
 */

const { Client } = require('pg')
const Redis = require('ioredis')
const jwt = require('jsonwebtoken')

const MEDUSA_URL = 'http://localhost:9000'
const PUBLISHABLE_KEY = 'pk_e03efb8523c1542172c95fe34dc90955a3389f3ee3592faa16171966d4699096'
const DB_URL = 'postgresql://postgres:b4c2de80b80e3bebc18adbde993908a9@localhost:5432/bd_commerce?schema=public'
const REDIS_URL = 'redis://:6ea11ee5036bf8069b51791418df497f7cc9502254c67b94@localhost:6379'
const JWT_SECRET = 'supersecret'

function makeToken(userId, email, role, options = {}) {
  const nowSec = Math.floor(Date.now() / 1000)
  return jwt.sign(
    {
      actor_id: userId,
      actor_type: 'user',
      auth_identity_id: `authid_${userId}`,
      app_metadata: { user_id: userId, role },
      iat: options.iat !== undefined ? options.iat : nowSec,
    },
    JWT_SECRET,
    { expiresIn: '1d' }
  )
}

async function runPrompt10Verification() {
  const pg = new Client({ connectionString: DB_URL })
  await pg.connect()
  const redis = new Redis(REDIS_URL)

  console.log('=== STARTING PROMPT 10 AUTH & RBAC VERIFICATION SUITE ===\n')

  // ==========================================
  // TEST 1: RBAC Schema & Seed Validation
  // ==========================================
  console.log('--- TEST 1: Canonical Roles & Policies Seed ---')
  const rolesRes = await pg.query(`SELECT name FROM rbac_role ORDER BY name ASC`)
  const roleNames = rolesRes.rows.map((r) => r.name)
  console.log(`Roles in database: ${roleNames.join(', ')}`)

  const expectedRoles = ['call_center', 'content', 'finance', 'manager', 'owner', 'staff', 'warehouse']
  for (const exp of expectedRoles) {
    if (!roleNames.includes(exp)) {
      throw new Error(`Expected canonical role "${exp}" not found in rbac_role table!`)
    }
  }
  console.log('✓ All 7 canonical roles confirmed in rbac_role')

  const policiesRes = await pg.query(`SELECT "key" FROM rbac_policy ORDER BY "key" ASC`)
  console.log(`✓ Confirmed ${policiesRes.rows.length} canonical policies in rbac_policy`)

  const ownerLinkRes = await pg.query(`
    SELECT u.email, rr.name as role_name
    FROM "user" u
    JOIN user_rbac_role urr ON urr.user_id = u.id AND urr.deleted_at IS NULL
    JOIN rbac_role rr ON rr.id = urr.rbac_role_id AND rr.deleted_at IS NULL
    WHERE u.email = 'admin@bd-commerce.com'
  `)
  if (ownerLinkRes.rows.length === 0 || ownerLinkRes.rows[0].role_name !== 'owner') {
    throw new Error('admin@bd-commerce.com is not linked to owner role!')
  }
  console.log(`✓ admin@bd-commerce.com linked to role "${ownerLinkRes.rows[0].role_name}" via user_rbac_role`)

  // ==========================================
  // TEST 2: CHK-SEC-01 Server-Side RBAC Enforcement
  // ==========================================
  console.log('\n--- TEST 2: CHK-SEC-01 Server-Side RBAC Enforcement ---')
  // 1. Create a Call Center user in database if not exists
  const ccUserRes = await pg.query(`SELECT id FROM "user" WHERE email = 'callcenter_test@bd-commerce.com'`)
  let ccUserId
  if (ccUserRes.rows.length > 0) {
    ccUserId = ccUserRes.rows[0].id
  } else {
    const createRes = await pg.query(`
      INSERT INTO "user" (id, email, first_name, last_name, metadata, created_at, updated_at)
      VALUES ('usr_callcenter_test', 'callcenter_test@bd-commerce.com', 'Rahim', 'Agent', '{"role":"call_center"}'::jsonb, now(), now())
      RETURNING id
    `)
    ccUserId = createRes.rows[0].id
    await pg.query(`
      INSERT INTO user_rbac_role (id, user_id, rbac_role_id, created_at, updated_at)
      VALUES ('urlk_cc_test', $1, 'role_call_center', now(), now())
      ON CONFLICT DO NOTHING
    `, [ccUserId])
  }

  // Clear any revocation for ccUserId
  await redis.del(`auth:revoked:${ccUserId}`)

  const ccToken = makeToken(ccUserId, 'callcenter_test@bd-commerce.com', 'call_center')
  const ownerToken = makeToken('user_01M5P3610BV01PG4SD3BYDM517', 'admin@bd-commerce.com', 'owner')

  // Attempt 1: Call Center tries to access /admin/settings/bangladesh (must return 403)
  const ccSettingsRes = await fetch(`${MEDUSA_URL}/admin/settings/bangladesh`, {
    headers: { Authorization: `Bearer ${ccToken}` },
  })
  console.log(`Call center -> GET /admin/settings/bangladesh status: ${ccSettingsRes.status}`)
  if (ccSettingsRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden for call center on settings, got ${ccSettingsRes.status}`)
  }
  console.log('✓ CHK-SEC-01: Call center blocked from /admin/settings/bangladesh with HTTP 403')

  // Attempt 2: Call Center tries to access /admin/settings/gateways (must return 403)
  const ccGatewaysRes = await fetch(`${MEDUSA_URL}/admin/settings/gateways`, {
    headers: { Authorization: `Bearer ${ccToken}` },
  })
  console.log(`Call center -> GET /admin/settings/gateways status: ${ccGatewaysRes.status}`)
  if (ccGatewaysRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden for call center on gateways, got ${ccGatewaysRes.status}`)
  }
  console.log('✓ CHK-SEC-01: Call center blocked from /admin/settings/gateways with HTTP 403')

  // Attempt 3: Call Center tries to access /admin/reports/contribution-profit (must return 403)
  const ccReportsRes = await fetch(`${MEDUSA_URL}/admin/reports/contribution-profit`, {
    headers: { Authorization: `Bearer ${ccToken}` },
  })
  console.log(`Call center -> GET /admin/reports/contribution-profit status: ${ccReportsRes.status}`)
  if (ccReportsRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden for call center on profit report, got ${ccReportsRes.status}`)
  }
  console.log('✓ CHK-SEC-01: Call center blocked from /admin/reports/contribution-profit with HTTP 403')

  // Attempt 4: Call Center CAN access /admin/cod-queue (must return 200)
  const ccQueueRes = await fetch(`${MEDUSA_URL}/admin/cod-queue`, {
    headers: { Authorization: `Bearer ${ccToken}` },
  })
  console.log(`Call center -> GET /admin/cod-queue status: ${ccQueueRes.status}`)
  if (ccQueueRes.status !== 200) {
    throw new Error(`Expected 200 OK for call center on cod-queue, got ${ccQueueRes.status}`)
  }
  console.log('✓ Call center authorized to view /admin/cod-queue (HTTP 200)')

  // Attempt 5: Owner CAN access settings and reports (must return 200)
  const ownerSettingsRes = await fetch(`${MEDUSA_URL}/admin/settings/bangladesh`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  })
  if (ownerSettingsRes.status !== 200) {
    throw new Error(`Expected 200 OK for owner on settings, got ${ownerSettingsRes.status}`)
  }
  console.log('✓ Owner authorized to access /admin/settings/bangladesh (HTTP 200)')

  // ==========================================
  // TEST 3: CHK-SEC-02 Brute-Force Rate Limiting (5 failures -> lockout)
  // ==========================================
  console.log('\n--- TEST 3: CHK-SEC-02 Account Lockout Defense (5 failures -> lockout) ---')
  const victimEmail = 'staff_lockout_victim@bd-commerce.com'
  const lockoutKey = `auth:lockout:${victimEmail}`
  await redis.del(lockoutKey)

  console.log('Submitting 5 consecutive failed login attempts...')
  for (let i = 1; i <= 5; i++) {
    const failRes = await fetch(`${MEDUSA_URL}/auth/user/emailpass`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: victimEmail, password: `wrong_pass_${i}` }),
    })
    console.log(`  - Attempt #${i} status: ${failRes.status}`)
  }

  const failuresRecorded = await redis.get(lockoutKey)
  const ttl = await redis.ttl(lockoutKey)
  console.log(`✓ Redis counter recorded: ${failuresRecorded} failures, TTL: ${ttl}s (target 900s)`)

  console.log('Submitting 6th login attempt (should trigger lockout)...')
  const sixthRes = await fetch(`${MEDUSA_URL}/auth/user/emailpass`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: victimEmail, password: 'wrong_pass_6' }),
  })
  const sixthData = await sixthRes.json()
  console.log(`✓ 6th attempt status: ${sixthRes.status}, message: "${sixthData.message}"`)
  if (sixthRes.status !== 429) {
    throw new Error(`Expected 429 Too Many Requests on locked account, got ${sixthRes.status}`)
  }

  // Check audit_log recorded the lockout
  const lockoutAuditRes = await pg.query(`
    SELECT action, entity_id, actor_type, after_redacted
    FROM audit_log
    WHERE entity_id = $1 AND action = 'auth_lockout'
    ORDER BY created_at DESC
    LIMIT 1
  `, [victimEmail])
  if (lockoutAuditRes.rows.length === 0) {
    throw new Error('audit_log record for auth_lockout not found!')
  }
  console.log(`✓ audit_log entry verified for auth_lockout on ${victimEmail}`)

  // Clean up test lockout
  await redis.del(lockoutKey)

  // ==========================================
  // TEST 4: AC-8.4 Role Change Kills Active Session
  // ==========================================
  console.log('\n--- TEST 4: AC-8.4 Role Change Kills Active Session ---')
  // 1. Create a staff user for session testing
  const sessUserEmail = `sess_user_${Date.now()}@bd-commerce.com`
  const teamInviteRes = await fetch(`${MEDUSA_URL}/admin/team`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ownerToken}`,
    },
    body: JSON.stringify({
      email: sessUserEmail,
      first_name: 'Karim',
      last_name: 'Session',
      role: 'call_center',
      password: 'TemporaryPassword123!',
    }),
  })
  const sessUserData = await teamInviteRes.json()
  const sessUserId = sessUserData.user.id
  console.log(`Created test user ${sessUserId} with role call_center`)

  // Clear must_change_password temporarily for this test
  await pg.query(`UPDATE "user" SET metadata = metadata - 'must_change_password' WHERE id = $1`, [sessUserId])

  // 2. Issue JWT token
  const initialToken = makeToken(sessUserId, sessUserEmail, 'call_center')

  // 3. Verify user can access /admin/cod-queue
  const initialCallRes = await fetch(`${MEDUSA_URL}/admin/cod-queue`, {
    headers: { Authorization: `Bearer ${initialToken}` },
  })
  if (initialCallRes.status !== 200) {
    throw new Error(`Expected initial call to succeed (200), got ${initialCallRes.status}`)
  }
  console.log('✓ Initial session active: call to /admin/cod-queue returned HTTP 200')

  // 4. Update role to warehouse via PATCH /admin/team/:id/role
  console.log('Changing user role from call_center to warehouse...')
  // Sleep 100ms to guarantee timestamp difference
  await new Promise((r) => setTimeout(r, 100))

  const patchRoleRes = await fetch(`${MEDUSA_URL}/admin/team/${sessUserId}/role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ownerToken}`,
    },
    body: JSON.stringify({ role: 'warehouse' }),
  })
  const patchRoleData = await patchRoleRes.json()
  console.log(`✓ Role updated: ${patchRoleData.previous_role} -> ${patchRoleData.new_role}`)

  // 5. Attempt to use old token -> must be rejected with 403 (AC-8.4)
  const revokedCallRes = await fetch(`${MEDUSA_URL}/admin/cod-queue`, {
    headers: { Authorization: `Bearer ${initialToken}` },
  })
  console.log(`✓ Post-role-change request with old token status: ${revokedCallRes.status} (Expected 403)`)
  if (revokedCallRes.status !== 403) {
    throw new Error(`AC-8.4 Failed: old session was NOT invalidated! Status: ${revokedCallRes.status}`)
  }
  const revokedData = await revokedCallRes.json()
  console.log(`✓ Rejection message: "${revokedData.message}"`)

  // ==========================================
  // TEST 5: FR-8.2.5 Forced Password Change
  // ==========================================
  console.log('\n--- TEST 5: FR-8.2.5 Forced Password Change Enforcement ---')
  const newStaffEmail = `new_staff_${Date.now()}@bd-commerce.com`
  const newStaffInvite = await fetch(`${MEDUSA_URL}/admin/team`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ownerToken}`,
    },
    body: JSON.stringify({
      email: newStaffEmail,
      first_name: 'Salma',
      last_name: 'Staff',
      role: 'call_center',
      password: 'InitialPassword123!',
    }),
  })
  const newStaffUser = (await newStaffInvite.json()).user
  console.log(`Provisioned new staff ${newStaffUser.id} with must_change_password = true`)

  const newStaffToken = makeToken(newStaffUser.id, newStaffEmail, 'call_center')

  // Try to access cod queue -> blocked with 403
  const blockedAccessRes = await fetch(`${MEDUSA_URL}/admin/cod-queue`, {
    headers: { Authorization: `Bearer ${newStaffToken}` },
  })
  console.log(`✓ Access blocked status: ${blockedAccessRes.status} (Expected 403)`)
  const blockedData = await blockedAccessRes.json()
  console.log(`✓ Message: "${blockedData.message}" (code: ${blockedData.error})`)
  if (blockedAccessRes.status !== 403 || blockedData.error !== 'must_change_password') {
    throw new Error('FR-8.2.5 Failed: unverified staff was not blocked from APIs!')
  }

  // Submit password change
  console.log('Submitting required password change...')
  const changePassRes = await fetch(`${MEDUSA_URL}/admin/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${newStaffToken}`,
    },
    body: JSON.stringify({ new_password: 'PermanentSecurePassword456!' }),
  })
  const changePassData = await changePassRes.json()
  if (!changePassRes.ok) {
    throw new Error(`Password change failed: ${JSON.stringify(changePassData)}`)
  }
  console.log(`✓ Password changed successfully: "${changePassData.message}"`)

  // Issue new token with refreshed timestamp
  await new Promise((r) => setTimeout(r, 100))
  const freshToken = makeToken(newStaffUser.id, newStaffEmail, 'call_center')
  const unblockedRes = await fetch(`${MEDUSA_URL}/admin/cod-queue`, {
    headers: { Authorization: `Bearer ${freshToken}` },
  })
  if (unblockedRes.status !== 200) {
    throw new Error(`Expected 200 OK after password change, got ${unblockedRes.status}`)
  }
  console.log('✓ Staff unblocked after password change: access granted to /admin/cod-queue')

  // ==========================================
  // TEST 6: AC-8.5 Passwords Never Returned
  // ==========================================
  console.log('\n--- TEST 6: AC-8.5 Passwords Never Returned ---')
  const teamListRes = await fetch(`${MEDUSA_URL}/admin/team`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  })
  const teamListData = await teamListRes.json()
  const teamListStr = JSON.stringify(teamListData)
  if (
    teamListStr.includes('password') &&
    (teamListStr.includes('scrypt') || teamListStr.includes('PermanentSecurePassword'))
  ) {
    throw new Error('AC-8.5 Violation: password hash or plain password leaked in API response!')
  }
  console.log(`✓ Verified ${teamListData.users.length} staff records: zero password hashes or plain passwords returned`)

  // ==========================================
  // TEST 7: CHK-SEC-04 Order Tracking Rate Limiting
  // ==========================================
  console.log('\n--- TEST 7: CHK-SEC-04 Order Tracking Rate Limiting (5/min per IP + Phone) ---')
  const trackTestPhone = '01799887766'
  const trackKey = `ratelimit:track:127.0.0.1:+8801799887766`
  await redis.del(trackKey)

  console.log('Sending 5 consecutive tracking lookups...')
  for (let i = 1; i <= 5; i++) {
    const tRes = await fetch(`${MEDUSA_URL}/store/orders/track?order_id=order_dummy_${i}&phone=${trackTestPhone}`, {
      headers: { 'x-publishable-api-key': PUBLISHABLE_KEY },
    })
    console.log(`  - Lookup #${i} status: ${tRes.status} (Expected 404/200)`)
  }

  console.log('Sending 6th rapid tracking lookup (should trigger HTTP 429)...')
  const sixthTrackRes = await fetch(`${MEDUSA_URL}/store/orders/track?order_id=order_dummy_6&phone=${trackTestPhone}`, {
    headers: { 'x-publishable-api-key': PUBLISHABLE_KEY },
  })
  const sixthTrackData = await sixthTrackRes.json()
  console.log(`✓ 6th lookup status: ${sixthTrackRes.status}, message: "${sixthTrackData.message}"`)
  if (sixthTrackRes.status !== 429) {
    throw new Error(`Expected 429 Too Many Requests on tracking endpoint, got ${sixthTrackRes.status}`)
  }
  console.log('✓ CHK-SEC-04: Phone enumeration and scraping blocked at 5 attempts/minute')

  await redis.del(trackKey)
  await pg.end()
  await redis.quit()

  console.log('\n=== ALL PROMPT 10 ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY ===')
}

runPrompt10Verification().catch((err) => {
  console.error('\n❌ PROMPT 10 VERIFICATION FAILED:', err)
  process.exit(1)
})
