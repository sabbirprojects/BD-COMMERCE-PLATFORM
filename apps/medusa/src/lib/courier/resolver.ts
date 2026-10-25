import { CourierAdapter, AreaResolutionResult } from "./types"
import { SteadfastAdapter } from "./steadfast"
import { PathaoAdapter } from "./pathao"
import { RedXAdapter } from "./redx"
import { ManualCourierAdapter } from "./manual"

const adapters: Record<string, CourierAdapter> = {
  steadfast: new SteadfastAdapter(),
  pathao: new PathaoAdapter(),
  redx: new RedXAdapter(),
  manual: new ManualCourierAdapter(),
}

export function getCourierAdapter(code: string): CourierAdapter {
  const adapter = adapters[code.toLowerCase()]
  if (!adapter) {
    throw new Error(`Unsupported courier provider: '${code}'. Supported: steadfast, pathao, redx, manual.`)
  }
  return adapter
}

/**
 * Resolves courier area identifiers using the 4-tier Bangladesh resolution logic
 * defined in database.md §8.2.
 */
export async function resolveCourierArea(params: {
  courierCode: string
  thanaCode: string
  districtCode?: string
  districtName?: string
  thanaName?: string
  pg: any
}): Promise<AreaResolutionResult> {
  const { courierCode, thanaCode, districtName, thanaName, pg } = params

  if (courierCode === "manual") {
    return {
      mapped: true,
      source: "direct",
      area_name_raw: thanaName || thanaCode,
    }
  }

  // 1. Direct active mapping on thana_code
  const directRes = await pg.raw(
    `SELECT * FROM courier_area_map 
     WHERE courier_code = ? AND thana_code = ? AND is_active = true AND deleted_at IS NULL
     LIMIT 1`,
    [courierCode, thanaCode]
  )
  if (directRes.rows?.[0]) {
    const row = directRes.rows[0]
    return {
      mapped: true,
      courier_city_id: row.courier_city_id,
      courier_zone_id: row.courier_zone_id,
      courier_area_id: row.courier_area_id,
      area_name_raw: row.area_name_raw,
      source: "direct",
    }
  }

  // 2. Alias resolution (e.g. Chittagong -> Chattogram)
  const normalizedAlias = (thanaName || districtName || thanaCode).toLowerCase().trim()
  const aliasRes = await pg.raw(
    `SELECT cam.* FROM courier_area_alias caa
     JOIN courier_area_map cam ON cam.courier_code = caa.courier_code AND cam.thana_code = caa.thana_code
     WHERE caa.courier_code = ? AND caa.alias_text = ? AND cam.is_active = true AND cam.deleted_at IS NULL
     LIMIT 1`,
    [courierCode, normalizedAlias]
  )
  if (aliasRes.rows?.[0]) {
    const row = aliasRes.rows[0]
    return {
      mapped: true,
      courier_city_id: row.courier_city_id,
      courier_zone_id: row.courier_zone_id,
      courier_area_id: row.courier_area_id,
      area_name_raw: row.area_name_raw,
      source: "alias",
    }
  }

  // 3. District-level fallback if courier only supports district granularity (e.g. Steadfast without thana)
  if (courierCode === "steadfast" && districtName) {
    return {
      mapped: true,
      area_name_raw: `${districtName}, ${thanaName || ""}`.trim(),
      source: "district_fallback",
    }
  }

  // 4. No mapping found -> unmapped
  return {
    mapped: false,
    source: "unmapped",
  }
}
