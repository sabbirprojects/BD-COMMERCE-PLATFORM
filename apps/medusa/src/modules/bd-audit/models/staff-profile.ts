import { model } from "@medusajs/framework/utils"

/**
 * HR/ops profile for staff (database.md §3.12.3).
 * Authorization is NOT here — roles live in native `rbac_role` +
 * `user_rbac_role`; `must_change_password` lives in
 * `auth_identity.app_metadata`.
 */
export const StaffProfile = model
  .define("staff_profile", {
    id: model.id({ prefix: "staff_" }).primaryKey(),
    user_id: model.text().unique(),
    employee_code: model.text().nullable(),
    display_name: model.text(),
    phone_e164: model.text().nullable(),
    department: model.text().nullable(),
    designation: model.text().nullable(),
    joined_at: model.dateTime().nullable(),
    is_active: model.boolean().default(true),
    notes: model.text().nullable(),
  })
  .indexes([
    {
      on: ["employee_code"],
      unique: true,
      where: `"employee_code" IS NOT NULL`,
    },
  ])

export default StaffProfile
