import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Locale } from '@/lib/i18n'
import { MEDUSA_BACKEND_URL, MEDUSA_PUBLISHABLE_KEY } from '@/lib/medusa'

export const dynamic = 'force-dynamic'

async function getContentPage(slug: string) {
  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/store/content/pages/${slug}`, {
      headers: {
        'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY,
      },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.page
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
  const page = await getContentPage(slug)
  if (!page) return { title: 'Not Found' }

  const isBn = locale === 'bn'
  const title = isBn ? page.seo_title_bn || page.title_bn || page.title_en : page.seo_title_en || page.title_en
  const desc = isBn
    ? page.seo_description_bn || page.excerpt_bn || 'বিডি কমার্স পলিসি ও বিবরণ।'
    : page.seo_description_en || page.excerpt_en || 'BD Commerce Platform policies and information.'

  return {
    title: `${title} | BD Commerce Platform`,
    description: desc,
    alternates: {
      canonical: page.canonical_url || `/${locale}/pages/${slug}`,
    },
  }
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: rawLocale, slug } = await params
  const locale = (rawLocale === 'bn' ? 'bn' : 'en') as Locale
  const isBn = locale === 'bn'

  const page = await getContentPage(slug)
  if (!page) {
    notFound()
  }

  const title = isBn ? page.title_bn || page.title_en : page.title_en
  const body = isBn ? page.body_bn || page.body_en : page.body_en

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-12 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
          {title}
        </h1>

        {page.published_at && (
          <div className="text-xs text-slate-400 mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
            {isBn ? 'সর্বশেষ হালনাগাদ:' : 'Last updated:'}{' '}
            {new Date(page.published_at).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        )}

        {body ? (
          <div
            className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed text-sm sm:text-base space-y-4"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        ) : (
          <p className="text-slate-500 italic">
            {isBn ? 'এই পৃষ্ঠার তথ্য শীঘ্রই প্রকাশিত হবে।' : 'Content for this page will be updated shortly.'}
          </p>
        )}
      </div>
    </div>
  )
}
