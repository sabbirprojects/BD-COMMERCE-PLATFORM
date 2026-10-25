'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingBag, ShieldCheck, Truck, AlertCircle, Trash2, CheckCircle2 } from 'lucide-react'
import { Locale, formatBdt } from '@/lib/i18n'
import { useCart } from '@/context/CartContext'
import { trackMetaEvent } from '@/components/analytics/MetaPixel'

interface CampaignOffer {
  id: string
  landing_page_id: string
  variant_id: string
  offer_price_paisa: number | null
  bundle_qty: number
  label_en: string | null
  label_bn: string | null
  starts_at: string | null
  ends_at: string | null
  is_active: boolean
  variant_title: string
  sku: string
  product_id: string
  product_title: string
  product_thumbnail: string | null
  available_stock: number
}

interface EmbeddedCheckoutProps {
  locale: Locale
  landingPageId: string
  campaignId?: string
  offers: CampaignOffer[]
}

export function EmbeddedCheckout({
  locale,
  landingPageId,
  campaignId,
  offers,
}: EmbeddedCheckoutProps) {
  const isBn = locale === 'bn'
  const router = useRouter()
  const { cart, addToCart, updateQuantity, removeItem, refreshCart } = useCart()

  // Selected campaign offer
  const [selectedOffer, setSelectedOffer] = useState<CampaignOffer | null>(offers[0] || null)

  // 4-Tier Geo State
  const [geoData, setGeoData] = useState<any>(null)
  const [divisionCode, setDivisionCode] = useState('BD-DHK')
  const [districtCode, setDistrictCode] = useState('BD-DHK-DHA')
  const [thanaCode, setThanaCode] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [streetAddress, setStreetAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bkash' | 'nagad'>('cod')

  // Shipping calculation
  const [deliveryCharge, setDeliveryCharge] = useState<number>(60)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Fetch Geo Master
  useEffect(() => {
    fetch('/api/geo')
      .then((r) => r.json())
      .then((data) => {
        setGeoData(data)
        const dhakaDiv = data.divisions?.find((d: any) => d.code === 'BD-DHK')
        if (dhakaDiv) {
          const dhakaDist = data.districts?.find((d: any) => d.code === 'BD-DHK-DHA')
          const thanas = data.thanas?.filter((t: any) => t.district_code === 'BD-DHK-DHA')
          if (thanas && thanas.length > 0) setThanaCode(thanas[0].code)
        }
      })
      .catch(() => {})
  }, [])

  // Auto-add selected campaign offer to cart if not already present
  useEffect(() => {
    if (!selectedOffer) return

    const existingLine = cart?.items?.find((item) => item.variant_id === selectedOffer.variant_id)
    if (!existingLine) {
      addToCart(selectedOffer.variant_id, selectedOffer.bundle_qty || 1)
    }
  }, [selectedOffer?.variant_id])

  // Recalculate delivery zone rate
  useEffect(() => {
    if (!districtCode) return
    fetch(`/api/geo/zone?district_code=${districtCode}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.zone) {
          setDeliveryCharge(Number(data.zone.rate || 60))
        }
      })
      .catch(() => {})
  }, [districtCode])

  const divisions = geoData?.divisions || []
  const filteredDistricts = geoData?.districts?.filter((d: any) => d.division_code === divisionCode) || []
  const filteredThanas = geoData?.thanas?.filter((t: any) => t.district_code === districtCode) || []

  // Check offer expiry (FR-5.2.5)
  const isOfferExpired = Boolean(selectedOffer?.ends_at && new Date(selectedOffer.ends_at) < new Date())

  // Cart subtotal from unified cart
  const cartSubtotal = (cart?.items || []).reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
  const totalAmount = cartSubtotal + deliveryCharge

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (isOfferExpired || selectedOffer?.is_active === false) {
      setErrorMessage(
        isBn
          ? 'এই ক্যাম্পেইন অফারটি মেয়াদোত্তীর্ণ বা বর্তমানে অনুপলব্ধ। অর্ডার করা সম্ভব নয়।'
          : 'This campaign offer has expired or is no longer active. Checkout blocked.'
      )
      return
    }

    if (!phone || !streetAddress || !thanaCode) {
      setErrorMessage(
        isBn
          ? 'অনুগ্রহ করে মোবাইল নম্বর, থানা এবং সম্পূর্ণ ঠিকানা দিন।'
          : 'Please provide mobile phone, thana, and full street address.'
      )
      return
    }

    setLoading(true)

    try {
      // Read UTM parameters from session or URL
      const searchParams = new URLSearchParams(window.location.search)
      const utmParams = {
        utm_source: searchParams.get('utm_source') || undefined,
        utm_medium: searchParams.get('utm_medium') || undefined,
        utm_campaign: searchParams.get('utm_campaign') || undefined,
        utm_content: searchParams.get('utm_content') || undefined,
        utm_term: searchParams.get('utm_term') || undefined,
      }

      // Generate unique idempotency key
      const idempotencyKey = `lp_chk_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

      const payload = {
        first_name: firstName || 'Customer',
        last_name: lastName || '',
        phone,
        division_code: divisionCode,
        district_code: districtCode,
        thana_code: thanaCode,
        street_address: streetAddress,
        utm_params: utmParams,
        landing_page_id: landingPageId,
        ad_campaign_id: campaignId || null,
        payment_method: paymentMethod,
        locale,
      }

      const res = await fetch('/api/checkout/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(isBn ? data.error_bn || data.error : data.error)
      }

      // Track Meta Pixel Purchase event with unique deduplication ID
      if (data.order?.id) {
        trackMetaEvent(
          'Purchase',
          {
            value: totalAmount,
            currency: 'BDT',
            order_id: data.order.id,
            landing_page_id: landingPageId,
          },
          data.order.id
        )
      }

      // Redirect to confirmation or payment gateway
      if (data.redirect_url) {
        window.location.href = data.redirect_url
      } else {
        router.push(`/${locale}/orders/${data.order.id}`)
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Checkout failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div id="embedded-checkout" className="max-w-4xl mx-auto my-12 p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800">
      <div className="text-center max-w-xl mx-auto mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-3 border border-emerald-300 dark:border-emerald-700/50">
          <ShieldCheck className="w-3.5 h-3.5" />
          {isBn ? 'ক্যাশ অন ডেলিভারি সুবিধা' : 'Cash on Delivery Available'}
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          {isBn ? 'অর্ডারটি কনফার্ম করতে ফর্মটি পূরণ করুন' : 'Complete Your Order Below'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
          {isBn
            ? 'পণ্য হাতে পেয়ে চেক করে সম্পূর্ণ মূল্য পরিশোধ করুন। সারা বাংলাদেশে ৩-৫ দিনে নিশ্চিত ডেলিভারি।'
            : 'Inspect parcel upon delivery before paying. Fast delivery across 64 districts.'}
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Offer Bundle Selection */}
      {offers.length > 1 && (
        <div className="mb-8">
          <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">
            {isBn ? 'পছন্দের প্যাকেজ নির্বাচন করুন:' : 'Select Your Package:'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {offers.map((offer) => {
              const isSelected = selectedOffer?.id === offer.id
              return (
                <button
                  type="button"
                  key={offer.id}
                  onClick={() => setSelectedOffer(offer)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {isBn ? offer.label_bn || offer.variant_title : offer.label_en || offer.variant_title}
                    </span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <div className="text-emerald-700 dark:text-emerald-400 font-extrabold text-base">
                    {offer.offer_price_paisa ? formatBdt(offer.offer_price_paisa / 100, locale) : 'Special Deal'}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Unified Cart Items Review (AC-5.1: Campaign Item PLUS Existing Cart Lines) */}
      <div className="mb-8 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-emerald-600" />
          <span>{isBn ? 'আপনার অর্ডারের বিবরণ (সম্মিলিত কার্ট)' : 'Your Order Review (Unified Cart)'}</span>
        </h3>

        <div className="divide-y divide-slate-200 dark:divide-slate-700/60">
          {(cart?.items || []).map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                  {item.title}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {formatBdt(item.unit_price, locale)} × {item.quantity}
                </div>
              </div>

              {/* Quantity Controls & Remove */}
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    className="px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    -
                  </button>
                  <span className="px-2.5 py-0.5 text-xs font-bold text-slate-800 dark:text-slate-100">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    +
                  </button>
                </div>

                <div className="font-bold text-sm text-slate-900 dark:text-white min-w-[70px] text-right">
                  {formatBdt(item.unit_price * item.quantity, locale)}
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  title="Remove item"
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Financial Summary */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>{isBn ? 'সাবটোটাল' : 'Subtotal'}</span>
            <span className="font-semibold">{formatBdt(cartSubtotal, locale)}</span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>{isBn ? 'ডেলিভারি চার্জ' : 'Delivery Charge'}</span>
            <span className="font-semibold">{formatBdt(deliveryCharge, locale)}</span>
          </div>
          <div className="flex justify-between text-base sm:text-lg font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
            <span>{isBn ? 'সর্বমোট' : 'Total Payable'}</span>
            <span className="text-emerald-600 dark:text-emerald-400">{formatBdt(totalAmount, locale)}</span>
          </div>
        </div>
      </div>

      {/* Checkout Form */}
      <form onSubmit={handleSubmitOrder} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              {isBn ? 'আপনার নাম *' : 'Full Name *'}
            </label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder={isBn ? 'যেমন: মোহাম্মদ রফিকুল ইসলাম' : 'e.g. Rafiqul Islam'}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              {isBn ? 'মোবাইল নম্বর (১১ ডিজিট) *' : 'Mobile Phone (11 digits) *'}
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="017XXXXXXXX"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-mono"
            />
          </div>
        </div>

        {/* 4-Tier Address Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              {isBn ? 'বিভাগ *' : 'Division *'}
            </label>
            <select
              value={divisionCode}
              onChange={(e) => {
                setDivisionCode(e.target.value)
                const dists = geoData?.districts?.filter((d: any) => d.division_code === e.target.value) || []
                if (dists.length > 0) {
                  setDistrictCode(dists[0].code)
                  const thanas = geoData?.thanas?.filter((t: any) => t.district_code === dists[0].code) || []
                  if (thanas.length > 0) setThanaCode(thanas[0].code)
                }
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {divisions.map((div: any) => (
                <option key={div.code} value={div.code}>
                  {isBn ? div.name_bn || div.name_en : div.name_en}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              {isBn ? 'জেলা *' : 'District *'}
            </label>
            <select
              value={districtCode}
              onChange={(e) => {
                setDistrictCode(e.target.value)
                const thanas = geoData?.thanas?.filter((t: any) => t.district_code === e.target.value) || []
                if (thanas.length > 0) setThanaCode(thanas[0].code)
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {filteredDistricts.map((dist: any) => (
                <option key={dist.code} value={dist.code}>
                  {isBn ? dist.name_bn || dist.name_en : dist.name_en}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              {isBn ? 'থানা / উপজেলা *' : 'Thana / Upazila *'}
            </label>
            <select
              value={thanaCode}
              onChange={(e) => setThanaCode(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {filteredThanas.map((th: any) => (
                <option key={th.code} value={th.code}>
                  {isBn ? th.name_bn || th.name_en : th.name_en}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
            {isBn ? 'সম্পূর্ণ ঠিকানা (বাসা/রোড/এলাকা) *' : 'Full Street Address *'}
          </label>
          <input
            type="text"
            required
            value={streetAddress}
            onChange={(e) => setStreetAddress(e.target.value)}
            placeholder={isBn ? 'বাড়ি নং, রোড নং, এলাকা...' : 'House #, Road #, Area details...'}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
          />
        </div>

        {/* Payment Method Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
            {isBn ? 'পেমেন্ট পদ্ধতি নির্বাচন করুন:' : 'Payment Method:'}
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('cod')}
              className={`p-3 rounded-xl border text-center transition-all ${
                paymentMethod === 'cod'
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 font-bold text-emerald-800 dark:text-emerald-300'
                  : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="text-sm font-bold">{isBn ? 'ক্যাশ অন ডেলিভারি' : 'Cash on Delivery'}</div>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('bkash')}
              className={`p-3 rounded-xl border text-center transition-all ${
                paymentMethod === 'bkash'
                  ? 'border-pink-600 bg-pink-50 dark:bg-pink-950/40 font-bold text-pink-700 dark:text-pink-300'
                  : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="text-sm font-bold">bKash</div>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('nagad')}
              className={`p-3 rounded-xl border text-center transition-all ${
                paymentMethod === 'nagad'
                  ? 'border-orange-600 bg-orange-50 dark:bg-orange-950/40 font-bold text-orange-700 dark:text-orange-300'
                  : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="text-sm font-bold">Nagad</div>
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || isOfferExpired}
          className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-black text-base shadow-xl shadow-emerald-600/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <span>{isBn ? 'প্রসেসিং হচ্ছে...' : 'Processing Order...'}</span>
          ) : (
            <>
              <Truck className="w-5 h-5" />
              <span>
                {isBn
                  ? `৳${totalAmount.toLocaleString('bn-BD')} — অর্ডার সম্পন্ন করুন`
                  : `Place Order — ৳${totalAmount.toLocaleString()}`}
              </span>
            </>
          )}
        </button>
      </form>
    </div>
  )
}
