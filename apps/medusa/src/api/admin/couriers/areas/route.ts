import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID } from "crypto"
import { resolveCourierArea } from "../../../../lib/courier"

/**
 * GET /admin/couriers/areas
 *
 * Check coverage or search area mappings for a courier (PRD FR-7.4.4).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const { courier_code, thana_code, district_code } = req.query as Record<string, string>

  if (courier_code && thana_code) {
    const resolution = await resolveCourierArea({
      courierCode: courier_code,
      thanaCode: thana_code,
      districtCode: district_code,
      pg,
    })
    return res.json({
      success: true,
      courier_code,
      thana_code,
      resolution,
    })
  }

  // Otherwise list mappings
  let sql = `SELECT * FROM courier_area_map WHERE deleted_at IS NULL`
  const bindings: any[] = []
  if (courier_code) {
    sql += ` AND courier_code = ?`
    bindings.push(courier_code)
  }
  sql += ` ORDER BY thana_code ASC LIMIT 100`

  const listRes = await pg.raw(sql, bindings)
  return res.json({
    success: true,
    mappings: listRes.rows || [],
  })
}

/**
 * POST /admin/couriers/areas
 *
 * Add or update a courier area mapping.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const {
    courier_code,
    thana_code,
    courier_city_id,
    courier_zone_id,
    courier_area_id,
    area_name_raw,
  } = req.body as any

  if (!courier_code || !thana_code) {
    return res.status(400).json({ success: false, error: "courier_code and thana_code are required" })
  }

  const id = `courarea_${randomUUID().replace(/-/g, "").slice(0, 24)}`

  await pg.raw(
    `INSERT INTO courier_area_map (
      id, courier_code, thana_code, courier_city_id, courier_zone_id,
      courier_area_id, area_name_raw, is_active, verified_at, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, true, now(), now(), now()
    ) ON CONFLICT (courier_code, thana_code) WHERE is_active = true AND deleted_at IS NULL
    DO UPDATE SET
      courier_city_id = EXCLUDED.courier_city_id,
      courier_zone_id = EXCLUDED.courier_zone_id,
      courier_area_id = EXCLUDED.courier_area_id,
      area_name_raw = EXCLUDED.area_name_raw,
      verified_at = now(),
      updated_at = now()`,
    [
      id,
      courier_code,
      thana_code,
      courier_city_id || null,
      courier_zone_id || null,
      courier_area_id || null,
      area_name_raw || null,
    ]
  )

  return res.json({
    success: true,
    courier_code,
    thana_code,
    message: "Area mapping updated successfully.",
  })
}
