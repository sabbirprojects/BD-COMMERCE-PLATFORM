import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ChevronRight, Layers } from 'lucide-react'
import { Locale, getDictionary } from '@/lib/i18n'
import {
  getStoreCategoryByHandle,
  getStoreProducts,
  getStoreProductLocalization,
} from '@/lib/medusa'
import { ProductCard } from '@/components/product/ProductCard'

export const revalidate = 30

interface CategoryPageProps {
  params: Promise<{
    locale: string
    handle: string
  }>
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { locale: rawLocale, handle } = await params
  const locale = (rawLocale === 'bn' ? 'bn' : 'en') as Locale
  const category = await getStoreCategoryByHandle(handle)

  if (!category) {
    return { title: 'Category Not Found' }
  }

  const title =
    locale === 'bn'
      ? `${category.name} | বিডি কমার্স`
      : `${category.name} | BD Commerce Platform`

  return {
    title,
    description:
      category.description ||
      `Browse our curated collection of ${category.name} products with nationwide Cash on Delivery.`,
    alternates: {
      canonical: `/${locale}/categories/${handle}`,
      languages: {
        en: `/en/categories/${handle}`,
        bn: `/bn/categories/${handle}`,
      },
    },
    openGraph: {
      title,
      description: category.description || `Browse ${category.name}`,
    },
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { locale: rawLocale, handle } = await params
  const locale = (rawLocale === 'bn' ? 'bn' : 'en') as Locale
  const dict = getDictionary(locale)

  const category = await getStoreCategoryByHandle(handle)
  if (!category) {
    notFound()
  }

  // Fetch products under this category
  const { products } = await getStoreProducts({
    category_id: [category.id],
    limit: 50,
  })

  // Fetch Bangla titles for products if in Bangla locale
  const banglaTitlesMap = new Map<string, string>()
  if (locale === 'bn') {
    await Promise.all(
      products.map(async (prod) => {
        const loc = await getStoreProductLocalization(prod.id)
        if (loc?.translation_bn?.title) {
          banglaTitlesMap.set(prod.id, loc.translation_bn.title)
        }
      })
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
        <Link href={`/${locale}`} className="hover:text-emerald-600 transition-colors">
          {dict.nav.home}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/${locale}`} className="hover:text-emerald-600 transition-colors">
          {dict.nav.categories}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-900 dark:text-white truncate">
          {category.name}
        </span>
      </nav>

      {/* Category Header with Single H1 */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2 uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            <span>{dict.catalog.filterCategory}</span>
          </div>
          {/* Exactly ONE H1 tag per page */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {category.name}
          </h1>
          {category.description && (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              {category.description}
            </p>
          )}
        </div>
        <div className="text-xs text-slate-500 font-medium">
          {locale === 'bn' ? `${products.length} টি পণ্য পাওয়া গেছে` : `${products.length} products found`}
        </div>
      </div>

      {/* Category Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <Layers className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            {dict.catalog.noProducts}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {dict.catalog.noProductsDesc}
          </p>
          <div className="pt-2">
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
            >
              {dict.home.shopNow}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              locale={locale}
              banglaTitle={banglaTitlesMap.get(prod.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
