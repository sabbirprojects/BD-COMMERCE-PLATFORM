import { model } from "@medusajs/framework/utils"

/**
 * Singleton operational configuration (database.md §3.8.1).
 * Exactly one row with `id = 'global'` (DB CHECK enforced).
 */
export const OperationalSettings = model
  .define("operational_settings", {
    id: model.id({ prefix: "opset_" }).primaryKey(),
    cod_expiry_hours: model.number().default(48),
    cod_max_call_attempts: model.number().default(3),
    sms_sender_id: model.text().nullable(),
    sms_rate_limit_per_order_event: model.number().default(3),
    meta_pixel_id: model.text().nullable(),
    meta_capi_enabled: model.boolean().default(false),
    meta_capi_secret_ref: model.text().nullable(),
    meta_test_event_code: model.text().nullable(),
    ga4_measurement_id: model.text().nullable(),
    support_phone: model.text().nullable(),
    support_email: model.text().nullable(),
    default_locale: model.enum(["en", "bn"]).default("en"),
    currency_display_locale: model.text().default("bn-BD"),
    invoice_terms_en: model.text().nullable(),
    invoice_terms_bn: model.text().nullable(),
    cod_advance_required_above_paisa: model.bigNumber().nullable(),
    retention_webhook_days: model.number().default(90),
    retention_sms_days: model.number().default(180),
    retention_risk_months: model.number().default(24),
    retention_audit_years: model.number().default(6),
    updated_by: model.text().nullable(),
  })
  .indexes([
    // The only Meta Pixel configuration in the schema (one central pixel).
    {
      on: ["meta_pixel_id"],
      unique: true,
      where: `"meta_pixel_id" IS NOT NULL`,
    },
  ])
  .checks([
    {
      name: "CK_opset_singleton",
      expression: `"id" = 'global'`,
    },
    {
      name: "CK_opset_positive_integers",
      expression: `"cod_expiry_hours" > 0 AND "cod_max_call_attempts" > 0 AND "sms_rate_limit_per_order_event" > 0`,
    },
    {
      name: "CK_opset_cod_advance_paisa_integer",
      expression: `"cod_advance_required_above_paisa" IS NULL OR ("cod_advance_required_above_paisa" = trunc("cod_advance_required_above_paisa") AND "cod_advance_required_above_paisa" >= 0)`,
    },
  ])

export default OperationalSettings
