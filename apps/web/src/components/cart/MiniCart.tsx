'use client'

import React, { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { Locale, getDictionary, formatBdt } from '@/lib/i18n'

interface MiniCartProps {
  locale: Locale
}

export function MiniCart({ locale }: MiniCartProps) {
  const dict = getDictionary(locale)
  const {
    cart,
    itemCount,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
    isLoading,
  } = useCart()

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer()
    }
    if (isDrawerOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDrawerOpen, closeDrawer])

  if (!isDrawerOpen) return null

  const items = cart?.items || []
  const subtotal = cart?.subtotal || 0

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {dict.cart.title}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                {itemCount} {itemCount === 1 ? dict.cart.item : dict.cart.items}
              </span>
            </div>
            <button
              type="button"
              onClick={closeDrawer}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              aria-label="Close cart drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                    {dict.cart.emptyTitle}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-xs">
                    {dict.cart.emptySubtitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
                >
                  {dict.cart.startShopping}
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800"
                >
                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 rounded-xl bg-white dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
                    {item.thumbnail ? (
                      <Image
                        src={item.thumbnail}
                        alt={item.title}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                        BD
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                          {item.title}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={isLoading}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1"
                          aria-label={dict.cart.remove}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {item.variant_title && (
                        <p className="text-[11px] text-slate-500">
                          {item.variant_title}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2">
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                        {formatBdt(item.unit_price, locale)}
                      </span>

                      {/* Quantity Controls */}
                      <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={isLoading}
                          className="p-1 hover:text-emerald-600 transition-colors disabled:opacity-50"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={isLoading}
                          className="p-1 hover:text-emerald-600 transition-colors disabled:opacity-50"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with Totals and Action Buttons */}
          {items.length > 0 && (
            <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>{dict.cart.subtotal}</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {formatBdt(subtotal, locale)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>{dict.cart.delivery}</span>
                  <span>{dict.cart.deliveryCalculated}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                <Link
                  href={`/${locale}/checkout`}
                  onClick={closeDrawer}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm text-center transition-colors flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20"
                >
                  <span>{dict.cart.proceedToCheckout}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href={`/${locale}/cart`}
                  onClick={closeDrawer}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs text-center transition-colors"
                >
                  {dict.cart.viewCart}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
