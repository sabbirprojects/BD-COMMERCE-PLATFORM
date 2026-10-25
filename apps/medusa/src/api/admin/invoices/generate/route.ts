import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { generateInvoiceForOrder } from "../../../../lib/invoice"

/**
 * POST /admin/invoices/generate
 * Generates an immutable invoice with Bangladesh fiscal year numbering (CHK-INV-01).
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const user = (req as any).user || { id: "user_staff", role: "operations" }

  const { order_id } = req.body as any
  if (!order_id) {
    return res.status(400).json({ success: false, error: "order_id is required" })
  }

  try {
    const result = await generateInvoiceForOrder({
      orderId: order_id,
      issuedBy: user.id,
      pg,
    })

    return res.json(result)
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message,
    })
  }
}
