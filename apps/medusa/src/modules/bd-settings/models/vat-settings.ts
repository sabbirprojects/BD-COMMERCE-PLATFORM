import { model } from "@medusajs/framework/utils"

/**
 * VAT registration/display config (database.md §3.8.4).
 * The numeric VAT rate lives in native `tax_rate` (referenced by
 * `tax_rate_id`); this table stores registration and display flags only.
 * Disabled + unverified until owner sign-off (O-02).
 */
export const VatSettings = model
  .define("vat_settings", {
    id: model.id({ prefix: "vat_" }).primaryKey(),
    is_current: model.boolean().default(false),
    is_vat_enabled: model.boolean().default(false),
    registration_number: model.text().nullable(),
    registration_status: model
      .enum(["unverified", "verified"])
      .default("unverified"),
    prices_include_vat: model.boolean().default(false),
    tax_region_id: model.text().nullable(),
    tax_rate_id: model.text().nullable(),
    legal_note_en: model.text().nullable(),
    legal_note_bn: model.text().nullable(),
    effective_from: model.dateTime().nullable(),
    effective_to: model.dateTime().nullable(),
    created_by: model.text().nullable(),
  })
  .indexes([
    // Exactly one current configuration row.
    {
      on: ["is_current"],
      unique: true,
      where: `"is_current" = true`,
    },
  ])

export default VatSettings
