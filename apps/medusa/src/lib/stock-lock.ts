/**
 * Redis Distributed Mutex & Stock Reservation Helper
 *
 * Implements Prompt 05 & Architecture §7.2:
 *
 * RESERVATION POLICY INVARIANTS:
 * 1. ZERO-RESERVATION AT CART ADD: Adding an item to the shopping cart
 *    MUST NOT reserve inventory, decrement stock, or hold a lock.
 * 2. ATOMIC RESERVATION AT ORDER PLACEMENT: Inventory reservation and decrement
 *    occur strictly inside an atomic transaction at checkout / COD order creation.
 * 3. DISTRIBUTED MUTEX FOR CONCURRENT CHECKOUT: For serialized stock evaluation,
 *    `stock:lock:{variant_id}` with TTL 30s serializes concurrent checkouts so
 *    stock never oversells or drops below 0.
 */

import Redis from "ioredis"
import { randomUUID } from "crypto"

let redisClientInstance: Redis | null = null

export function getStockLockRedis(): Redis {
  if (!redisClientInstance) {
    const url = process.env.REDIS_URL || "redis://localhost:6379"
    redisClientInstance = new Redis(url, {
      maxRetriesPerRequest: 3,
      lazyConnect: false,
    })
  }
  return redisClientInstance
}

const RELEASE_LOCK_LUA = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`

export interface LockResult {
  acquired: boolean
  lockToken: string | null
  key: string
}

/**
 * Attempts to acquire an atomic distributed lock on a product variant.
 * Key: `stock:lock:{variant_id}`
 * TTL: 30 seconds default
 */
export async function acquireStockLock(
  variantId: string,
  ttlSeconds = 30,
  client?: Redis
): Promise<LockResult> {
  const redis = client || getStockLockRedis()
  const key = `stock:lock:${variantId}`
  const token = randomUUID()

  // SET key token NX EX ttlSeconds
  const result = await redis.set(key, token, "EX", ttlSeconds, "NX")

  if (result === "OK") {
    return {
      acquired: true,
      lockToken: token,
      key,
    }
  }

  return {
    acquired: false,
    lockToken: null,
    key,
  }
}

/**
 * Attempts to acquire an atomic distributed lock on a product variant with retries,
 * ensuring concurrent checkout attempts are serialized cleanly.
 */
export async function acquireStockLockWithRetry(
  variantId: string,
  ttlSeconds = 30,
  maxRetries = 25,
  retryDelayMs = 150,
  client?: Redis
): Promise<LockResult> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const res = await acquireStockLock(variantId, ttlSeconds, client)
    if (res.acquired) {
      return res
    }
    await new Promise((r) => setTimeout(r, retryDelayMs))
  }
  return {
    acquired: false,
    lockToken: null,
    key: `stock:lock:${variantId}`,
  }
}

/**
 * Releases the distributed lock only if the token matches, avoiding
 * releasing a lock that expired and was acquired by another process.
 */
export async function releaseStockLock(
  variantId: string,
  lockToken: string,
  client?: Redis
): Promise<boolean> {
  if (!lockToken) return false
  const redis = client || getStockLockRedis()
  const key = `stock:lock:${variantId}`

  const result = await redis.eval(RELEASE_LOCK_LUA, 1, key, lockToken)
  return result === 1
}

/**
 * Executes a critical stock operation with automatic lock acquisition and release.
 * Throws an error if the lock cannot be acquired.
 */
export async function withStockLock<T>(
  variantId: string,
  action: () => Promise<T>,
  ttlSeconds = 30,
  client?: Redis
): Promise<T> {
  const { acquired, lockToken } = await acquireStockLock(variantId, ttlSeconds, client)
  if (!acquired || !lockToken) {
    throw new Error(`Could not acquire stock lock for variant: ${variantId}. Concurrency conflict.`)
  }

  try {
    return await action()
  } finally {
    await releaseStockLock(variantId, lockToken, client)
  }
}
