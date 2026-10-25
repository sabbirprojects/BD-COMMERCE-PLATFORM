import Link from 'next/link'
import Image from 'next/image'
import { Locale, formatBdt, formatDiscount } from '@/lib/i18n'
import { StoreProduct, getVariantPricing } from '@/lib/medusa'

interface ProductCardProps {
  product: StoreProduct
  locale: Locale
  banglaTitle?: string | null
}

export function ProductCard({ product, locale, banglaTitle }: ProductCardProps) {
  // Determine pricing from primary/first variant
  const primaryVariant = product.variants?.[0]
  const { price, salePrice, hasSale, discountPercent } = getVariantPricing(primaryVariant)

  // Determine stock availability across all variants
  const isOutOfStock =
    product.variants?.every(
      (v) =>
        v.manage_inventory &&
        !v.allow_backorder &&
        (v.inventory_quantity ?? 0) <= 0
    ) ?? false

  // Pick title based on locale
  const displayTitle = locale === 'bn' && banglaTitle ? banglaTitle : product.title
  const categoryName = product.categories?.[0]?.name

  const imageUrl = product.thumbnail || product.images?.[0]?.url || null

  return (
    <Link
      href={`/${locale}/products/${product.handle}`}
      className="group flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-500/50 transition-all"
    >
      {/* Product Image Box */}
      <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={displayTitle}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
            <span className="text-2xl font-bold mb-1">BD</span>
            <span className="text-[11px] font-medium">No Image</span>
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 pointer-events-none">
          {hasSale && (
            <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-extrabold text-[10px] tracking-wide shadow-sm">
              {formatDiscount(discountPercent, locale)}
            </span>
          )}

          {isOutOfStock ? (
            <span className="ml-auto px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur text-white text-[10px] font-semibold">
              {locale === 'bn' ? 'স্টক শেষ' : 'Out of Stock'}
            </span>
          ) : (
            <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-600/90 backdrop-blur text-white text-[10px] font-semibold">
              {locale === 'bn' ? 'স্টকে আছে' : 'In Stock'}
            </span>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          {categoryName && (
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1 block">
              {categoryName}
            </span>
          )}

          {/* Title: Supports variable length Bengali typography without clipping on 360px screens */}
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
            {displayTitle}
          </h3>
        </div>

        {/* Price Section */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-baseline gap-2 flex-wrap">
          {hasSale && salePrice != null ? (
            <>
              <span className="text-base sm:text-lg font-bold text-red-600 dark:text-red-400">
                {formatBdt(salePrice, locale)}
              </span>
              <span className="text-xs text-slate-400 line-through">
                {formatBdt(price, locale)}
              </span>
            </>
          ) : (
            <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {formatBdt(price, locale)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
