import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createInventoryLevelsWorkflow } from "@medusajs/medusa/core-flows"

export default async function seedInventoryLevels({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  logger.info("Starting inventory level assignment for Central Warehouse...")

  // Find Central Warehouse location
  const { data: stockLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
    filters: { name: "Central Warehouse" },
  })

  if (!stockLocations.length) {
    throw new Error("Central Warehouse location not found!")
  }

  const centralWarehouseId = stockLocations[0].id
  logger.info(`Central Warehouse ID: ${centralWarehouseId}`)

  // Get all inventory items
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "sku", "location_levels.location_id"],
  })

  logger.info(`Found ${inventoryItems.length} inventory items`)

  const levelsToCreate: {
    inventory_item_id: string
    location_id: string
    stocked_quantity: number
  }[] = []

  for (const item of inventoryItems) {
    const hasLevel = item.location_levels?.some(
      (l: any) => l.location_id === centralWarehouseId
    )
    if (!hasLevel) {
      // Set realistic stock: 50 for most, 0 for intentionally out-of-stock items
      let qty = 50
      if (item.sku === "LOAFER-43-BRN" || item.sku === "PANJABI-XL-NAV") {
        qty = 0 // Out of stock for testing
      } else if (item.sku === "LOAFER-40-BRN") {
        qty = 2 // Low stock for testing
      }

      levelsToCreate.push({
        inventory_item_id: item.id,
        location_id: centralWarehouseId,
        stocked_quantity: qty,
      })
    }
  }

  if (levelsToCreate.length > 0) {
    logger.info(`Creating ${levelsToCreate.length} inventory levels...`)
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: levelsToCreate,
      },
    })
    logger.info("Successfully created inventory levels!")
  } else {
    logger.info("All inventory items already have levels at Central Warehouse.")
  }
}
