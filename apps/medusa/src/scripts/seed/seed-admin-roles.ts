/**
 * Interim admin role seed — Prompt 02 scope item 8 companion.
 *
 * The native `rbac` module is a licensed Medusa feature (see seed-rbac.ts),
 * so until a license exists each admin user carries its role on
 * `user.metadata.role` (PRD §8.2: owner | manager | staff, plus finance per
 * architecture.md §6.3). This seed is IDEMPOTENT: it only assigns `owner`
 * to users that have NO role yet — it never downgrades or overwrites an
 * existing role.
 *
 * Run: npx medusa exec ./src/scripts/seed/seed-admin-roles.ts
 */
import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export default async function seedAdminRoles({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const userModule = container.resolve(Modules.USER)

  const users = await userModule.listUsers({})
  if (!users.length) {
    logger.info("seed-admin-roles: no admin users found — nothing to do")
    return
  }

  let assigned = 0
  for (const user of users) {
    const metadata = (user.metadata ?? {}) as Record<string, unknown>
    if (typeof metadata.role === "string" && metadata.role.length) {
      logger.info(
        `seed-admin-roles: ${user.email} already has role "${metadata.role}" — kept`
      )
      continue
    }
    await userModule.updateUsers({
      id: user.id,
      metadata: { ...metadata, role: "owner" },
    })
    assigned += 1
    logger.info(`seed-admin-roles: ${user.email} assigned interim role "owner"`)
  }

  logger.info(
    `seed-admin-roles: complete — ${assigned} assigned, ${users.length - assigned} kept`
  )
}
