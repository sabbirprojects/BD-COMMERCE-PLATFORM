import { loadEnv, defineConfig } from '@medusajs/framework/utils'
import path from 'path'

loadEnv(process.env.NODE_ENV || 'development', path.resolve(__dirname, '../../'))
loadEnv(process.env.NODE_ENV || 'development', __dirname)

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS || 'http://localhost:3000,http://localhost:8000',
      adminCors: process.env.ADMIN_CORS || 'http://localhost:9000,http://localhost:5173',
      authCors: process.env.AUTH_CORS || 'http://localhost:9000,http://localhost:3000',
      jwtSecret: process.env.JWT_SECRET || 'supersecret',
      cookieSecret: process.env.COOKIE_SECRET || 'supersecret',
    }
  },
  admin: {
    // Embedded Medusa Admin is the only staff UI (Prompt 02). The admin
    // toolchain (@medusajs/admin-sdk, @medusajs/dashboard, vite) ships with the
    // 2.22.0 dependency set, so `medusa build` emits the admin bundle into
    // .medusa/server/public/admin and `medusa start` serves it at /app.
    disable: false,
  },
  /**
   * Native modules (product, pricing, inventory, cart, order, customer, auth,
   * user, fulfillment, payment, tax, translation, notification, file,
   * promotion, region, sales channel, stock location, api key, currency) are
   * enabled by default by @medusajs/medusa@2.22.0 — no explicit entries needed.
   *
   * NOTE: the native `rbac` module is a licensed Medusa feature
   * (MEDUSA_LICENSE_KEY). It is deliberately NOT registered here; the
   * prepared role/policy seed lives in src/scripts/seed/seed-rbac.ts and is
   * run only on licensed deployments (database.md §9.2 step 5 — deferred).
   *
   * Custom Bangladesh modules. Only modules whose DML matches canonical
   * database.md stay registered. Prompt 01 reshapes bd-settings + bd-audit;
   * the remaining scaffolds (bd-catalog, bd-orders, bd-courier, bd-payments,
   * bd-campaigns) still use superseded draft names and are re-registered when
   * their prompts reshape them.
   */
  modules: [
    {
      resolve: "./src/modules/bd-settings",
    },
    {
      resolve: "./src/modules/bd-audit",
    },
    {
      resolve: "./src/modules/bd-catalog",
    },
    {
      resolve: "./src/modules/bd-orders",
    },
    {
      resolve: "./src/modules/bd-payments",
    },
    {
      resolve: "./src/modules/bd-courier",
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "./src/modules/pp-cod",
            options: {},
          },
          {
            resolve: "./src/modules/pp-bkash",
            options: {},
          },
          {
            resolve: "./src/modules/pp-nagad",
            options: {},
          },
        ],
      },
    },
    {
      resolve: "@medusajs/translation",
    },
  ],
})
