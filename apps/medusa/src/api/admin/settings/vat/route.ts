import {
  AuthenticatedMedusaRequest,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import BdSettingsModuleService from "../../../../modules/bd-settings/service"
import { BD_SETTINGS_MODULE } from "../../../../modules/bd-settings"
import BdAuditModuleService from "../../../../modules/bd-audit/service"
import { BD_AUDIT_MODULE } from "../../../../modules/bd-audit"

/**
 * Opt out of the framework's global /admin authenticate middleware so the
 * requireBdRoles guard owns authentication end-to-end and can map every
 * auth failure to 403 (Prompt 02 DONE WHEN). The guard itself calls the
 * same framework `authenticate("user", ["session", "bearer"])` — no auth
 * path is skipped.
 */
export const AUTHENTICATE = false

type VatSettingsRow = {
  id: string
  is_vat_enabled: boolean
  registration_status: "unverified" | "verified"
  registration_number: string | null
  prices_include_vat: boolean
  tax_rate_id: string | null
  legal_note_en: string | null
}

/**
 * GET /admin/settings/vat — current VAT configuration. Registration fields
 * are display-only; the numeric rate belongs to the native tax module and
 * is surfaced read-only (or "not yet configured" when unset, O-02).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const settings = req.scope.resolve<BdSettingsModuleService>(BD_SETTINGS_MODULE)

  const [current] = await settings.listVatSettings(
    { is_current: true },
    { take: 1 }
  )

  if (!current) {
    res.json({ vat: null })
    return
  }

  const row = current as unknown as VatSettingsRow

  // The numeric VAT rate lives in the native tax module (database.md §3.8.4)
  // — resolve it read-only for display when the row is linked.
  let taxRateValue: number | null = null
  if (row.tax_rate_id) {
    try {
      const tax = req.scope.resolve(Modules.TAX)
      const rate = await tax.retrieveTaxRate(row.tax_rate_id)
      taxRateValue = rate?.rate ?? null
    } catch {
      // Rate deleted or unavailable — surface as not configured.
      taxRateValue = null
    }
  }

  res.json({
    id: row.id,
    is_vat_enabled: row.is_vat_enabled,
    registration_status: row.registration_status,
    registration_number: row.registration_number,
    prices_include_vat: row.prices_include_vat,
    tax_rate_id: row.tax_rate_id,
    tax_rate_value: taxRateValue,
    legal_note_en: row.legal_note_en,
  })
}

/**
 * POST /admin/settings/vat — update VAT display flags only (Prompt 02
 * scope item 4). Registration status/number and the native tax rate are
 * intentionally not editable here. Changes are appended to audit_log.
 */
export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const body = req.body as {
    is_vat_enabled?: unknown
    prices_include_vat?: unknown
  }

  if (typeof body?.is_vat_enabled !== "boolean") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "is_vat_enabled must be a boolean"
    )
  }
  if (typeof body?.prices_include_vat !== "boolean") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "prices_include_vat must be a boolean"
    )
  }

  const settings = req.scope.resolve<BdSettingsModuleService>(BD_SETTINGS_MODULE)
  const audit = req.scope.resolve<BdAuditModuleService>(BD_AUDIT_MODULE)
  const actorId = req.auth_context?.actor_id ?? "system"

  const [current] = await settings.listVatSettings(
    { is_current: true },
    { take: 1 }
  )
  if (!current) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "No current VAT settings row — run the foundation seed"
    )
  }

  const before = current as unknown as VatSettingsRow

  await settings.updateVatSettings({
    id: current.id,
    is_vat_enabled: body.is_vat_enabled,
    prices_include_vat: body.prices_include_vat,
  })

  await audit.appendAuditLog({
    occurred_at: new Date(),
    actor_id: actorId,
    actor_type: "user",
    entity_type: "vat_settings",
    entity_id: before.id,
    entity_label: "VAT display flags",
    action: "vat_settings_updated",
    before_redacted: {
      is_vat_enabled: before.is_vat_enabled,
      prices_include_vat: before.prices_include_vat,
    },
    after_redacted: {
      is_vat_enabled: body.is_vat_enabled,
      prices_include_vat: body.prices_include_vat,
    },
    changed_fields: [
      ...(before.is_vat_enabled !== body.is_vat_enabled
        ? ["is_vat_enabled"]
        : []),
      ...(before.prices_include_vat !== body.prices_include_vat
        ? ["prices_include_vat"]
        : []),
    ],
    request_id: req.requestId,
  })

  res.json({
    id: before.id,
    is_vat_enabled: body.is_vat_enabled,
    prices_include_vat: body.prices_include_vat,
  })
}
