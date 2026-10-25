import { configureStoreSearch, defineMiddlewares } from '@medusajs/framework/http'
import { requireBdRoles } from './middleware-utils/bd-role-guard'
import { authLockoutMiddleware } from './middleware-utils/auth-lockout'
import {
  validateMediaUploads,
  validateProductOptionsCap,
  validateProductPublish,
  validateVariantSkuUniqueness,
} from './middleware-utils/catalog-guards'

export default defineMiddlewares({
  routes: [
    {
      // Search index configuration
      method: ['POST'],
      matcher: '/store/search',
      middlewares: [
        configureStoreSearch({
          allowed_indexes: {
            product: true,
          },
        }),
      ],
    },
    {
      // FR-8.2.7 / CHK-SEC-02: Account lockout defense against brute force attacks
      // 5 consecutive failed logins -> 15 min account lockout in Redis
      method: ['POST'],
      matcher: '/auth/user/*',
      middlewares: [authLockoutMiddleware],
    },
    {
      // Prompt 02 / Prompt 10: audit trail is Owner/Finance only (CHK-SEC-01)
      matcher: '/admin/audit-logs',
      middlewares: requireBdRoles(['owner', 'finance']),
    },
    {
      // Prompt 10 / CHK-SEC-01: Contribution profit & COGS margins are Owner + Finance only
      matcher: '/admin/reports/contribution-profit',
      middlewares: requireBdRoles(['owner', 'finance']),
    },
    {
      // Prompt 10 / CHK-SEC-01: Payment Gateways config is Owner only
      matcher: '/admin/settings/gateways',
      middlewares: requireBdRoles(['owner']),
    },
    {
      // Prompt 09 & Prompt 10: COD Call Center Queue and actions follow architecture §6.3
      // Only Owner, Manager, and Call Center Staff can view queue or confirm
      matcher: '/admin/cod-queue',
      middlewares: requireBdRoles(['owner', 'manager', 'call_center', 'staff']),
    },
    {
      matcher: '/admin/orders/:id/cod',
      middlewares: requireBdRoles(['owner', 'manager', 'call_center', 'staff']),
    },
    {
      // Prompt 10: Team management & role assignments
      method: ['POST', 'PATCH', 'DELETE'],
      matcher: '/admin/team*',
      middlewares: requireBdRoles(['owner']),
    },
    {
      method: ['GET'],
      matcher: '/admin/team*',
      middlewares: requireBdRoles(['owner', 'manager']),
    },
    {
      // Prompt 10: Change password (FR-8.2.5, FR-8.2.6)
      method: ['POST'],
      matcher: '/admin/auth/change-password',
      middlewares: requireBdRoles([
        'owner',
        'manager',
        'finance',
        'warehouse',
        'call_center',
        'content',
        'staff',
      ]),
    },
    {
      // System settings follow architecture.md §6.3:
      // Owner full CRUD, Manager view only. Call Center & Warehouse receive 403 (CHK-SEC-01)
      method: ['POST'],
      matcher: '/admin/settings/bangladesh',
      middlewares: requireBdRoles(['owner']),
    },
    {
      method: ['POST'],
      matcher: '/admin/settings/vat',
      middlewares: requireBdRoles(['owner']),
    },
    {
      method: ['GET'],
      matcher: '/admin/settings/bangladesh',
      middlewares: requireBdRoles(['owner', 'manager', 'finance']),
    },
    {
      method: ['GET'],
      matcher: '/admin/settings/vat',
      middlewares: requireBdRoles(['owner', 'manager', 'finance']),
    },
    {
      // CHK-CAT-02: 4th option type blocked in Admin and API
      // AC-3.2: Variant SKU uniqueness within product
      // AC-10.2: Publish rules
      method: ['POST'],
      matcher: '/admin/products',
      middlewares: [
        validateProductOptionsCap,
        validateVariantSkuUniqueness,
        validateProductPublish,
      ],
    },
    {
      method: ['POST'],
      matcher: '/admin/products/:id',
      middlewares: [
        validateProductOptionsCap,
        validateProductPublish,
      ],
    },
    {
      method: ['POST'],
      matcher: '/admin/products/:id/options',
      middlewares: [validateProductOptionsCap],
    },
    {
      method: ['POST'],
      matcher: '/admin/products/:id/variants',
      middlewares: [validateVariantSkuUniqueness],
    },
    {
      // CHK-CAT-05: Upload security (JPG/PNG/WebP <= 5MB)
      method: ['POST'],
      matcher: '/admin/uploads',
      middlewares: [validateMediaUploads],
    },
    {
      // CHK-CAT-07: COGS / variant costs is strictly Owner/Finance only.
      matcher: '/admin/products/:id/variants/costs',
      middlewares: requireBdRoles(['owner', 'finance']),
    },
    {
      matcher: '/admin/products/:id/variants/:variant_id/cost',
      middlewares: requireBdRoles(['owner', 'finance']),
    },
    {
      // Prompt 13: Courier Dispatch & Manifest (Owner, Manager, Warehouse, Operations, Finance)
      matcher: '/admin/couriers*',
      middlewares: requireBdRoles(['owner', 'manager', 'warehouse', 'operations', 'finance']),
    },
  ],
})
