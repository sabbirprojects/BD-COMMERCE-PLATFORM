import { MedusaRequest, MedusaResponse, AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID, scryptSync, randomBytes } from "crypto"
import Redis from "ioredis"

export const AUTHENTICATE = false

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379"
let redisClient: Redis | null = null

function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis(REDIS_URL, { maxRetriesPerRequest: 2 })
  }
  return redisClient
}

function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const derivedKey = scryptSync(password, salt, 64)
  return `scrypt$${salt.toString("hex")}$${derivedKey.toString("hex")}`
}

/**
 * GET /admin/team
 * Lists staff accounts, role assignments, and security status. Passwords never returned (AC-8.5).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const redis = getRedis()

  const staffQuery = await pg.raw(`
    SELECT 
      u.id,
      u.email,
      u.first_name,
      u.last_name,
      u.created_at,
      u.metadata,
      COALESCE(rr.name, u.metadata->>'role', 'staff') as role,
      COALESCE(rr.description, 'Staff role') as role_description,
      sp.employee_code,
      sp.department,
      sp.designation,
      sp.is_active as profile_is_active
    FROM "user" u
    LEFT JOIN user_rbac_role urr ON urr.user_id = u.id AND urr.deleted_at IS NULL
    LEFT JOIN rbac_role rr ON rr.id = urr.rbac_role_id AND rr.deleted_at IS NULL
    LEFT JOIN staff_profile sp ON sp.user_id = u.id AND sp.deleted_at IS NULL
    WHERE u.deleted_at IS NULL
    ORDER BY u.created_at ASC
  `)

  const users = await Promise.all(
    (staffQuery.rows || []).map(async (row: any) => {
      const email = row.email || ""
      const isLocked = Boolean(await redis.get(`auth:lockout:${email.toLowerCase()}`))
      const mustChangePassword =
        row.metadata?.must_change_password === true ||
        row.metadata?.must_change_password === "true"

      return {
        id: row.id,
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
        name: `${row.first_name || ""} ${row.last_name || ""}`.trim() || row.email,
        role: row.role,
        role_description: row.role_description,
        department: row.department || "Operations",
        designation: row.designation || "Staff",
        is_locked: isLocked,
        must_change_password: mustChangePassword,
        created_at: row.created_at,
      }
    })
  )

  return res.json({ users, count: users.length })
}

/**
 * POST /admin/team
 * Provisions a new staff member with assigned role and forced password change flag (FR-8.2.1, FR-8.2.5).
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const actorId =
    (req as AuthenticatedMedusaRequest).auth_context?.actor_id ||
    (req as any).acting_user?.id ||
    "admin_owner"

  const { email, first_name, last_name, role, password } = (req.body || {}) as {
    email?: string
    first_name?: string
    last_name?: string
    role?: string
    password?: string
  }

  if (!email || !role || !password) {
    return res.status(400).json({ error: "email, role, and password are required" })
  }

  const validRoles = ["owner", "manager", "finance", "warehouse", "call_center", "content", "staff"]
  if (!validRoles.includes(role)) {
    return res.status(400).json({
      error: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
    })
  }

  const normalizedEmail = email.trim().toLowerCase()

  // Check if user already exists
  const existingUserRes = await pg.raw(`SELECT id FROM "user" WHERE email = ?`, [normalizedEmail])
  if (existingUserRes.rows?.length) {
    return res.status(409).json({ error: `User with email ${normalizedEmail} already exists` })
  }

  const userId = `usr_${randomUUID().replace(/-/g, "").slice(0, 24)}`
  const authId = `authid_${randomUUID().replace(/-/g, "").slice(0, 24)}`
  const provId = `prov_${randomUUID().replace(/-/g, "").slice(0, 24)}`
  const roleLinkId = `urlk_${randomUUID().replace(/-/g, "").slice(0, 24)}`
  const hashedPassword = hashPassword(password)

  // 1. Create native user with must_change_password = true
  await pg.raw(
    `INSERT INTO "user" (
      id, email, first_name, last_name, metadata, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, now(), now()
    )`,
    [
      userId,
      normalizedEmail,
      first_name || null,
      last_name || null,
      JSON.stringify({ role, must_change_password: true }),
    ]
  )

  // 2. Create auth_identity with must_change_password = true
  await pg.raw(
    `INSERT INTO auth_identity (
      id, app_metadata, created_at, updated_at
    ) VALUES (
      ?, ?, now(), now()
    )`,
    [authId, JSON.stringify({ user_id: userId, must_change_password: true })]
  )

  // 3. Create provider_identity (emailpass)
  await pg.raw(
    `INSERT INTO provider_identity (
      id, entity_id, provider, auth_identity_id, provider_metadata, created_at, updated_at
    ) VALUES (
      ?, ?, 'emailpass', ?, ?, now(), now()
    )`,
    [provId, normalizedEmail, authId, JSON.stringify({ password: hashedPassword })]
  )

  // 4. Link to role in user_rbac_role
  const roleId = `role_${role}`
  await pg.raw(
    `INSERT INTO user_rbac_role (
      id, user_id, rbac_role_id, created_at, updated_at
    ) VALUES (
      ?, ?, ?, now(), now()
    )`,
    [roleLinkId, userId, roleId]
  )

  // 5. Create HR staff_profile
  const staffProfileId = `staff_${randomUUID().replace(/-/g, "").slice(0, 24)}`
  await pg.raw(
    `INSERT INTO staff_profile (
      id, user_id, display_name, created_at, updated_at
    ) VALUES (
      ?, ?, ?, now(), now()
    )`,
    [staffProfileId, userId, `${first_name || ""} ${last_name || ""}`.trim() || normalizedEmail]
  )

  // 6. Log to audit_log
  const auditId = `audit_${randomUUID().replace(/-/g, "").slice(0, 24)}`
  await pg.raw(
    `INSERT INTO audit_log (
      id, entity_type, entity_id, action, actor_type, actor_id, after_redacted, record_hash
    ) VALUES (
      ?, 'user', ?, 'user_create', 'user', ?, ?, 'pending-db-chain'
    )`,
    [
      auditId,
      userId,
      actorId,
      JSON.stringify({
        email: normalizedEmail,
        role,
        must_change_password: true,
      }),
    ]
  )

  // Passwords are NEVER returned (AC-8.5)
  return res.status(201).json({
    success: true,
    user: {
      id: userId,
      email: normalizedEmail,
      first_name,
      last_name,
      role,
      must_change_password: true,
    },
    message: `Staff member ${normalizedEmail} created with role "${role}". Initial password change enforced (FR-8.2.5).`,
  })
}
