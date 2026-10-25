import Link from 'next/link'
import { ArrowRight, Sparkles, Layers, ShieldCheck, HeartHandshake } from 'lucide-react'
import { Locale, getDictionary } from '@/lib/i18n'
import { getStoreProducts, getStoreCategories, getStoreProductLocalization } from '@/lib/medusa'
import { ProductCard } from '@/components/product/ProductCard'

export const revalidate = 60

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale = (rawLocale === 'bn' ? 'bn' : 'en') as Locale
  const dict = getDictionary(locale)

  // Fetch real catalog data from Medusa
  const [{ products }, categories] = await Promise.all([
    getStoreProducts({ limit: 8 }),
    getStoreCategories(),
  ])

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

  // Filter root categories
  const rootCategories = categories.filter((c) => !c.parent_category_id)

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/60 via-slate-50/20 to-transparent dark:from-emerald-950/20 dark:via-slate-900/40 dark:to-transparent py-14 sm:py-20 border-b border-slate-200/60 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-6 border border-emerald-300 dark:border-emerald-700/50">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{dict.home.heroBadge}</span>
            </div>

            {/* Exactly ONE H1 tag per page (CHK-UX-03) */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
              {dict.home.heroTitle}{' '}
              <span className="text-emerald-600 dark:text-emerald-400 block sm:inline">
                {dict.home.heroHighlight}
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              {dict.home.heroSubtitle}
            </p>

            <div className="mt-8 flex items-center gap-4 flex-wrap">
              <a
                href="#featured-catalog"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 active:scale-95 transition-all"
              >
                <span>{dict.home.shopNow}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <Link
                href={`/${locale}/categories/panjabi`}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm transition-all"
              >
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>{locale === 'bn' ? 'পাঞ্জাবি কালেকশন' : 'Panjabi Collection'}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      {rootCategories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {dict.home.categoriesTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                {dict.home.categoriesSubtitle}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {rootCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/${locale}/categories/${cat.handle}`}
                className="group p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-md transition-all text-center flex flex-col items-center justify-center min-h-[110px]"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm mb-2 group-hover:scale-110 transition-transform">
                  {cat.name.slice(0, 2).toUpperCase()}
                </div>
                <h3 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                  {cat.name}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products Catalog Section */}
      <section id="featured-catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {dict.home.featuredTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {dict.home.featuredSubtitle}
            </p>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
              {dict.catalog.noProducts}
            </h3>
            <p className="text-xs text-slate-500 mt-1">{dict.catalog.noProductsDesc}</p>
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
      </section>

      {/* Minimal CMS / Promotional Campaign Banner Placeholder (Prompt 06 requirement) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-8 sm:p-12 relative overflow-hidden shadow-xl">
          <div className="max-w-xl relative z-10 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>{locale === 'bn' ? 'সরাসরি প্রস্তুতকারী থেকে' : 'Artisan Craftsmanship'}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {locale === 'bn'
                ? 'উৎসবের সেরা পোশাক ও খাঁটি পণ্যের সমাহার'
                : 'Festive Wear & Pure Essentials Handcrafted for You'}
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
              {locale === 'bn'
                ? 'আমাদের প্রতিটি পণ্য সরাসরি ঐতিহ্যবাহী তাঁতি ও কারিগরদের থেকে সংগৃহীত। দ্রুততম সময়ে ডেলিভারি পেতে আজই অর্ডার করুন।'
                : 'Directly sourced from Tangail weavers, Pabna mustard hubs, and artisan leather workshops across Bangladesh.'}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
