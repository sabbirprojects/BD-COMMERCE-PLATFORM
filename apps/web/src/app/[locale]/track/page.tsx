'use client'

import React, { use, useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Search,
  Package,
  Truck,
  Phone,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import { Locale, getDictionary, formatBdt } from '@/lib/i18n'
import { validateAndNormalizeBdPhone } from '@/lib/phone'

interface TrackPageProps {
  params: Promise<{ locale: string }>
  searchParams?: Promise<{ order_id?: string }>
}

export default function TrackOrderPage({ params, searchParams }: TrackPageProps) {
  const { locale: rawLocale } = use(params)
  const locale = (rawLocale === 'bn' ? 'bn' : 'en') as Locale
  const dict = getDictionary(locale)
  const isBn = locale === 'bn'

  const [orderId, setOrderId] = useState('')
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderResult, setOrderResult] = useState<any | null>(null)

  useEffect(() => {
    if (searchParams) {
      searchParams.then((sp) => {
        if (sp.order_id) {
          setOrderId(sp.order_id)
        }
      })
    }
  }, [searchParams])

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setOrderResult(null)

    if (!orderId.trim()) {
      setError(isBn ? 'অনুগ্রহ করে অর্ডার নম্বর প্রদান করুন।' : 'Please enter your order ID.')
      return
    }

    const phoneVal = validateAndNormalizeBdPhone(phone)
    if (!phoneVal.isValid) {
      setError(isBn ? phoneVal.errorBn || 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন' : phoneVal.errorEn || 'Invalid phone number')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(
        `/api/track?order_id=${encodeURIComponent(orderId.trim())}&phone=${encodeURIComponent(
          phoneVal.canonical!
        )}`
      )
      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(isBn ? data.error_bn || data.error : data.error || 'Order not found')
        return
      }

      setOrderResult(data.order)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tracking details.')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (codStatus: string) => {
    switch (codStatus) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isBn ? 'অর্ডার নিশ্চিত হয়েছে' : 'Confirmed & Processing'}
          </span>
        )
      case 'escalated':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <AlertTriangle className="w-3.5 h-3.5" />
            {isBn ? 'পুনঃযাচাই প্রয়োজন (কল ধরেননি)' : 'Escalated / Pending Verification'}
          </span>
        )
      case 'canceled':
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
            <XCircle className="w-3.5 h-3.5" />
            {isBn ? 'বাতিল করা হয়েছে' : 'Canceled / Expired'}
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <Clock className="w-3.5 h-3.5" />
            {isBn ? 'ফোন কনফার্মেশনের অপেক্ষায়' : 'Pending Phone Confirmation'}
          </span>
        )
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      {/* Back button */}
      <Link
        href={`/${locale}`}
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{dict.nav.home}</span>
      </Link>

      {/* Exactly ONE H1 per page (CHK-UX-03) */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {dict.nav.trackOrder}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          {dict.orderConfirmation.trackNotice}
        </p>
      </div>

      {/* Tracking Form */}
      <form
        onSubmit={handleTrack}
        className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {dict.orderConfirmation.orderId} *
            </label>
            <input
              type="text"
              id="track-order-id"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g. order_01M..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {dict.checkout.phone} *
            </label>
            <input
              type="tel"
              id="track-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="017XXXXXXXX"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        <button
          type="submit"
          id="track-submit-btn"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-colors shadow-sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{isBn ? 'অনুসন্ধান করা হচ্ছে...' : 'Tracking...'}</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>{isBn ? 'অর্ডারের অবস্থা দেখুন' : 'Check Order Status'}</span>
            </>
          )}
        </button>
      </form>

      {/* Result Card */}
      {orderResult && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs text-slate-400 font-medium block">
                {dict.orderConfirmation.orderId}
              </span>
              <span className="text-base font-mono font-bold text-slate-900 dark:text-white">
                {orderResult.order_id}
              </span>
            </div>
            <div>{getStatusBadge(orderResult.cod_status)}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-400 block">{dict.checkout.phone}</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200 font-mono">
                {orderResult.masked_phone}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-400 block">{dict.orderConfirmation.deliveryZone}</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200 capitalize">
                {orderResult.delivery_zone?.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-400 block">{dict.orderConfirmation.total}</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {formatBdt(orderResult.total_amount, locale)}
              </span>
            </div>
          </div>

          {/* Shipment & Courier Status */}
          {orderResult.shipment_state && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold text-slate-700 dark:text-slate-200 capitalize">
                  {isBn ? 'ডেলিভারি অবস্থা: ' : 'Shipment State: '}
                  {orderResult.shipment_state.replace(/_/g, ' ')}
                </span>
              </div>
              {orderResult.courier_tracking_code && (
                <div className="font-mono text-slate-500">
                  {isBn ? 'ট্র্যাকিং কোড: ' : 'Tracking Code: '}
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {orderResult.courier_tracking_code}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Return Status Badge & Notice (CHK-FUL-04, AC-6.7) */}
          {orderResult.return_status && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-800 dark:text-amber-300">
                  {isBn ? 'রিটার্ন আবেদন' : 'Return Request'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 uppercase tracking-wider text-[10px]">
                  {orderResult.return_status.replace(/_/g, ' ')}
                </span>
              </div>
              {orderResult.return_details?.rejection_note && (
                <p className="text-amber-700 dark:text-amber-400">
                  {isBn ? 'প্রত্যাখ্যানের কারণ: ' : 'Reason: '}
                  {orderResult.return_details.rejection_note}
                </p>
              )}
            </div>
          )}

          {/* Items */}
          {orderResult.items && orderResult.items.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {dict.orderConfirmation.items}
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-b border-slate-100 dark:border-slate-800">
                {orderResult.items.map((item: any, i: number) => (
                  <div key={i} className="py-2.5 flex justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{item.title}</p>
                      {item.variant_title && item.variant_title !== 'Default' && (
                        <p className="text-slate-400">{item.variant_title}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-500">
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
        </div>
      )}
    </div>
  )
}
