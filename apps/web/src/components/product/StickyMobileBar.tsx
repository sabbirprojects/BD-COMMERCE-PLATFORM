'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Zap, AlertCircle, Loader2 } from 'lucide-react'
import { Locale, getDictionary, formatBdt } from '@/lib/i18n'
import { StoreVariant, getVariantPricing } from '@/lib/medusa'
import { useCart } from '@/context/CartContext'

interface StickyMobileBarProps {
  variant?: StoreVariant | null
  productTitle: string
  thumbnail?: string | null
  locale: Locale
}

export function StickyMobileBar({
  variant,
  productTitle,
  thumbnail,
  locale,
}: StickyMobileBarProps) {
  const dict = getDictionary(locale)
  const router = useRouter()
  const { addToCart, buyNow } = useCart()
  const [isVisible, setIsVisible] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [isBuying, setIsBuying] = useState(false)

  useEffect(() => {
    const targetElement = document.getElementById('pdp-main-cta')
    if (!targetElement) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // If main CTA is NOT intersecting (scrolled past), show sticky bar
        setIsVisible(!entry.isIntersecting)
      },
      { threshold: 0.1 }
    )

    observer.observe(targetElement)
    return () => observer.disconnect()
  }, [])

  if (!variant) return null

  const { price, salePrice, hasSale } = getVariantPricing(variant)
  const isOutOfStock =
    variant.manage_inventory &&
    !variant.allow_backorder &&
    (variant.inventory_quantity ?? 0) <= 0

  const handleAddToCart = async () => {
    if (isOutOfStock || isAdding) return
    setIsAdding(true)
    try {
      await addToCart(variant.id, 1)
    } finally {
      setIsAdding(false)
    }
  }

  const handleBuyNow = async () => {
    if (isOutOfStock || isBuying) return
    setIsBuying(true)
    try {
      const res = await buyNow(variant.id, locale)
      if (res.success && res.redirectUrl) {
        router.push(res.redirectUrl)
      }
    } finally {
      setIsBuying(false)
    }
  }

  return (
    <div
      id="pdp-sticky-bar"
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 shadow-2xl transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        {/* Left: Mini thumbnail + Price */}
        <div className="flex items-center gap-2.5 min-w-0">
          {thumbnail && (
            <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <Image
                src={thumbnail}
                alt={productTitle}
                fill
                sizes="44px"
                className="object-cover"
              />
            </div>
          )}
          <div className="min-w-0">
            <span className="text-xs font-semibold text-slate-900 dark:text-white truncate block max-w-[120px]">
              {variant.title}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatBdt(hasSale && salePrice != null ? salePrice : price, locale)}
              </span>
              {hasSale && salePrice != null && (
                <span className="text-[10px] text-slate-400 line-through">
                  {formatBdt(price, locale)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isOutOfStock ? (
            <button
              type="button"
              disabled
              className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed flex items-center gap-1.5"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{dict.catalog.outOfStock}</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={isAdding}
                onClick={handleAddToCart}
                className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 transition-colors flex items-center gap-1"
                aria-label={dict.pdp.addToCart}
              >
                {isAdding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShoppingCart className="w-4 h-4" />
                )}
                <span className="hidden xs:inline">{dict.pdp.addToCart}</span>
              </button>
              <button
                type="button"
                disabled={isBuying}
                onClick={handleBuyNow}
                className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all shadow-sm flex items-center gap-1"
              >
                {isBuying ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                )}
                <span>{dict.pdp.buyNow}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
