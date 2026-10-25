'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Locale, formatBdt } from '@/lib/i18n'
import { StorefrontSearchHit } from '@/lib/meilisearch'

interface SearchProductCardProps {
  hit: StorefrontSearchHit
  locale: Locale
}

export function SearchProductCard({ hit, locale }: SearchProductCardProps) {
  const displayTitle = locale === 'bn' && hit.title_bn ? hit.title_bn : hit.title_en || hit.title
  const hasDiscount = hit.original_price_bdt > hit.price_bdt && hit.price_bdt > 0

  return (
    <Link
      href={`/${locale}/products/${hit.handle}`}
      className="group flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-500/50 transition-all"
    >
      {/* Product Image Box */}
      <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {hit.thumbnail ? (
          <Image
            src={hit.thumbnail}
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
          {hasDiscount && (
            <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-extrabold text-[10px] tracking-wide shadow-sm">
              SALE
            </span>
          )}

          {/* OOS is shown and clearly marked, not hidden by default (FR-4.1.2) */}
          {!hit.in_stock ? (
            <span
              data-testid="oos-badge"
              className="ml-auto px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold shadow-sm"
            >
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
          {hit.category_name && (
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1 block">
              {hit.category_name}
            </span>
          )}

          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
            {displayTitle}
          </h3>

          {hit.description_excerpt && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">
              {hit.description_excerpt}
            </p>
          )}
        </div>

        {/* Price Section */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-baseline gap-2 flex-wrap">
          {hasDiscount ? (
            <>
              <span className="text-base sm:text-lg font-bold text-red-600 dark:text-red-400">
                {formatBdt(hit.price_bdt, locale)}
              </span>
              <span className="text-xs text-slate-400 line-through">
                {formatBdt(hit.original_price_bdt, locale)}
              </span>
            </>
          ) : (
            <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {hit.price_bdt > 0 ? formatBdt(hit.price_bdt, locale) : 'BDT 0'}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
