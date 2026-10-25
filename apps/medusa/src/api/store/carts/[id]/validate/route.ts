import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

/**
 * POST /store/carts/:id/validate
 *
 * Authoritative Server-Side Price & Stock Revalidation
 * Requirements:
 * - CHK-CHK-07: Server recalculates line totals using official database prices.
 * - PRD FR-4.3.5 / FR-4.3.6 / AC-4.4 / AC-4.5:
 *   Revalidates price set and stock availability for every line in the cart.
 *   Returns structured price discrepancies and stock shortages.
 *   Never allows checkout with stale price or insufficient stock.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id: cartId } = req.params
  const body = (req.body || {}) as {
    acknowledge_price_changes?: boolean
  }

  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  // 1. Fetch current cart lines
  const cartLinesQuery = await pg.raw(
    `SELECT 
      cli.id,
      cli.title,
      cli.variant_id,
      cli.quantity,
      cli.unit_price
     FROM cart_line_item cli
     WHERE cli.cart_id = ?
     ORDER BY cli.created_at ASC`,
    [cartId]
  )

  const cartLines = cartLinesQuery.rows || []
  if (cartLines.length === 0) {
    return res.json({
      valid: false,
      message: "Cart is empty",
      empty_cart: true,
      price_changes: [],
      stock_issues: [],
    })
  }

  const priceChanges: Array<{
    line_id: string
    variant_id: string
    title: string
    old_unit_price: number
    new_unit_price: number
  }> = []

  const stockIssues: Array<{
    line_id: string
    variant_id: string
    title: string
    requested_quantity: number
    available_quantity: number
    is_out_of_stock: boolean
  }> = []

  for (const line of cartLines) {
    // 2. Fetch authoritative live BDT price and stock from database
    const variantDataQuery = await pg.raw(
      `SELECT 
        pv.id AS variant_id,
        pr.amount AS current_bdt_price,
        COALESCE(il.stocked_quantity, 0) AS stocked_quantity,
        COALESCE(il.reserved_quantity, 0) AS reserved_quantity
       FROM product_variant pv
       JOIN product_variant_price_set pvps ON pvps.variant_id = pv.id
       JOIN price pr ON pr.price_set_id = pvps.price_set_id AND pr.currency_code = 'bdt'
       LEFT JOIN product_variant_inventory_item pvii ON pvii.variant_id = pv.id
       LEFT JOIN inventory_level il ON il.inventory_item_id = pvii.inventory_item_id
       WHERE pv.id = ?`,
      [line.variant_id]
    )

    const variantRow = variantDataQuery.rows?.[0]
    if (!variantRow) {
      stockIssues.push({
        line_id: line.id,
        variant_id: line.variant_id,
        title: line.title,
        requested_quantity: line.quantity,
        available_quantity: 0,
        is_out_of_stock: true,
      })
      continue
    }

    const currentPrice = Number(variantRow.current_bdt_price)
    const storedPrice = Number(line.unit_price)

    // Check price integrity
    if (Math.abs(currentPrice - storedPrice) > 0.001) {
      priceChanges.push({
        line_id: line.id,
        variant_id: line.variant_id,
        title: line.title,
        old_unit_price: storedPrice,
        new_unit_price: currentPrice,
      })
    }

    // Check stock integrity
    const stocked = Number(variantRow.stocked_quantity)
    const reserved = Number(variantRow.reserved_quantity)
    const available = Math.max(0, stocked - reserved)

    if (available < line.quantity) {
      stockIssues.push({
        line_id: line.id,
        variant_id: line.variant_id,
        title: line.title,
        requested_quantity: line.quantity,
        available_quantity: available,
        is_out_of_stock: available <= 0,
      })
    }
  }

  // If customer acknowledged price changes, update cart lines with current price
  if (body.acknowledge_price_changes && priceChanges.length > 0) {
    for (const change of priceChanges) {
      await pg.raw(
        `UPDATE cart_line_item 
         SET unit_price = ?, raw_unit_price = ? 
         WHERE id = ?`,
        [
          change.new_unit_price,
          JSON.stringify({ value: String(change.new_unit_price), precision: 20 }),
          change.line_id,
        ]
      )
    }
  }

  const isValid = priceChanges.length === 0 && stockIssues.length === 0

  return res.json({
    valid: isValid,
    has_price_change: priceChanges.length > 0,
    has_stock_issue: stockIssues.length > 0,
    price_changes: priceChanges,
    stock_issues: stockIssues,
  })
}
