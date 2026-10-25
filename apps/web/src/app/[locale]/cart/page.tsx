'use client'

import React, { use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
} from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { Locale, getDictionary, formatBdt } from '@/lib/i18n'

interface CartPageProps {
  params: Promise<{ locale: string }>
}

export default function CartPage({ params }: CartPageProps) {
  const { locale: rawLocale } = use(params)
  const locale = (rawLocale === 'bn' ? 'bn' : 'en') as Locale
  const dict = getDictionary(locale)

  const { cart, itemCount, isLoading, updateQuantity, removeItem } = useCart()

  const items = cart?.items || []
  const subtotal = cart?.subtotal || 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Exactly ONE H1 per page (CHK-UX-03) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {dict.cart.title}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            {itemCount} {itemCount === 1 ? dict.cart.item : dict.cart.items} {dict.cart.total}
          </p>
        </div>
        <Link
          href={`/${locale}`}
          className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
        >
          {dict.cart.continueShopping}
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="py-16 sm:py-24 text-center max-w-md mx-auto space-y-6">
          <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 mx-auto">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {dict.cart.emptyTitle}
            </h2>
            <p className="text-sm text-slate-500">{dict.cart.emptySubtitle}</p>
          </div>
          <Link
            href={`/${locale}`}
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors shadow-sm shadow-emerald-600/20"
          >
            {dict.cart.startShopping}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Cart Items List (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="hidden sm:grid grid-cols-12 gap-4 pb-3 text-xs font-semibold text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
              <span className="col-span-6">{dict.cart.product}</span>
              <span className="col-span-2 text-center">{dict.cart.price}</span>
              <span className="col-span-2 text-center">{dict.cart.quantity}</span>
              <span className="col-span-2 text-right">{dict.cart.total}</span>
            </div>

            {items.map((item) => {
              const lineTotal = (item.unit_price || 0) * (item.quantity || 1)

              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:grid sm:grid-cols-12 gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm items-center"
                >
                  {/* Product Info (Col 6) */}
                  <div className="sm:col-span-6 flex items-center gap-4 w-full">
                    <div className="relative w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
                      {item.thumbnail ? (
                        <Image
                          src={item.thumbnail}
                          alt={item.title}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-bold text-slate-400">
                          BD
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-2">
                        {item.title}
                      </h3>
                      {item.variant_title && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.variant_title}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={isLoading}
                        className="mt-2 text-xs font-medium text-red-500 hover:text-red-700 transition-colors inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{dict.cart.remove}</span>
                      </button>
                    </div>
                  </div>

                  {/* Unit Price (Col 2) */}
                  <div className="sm:col-span-2 text-center w-full sm:w-auto flex justify-between sm:justify-center items-center text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    <span className="sm:hidden text-slate-400">{dict.cart.price}:</span>
                    <span className="font-semibold">{formatBdt(item.unit_price, locale)}</span>
                  </div>

                  {/* Quantity Controls (Col 2) */}
                  <div className="sm:col-span-2 flex justify-between sm:justify-center items-center w-full sm:w-auto">
                    <span className="sm:hidden text-slate-400 text-xs">{dict.cart.quantity}:</span>
                    <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={isLoading}
                        className="p-1.5 hover:text-emerald-600 transition-colors disabled:opacity-50"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 text-xs font-bold text-slate-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={isLoading}
                        className="p-1.5 hover:text-emerald-600 transition-colors disabled:opacity-50"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Line Total (Col 2) */}
                  <div className="sm:col-span-2 text-right w-full sm:w-auto flex justify-between sm:justify-end items-center">
                    <span className="sm:hidden text-slate-400 text-xs">{dict.cart.total}:</span>
                    <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                      {formatBdt(lineTotal, locale)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Order Summary Sidebar (4 Cols) */}
          <div className="lg:col-span-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {dict.cart.orderTotal}
            </h2>

            <div className="space-y-3 text-sm divide-y divide-slate-100 dark:divide-slate-800">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 pt-1">
                <span>{dict.cart.subtotal}</span>
                <span className="font-bold text-slate-900 dark:text-white text-base">
                  {formatBdt(subtotal, locale)}
                </span>
              </div>

              <div className="flex flex-col gap-1 pt-3 text-xs text-slate-500">
                <div className="flex items-center justify-between font-medium">
                  <span>{dict.cart.delivery}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {locale === 'bn' ? 'চেকআউটে নির্ধারিত হবে' : 'Calculated at checkout'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{dict.cart.deliveryCalculated}</p>
              </div>

              <div className="flex items-center justify-between pt-4 text-base font-extrabold text-slate-900 dark:text-white">
                <span>{dict.cart.orderTotal}</span>
                <span className="text-xl sm:text-2xl text-emerald-600 dark:text-emerald-400">
                  {formatBdt(subtotal, locale)}
                </span>
              </div>
            </div>

            <Link
              href={`/${locale}/checkout`}
              className="w-full py-4 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm text-center transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <span>{dict.cart.proceedToCheckout}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {/* Trust Signals */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{locale === 'bn' ? '৬৪ জেলায় দ্রুততম ডেলিভারি' : 'Nationwide 64 Districts Delivery'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{locale === 'bn' ? 'ক্যাশ অন ডেলিভারি সুবিধা' : 'Cash on Delivery Available'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <RotateCcw className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{locale === 'bn' ? 'সহজ রিটার্ন পর্যালোচনা' : 'Easy Return Review Process'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
