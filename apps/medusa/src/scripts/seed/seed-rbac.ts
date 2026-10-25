/**
 * Opt-in RBAC seed — database.md §9.2 Phase 0 step 5.
 *
 * The native `rbac` module is a **licensed Medusa feature**. It is NOT
 * registered in medusa-config.ts for this deployment. To enable it:
 *   1. obtain MEDUSA_LICENSE_KEY from Medusa (support@medusajs.com),
 *   2. add `{ resolve: "@medusajs/rbac" }` to medusa-config.ts modules,
 *   3. run `npx medusa db:migrate` then this script.
 *
 * Seeds 7 roles + 11 policies per database.md §6.2 matrix and links every
 * existing admin user to the `owner` role via the user_rbac_role link.
 *
 * Run: npx medusa exec ./src/scripts/seed/seed-rbac.ts
 */
import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  Modules,
  ModuleRegistrationName,
} from "@medusajs/framework/utils"
import { RBAC_POLICIES, RBAC_ROLE_POLICIES } from "./seed-foundation"

export default async function seed_rbac({
  container,
}: {
  container: MedusaContainer
}) {
  if (!process.env.MEDUSA_LICENSE_KEY) {
    throw new Error(
      "MEDUSA_LICENSE_KEY is not set. The native rbac module is a licensed " +
        "Medusa feature and cannot be seeded without a valid license key."
    )
  }

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const rbacService = container.resolve(ModuleRegistrationName.RBAC)

  const createdPolicies = await rbacService.createRbacPolicies(RBAC_POLICIES)
  const policyByKey = Object.fromEntries(
    createdPolicies.map((p) => [p.key, p.id])
  )
  for (const [roleName, policyKeys] of Object.entries(RBAC_ROLE_POLICIES)) {
    const role = await rbacService.createRbacRoles({ name: roleName })
    await rbacService.createRbacRolePolicies(
      policyKeys.map((key) => ({
        role_id: role.id,
        policy_id: policyByKey[key],
      }))
    )
  }
  logger.info(
    `rbac: ${Object.keys(RBAC_ROLE_POLICIES).length} roles, ${RBAC_POLICIES.length} policies attached per §6.2`
  )

  const { data: users } = await query.graph({
    entity: "user",
    fields: ["id", "email"],
  })
  const { data: roles } = await query.graph({
    entity: "rbac_role",
    fields: ["id", "name"],
    filters: { name: "owner" },
  })
  for (const user of users) {
    await link.create({
      [Modules.USER]: { user_id: user.id },
      [Modules.RBAC]: { rbac_role_id: roles[0].id },
    })
    logger.info(`rbac: ${user.email} linked to role "owner"`)
  }

  logger.info("RBAC seed complete")
}
