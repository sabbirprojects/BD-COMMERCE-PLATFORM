import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ChevronRight, Truck, ShieldCheck, Banknote } from 'lucide-react'
import { Locale, getDictionary, formatBdt } from '@/lib/i18n'
import {
  getStoreProductByHandle,
  getStoreProductLocalization,
  getVariantPricing,
} from '@/lib/medusa'
import { ProductGallery } from '@/components/product/ProductGallery'
import { VariantSelector } from '@/components/product/VariantSelector'
import { StickyMobileBar } from '@/components/product/StickyMobileBar'
import { ProductSpecs } from '@/components/product/ProductSpecs'

export const revalidate = 30

interface ProductPageProps {
  params: Promise<{
    locale: string
    handle: string
  }>
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { locale: rawLocale, handle } = await params
  const locale = (rawLocale === 'bn' ? 'bn' : 'en') as Locale

  const product = await getStoreProductByHandle(handle)
  if (!product) {
    return { title: 'Product Not Found' }
  }

  const localization = await getStoreProductLocalization(product.id)
  const isBn = locale === 'bn'

  const title =
    isBn && localization?.translation_bn?.title
      ? `${localization.translation_bn.title} | বিডি কমার্স`
      : `${product.title} | BD Commerce Platform`

  const description =
    isBn && localization?.localization?.meta_description_bn
      ? localization.localization.meta_description_bn
      : product.description || `Buy ${product.title} online in Bangladesh.`

  const ogImage = product.thumbnail || product.images?.[0]?.url || undefined

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/products/${handle}`,
      languages: {
        en: `/en/products/${handle}`,
        bn: `/bn/products/${handle}`,
      },
    },
    openGraph: {
      title,
      description,
      images: ogImage ? [{ url: ogImage, width: 800, height: 800, alt: title }] : [],
    },
  }
}

export default async function ProductDetailsPage({ params }: ProductPageProps) {
  const { locale: rawLocale, handle } = await params
  const locale = (rawLocale === 'bn' ? 'bn' : 'en') as Locale
  const dict = getDictionary(locale)

  // Fetch product from Store API
  const product = await getStoreProductByHandle(handle)
  if (!product) {
    notFound()
  }

  // Fetch customer-facing Bangladesh localization and attributes
  const localization = await getStoreProductLocalization(product.id)

  const isBn = locale === 'bn'
  const displayTitle =
    isBn && localization?.translation_bn?.title
      ? localization.translation_bn.title
      : product.title

  const displayDescription =
    isBn && localization?.translation_bn?.description
      ? localization.translation_bn.description
      : product.description

  const category = product.categories?.[0]
  const brand = localization?.brand

  // Pricing & Stock on default variant for initial rendering
  const primaryVariant = product.variants?.[0]
  const { price, salePrice, hasSale } = getVariantPricing(primaryVariant)
  const payablePrice = hasSale && salePrice != null ? salePrice : price

  const isOutOfStock =
    primaryVariant?.manage_inventory &&
    !primaryVariant?.allow_backorder &&
    (primaryVariant?.inventory_quantity ?? 0) <= 0

  // JSON-LD Structured Data (Product Schema)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: displayTitle,
    image: product.thumbnail || product.images?.[0]?.url,
    description: displayDescription || product.title,
    sku: primaryVariant?.sku || product.handle,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'BDT',
      price: payablePrice,
      availability: isOutOfStock
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
    ...(brand && {
      brand: {
        '@type': 'Brand',
        name: isBn && brand.name_bn ? brand.name_bn : brand.name_en,
      },
    }),
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Product JSON-LD Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 overflow-x-auto no-scrollbar">
        <Link href={`/${locale}`} className="hover:text-emerald-600 transition-colors whitespace-nowrap">
          {dict.nav.home}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
        {category ? (
          <>
            <Link
              href={`/${locale}/categories/${category.handle}`}
              className="hover:text-emerald-600 transition-colors whitespace-nowrap"
            >
              {category.name}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
          </>
        ) : null}
        <span className="font-semibold text-slate-900 dark:text-white truncate">
          {displayTitle}
        </span>
      </nav>

      {/* Main PDP Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Image Gallery (5 Cols) */}
        <div className="lg:col-span-5">
          <ProductGallery
            images={product.images}
            thumbnail={product.thumbnail}
            title={displayTitle}
          />
        </div>

        {/* Right Column: Information, Pricing, Variants & Actions (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Brand & Category Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            {brand && (
              <span className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                {isBn && brand.name_bn ? brand.name_bn : brand.name_en}
              </span>
            )}
            {category && (
              <Link
                href={`/${locale}/categories/${category.handle}`}
                className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 text-xs font-semibold transition-colors"
              >
                {category.name}
              </Link>
            )}
          </div>

          {/* Exactly ONE H1 per page (CHK-UX-03) */}
          {/* Unicode Typography Stability: Tested for 360px viewport width without text clipping */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight break-words">
            {displayTitle}
          </h1>

          {/* Subtitle / Excerpt */}
          {(localization?.localization?.description_excerpt_bn || product.subtitle) && (
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {isBn && localization?.localization?.description_excerpt_bn
                ? localization.localization.description_excerpt_bn
                : product.subtitle}
            </p>
          )}

          {/* Interactive Variant Selection & Dynamic Pricing */}
          <VariantSelector
            product={product}
            locale={locale}
          />

          {/* Delivery Estimate Box (Calculated at checkout — NOT hardcoded ৳60) */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Truck className="w-4 h-4 text-emerald-600" />
              <span>{dict.pdp.deliveryEstimate}</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {dict.pdp.deliveryNote}
            </p>
            <div className="flex items-center gap-4 pt-1 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                {dict.home.trustCod}
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {dict.home.trustOriginal}
              </span>
            </div>
          </div>

          {/* Product Description */}
          {displayDescription && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2">
                {dict.pdp.description}
              </h3>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {displayDescription}
              </div>
            </div>
          )}

          {/* Specifications, Category Attributes, Warranty & Returnability */}
          <ProductSpecs localization={localization} locale={locale} />
        </div>
      </div>

      {/* Sticky Mobile Action Bar (CHK-UX-01) */}
      <StickyMobileBar
        variant={primaryVariant}
        productTitle={displayTitle}
        thumbnail={product.thumbnail || product.images?.[0]?.url}
        locale={locale}
      />
    </div>
  )
}
