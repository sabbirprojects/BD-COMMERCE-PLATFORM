import { Suspense } from 'react'
import { Metadata } from 'next'
import { Locale } from '@/lib/i18n'
import { SearchClient } from './SearchClient'

export const dynamic = 'force-dynamic'

interface SearchPageProps {
  params: Promise<{
    locale: Locale
  }>
}

export async function generateMetadata({ params }: SearchPageProps): Promise<Metadata> {
  const { locale } = await params
  const isBn = locale === 'bn'

  return {
    title: isBn ? 'পণ্য অনুসন্ধান | BD Commerce' : 'Search Products | BD Commerce',
    description: isBn
      ? 'আমাদের সংগ্রহে খাঁটি চামড়ার লোফার, সুতি পাঞ্জাবি এবং ঘানিভাঙ্গা সরিষার তেল খুঁজুন।'
      : 'Search our curated collection of authentic handcrafted footwear, cotton panjabis, and groceries.',
  }
}

export default async function SearchPage({ params }: SearchPageProps) {
  const { locale } = await params

  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
          <p className="mt-4 text-sm text-slate-500">Loading search catalog...</p>
        </div>
      }
    >
      <SearchClient locale={locale} />
    </Suspense>
  )
}
