import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  CheckCircle2,
  Clock,
  Phone,
  MapPin,
  Truck,
  Package,
  ArrowRight,
  ShieldAlert,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react'
import { Locale, getDictionary, formatBdt } from '@/lib/i18n'
import { trackMedusaOrder } from '@/lib/medusa'

export const dynamic = 'force-dynamic'

interface OrderConfirmationPageProps {
  params: Promise<{
    locale: string
    id: string
  }>
}

export default async function OrderConfirmationPage({ params }: OrderConfirmationPageProps) {
  const { locale: rawLocale, id: orderId } = await params
  const locale = (rawLocale === 'bn' ? 'bn' : 'en') as Locale
  const dict = getDictionary(locale)
  const isBn = locale === 'bn'

  // Fetch order details via authoritative Medusa endpoint
  // Using direct fetch or tracking endpoint
  let orderData: any = null
  try {
    const medusaBackendUrl = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
    const res = await fetch(`${medusaBackendUrl}/store/orders/track?order_id=${encodeURIComponent(orderId)}&phone=all`, {
      headers: {
        'x-publishable-api-key':
          process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
          'pk_e03efb8523c1542172c95fe34dc90955a3389f3ee3592faa16171966d4699096',
      },
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      orderData = data.order
    }
  } catch (err) {
    console.error('Failed to load order:', err)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      {/* Success Hero */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-2 ring-8 ring-emerald-50 dark:ring-emerald-900/30 animate-in fade-in zoom-in duration-300">
          <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>
        {/* Exactly ONE H1 per page (CHK-UX-03) */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {dict.orderConfirmation.title}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          {dict.orderConfirmation.subtitle}
        </p>
      </div>

      {/* COD Call Verification Callout */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-start gap-4">
        <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 space-y-1">
          <p className="font-bold">
            {isBn ? 'ফোন ভেরিফিকেশন ও ক্যাশ অন ডেলিভারি' : 'Cash on Delivery & Phone Verification'}
          </p>
          <p className="leading-relaxed">
            {dict.orderConfirmation.callCenterNotice}
          </p>
          <p className="font-semibold pt-1 text-amber-800 dark:text-amber-300">
            {dict.orderConfirmation.codNotice}
          </p>
        </div>
      </div>

      {/* Order Summary Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {/* Order Meta Header */}
        <div className="p-5 sm:p-6 bg-slate-50/50 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">
              {dict.orderConfirmation.orderId}
            </span>
            <span className="text-base sm:text-lg font-mono font-bold text-slate-900 dark:text-white">
              {orderId}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
              <Clock className="w-3.5 h-3.5 mr-1" />
              {isBn ? 'কনফার্মেশনের অপেক্ষায়' : 'Pending Confirmation'}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300">
              COD
            </span>
          </div>
        </div>

        {/* Order Details Body */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* Items List (if available from tracking) */}
          {orderData?.items && orderData.items.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                {dict.orderConfirmation.items}
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-b border-slate-100 dark:border-slate-800">
                {orderData.items.map((item: any, idx: number) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs sm:text-sm">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                      {item.variant_title && item.variant_title !== 'Default' && (
                        <p className="text-slate-400 text-xs">{item.variant_title}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-600 dark:text-slate-300">
                        {item.quantity} × {formatBdt(item.unit_price, locale)}
                      </p>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {formatBdt(item.quantity * item.unit_price, locale)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pricing Totals */}
          {orderData && (
            <div className="pt-2 space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>{dict.orderConfirmation.subtotal}</span>
                <span>{formatBdt(orderData.total_amount - (orderData.shipping_total || 0), locale)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>{dict.orderConfirmation.deliveryFee}</span>
                <span>{formatBdt(orderData.shipping_total || 0, locale)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                <span>{dict.orderConfirmation.total}</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {formatBdt(orderData.total_amount, locale)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-5 sm:p-6 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link
            href={`/${locale}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-colors shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{dict.orderConfirmation.continueShopping}</span>
          </Link>

          <Link
            href={`/${locale}/track?order_id=${encodeURIComponent(orderId)}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm transition-colors"
          >
            <Truck className="w-4 h-4" />
            <span>{dict.orderConfirmation.trackOrder}</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
