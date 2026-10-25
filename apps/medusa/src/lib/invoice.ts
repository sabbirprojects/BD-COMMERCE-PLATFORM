import { randomUUID, createHash } from "crypto"

export interface GenerateInvoiceParams {
  orderId: string
  issuedBy?: string
  pg: any
}

export function computeFiscalYear(date: Date = new Date()): string {
  const month = date.getMonth() + 1 // 1-12
  const year = date.getFullYear()

  if (month >= 7) {
    // July to Dec
    const nextYearTwoDigits = String(year + 1).slice(-2)
    return `${year}-${nextYearTwoDigits}`
  } else {
    // Jan to June
    const yearTwoDigits = String(year).slice(-2)
    return `${year - 1}-${yearTwoDigits}`
  }
}

export async function generateInvoiceForOrder(params: GenerateInvoiceParams) {
  const { orderId, issuedBy = "system", pg } = params

  // 1. Check if invoice already exists (Immutable, 1:1 with order)
  const existingRes = await pg.raw(
    `SELECT * FROM invoice WHERE order_id = ? AND deleted_at IS NULL LIMIT 1`,
    [orderId]
  )

  if (existingRes.rows?.length > 0) {
    return {
      success: true,
      already_issued: true,
      invoice: existingRes.rows[0],
    }
  }

  // 2. Fetch order, bd details, and line snapshots
  const orderRes = await pg.raw(
    `SELECT o.*, obd.delivery_zone_code, obd.address_snapshot, obd.cod_status,
            obd.customer_paid_delivery_paisa, obd.payment_method_code
     FROM "order" o
     LEFT JOIN order_bd_details obd ON obd.order_id = o.id
     WHERE o.id = ?`,
    [orderId]
  )

  const order = orderRes.rows?.[0]
  if (!order) {
    throw new Error(`Order ${orderId} not found`)
  }

  const linesRes = await pg.raw(
    `SELECT * FROM order_line_snapshot WHERE order_id = ? AND deleted_at IS NULL ORDER BY created_at ASC`,
    [orderId]
  )
  const lines = linesRes.rows || []

  // 3. Compute fiscal year & serial
  const fiscalYear = computeFiscalYear()
  const seqRes = await pg.raw(`SELECT nextval('invoice_serial_seq') as next_serial`)
  const serial = Number(seqRes.rows[0].next_serial)
  const invoiceNumber = `INV-${fiscalYear}-${String(serial).padStart(6, "0")}`

  // 4. Fetch active invoice template
  const tplRes = await pg.raw(
    `SELECT * FROM invoice_template WHERE is_active = true AND deleted_at IS NULL ORDER BY version DESC LIMIT 1`
  )
  const template = tplRes.rows?.[0] || {
    id: "invtpl_default",
    version: 1,
    show_vat: false,
    header_text_en: "Bangladesh Commerce Platform",
    terms_en: "Standard Terms Apply",
  }

  // 5. Check VAT settings (O-02: only if VAT is confirmed and active)
  const vatSettingsRes = await pg.raw(
    `SELECT * FROM vat_settings WHERE is_vat_enabled = true AND deleted_at IS NULL LIMIT 1`
  ).catch(() => ({ rows: [] }))
  const isVatEnabled = vatSettingsRes.rows?.length > 0

  let vatAmountPaisa = 0
  let vatSnapshotJson: any = null

  if (isVatEnabled) {
    const vatRate = Number(vatSettingsRes.rows[0].vat_rate_percent || 0)
    vatAmountPaisa = Math.round((Number(order.total || 0) * 100 * vatRate) / (100 + vatRate))
    vatSnapshotJson = {
      is_enabled: true,
      rate_percent: vatRate,
      registration_number: vatSettingsRes.rows[0].bin_number || "UNVERIFIED",
    }
  }

  // 6. Compute totals snapshot & content hash
  const subtotalPaisa = lines.reduce(
    (sum: number, l: any) => sum + Number(l.unit_price_paisa) * Number(l.quantity),
    0
  )
  const shippingPaisa = Number(order.customer_paid_delivery_paisa || 0)
  const totalPaisa = subtotalPaisa + shippingPaisa

  const totalsSnapshotJson = {
    subtotal_paisa: subtotalPaisa,
    shipping_paisa: shippingPaisa,
    vat_amount_paisa: vatAmountPaisa,
    total_paisa: totalPaisa,
    lines_count: lines.length,
  }

  const rawHashContent = JSON.stringify({
    order_id: orderId,
    invoice_number: invoiceNumber,
    totals: totalsSnapshotJson,
    lines: lines.map((l: any) => ({
      sku: l.sku,
      unit_price_paisa: l.unit_price_paisa,
      quantity: l.quantity,
    })),
  })
  const snapshotSha256 = createHash("sha256").update(rawHashContent).digest("hex")

  const invoiceId = `inv_${randomUUID().replace(/-/g, "").slice(0, 24)}`

  // 7. Insert immutable invoice record
  await pg.raw(
    `INSERT INTO invoice (
      id, order_id, invoice_number, fiscal_year, serial,
      template_id, template_version, snapshot_sha256,
      vat_snapshot_json, totals_snapshot_json, total_paisa,
      vat_amount_paisa, issued_at, issued_by, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, now(), ?, now(), now()
    )`,
    [
      invoiceId,
      orderId,
      invoiceNumber,
      fiscalYear,
      serial,
      template.id,
      template.version,
      snapshotSha256,
      vatSnapshotJson ? JSON.stringify(vatSnapshotJson) : null,
      JSON.stringify(totalsSnapshotJson),
      totalPaisa,
      vatAmountPaisa,
      issuedBy,
    ]
  )

  const createdInvoice = {
    id: invoiceId,
    order_id: orderId,
    invoice_number: invoiceNumber,
    fiscal_year: fiscalYear,
    serial,
    template_id: template.id,
    snapshot_sha256: snapshotSha256,
    vat_snapshot_json: vatSnapshotJson,
    totals_snapshot_json: totalsSnapshotJson,
    total_paisa: totalPaisa,
    vat_amount_paisa: vatAmountPaisa,
    issued_at: new Date().toISOString(),
    issued_by: issuedBy,
  }

  return {
    success: true,
    already_issued: false,
    invoice: createdInvoice,
  }
}
