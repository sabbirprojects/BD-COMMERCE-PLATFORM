'use client'

import React, { use, useState, useEffect, useId, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Truck,
  MapPin,
  Phone,
  User,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Info,
} from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { Locale, getDictionary, formatBdt } from '@/lib/i18n'
import { validateAndNormalizeBdPhone } from '@/lib/phone'
import { GeoDivision, GeoDistrict, GeoThana, GeoDeliveryZone } from '@/lib/medusa'

interface CheckoutPageProps {
  params: Promise<{ locale: string }>
}

function CheckoutContent({ params }: CheckoutPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { locale: rawLocale } = use(params)
  const locale = (rawLocale === 'bn' ? 'bn' : 'en') as Locale
  const dict = getDictionary(locale)
  const isBn = locale === 'bn'

  const [availableGateways, setAvailableGateways] = useState<Array<{ code: string; is_enabled: boolean }>>([
    { code: 'cod', is_enabled: true },
    { code: 'bkash', is_enabled: false },
    { code: 'nagad', is_enabled: false },
  ])

  const { cart, itemCount, isLoading: isCartLoading, updateQuantity, removeItem, refreshCart } = useCart()

  // Form State
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [altPhone, setAltPhone] = useState('')
  const [streetAddress, setStreetAddress] = useState('')
  const [postalCode, setPostalCode] = useState('')

  // Geo Cascade State
  const [divisions, setDivisions] = useState<GeoDivision[]>([])
  const [districts, setDistricts] = useState<GeoDistrict[]>([])
  const [thanas, setThanas] = useState<GeoThana[]>([])

  const [selectedDivisionCode, setSelectedDivisionCode] = useState('')
  const [selectedDistrictCode, setSelectedDistrictCode] = useState('')
  const [selectedThanaCode, setSelectedThanaCode] = useState('')

  // Delivery Zone & Price Revalidation
  const [activeZone, setActiveZone] = useState<GeoDeliveryZone | null>(null)
  const [isResolvingShipping, setIsResolvingShipping] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bkash' | 'nagad'>('cod')

  // Validation & Error Feedback
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [successNotice, setSuccessNotice] = useState<string | null>(null)

  // CHK-CHK-07 Price Changes & Stock Issues
  const [priceChanges, setPriceChanges] = useState<any[]>([])
  const [stockIssues, setStockIssues] = useState<any[]>([])
  const [isAcknowledging, setIsAcknowledging] = useState(false)

  // 1. Fetch Geo Master (Divisions, Districts, Thanas)
  useEffect(() => {
    async function loadGeoData() {
      try {
        const res = await fetch('/api/geo')
        if (res.ok) {
          const data = await res.json()
          setDivisions(data.divisions || [])
          setDistricts(data.districts || [])
          setThanas(data.thanas || [])
        }
      } catch (err) {
        console.error('Failed to load geo data:', err)
      }
    }
    loadGeoData()
  }, [])

  // Check for payment cancellation or failure redirect (CHK-PAY-04 & FR-7.3.7)
  useEffect(() => {
    if (searchParams.get('payment_error') === 'cancelled') {
      setGeneralError(
        isBn
          ? 'পেমেন্ট সম্পন্ন হয়নি। আবার চেষ্টা করুন অথবা ক্যাশ অন ডেলিভারি বেছে নিন।'
          : 'Payment was not completed. Please try again or select Cash on Delivery.'
      )
    }
  }, [searchParams, isBn])

  // Load configured payment gateways (AC-7.1, AC-7.4)
  useEffect(() => {
    async function loadGateways() {
      try {
        const res = await fetch('/api/checkout/gateways')
        if (res.ok) {
          const data = await res.json()
          if (data.gateways && Array.isArray(data.gateways)) {
            setAvailableGateways(data.gateways)
          }
        }
      } catch (err) {
        console.error('Failed to load gateways:', err)
      }
    }
    loadGateways()
  }, [])

  // 2. Filter Districts by selected Division
  const availableDistricts = districts.filter(
    (d) => d.division_code === selectedDivisionCode
  )

  // 3. Filter Thanas by selected District
  const availableThanas = thanas.filter(
    (t) => t.district_code === selectedDistrictCode
  )

  // 4. Handle Division change -> reset dependent District, Thana, Zone
  const handleDivisionChange = (divisionCode: string) => {
    setSelectedDivisionCode(divisionCode)
    setSelectedDistrictCode('')
    setSelectedThanaCode('')
    setPostalCode('')
    setActiveZone(null)
  }

  // 5. Handle District change -> Resolve Delivery Zone & Shipping Option (CHK-CHK-06)
  const handleDistrictChange = async (districtCode: string) => {
    setSelectedDistrictCode(districtCode)
    setSelectedThanaCode('')
    setPostalCode('')

    if (!districtCode) {
      setActiveZone(null)
      return
    }

    setIsResolvingShipping(true)
    setGeneralError(null)

    try {
      const res = await fetch('/api/checkout/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ district_code: districtCode }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setActiveZone(data.zone)
        // Refresh cart to display updated shipping_total and total
        await refreshCart()
      } else {
        setGeneralError(data.error || 'Failed to resolve delivery rate')
      }
    } catch (err: any) {
      setGeneralError(err.message || 'Error applying delivery option')
    } finally {
      setIsResolvingShipping(false)
    }
  }

  // 6. Handle Thana change -> Auto-fill postal code
  const handleThanaChange = (thanaCode: string) => {
    setSelectedThanaCode(thanaCode)
    const matchedThana = availableThanas.find((t) => t.code === thanaCode)
    if (matchedThana && matchedThana.postal_codes && matchedThana.postal_codes.length > 0) {
      setPostalCode(matchedThana.postal_codes[0])
    }
  }

  // 7. Phone input blur/change validation (CHK-CHK-05)
  const handlePhoneBlur = () => {
    if (!phone.trim()) {
      setPhoneError(null)
      return
    }
    const result = validateAndNormalizeBdPhone(phone)
    if (!result.isValid) {
      setPhoneError(isBn ? result.errorBn || 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন' : result.errorEn || 'Invalid phone number')
    } else {
      setPhoneError(null)
      if (result.formattedLocal) {
        setPhone(result.formattedLocal)
      }
    }
  }

  // 8. Recheck cart price and stock integrity on mount
  const checkIntegrity = useCallback(async () => {
    if (!cart || !cart.items || cart.items.length === 0) return

    try {
      const res = await fetch('/api/checkout/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (res.ok) {
        if (data.has_price_change) {
          setPriceChanges(data.price_changes || [])
        } else {
          setPriceChanges([])
        }
        if (data.has_stock_issue) {
          setStockIssues(data.stock_issues || [])
        } else {
          setStockIssues([])
        }
      }
    } catch (err) {
      console.error('Integrity check error:', err)
    }
  }, [cart])

  useEffect(() => {
    checkIntegrity()
  }, [checkIntegrity])

  // 9. Acknowledge Price Changes (CHK-CHK-07)
  const handleAcknowledgePrices = async () => {
    setIsAcknowledging(true)
    try {
      const res = await fetch('/api/checkout/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acknowledge_price_changes: true }),
      })
      if (res.ok) {
        setPriceChanges([])
        await refreshCart()
      }
    } catch (err) {
      console.error('Failed to acknowledge prices:', err)
    } finally {
      setIsAcknowledging(false)
    }
  }

  // 10. Checkout Submission & Validation
  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError(null)
    setSuccessNotice(null)

    // Validate phone (CHK-CHK-05)
    const phoneVal = validateAndNormalizeBdPhone(phone)
    if (!phoneVal.isValid) {
      setPhoneError(isBn ? phoneVal.errorBn || 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন' : phoneVal.errorEn || 'Invalid phone number')
      return
    }

    // Validate address tiers
    if (!firstName.trim()) {
      setGeneralError(isBn ? 'অনুগ্রহ করে গ্রাহকের নাম দিন।' : 'Please enter recipient name.')
      return
    }
    if (!selectedDivisionCode || !selectedDistrictCode || !selectedThanaCode || !streetAddress.trim()) {
      setGeneralError(dict.checkout.addressError)
      return
    }

    setIsSubmitting(true)
    const idempotencyKey = `chk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    try {
      const res = await fetch('/api/checkout/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-idempotency-key': idempotencyKey,
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone: phoneVal.canonical,
          alt_phone: altPhone,
          division_code: selectedDivisionCode,
          district_code: selectedDistrictCode,
          thana_code: selectedThanaCode,
          street_address: streetAddress,
          postal_code: postalCode,
          payment_method: paymentMethod,
          locale: locale,
        }),
      })

      const data = await res.json()

      if (res.status === 429) {
        setGeneralError(isBn ? data.error_bn : data.error)
        return
      }

      if (!res.ok) {
        if (data.requires_acknowledgement) {
          setPriceChanges(data.price_changes || [])
          setGeneralError(isBn ? data.error_bn : data.error)
        } else if (data.stock_issues) {
          setStockIssues(data.stock_issues || [])
          setGeneralError(isBn ? data.error_bn : data.error)
        } else {
          setGeneralError(isBn ? data.error_bn || data.error : data.error)
        }
        return
      }

      if (data.success && data.redirect_url) {
        await refreshCart()
        router.push(data.redirect_url)
        return
      }

      if (data.success) {
        setSuccessNotice(
          isBn
            ? 'অর্ডার সফলভাবে তৈরি হয়েছে।'
            : 'Order created successfully.'
        )
        await refreshCart()
      }
    } catch (err: any) {
      setGeneralError(err.message || 'Failed to submit checkout.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const items = cart?.items || []
  const subtotal = cart?.subtotal || 0
  const shippingTotal = cart?.shipping_total ?? (activeZone ? activeZone.amount : 0)
  const grandTotal = subtotal + (shippingTotal || 0)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href={`/${locale}/cart`}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{locale === 'bn' ? 'কার্টে ফিরে যান' : 'Back to Cart'}</span>
        </Link>
        <span className="text-xs text-slate-500 font-medium">
          {itemCount} {itemCount === 1 ? dict.cart.item : dict.cart.items}
        </span>
      </div>

      {/* Exactly ONE H1 per page (CHK-UX-03) */}
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {dict.checkout.title}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          {dict.checkout.subtitle}
        </p>
      </div>

      {/* Prompt 08 Verification & Handoff Banner */}
      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-900 dark:text-emerald-300 leading-relaxed space-y-1">
          <p className="font-bold">{dict.checkout.handoffBannerTitle}</p>
          <p>{dict.checkout.handoffBannerDesc}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="py-16 text-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {dict.cart.emptyTitle}
          </h2>
          <p className="text-xs text-slate-500">{dict.cart.emptySubtitle}</p>
          <Link
            href={`/${locale}`}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
          >
            {dict.cart.startShopping}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmitCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Guest Checkout Form & 4-Tier Address Cascade (7 Cols) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Price Change Warning Banner (CHK-CHK-07) */}
            {priceChanges.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-3">
                <div className="flex items-start gap-2.5 text-amber-800 dark:text-amber-300">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold">{dict.checkout.priceChangedNotice}</p>
                    {priceChanges.map((change) => (
                      <p key={change.line_id}>
                        {change.title}:{' '}
                        <span className="line-through text-slate-500">{formatBdt(change.old_unit_price, locale)}</span>{' '}
                        ➔ <strong className="text-amber-700 dark:text-amber-300 font-extrabold">{formatBdt(change.new_unit_price, locale)}</strong>
                      </p>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAcknowledgePrices}
                  disabled={isAcknowledging}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-colors"
                >
                  {isAcknowledging && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{dict.checkout.acknowledgePrice}</span>
                </button>
              </div>
            )}

            {/* Out of Stock Warning Banner (AC-4.4) */}
            {stockIssues.length > 0 && (
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-xs text-red-800 dark:text-red-300 space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
                  <div className="space-y-1">
                    <p className="font-bold">
                      {isBn ? 'স্টক অপ্রতুলতার কারণে অর্ডার সম্পন্ন করা যাচ্ছে না:' : 'Stock issue prevents order progression:'}
                    </p>
                    {stockIssues.map((issue) => (
                      <p key={issue.line_id}>
                        • <strong>{issue.title}</strong>: {issue.is_out_of_stock ? dict.checkout.outOfStockNotice : `${dict.checkout.insufficientStockNotice} (${issue.available_quantity})`}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* General Error Banner */}
            {generalError && (
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 dark:text-red-300">{generalError}</p>
              </div>
            )}

            {/* Success Ready Banner */}
            {successNotice && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">{successNotice}</p>
              </div>
            )}

            {/* Step 1: Customer Identity Form (No Account Required) */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <User className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {dict.checkout.customerInfo}
                  </h2>
                </div>
                <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900">
                  {dict.checkout.guestNotice}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {dict.checkout.firstName} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={isBn ? 'আপনার নাম লিখুন' : 'e.g. Sabbir'}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {dict.checkout.lastName}
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={isBn ? 'পদবী (ঐচ্ছিক)' : 'e.g. Ahmed'}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Mobile Phone Input with Validation (CHK-CHK-05) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {dict.checkout.phone} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    id="checkout-phone-input"
                    required
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value)
                      if (phoneError) setPhoneError(null)
                    }}
                    onBlur={handlePhoneBlur}
                    placeholder={dict.checkout.phonePlaceholder}
                    className={`w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border ${
                      phoneError
                        ? 'border-red-500 focus:ring-red-500 bg-red-50/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-emerald-500'
                    } focus:outline-none focus:ring-2`}
                  />
                </div>
                {phoneError ? (
                  <p id="phone-error-msg" className="mt-1 text-xs text-red-600 font-semibold">
                    {phoneError}
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] text-slate-400">
                    {dict.checkout.phoneHelp}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {dict.checkout.altPhone}
                </label>
                <input
                  type="tel"
                  value={altPhone}
                  onChange={(e) => setAltPhone(e.target.value)}
                  placeholder={dict.checkout.phonePlaceholder}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Step 2: 4-Tier Bangladesh Address Cascade */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {dict.checkout.deliveryAddress}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tier 1: Division */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {dict.checkout.division} <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="checkout-division-select"
                    required
                    value={selectedDivisionCode}
                    onChange={(e) => handleDivisionChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">{dict.checkout.selectDivision}</option>
                    {divisions.map((div) => (
                      <option key={div.code} value={div.code}>
                        {isBn ? div.name_bn : div.name_en}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tier 2: District (Triggers Dynamic Zone Rate) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {dict.checkout.district} <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="checkout-district-select"
                    required
                    disabled={!selectedDivisionCode}
                    value={selectedDistrictCode}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                  >
                    <option value="">{dict.checkout.selectDistrict}</option>
                    {availableDistricts.map((dist) => (
                      <option key={dist.code} value={dist.code}>
                        {isBn ? dist.name_bn : dist.name_en}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tier 3: Upazila / Thana */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {dict.checkout.thana} <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="checkout-thana-select"
                    required
                    disabled={!selectedDistrictCode}
                    value={selectedThanaCode}
                    onChange={(e) => handleThanaChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                  >
                    <option value="">{dict.checkout.selectThana}</option>
                    {availableThanas.map((thana) => (
                      <option key={thana.code} value={thana.code}>
                        {isBn ? thana.name_bn : thana.name_en}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Postal Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {dict.checkout.postalCode}
                  </label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="1216"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Tier 4: Area / Street Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {dict.checkout.streetAddress} <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder={dict.checkout.streetPlaceholder}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Active Delivery Zone Feedback */}
              {isResolvingShipping ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>{isBn ? 'ডেলিভারি চার্জ নির্ণয় করা হচ্ছে...' : 'Resolving delivery zone rates...'}</span>
                </div>
              ) : activeZone ? (
                <div id="checkout-zone-info" className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {isBn ? activeZone.name_bn : activeZone.name_en}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {isBn
                          ? `আনুমানিক ডেলিভারি সময়: ${activeZone.delivery_days_min}-${activeZone.delivery_days_max} কার্যদিবস`
                          : `Estimated Delivery: ${activeZone.delivery_days_min}-${activeZone.delivery_days_max} business days`}
                      </p>
                    </div>
                  </div>
                  <span className="font-extrabold text-sm text-emerald-700 dark:text-emerald-400">
                    {formatBdt(activeZone.amount, locale)}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Step 3: Payment Method Options */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                {dict.checkout.paymentMethod}
              </h2>

              <div className="space-y-3">
                {/* Cash on Delivery (always active in Phase 1) */}
                <label className={`flex items-start gap-3 p-4 rounded-xl border-2 ${paymentMethod === 'cod' ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'} cursor-pointer transition-all`}>
                  <input
                    type="radio"
                    name="payment_method"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-1 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {dict.checkout.cod}
                    </p>
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                      {dict.checkout.codNotice}
                    </p>
                  </div>
                </label>

                {/* bKash Direct Merchant Gateway (AC-7.1 & AC-7.4) */}
                {availableGateways.find((g) => g.code === 'bkash')?.is_enabled ? (
                  <label className={`flex items-start gap-3 p-4 rounded-xl border-2 ${paymentMethod === 'bkash' ? 'border-pink-500 bg-pink-50/20 dark:bg-pink-950/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'} cursor-pointer transition-all`}>
                    <input
                      type="radio"
                      name="payment_method"
                      checked={paymentMethod === 'bkash'}
                      onChange={() => setPaymentMethod('bkash')}
                      className="mt-1 text-pink-600 focus:ring-pink-500"
                    />
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {dict.checkout.bkash}
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400">
                          Instant
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {isBn ? 'সরাসরি বিকাশ গেটওয়ে দিয়ে পেমেন্ট করুন' : 'Direct bKash merchant gateway checkout'}
                      </p>
                    </div>
                  </label>
                ) : (
                  <div className="flex items-start gap-3 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 opacity-60">
                    <div className="mt-1 w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 flex-shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-slate-500">
                        {dict.checkout.bkash} ({isBn ? 'বর্তমানে অনুপলব্ধ' : 'Unavailable'})
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {isBn ? 'মার্চেন্ট গেটওয়ে কনফিগারেশন প্রক্রিয়াধীন (AC-7.4)' : 'Pending merchant gateway configuration (AC-7.4)'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Nagad DFS Merchant Gateway (AC-7.1 & AC-7.4) */}
                {availableGateways.find((g) => g.code === 'nagad')?.is_enabled ? (
                  <label className={`flex items-start gap-3 p-4 rounded-xl border-2 ${paymentMethod === 'nagad' ? 'border-orange-500 bg-orange-50/20 dark:bg-orange-950/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'} cursor-pointer transition-all`}>
                    <input
                      type="radio"
                      name="payment_method"
                      checked={paymentMethod === 'nagad'}
                      onChange={() => setPaymentMethod('nagad')}
                      className="mt-1 text-orange-600 focus:ring-orange-500"
                    />
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {dict.checkout.nagad}
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400">
                          Instant
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {isBn ? 'সরাসরি নগদ গেটওয়ে দিয়ে পেমেন্ট করুন' : 'Direct Nagad merchant gateway checkout'}
                      </p>
                    </div>
                  </label>
                ) : (
                  <div className="flex items-start gap-3 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 opacity-60">
                    <div className="mt-1 w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 flex-shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-slate-500">
                        {dict.checkout.nagad} ({isBn ? 'বর্তমানে অনুপলব্ধ' : 'Unavailable'})
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {isBn ? 'মার্চেন্ট গেটওয়ে কনফিগারেশন প্রক্রিয়াধীন (AC-7.4)' : 'Pending merchant gateway configuration (AC-7.4)'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Order Review & Dynamic Summary (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                {dict.checkout.orderReview}
              </h2>

              {/* Editable Line Items per PRD FR-4.3.4 */}
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {items.map((item) => {
                  const lineTotal = (item.unit_price || 0) * (item.quantity || 1)

                  return (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
                          {item.thumbnail ? (
                            <Image
                              src={item.thumbnail}
                              alt={item.title}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-400">
                              BD
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                            {item.title}
                          </h3>
                          {item.variant_title && (
                            <p className="text-[11px] text-slate-500">{item.variant_title}</p>
                          )}
                          <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatBdt(item.unit_price, locale)} × {item.quantity}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                          {formatBdt(lineTotal, locale)}
                        </span>

                        <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={isCartLoading}
                            className="p-1 hover:text-emerald-600 transition-colors disabled:opacity-50"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-[11px] font-bold text-slate-900 dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={isCartLoading}
                            className="p-1 hover:text-emerald-600 transition-colors disabled:opacity-50"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Dynamic Totals Breakdown */}
              <div className="space-y-3 text-sm divide-y divide-slate-100 dark:divide-slate-800 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 pt-1">
                  <span>{dict.cart.subtotal}</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {formatBdt(subtotal, locale)}
                  </span>
                </div>

                {/* Delivery Charge Line (CHK-CHK-06 separate line item) */}
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 pt-2 text-xs">
                  <div>
                    <span className="font-medium">{dict.cart.delivery}</span>
                    {activeZone && (
                      <span className="block text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        {isBn ? activeZone.name_bn : activeZone.name_en}
                      </span>
                    )}
                  </div>
                  <span id="checkout-delivery-fee" className="font-bold text-slate-900 dark:text-white text-sm">
                    {shippingTotal > 0 ? (
                      formatBdt(shippingTotal, locale)
                    ) : (
                      <span className="text-slate-400 font-normal text-xs">
                        {isBn ? 'জেলা নির্বাচন করুন' : 'Select district'}
                      </span>
                    )}
                  </span>
                </div>

                {/* Grand Total */}
                <div className="flex items-center justify-between pt-4 text-base font-extrabold text-slate-900 dark:text-white">
                  <span>{dict.cart.orderTotal}</span>
                  <span id="checkout-grand-total" className="text-xl sm:text-2xl text-emerald-600 dark:text-emerald-400">
                    {formatBdt(grandTotal, locale)}
                  </span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                id="checkout-confirm-btn"
                disabled={isSubmitting || isCartLoading || stockIssues.length > 0 || priceChanges.length > 0}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold text-sm shadow-md transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{dict.checkout.validating}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{dict.checkout.placeCodOrder}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}

export default function CheckoutPage(props: CheckoutPageProps) {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <CheckoutContent {...props} />
    </React.Suspense>
  )
}
