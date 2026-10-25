'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Truck, ShieldCheck, Banknote, Clock } from 'lucide-react'
import { Locale, getDictionary } from '@/lib/i18n'
import { StoreCategory } from '@/lib/medusa'

interface FooterProps {
  locale: Locale
  categories: StoreCategory[]
}

export function Footer({ locale, categories }: FooterProps) {
  const pathname = usePathname()
  if (pathname?.includes('/lp/')) {
    return null
  }

  const dict = getDictionary(locale)

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      {/* Bangladesh Trust Signals Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-b border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-base mb-1">{dict.home.trustCod}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{dict.home.trustCodDesc}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-base mb-1">{dict.home.trustDelivery}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{dict.home.trustDeliveryDesc}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-base mb-1">{dict.home.trustOriginal}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{dict.home.trustOriginalDesc}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-base mb-1">{dict.home.trustSupport}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{dict.home.trustSupportDesc}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-extrabold text-base">
                BD
              </div>
              <span className="font-bold text-xl text-white tracking-tight">BD Commerce</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {dict.footer.aboutText}
            </p>
            <div className="text-xs text-slate-400 space-y-1">
              <p>{dict.footer.supportPhone}</p>
              <p>{dict.footer.supportEmail}</p>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-4 uppercase tracking-wider">
              {dict.nav.categories}
            </h4>
            <ul className="space-y-2 text-xs">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/${locale}/categories/${cat.handle}`}
                    className="hover:text-emerald-400 transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-4 uppercase tracking-wider">
              {dict.footer.customerCare}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href={`/${locale}`} className="hover:text-emerald-400 transition-colors">
                  {dict.nav.trackOrder}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}`} className="hover:text-emerald-400 transition-colors">
                  {dict.footer.returnPolicy}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}`} className="hover:text-emerald-400 transition-colors">
                  {dict.footer.terms}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}`} className="hover:text-emerald-400 transition-colors">
                  {dict.footer.privacy}
                </Link>
              </li>
            </ul>
          </div>

          {/* Payment & Security */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-4 uppercase tracking-wider">
              {locale === 'bn' ? 'নিরাপদ পেমেন্ট' : 'Secure Payment'}
            </h4>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              {dict.footer.paymentMethods}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <div className="px-2.5 py-1 rounded bg-slate-800 text-[11px] font-semibold text-emerald-400 border border-slate-700">
                Cash on Delivery
              </div>
              <div className="px-2.5 py-1 rounded bg-slate-800 text-[11px] font-semibold text-pink-400 border border-slate-700">
                bKash
              </div>
              <div className="px-2.5 py-1 rounded bg-slate-800 text-[11px] font-semibold text-orange-400 border border-slate-700">
                Nagad
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} BD Commerce Platform. {dict.footer.allRightsReserved}</p>
      </div>
    </footer>
  )
}
