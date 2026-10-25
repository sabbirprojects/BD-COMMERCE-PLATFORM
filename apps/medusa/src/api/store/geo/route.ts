import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import BdSettingsModuleService from "../../../modules/bd-settings/service"
import { BD_SETTINGS_MODULE } from "../../../modules/bd-settings"

/**
 * GET /store/geo
 *
 * Public Store API returning active Bangladesh administrative hierarchy.
 * Query params:
 * - ?division_code=BD-DHK -> returns districts for that division
 * - ?district_code=BD-DHK-DHA -> returns thanas for that district
 * - (no params) -> returns full cascade { divisions, districts, thanas }
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const settings = req.scope.resolve<BdSettingsModuleService>(BD_SETTINGS_MODULE)
  const divisionCode = req.query.division_code as string | undefined
  const districtCode = req.query.district_code as string | undefined

  if (districtCode) {
    const thanas = await settings.listGeoThanas(
      { district_code: districtCode, is_active: true },
      { order: { name_en: "ASC" } }
    )
    return res.json({
      thanas: thanas.map((t: any) => ({
        code: t.code,
        district_code: t.district_code,
        name_en: t.name_en,
        name_bn: t.name_bn,
        postal_codes: t.postal_codes,
      })),
    })
  }

  if (divisionCode) {
    const districts = await settings.listGeoDistricts(
      { division_code: divisionCode, is_active: true },
      { order: { name_en: "ASC" } }
    )
    return res.json({
      districts: districts.map((d: any) => ({
        code: d.code,
        division_code: d.division_code,
        name_en: d.name_en,
        name_bn: d.name_bn,
      })),
    })
  }

  // Return full hierarchy if no specific parent filter was supplied
  const [divisions, districts, thanas] = await Promise.all([
    settings.listGeoDivisions(
      { is_active: true },
      { order: { sort_order: "ASC" } }
    ),
    settings.listGeoDistricts(
      { is_active: true },
      { order: { name_en: "ASC" } }
    ),
    settings.listGeoThanas(
      { is_active: true },
      { order: { name_en: "ASC" } }
    ),
  ])

  res.json({
    divisions: divisions.map((d: any) => ({
      code: d.code,
      name_en: d.name_en,
      name_bn: d.name_bn,
      sort_order: d.sort_order,
    })),
    districts: districts.map((d: any) => ({
      code: d.code,
      division_code: d.division_code,
      name_en: d.name_en,
      name_bn: d.name_bn,
    })),
    thanas: thanas.map((t: any) => ({
      code: t.code,
      district_code: t.district_code,
      name_en: t.name_en,
      name_bn: t.name_bn,
      postal_codes: t.postal_codes,
    })),
  })
}
