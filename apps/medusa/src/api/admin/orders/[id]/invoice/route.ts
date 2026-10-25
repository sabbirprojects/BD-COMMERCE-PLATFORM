import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { generateInvoiceForOrder } from "../../../../../lib/invoice"

/**
 * GET /admin/orders/:id/invoice
 * Returns printable invoice data with Bangladesh fiscal year numbering (CHK-INV-01).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const { id } = req.params

  // 1. Fetch or generate invoice
  let invoiceRes = await pg.raw(
    `SELECT * FROM invoice WHERE order_id = ? AND deleted_at IS NULL LIMIT 1`,
    [id]
  )

  let invoice = invoiceRes.rows?.[0]
  if (!invoice) {
    const gen = await generateInvoiceForOrder({ orderId: id, issuedBy: "admin", pg })
    invoice = gen.invoice
  }

  // 2. Fetch order lines & BD details
  const orderRes = await pg.raw(
    `SELECT o.*, obd.address_snapshot, obd.delivery_zone_code, obd.payment_method_code,
            obd.customer_paid_delivery_paisa
     FROM "order" o
     JOIN order_bd_details obd ON obd.order_id = o.id
     WHERE o.id = ?`,
    [id]
  )
  const order = orderRes.rows?.[0]

  const linesRes = await pg.raw(
    `SELECT * FROM order_line_snapshot WHERE order_id = ? AND deleted_at IS NULL ORDER BY created_at ASC`,
    [id]
  )
  const lines = linesRes.rows || []

  const addr = order?.address_snapshot || {}
  const phone = addr.phone || ""
  const maskedPhone = phone.length >= 10 ? `${phone.slice(0, 6)}****${phone.slice(-4)}` : phone

  const subtotalBdt = Number(invoice.totals_snapshot_json?.subtotal_paisa || 0) / 100
  const deliveryBdt = Number(invoice.totals_snapshot_json?.shipping_paisa || 0) / 100
  const totalBdt = Number(invoice.total_paisa || 0) / 100
  const vatAmountBdt = Number(invoice.vat_amount_paisa || 0) / 100

  return res.json({
    success: true,
    invoice: {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      fiscal_year: invoice.fiscal_year,
      serial: invoice.serial,
      issued_at: invoice.issued_at,
      snapshot_sha256: invoice.snapshot_sha256,
      voided_at: invoice.voided_at,
      store: {
        name: "BD Commerce Store",
        address: "Dhaka, Bangladesh",
        support_phone: "+8809600000000",
      },
      customer: {
        name: `${addr.first_name || ""} ${addr.last_name || ""}`.trim() || "Customer",
        phone: maskedPhone,
        address: addr.street_address || "",
        zone: order?.delivery_zone_code || "",
      },
      items: lines.map((l: any) => ({
        sku: l.sku,
        title: l.title,
        variant_title: l.variant_title,
        quantity: l.quantity,
        unit_price_bdt: Number(l.unit_price_paisa) / 100,
        total_price_bdt: (Number(l.unit_price_paisa) * Number(l.quantity)) / 100,
      })),
      totals: {
        subtotal_bdt: subtotalBdt,
        delivery_bdt: deliveryBdt,
        vat_bdt: vatAmountBdt,
        total_bdt: totalBdt,
      },
      vat_line_included: invoice.vat_snapshot_json?.is_enabled === true,
      legal_note: invoice.vat_snapshot_json?.is_enabled
        ? `BIN: ${invoice.vat_snapshot_json?.registration_number}`
        : "VAT not configured at order time (FR-11.7.4).",
    },
  })
}
