import { Client } from 'pg'

const DB_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:b4c2de80b80e3bebc18adbde993908a9@localhost:5432/bd_commerce?schema=public'

export async function seedPrompt10Rbac() {
  const c = new Client({ connectionString: DB_URL })
  await c.connect()

  console.log('--- Setting up Prompt 10 RBAC Schema & Seed ---')

  // 1. Create native-compatible RBAC tables
  await c.query(`
    CREATE TABLE IF NOT EXISTS rbac_role (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      deleted_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS rbac_policy (
      id VARCHAR(255) PRIMARY KEY,
      "key" VARCHAR(255) NOT NULL UNIQUE,
      resource VARCHAR(255) NOT NULL,
      operation VARCHAR(255) NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      deleted_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS rbac_role_policy (
      id VARCHAR(255) PRIMARY KEY,
      role_id VARCHAR(255) NOT NULL REFERENCES rbac_role(id) ON DELETE CASCADE,
      policy_id VARCHAR(255) NOT NULL REFERENCES rbac_policy(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      deleted_at TIMESTAMPTZ,
      UNIQUE (role_id, policy_id)
    );

    CREATE INDEX IF NOT EXISTS idx_rbac_role_name ON rbac_role(name);
    CREATE INDEX IF NOT EXISTS idx_rbac_policy_key ON rbac_policy("key");
    CREATE INDEX IF NOT EXISTS idx_rbac_role_policy_role ON rbac_role_policy(role_id);
    CREATE INDEX IF NOT EXISTS idx_user_rbac_role_user ON user_rbac_role(user_id);
  `)

  // 2. Seed 11 Policies (Prompt 10 & architecture.md §6.3)
  const policies = [
    { key: 'order.read', resource: 'order', operation: 'read', description: 'Read orders and view queues' },
    { key: 'order.confirm_cod', resource: 'order', operation: 'confirm_cod', description: 'Confirm COD orders' },
    { key: 'order.cancel', resource: 'order', operation: 'cancel', description: 'Cancel orders and restock' },
    { key: 'courier.book', resource: 'courier', operation: 'book', description: 'Book parcels with couriers' },
    { key: 'refund.approve', resource: 'refund', operation: 'approve', description: 'Approve customer returns' },
    { key: 'refund.pay', resource: 'refund', operation: 'pay', description: 'Record refund payouts' },
    { key: 'cogs.read', resource: 'cogs', operation: 'read', description: 'View cost of goods sold and margins' },
    { key: 'audit.read', resource: 'audit', operation: 'read', description: 'View audit logs' },
    { key: 'content.publish', resource: 'content', operation: 'publish', description: 'Publish content and pages' },
    { key: 'settings.update', resource: 'settings', operation: 'update', description: 'Modify system and gateway settings' },
    { key: 'export.run', resource: 'export', operation: 'run', description: 'Run financial and data exports' },
  ]

  for (const p of policies) {
    const id = 'plc_' + p.key.replace('.', '_')
    await c.query(
      `INSERT INTO rbac_policy (id, "key", resource, operation, description, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, now(), now())
       ON CONFLICT ("key") DO UPDATE SET 
         resource = EXCLUDED.resource,
         operation = EXCLUDED.operation,
         description = EXCLUDED.description,
         updated_at = now()`,
      [id, p.key, p.resource, p.operation, p.description]
    )
  }
  console.log(`✓ Seeded ${policies.length} rbac_policy rows`)

  // 3. Seed 7 Roles (database.md §2.5: owner, manager, finance, warehouse, call_center, content, staff)
  const roles = [
    { name: 'owner', description: 'Super Admin / Store Owner with full unrestricted access' },
    { name: 'manager', description: 'Store Manager for daily sales and operations' },
    { name: 'finance', description: 'Finance and Accounts Manager with margin and payout control' },
    { name: 'warehouse', description: 'Warehouse and Dispatch Staff for parcel fulfillment' },
    { name: 'call_center', description: 'Call Center Verification Staff for phone confirmation' },
    { name: 'content', description: 'Content and Catalog Editor' },
    { name: 'staff', description: 'General Read-Only Staff' },
  ]

  const roleMap: Record<string, string> = {}
  for (const r of roles) {
    const id = 'role_' + r.name
    const res = await c.query(
      `INSERT INTO rbac_role (id, name, description, created_at, updated_at)
       VALUES ($1, $2, $3, now(), now())
       ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, updated_at = now()
       RETURNING id`,
      [id, r.name, r.description]
    )
    roleMap[r.name] = res.rows[0].id
  }
  console.log(`✓ Seeded ${roles.length} rbac_role rows`)

  // 4. Map policies to roles per architecture §6.3 matrix
  const rolePolicies: Record<string, string[]> = {
    owner: policies.map((p) => p.key),
    manager: ['order.read', 'order.confirm_cod', 'order.cancel', 'courier.book', 'content.publish'],
    finance: ['order.read', 'refund.approve', 'refund.pay', 'cogs.read', 'audit.read', 'export.run'],
    warehouse: ['order.read', 'courier.book'],
    call_center: ['order.read', 'order.confirm_cod', 'order.cancel'],
    content: ['order.read', 'content.publish'],
    staff: ['order.read'],
  }

  for (const [roleName, pKeys] of Object.entries(rolePolicies)) {
    const roleId = roleMap[roleName]
    for (const pKey of pKeys) {
      const pRes = await c.query('SELECT id FROM rbac_policy WHERE "key" = $1', [pKey])
      const policyId = pRes.rows[0].id
      const rpId = 'rp_' + roleName + '_' + pKey.replace('.', '_')
      await c.query(
        `INSERT INTO rbac_role_policy (id, role_id, policy_id, created_at, updated_at)
         VALUES ($1, $2, $3, now(), now())
         ON CONFLICT (role_id, policy_id) DO NOTHING`,
        [rpId, roleId, policyId]
      )
    }
  }
  console.log('✓ Mapped rbac_role_policy per architecture §6.3 matrix')

  // 5. Link existing admin user to owner
  const userRes = await c.query(`SELECT id, email, metadata FROM "user" WHERE email = 'admin@bd-commerce.com'`)
  if (userRes.rows.length) {
    const adminUser = userRes.rows[0]
    const linkId = 'urlk_' + adminUser.id.slice(-8)
    await c.query(
      `INSERT INTO user_rbac_role (id, user_id, rbac_role_id, created_at, updated_at)
       VALUES ($1, $2, $3, now(), now())
       ON CONFLICT DO NOTHING`,
      [linkId, adminUser.id, roleMap['owner']]
    )

    // Ensure metadata role is owner and must_change_password is false
    await c.query(
      `UPDATE "user" 
       SET metadata = jsonb_set(
         jsonb_set(COALESCE(metadata, '{}'::jsonb), '{role}', '"owner"'),
         '{must_change_password}', 'false'
       )
       WHERE id = $1`,
      [adminUser.id]
    )
    console.log('✓ Linked admin@bd-commerce.com to owner role (user_rbac_role + metadata.role)')
  }

  await c.end()
  console.log('=== Prompt 10 RBAC setup & seed completed ===')
}

if (require.main === module) {
  seedPrompt10Rbac().catch((err) => {
    console.error('RBAC seed failed:', err)
    process.exit(1)
  })
}
