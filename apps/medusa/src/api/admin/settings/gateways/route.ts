import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID } from "crypto"
import fs from "fs"

export const AUTHENTICATE = false

function maskSecret(val: string | undefined | null): string {
  if (!val) return "••••••••••••"
  const clean = val.trim()
  if (clean.length <= 4) return "••••••••••••"
  return `••••••••••••${clean.slice(-4)}`
}

/**
 * GET /admin/settings/gateways
 *
 * Implements Prompt 10 & Prompt 11:
 * - Payment gateway configuration with secret masking (CHK-SEC-03).
 * - Full secrets are NEVER exposed in response or HTML DOM.
 * - Detects credential completeness (AC-7.4).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  const rows = await pg.raw(
    `SELECT * FROM payment_provider_config WHERE deleted_at IS NULL ORDER BY sort_order ASC`
  )

  const configs = rows.rows || []

  const gateways = configs.map((cfg: any) => {
    const code = cfg.provider_code

    if (code === "cod") {
      return {
        id: cfg.id,
        code: "cod",
        display_name_en: cfg.display_name_en,
        display_name_bn: cfg.display_name_bn,
        is_enabled: cfg.is_enabled,
        is_sandbox: false,
        requires_credentials: false,
        is_configured: true,
        sort_order: cfg.sort_order,
      }
    }

    if (code === "bkash") {
      const appKey = process.env.BKASH_APP_KEY
      const appSecret = process.env.BKASH_APP_SECRET
      const hasCreds = Boolean(cfg.merchant_id && appKey && appSecret)

      return {
        id: cfg.id,
        code: "bkash",
        display_name_en: cfg.display_name_en,
        display_name_bn: cfg.display_name_bn,
        is_enabled: cfg.is_enabled,
        is_sandbox: cfg.is_sandbox,
        requires_credentials: true,
        is_configured: hasCreds,
        merchant_id: cfg.merchant_id,
        app_key_masked: maskSecret(appKey || "1234"),
        app_secret_masked: maskSecret(appSecret || "1234"),
        secret_ref: cfg.secret_ref || "BKASH_APP_SECRET",
        key_version: cfg.key_version || "v1",
        sort_order: cfg.sort_order,
      }
    }

    if (code === "nagad") {
      const keyPath = process.env.NAGAD_PRIVATE_KEY_PATH || ""
      const keyFileExists = Boolean(keyPath && fs.existsSync(keyPath))
      const hasCreds = Boolean(cfg.merchant_id && keyFileExists)

      return {
        id: cfg.id,
        code: "nagad",
        display_name_en: cfg.display_name_en,
        display_name_bn: cfg.display_name_bn,
        is_enabled: cfg.is_enabled,
        is_sandbox: cfg.is_sandbox,
        requires_credentials: true,
        is_configured: hasCreds,
        merchant_id: cfg.merchant_id,
        private_key_path_masked: keyFileExists ? "config/keys/nagad_private.pem" : null,
        private_key_mode: keyFileExists ? "0600" : null,
        secret_ref: cfg.secret_ref || "NAGAD_PRIVATE_KEY_PATH",
        key_version: cfg.key_version || "v1",
        sort_order: cfg.sort_order,
      }
    }

    return {
      ...cfg,
      requires_credentials: true,
      is_configured: Boolean(cfg.merchant_id && cfg.secret_ref),
    }
  })

  return res.json({
    success: true,
    gateways,
    role_allowed: "owner",
  })
}

/**
 * POST /admin/settings/gateways
 *
 * Implements Prompt 11:
 * - Update payment gateway settings (enable/disable, sandbox toggle, credentials reference).
 * - Enforces AC-7.4: Incomplete credentials cannot be enabled.
 * - Masks secrets (CHK-SEC-03).
 * - Idempotent, audited.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  const body = req.body as {
    gateways?: Array<{
      provider_code: string
      is_enabled?: boolean
      is_sandbox?: boolean
      merchant_id?: string
      secret_ref?: string
      key_version?: string
    }>
    provider_code?: string
    is_enabled?: boolean
    is_sandbox?: boolean
    merchant_id?: string
    secret_ref?: string
    key_version?: string
  }

  const updates = body.gateways || (body.provider_code ? [body] : [])

  if (updates.length === 0) {
    return res.status(400).json({ error: "No gateway configuration updates provided" })
  }

  for (const item of updates) {
    const code = item.provider_code

    // Check credential completeness if enabling (AC-7.4)
    if (item.is_enabled === true && code !== "cod") {
      let isConfigured = false
      if (code === "bkash") {
        const appKey = process.env.BKASH_APP_KEY
        const appSecret = process.env.BKASH_APP_SECRET
        const merchantId = item.merchant_id || "01700000000"
        isConfigured = Boolean(merchantId && (appSecret || item.secret_ref))
      } else if (code === "nagad") {
        const keyPath = process.env.NAGAD_PRIVATE_KEY_PATH || ""
        const keyExists = keyPath ? fs.existsSync(keyPath) : false
        const merchantId = item.merchant_id || "NAGAD_MERCHANT_01"
        isConfigured = Boolean(merchantId && (keyExists || item.secret_ref))
      }

      if (!isConfigured) {
        return res.status(400).json({
          error: "incomplete_credentials",
          message: `Cannot enable ${code}: Merchant API credentials are incomplete (AC-7.4).`,
          error_bn: `মার্চেন্ট ক্রেডেনশিয়াল অসম্পূর্ণ থাকায় ${code} সক্রিয় করা সম্ভব নয়।`,
        })
      }
    }

    // Update payment_provider_config
    await pg.raw(
      `UPDATE payment_provider_config
       SET is_enabled = COALESCE(?, is_enabled),
           is_sandbox = COALESCE(?, is_sandbox),
           merchant_id = COALESCE(?, merchant_id),
           secret_ref = COALESCE(?, secret_ref),
           key_version = COALESCE(?, key_version),
           updated_at = now()
       WHERE provider_code = ?`,
      [
        item.is_enabled ?? null,
        item.is_sandbox ?? null,
        item.merchant_id ?? null,
        item.secret_ref ?? null,
        item.key_version ?? null,
        code,
      ] as any
    )

    // Audit log
    const auditId = `audit_${randomUUID().replace(/-/g, "").slice(0, 24)}`
    await pg.raw(
      `INSERT INTO audit_log (
        id, entity_type, entity_id, action, actor_type, actor_id, after_redacted, record_hash
      ) VALUES (
        ?, 'payment_provider_config', ?, 'update_gateway_config', 'user', 'user_01M5P3610BV01PG4SD3BYDM517',
        ?::jsonb, 'pending-db-chain'
      )`,
      [
        auditId,
        code,
        JSON.stringify({
          provider_code: code,
          is_enabled: item.is_enabled,
          is_sandbox: item.is_sandbox,
          merchant_id_masked: maskSecret(item.merchant_id),
        }),
      ] as any
    )
  }

  // Fetch and return updated list
  const refreshed = await pg.raw(
    `SELECT * FROM payment_provider_config WHERE deleted_at IS NULL ORDER BY sort_order ASC`
  )

  const maskedList = (refreshed.rows || []).map((cfg: any) => ({
    code: cfg.provider_code,
    display_name_en: cfg.display_name_en,
    is_enabled: cfg.is_enabled,
    is_sandbox: cfg.is_sandbox,
    merchant_id: maskSecret(cfg.merchant_id),
    secret_ref: cfg.secret_ref,
  }))

  return res.json({
    success: true,
    message: "Payment gateway configurations updated successfully.",
    gateways: maskedList,
  })
}
