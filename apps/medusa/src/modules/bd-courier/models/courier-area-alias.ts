import { model } from "@medusajs/framework/utils"

export const CourierAreaAlias = model.define("courier_area_alias", {
  id: model.id().primaryKey(),
  courier_code: model.text().index(),
  alias_text: model.text().index(),
  thana_code: model.text().index(),
})

export default CourierAreaAlias
