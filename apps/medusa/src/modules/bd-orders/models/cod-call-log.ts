import { model } from "@medusajs/framework/utils"

export const CodCallLog = model.define("cod_call_log", {
  id: model.id().primaryKey(),
  order_id: model.text().index(),
  attempt_no: model.number(),
  outcome: model.enum([
    "reached_confirmed",
    "reached_cancel",
    "no_answer",
    "wrong_number",
    "callback_requested",
    "suspicious",
  ]),
  agent_id: model.text(),
  notes: model.text().nullable(),
  called_at: model.dateTime(),
  next_followup_at: model.dateTime().nullable(),
})

export default CodCallLog
