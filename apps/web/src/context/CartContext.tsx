'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { StoreCart } from '@/lib/medusa'

interface CartContextType {
  cart: StoreCart | null
  itemCount: number
  isLoading: boolean
  isDrawerOpen: boolean
  notification: { message: string; type: 'success' | 'error' } | null
  openDrawer: () => void
  closeDrawer: () => void
  clearNotification: () => void
  addToCart: (variantId: string, quantity?: number) => Promise<{ success: boolean; error?: string }>
  buyNow: (
    variantId: string,
    locale?: string
  ) => Promise<{ success: boolean; redirectUrl?: string; error?: string }>
  updateQuantity: (lineId: string, quantity: number) => Promise<{ success: boolean; error?: string }>
  removeItem: (lineId: string) => Promise<{ success: boolean; error?: string }>
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<StoreCart | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null
  )

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type })
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr))
    }, 4000)
  }

  const clearNotification = useCallback(() => {
    setNotification(null)
  }, [])

  const refreshCart = useCallback(async () => {
    try {
      const res = await fetch('/api/cart', { method: 'GET' })
      const data = await res.json()
      if (data.success && data.cart) {
        setCart(data.cart)
      }
    } catch (err) {
      console.error('Error refreshing cart:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  const openDrawer = useCallback(() => setIsDrawerOpen(true), [])
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), [])

  const addToCart = useCallback(
    async (variantId: string, quantity: number = 1) => {
      setIsLoading(true)
      const idempotencyKey = `atc_${variantId}_${Date.now()}`
      try {
        const res = await fetch('/api/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify({ variantId, quantity, idempotencyKey }),
        })

        const data = await res.json()
        if (data.success && data.cart) {
          setCart(data.cart)
          setIsDrawerOpen(true)
          showNotification('Item added to cart', 'success')
          return { success: true }
        } else {
          const err = data.error || 'Failed to add item to cart'
          showNotification(err, 'error')
          return { success: false, error: err }
        }
      } catch (err: any) {
        const msg = err.message || 'Network error'
        showNotification(msg, 'error')
        return { success: false, error: msg }
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const buyNow = useCallback(
    async (variantId: string, locale: string = 'en') => {
      setIsLoading(true)
      const idempotencyKey = `buynow_${variantId}_${Date.now()}`
      try {
        const res = await fetch('/api/cart/buy-now', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify({ variantId, locale, idempotencyKey }),
        })

        const data = await res.json()
        if (data.success && data.cart) {
          setCart(data.cart)
          return {
            success: true,
            redirectUrl: data.redirectUrl || `/${locale}/checkout`,
          }
        } else {
          const err = data.error || 'Failed to process Buy Now'
          showNotification(err, 'error')
          return { success: false, error: err }
        }
      } catch (err: any) {
        const msg = err.message || 'Network error'
        showNotification(msg, 'error')
        return { success: false, error: msg }
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const updateQuantity = useCallback(
    async (lineId: string, quantity: number) => {
      setIsLoading(true)
      const idempotencyKey = `patch_${lineId}_${Date.now()}`
      try {
        const res = await fetch(`/api/cart/items/${lineId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify({ quantity, idempotencyKey }),
        })

        const data = await res.json()
        if (data.success && data.cart) {
          setCart(data.cart)
          return { success: true }
        } else {
          const err = data.error || 'Failed to update quantity'
          showNotification(err, 'error')
          return { success: false, error: err }
        }
      } catch (err: any) {
        const msg = err.message || 'Network error'
        showNotification(msg, 'error')
        return { success: false, error: msg }
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const removeItem = useCallback(
    async (lineId: string) => {
      setIsLoading(true)
      const idempotencyKey = `del_${lineId}_${Date.now()}`
      try {
        const res = await fetch(`/api/cart/items/${lineId}`, {
          method: 'DELETE',
          headers: {
            'X-Idempotency-Key': idempotencyKey,
          },
        })

        const data = await res.json()
        if (data.success && data.cart) {
          setCart(data.cart)
          showNotification('Item removed from cart', 'success')
          return { success: true }
        } else {
          const err = data.error || 'Failed to remove item'
          showNotification(err, 'error')
          return { success: false, error: err }
        }
      } catch (err: any) {
        const msg = err.message || 'Network error'
        showNotification(msg, 'error')
        return { success: false, error: msg }
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const itemCount = useMemo(() => {
    if (!cart?.items) return 0
    return cart.items.reduce((acc, item) => acc + (item.quantity || 0), 0)
  }, [cart])

  const value = useMemo(
    () => ({
      cart,
      itemCount,
      isLoading,
      isDrawerOpen,
      notification,
      openDrawer,
      closeDrawer,
      clearNotification,
      addToCart,
      buyNow,
      updateQuantity,
      removeItem,
      refreshCart,
    }),
    [
      cart,
      itemCount,
      isLoading,
      isDrawerOpen,
      notification,
      openDrawer,
      closeDrawer,
      clearNotification,
      addToCart,
      buyNow,
      updateQuantity,
      removeItem,
      refreshCart,
    ]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
