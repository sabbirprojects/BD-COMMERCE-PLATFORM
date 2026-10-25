'use client'

import { Suspense } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Locale, LOCALES } from '@/lib/i18n'

interface LanguageSwitcherProps {
  currentLocale: Locale
}

function LanguageSwitcherInner({ currentLocale }: LanguageSwitcherProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const switchLocale = (newLocale: Locale) => {
    if (newLocale === currentLocale) return

    // Replace the locale prefix in current path
    const segments = pathname.split('/')
    if (segments.length > 1 && LOCALES.includes(segments[1] as Locale)) {
      segments[1] = newLocale
    } else {
      segments.splice(1, 0, newLocale)
    }

    const newPath = segments.join('/') || `/${newLocale}`
    const queryString = searchParams.toString()
    const finalUrl = queryString ? `${newPath}?${queryString}` : newPath

    router.push(finalUrl)
  }

  return (
    <div className="inline-flex items-center rounded-lg bg-slate-100 p-1 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <button
        type="button"
        onClick={() => switchLocale('en')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
          currentLocale === 'en'
            ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm font-bold'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => switchLocale('bn')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
          currentLocale === 'bn'
            ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm font-bold'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
        aria-label="বাংলা ভাষায় পরিবর্তন করুন"
      >
        বাংলা
      </button>
    </div>
  )
}

export function LanguageSwitcher(props: LanguageSwitcherProps) {
  return (
    <Suspense
      fallback={
        <div className="inline-flex items-center rounded-lg bg-slate-100 p-1 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 opacity-60">
          <span className="px-2.5 py-1 text-xs font-semibold">EN</span>
          <span className="px-2.5 py-1 text-xs font-semibold">বাংলা</span>
        </div>
      }
    >
      <LanguageSwitcherInner {...props} />
    </Suspense>
  )
}
