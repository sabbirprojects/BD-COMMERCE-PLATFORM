import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Locale } from '@/lib/i18n'
import { MEDUSA_BACKEND_URL, MEDUSA_PUBLISHABLE_KEY } from '@/lib/medusa'
import { EmbeddedCheckout } from '@/components/campaign/EmbeddedCheckout'
import { ShieldCheck, Truck, Sparkles, CheckCircle2, Star, ArrowDown } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getLandingPage(slug: string) {
  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/store/landing-pages/${slug}`, {
      headers: {
        'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY,
      },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.landing_page
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const page = await getLandingPage(slug)
  if (!page) return { title: 'Not Found' }

  const isBn = locale === 'bn'
  const title = isBn ? page.seo_title_bn || page.title_bn || page.title_en : page.seo_title_en || page.title_en
  const desc = isBn
    ? page.seo_description_bn || 'বাংলাদেশের সেরা প্রিমিয়াম অফার। ক্যাশ অন ডেলিভারি সুবিধা।'
    : page.seo_description_en || 'Exclusive campaign offer with nationwide Cash on Delivery across 64 districts.'

  return {
    title: `${title} | BD Commerce Campaign`,
    description: desc,
    alternates: {
      canonical: page.canonical_url || `/${locale}/lp/${slug}`,
    },
  }
}

export default async function CampaignLandingPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: rawLocale, slug } = await params
  const locale = (rawLocale === 'bn' ? 'bn' : 'en') as Locale
  const isBn = locale === 'bn'

  const page = await getLandingPage(slug)
  if (!page) {
    notFound()
  }

  const sections = Array.isArray(page.sections) ? page.sections : []
  const offers = Array.isArray(page.offers) ? page.offers : []

  // Extract hero section or default
  const heroSection = sections.find((s: any) => s.section_type === 'hero') || {
    headline: isBn ? page.title_bn || page.title_en : page.title_en,
    subheadline: isBn
      ? 'সীমিত সময়ের জন্য বিশেষ মূল্যছাড় ও ক্যাশ অন ডেলিভারি সুবিধা। স্টক সীমিত!'
      : 'Special promotional pricing for a limited time. Genuine quality with nationwide COD.',
  }

  const featuresSection = sections.find((s: any) => s.section_type === 'features_grid')
  const reviewsSection = sections.find((s: any) => s.section_type === 'reviews_carousel')

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Standalone Brand Strip (No distracting navbar/search/links, CHK-MKT-01) */}
      <header className="py-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-sm">
              BD
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
              {isBn ? 'বিডি কমার্স ক্যাম্পেইন' : 'BD Commerce Special'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isBn ? '১০০% অরিজিনাল পণ্য' : '100% Genuine Guaranteed'}</span>
          </div>
        </div>
      </header>

      {/* Hero Banner Section */}
      <section className="relative overflow-hidden py-12 sm:py-20 bg-gradient-to-b from-emerald-50/70 via-slate-50/20 to-transparent dark:from-emerald-950/25 dark:via-slate-900/40 dark:to-transparent border-b border-slate-200/60 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-6 border border-emerald-300 dark:border-emerald-700/50">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isBn ? 'স্পেশাল ডিসকাউন্ট অফার' : 'Limited Time Campaign Offer'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.2]">
            {heroSection.headline}
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {heroSection.subheadline}
          </p>

          <div className="mt-8">
            <a
              href="#embedded-checkout"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-xl shadow-emerald-600/30 active:scale-95 transition-all"
            >
              <span>{isBn ? 'এখনই অর্ডার করুন' : 'Order Now with COD'}</span>
              <ArrowDown className="w-4 h-4 animate-bounce" />
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      {featuresSection && Array.isArray(featuresSection.items) && (
        <section className="max-w-4xl mx-auto px-4 py-12">
          <h2 className="text-xl sm:text-2xl font-black text-center text-slate-900 dark:text-white mb-8">
            {isBn ? 'কেন এটি আপনার জন্য সেরা পছন্দ?' : 'Why Choose This Product?'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {featuresSection.items.map((item: any, idx: number) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 mb-3 font-bold">
                  ✓
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Customer Reviews */}
      {reviewsSection && Array.isArray(reviewsSection.reviews) && (
        <section className="max-w-4xl mx-auto px-4 py-8">
          <h2 className="text-xl sm:text-2xl font-black text-center text-slate-900 dark:text-white mb-6">
            {isBn ? 'গ্রাহকদের রিভিউ ও সন্তুষ্টি' : 'Customer Reviews & Feedback'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {reviewsSection.reviews.map((rev: any, idx: number) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center gap-1 text-amber-500 mb-2">
                  {[...Array(rev.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 italic mb-3">
                  "{rev.comment}"
                </p>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span>{rev.name}</span>
                  <span className="text-emerald-600 dark:text-emerald-400">✓ Verified Buyer</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Mode B Direct Embedded Checkout Block (AC-5.1) */}
      <section className="px-4 pb-16">
        <EmbeddedCheckout
          locale={locale}
          landingPageId={page.id}
          campaignId={page.ad_campaign_id}
          offers={offers}
        />
      </section>

      {/* Simple Standalone Footer */}
      <footer className="py-8 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-600" />
            <span>{isBn ? 'সারা বাংলাদেশে দ্রুত ক্যাশ অন ডেলিভারি' : 'Nationwide Fast Cash on Delivery'}</span>
          </div>
          <div>© {new Date().getFullYear()} BD Commerce Platform. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}
