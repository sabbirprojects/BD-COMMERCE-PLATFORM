'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ShoppingCart, Zap, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Locale, getDictionary, formatBdt, formatDiscount } from '@/lib/i18n'
import { StoreProduct, StoreVariant, getVariantPricing } from '@/lib/medusa'
import { useCart } from '@/context/CartContext'

interface VariantSelectorProps {
  product: StoreProduct
  locale: Locale
  onVariantChange?: (variant: StoreVariant) => void
}

function VariantSelectorInner({ product, locale, onVariantChange }: VariantSelectorProps) {
  const dict = getDictionary(locale)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { addToCart, buyNow } = useCart()

  const [isAdding, setIsAdding] = useState(false)
  const [isBuying, setIsBuying] = useState(false)

  const variants = product.variants || []
  const initialVariantId = searchParams.get('variant') || variants[0]?.id

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    initialVariantId || ''
  )

  const selectedVariant =
    variants.find((v) => v.id === selectedVariantId) || variants[0]

  useEffect(() => {
    if (selectedVariant && onVariantChange) {
      onVariantChange(selectedVariant)
    }
  }, [selectedVariantId])

  const handleSelect = (variantId: string) => {
    setSelectedVariantId(variantId)
    const params = new URLSearchParams(searchParams.toString())
    params.set('variant', variantId)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  // Stock assessment on the selected variant
  const isOutOfStock =
    selectedVariant?.manage_inventory &&
    !selectedVariant?.allow_backorder &&
    (selectedVariant?.inventory_quantity ?? 0) <= 0

  const isLowStock =
    selectedVariant?.manage_inventory &&
    !selectedVariant?.allow_backorder &&
    (selectedVariant?.inventory_quantity ?? 0) > 0 &&
    (selectedVariant?.inventory_quantity ?? 0) <= 5

  const { price, salePrice, hasSale, discountPercent } = getVariantPricing(selectedVariant)

  const handleAddToCart = async () => {
    if (isOutOfStock || !selectedVariant || isAdding) return
    setIsAdding(true)
    try {
      await addToCart(selectedVariant.id, 1)
    } finally {
      setIsAdding(false)
    }
  }

  const handleBuyNow = async () => {
    if (isOutOfStock || !selectedVariant || isBuying) return
    setIsBuying(true)
    try {
      const res = await buyNow(selectedVariant.id, locale)
      if (res.success && res.redirectUrl) {
        router.push(res.redirectUrl)
      }
    } finally {
      setIsBuying(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Live Dynamic Price Display */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-4">
        <div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
            {locale === 'bn' ? 'বর্তমান মূল্য' : 'Current Price'}
          </span>
          <div className="flex items-baseline gap-3 flex-wrap">
            {hasSale && salePrice != null ? (
              <>
                <span className="text-2xl sm:text-3xl font-extrabold text-red-600 dark:text-red-400">
                  {formatBdt(salePrice, locale)}
                </span>
                <span className="text-base text-slate-400 line-through">
                  {formatBdt(price, locale)}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-extrabold text-xs">
                  {formatDiscount(discountPercent, locale)}
                </span>
              </>
            ) : (
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {formatBdt(price, locale)}
              </span>
            )}
          </div>
        </div>

        {/* Live Stock Badge */}
        <div>
          {isOutOfStock ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <AlertCircle className="w-3.5 h-3.5 text-red-500" />
              {dict.catalog.outOfStock}
            </span>
          ) : isLowStock ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              {dict.catalog.lowStock} ({selectedVariant.inventory_quantity})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              {dict.catalog.inStock}
            </span>
          )}
        </div>
      </div>

      {/* Variant Selection Chips */}
      {variants.length > 1 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
              {dict.pdp.selectVariant}:
            </span>
            <span className="text-slate-500 font-medium">
              {selectedVariant?.title} {selectedVariant?.sku ? `(${selectedVariant.sku})` : ''}
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {variants.map((v) => {
              const isSelected = v.id === selectedVariantId
              const vOutOfStock =
                v.manage_inventory &&
                !v.allow_backorder &&
                (v.inventory_quantity ?? 0) <= 0

              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleSelect(v.id)}
                  className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 border ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                  } ${vOutOfStock ? 'opacity-60' : ''}`}
                  aria-pressed={isSelected}
                >
                  <span>{v.title}</span>
                  {vOutOfStock && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {dict.catalog.outOfStock}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Action Buttons Section */}
      <div id="pdp-main-cta" className="flex flex-col sm:flex-row items-stretch gap-3 pt-2">
        <button
          type="button"
          disabled={isOutOfStock || isAdding}
          onClick={handleAddToCart}
          className={`min-h-[48px] flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm ${
            isOutOfStock
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white shadow-emerald-600/20'
          }`}
        >
          {isAdding ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ShoppingCart className="w-4 h-4" />
          )}
          <span>{dict.pdp.addToCart}</span>
        </button>

        <button
          type="button"
          disabled={isOutOfStock || isBuying}
          onClick={handleBuyNow}
          className={`min-h-[48px] flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm ${
            isOutOfStock
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-700'
              : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 active:scale-[0.99]'
          }`}
        >
          {isBuying ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
          )}
          <span>{dict.pdp.buyNow}</span>
        </button>
      </div>

      {isOutOfStock && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{dict.pdp.outOfStockWarning}</span>
        </div>
      )}
    </div>
  )
}

export function VariantSelector(props: VariantSelectorProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse">
          <div className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800" />
          <div className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800" />
        </div>
      }
    >
      <VariantSelectorInner {...props} />
    </Suspense>
  )
}
