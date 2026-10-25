import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID } from "crypto"
import jwt from "jsonwebtoken"

function getUserFromReq(req: MedusaRequest) {
  const authHeader = req.headers["authorization"] || ""
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7)
    const decoded = jwt.decode(token) as any
    if (decoded) {
      return {
        id: decoded.actor_id || decoded.app_metadata?.user_id || "user_staff",
        role: decoded.app_metadata?.role || decoded.role || "operations",
      }
    }
  }
  const authContext = (req as any).auth_context
  if (authContext) {
    return {
      id: authContext.actor_id || "user_staff",
      role: authContext.app_metadata?.role || "operations",
    }
  }
  return (req as any).user || { id: "user_warehouse", role: "operations" }
}

/**
 * POST /admin/returns/:id/evaluate
 *
 * Implements Physical Item Condition Evaluation & Restocking:
 * - Condition required before restock (PRD FR-6.7.14)
 * - Damaged items routed to Damaged Quarantine, never sellable stock (AC-6.3)
 * - Sellable items restored to sellable inventory with audit log
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const { id } = req.params
  const user = getUserFromReq(req)

  const { condition, restock = false, variant_id, quantity = 1 } = req.body as any

  if (!["sellable", "damaged", "not_restockable"].includes(condition)) {
    return res.status(400).json({
      success: false,
      error: "Valid condition ('sellable', 'damaged', 'not_restockable') is required before restock (PRD FR-6.7.14)",
    })
  }

  const reviewRes = await pg.raw(`SELECT * FROM return_review WHERE id = ? AND deleted_at IS NULL`, [id])
  const review = reviewRes.rows?.[0]
  if (!review) {
    return res.status(404).json({ success: false, error: "Return review not found" })
  }

  // Quarantine Location ID
  const DAMAGED_QUARANTINE_LOC_ID = "sloc_01M5QBBQZDHM08KE9AWDF3KKDV"
  const CENTRAL_WAREHOUSE_LOC_ID = "sloc_01M5QBBQZ6B84Q4M12C6T466F4"

  let restocked = false
  let quarantineId: string | null = null

  if (condition === "damaged") {
    // AC-6.3: Damaged items are routed to quarantine, NEVER restored to sellable stock!
    quarantineId = DAMAGED_QUARANTINE_LOC_ID

    await pg.raw(
      `UPDATE return_review
       SET condition = 'damaged',
           condition_recorded_by = ?,
           condition_recorded_at = now(),
           quarantine_location_id = ?,
           status = 'received_evaluating',
           received_at = COALESCE(received_at, now()),
           updated_at = now()
       WHERE id = ?`,
      [user.id, quarantineId, id]
    )

    await pg.raw(
      `INSERT INTO audit_log (
        id, occurred_at, actor_id, actor_type, actor_role,
        entity_type, entity_id, action, reason, after_redacted, record_hash
      ) VALUES (
        ?, now(), ?, 'user', ?,
        'return', ?, 'item_quarantined', 'Item damaged; routed to Damaged Quarantine', ?, 'pending-db-chain'
      )`,
      [
        `aud_${randomUUID().replace(/-/g, "").slice(0, 24)}`,
        user.id,
        user.role || "operations",
        id,
        JSON.stringify({ condition: "damaged", quarantine_location_id: quarantineId }),
      ]
    )

    return res.json({
      success: true,
      condition: "damaged",
      is_restocked_to_sellable: false,
      quarantine_location_id: quarantineId,
      message: "Returned item evaluated as damaged. Moved to Damaged Quarantine (never sellable stock, AC-6.3).",
    })
  }

  if (condition === "sellable") {
    let resolvedVariantId = variant_id
    if (!resolvedVariantId) {
      const snapRes = await pg.raw(
        `SELECT variant_id FROM order_line_snapshot WHERE order_id = ? LIMIT 1`,
        [review.order_id]
      )
      resolvedVariantId = snapRes.rows?.[0]?.variant_id
    }

    if (restock && resolvedVariantId) {
      // Restore inventory in Central Warehouse
      await pg.raw(
        `UPDATE inventory_level il
         SET stocked_quantity = stocked_quantity + ?, updated_at = now()
         FROM product_variant_inventory_item pvii
         WHERE pvii.inventory_item_id = il.inventory_item_id
           AND pvii.variant_id = ?
           AND il.location_id = ?`,
        [Number(quantity), resolvedVariantId, CENTRAL_WAREHOUSE_LOC_ID]
      )
      restocked = true
    }

    await pg.raw(
      `UPDATE return_review
       SET condition = 'sellable',
           condition_recorded_by = ?,
           condition_recorded_at = now(),
           restocked_at = ${restocked ? "now()" : "restocked_at"},
           restocked_by = ${restocked ? "?" : "restocked_by"},
           status = 'received_evaluating',
           received_at = COALESCE(received_at, now()),
           updated_at = now()
       WHERE id = ?`,
      restocked ? [user.id, user.id, id] : [user.id, id]
    )

    await pg.raw(
      `INSERT INTO audit_log (
        id, occurred_at, actor_id, actor_type, actor_role,
        entity_type, entity_id, action, reason, after_redacted, record_hash
      ) VALUES (
        ?, now(), ?, 'user', ?,
        'return', ?, 'item_evaluated_sellable', 'Item evaluated as sellable', ?, 'pending-db-chain'
      )`,
      [
        `aud_${randomUUID().replace(/-/g, "").slice(0, 24)}`,
        user.id,
        user.role || "operations",
        id,
        JSON.stringify({ condition: "sellable", restocked, quantity }),
      ]
    )

    return res.json({
      success: true,
      condition: "sellable",
      is_restocked_to_sellable: restocked,
      message: restocked
        ? `Item evaluated as sellable and restocked (+${quantity}) to Central Warehouse.`
        : "Item evaluated as sellable. Awaiting restock or refund.",
    })
  }

  return res.json({ success: true, condition })
}
