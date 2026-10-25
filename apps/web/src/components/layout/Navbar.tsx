'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { ShoppingBag, Search, Menu, X, ShieldCheck } from 'lucide-react'
import { Locale, getDictionary } from '@/lib/i18n'
import { StoreCategory } from '@/lib/medusa'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { useCart } from '@/context/CartContext'

interface NavbarProps {
  locale: Locale
  categories: StoreCategory[]
}

export function Navbar({ locale, categories }: NavbarProps) {
  const pathname = usePathname()
  if (pathname?.includes('/lp/')) {
    return null
  }

  const dict = getDictionary(locale)
  const { itemCount, openDrawer } = useCart()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Top primary categories
  const featuredCategories = categories
    .filter((c) => !c.parent_category_id)
    .slice(0, 6)

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Top Banner Notice */}
      <div className="bg-emerald-600 text-white text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 inline" />
        <span>{dict.home.heroBadge}</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo */}
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2 flex-shrink-0 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
              BD
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight leading-tight">
                BD Commerce
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">
                {locale === 'bn' ? 'বিশ্বস্ত ই-কমার্স' : 'Authentic Platform'}
              </span>
            </div>
          </Link>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder={dict.nav.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all"
              />
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher currentLocale={locale} />

            {/* Live Shopping Cart Button */}
            <div className="relative">
              <button
                type="button"
                onClick={openDrawer}
                className="relative p-2 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label={dict.nav.cart}
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span
                    id="navbar-cart-badge"
                    className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm"
                  >
                    {locale === 'bn'
                      ? String(itemCount).replace(
                          /[0-9]/g,
                          (d) => ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'][Number(d)]
                        )
                      : itemCount}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-700 dark:text-slate-300 hover:text-emerald-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Desktop Category Navigation Bar */}
        <nav className="hidden md:flex items-center gap-6 py-2.5 border-t border-slate-100 dark:border-slate-800 text-sm overflow-x-auto no-scrollbar">
          <Link
            href={`/${locale}`}
            className="font-medium text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors whitespace-nowrap"
          >
            {dict.nav.home}
          </Link>
          {featuredCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/${locale}/categories/${cat.handle}`}
              className="font-medium text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors whitespace-nowrap"
            >
              {cat.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-4">
          {/* Mobile Search */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder={dict.nav.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-1">
            <Link
              href={`/${locale}`}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-900 dark:text-white hover:bg-emerald-50 dark:hover:bg-slate-800"
            >
              {dict.nav.home}
            </Link>
            <div className="pt-2 pb-1 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              {dict.nav.categories}
            </div>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/${locale}/categories/${cat.handle}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
