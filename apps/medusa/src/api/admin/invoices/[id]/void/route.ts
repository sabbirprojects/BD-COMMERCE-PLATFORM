import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID } from "crypto"

/**
 * POST /admin/invoices/:id/void
 * Voids an invoice record (immutability rule §8.9).
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const { id } = req.params
  const user = (req as any).user || { id: "user_finance", role: "finance" }
  const { reason = "Administrative correction" } = req.body as any

  const invoiceRes = await pg.raw(`SELECT * FROM invoice WHERE id = ? AND deleted_at IS NULL`, [id])
  const invoice = invoiceRes.rows?.[0]
  if (!invoice) {
    return res.status(404).json({ success: false, error: "Invoice not found" })
  }

  if (invoice.voided_at) {
    return res.status(400).json({
      success: false,
      error: "invoice_already_voided",
      message: `Invoice ${invoice.invoice_number} is already voided.`,
    })
  }

  await pg.raw(
    `UPDATE invoice
     SET voided_at = now(),
         voided_by = ?,
         void_reason = ?,
         updated_at = now()
     WHERE id = ?`,
    [user.id, reason, id]
  )

  await pg.raw(
    `INSERT INTO audit_log (
      id, occurred_at, actor_id, actor_type, actor_role,
      entity_type, entity_id, action, reason, after_redacted, record_hash
    ) VALUES (
      ?, now(), ?, 'user', ?,
      'invoice', ?, 'invoice_voided', ?, ?, 'pending-db-chain'
    )`,
    [
      `aud_${randomUUID().replace(/-/g, "").slice(0, 24)}`,
      user.id,
      user.role || "finance",
      id,
      reason,
      JSON.stringify({ invoice_number: invoice.invoice_number, order_id: invoice.order_id }),
    ]
  )

  return res.json({
    success: true,
    invoice_id: id,
    invoice_number: invoice.invoice_number,
    status: "voided",
    void_reason: reason,
    message: "Invoice voided successfully. Any subsequent issuance will generate a new fiscal serial.",
  })
}
