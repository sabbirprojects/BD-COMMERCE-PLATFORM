import type { Metadata } from 'next'
import { Inter, Hind_Siliguri } from 'next/font/google'
import { notFound } from 'next/navigation'
import { LOCALES, Locale } from '@/lib/i18n'
import { getStoreCategories } from '@/lib/medusa'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { CartProvider } from '@/context/CartContext'
import { MiniCart } from '@/components/cart/MiniCart'
import '../globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const hindSiliguri = Hind_Siliguri({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['bengali'],
  variable: '--font-bengali',
  display: 'swap',
})

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const isBn = locale === 'bn'

  return {
    title: {
      template: isBn ? '%s | বিডি কমার্স' : '%s | BD Commerce Platform',
      default: isBn
        ? 'বিডি কমার্স | বাংলাদেশের প্রিমিয়াম ই-কমার্স প্ল্যাটফর্ম'
        : 'BD Commerce Platform | Next-Gen Bangladeshi E-Commerce',
    },
    description: isBn
      ? 'হাতে তৈরি খাঁটি চামড়ার জুতা, টাঙ্গাইলের সুতি পাঞ্জাবি এবং ঘানিভাঙ্গা খাঁটি সরিষার তেল। ৬৪ জেলায় ক্যাশ অন ডেলিভারি।'
      : 'High-performance B2C e-commerce platform in Bangladesh. Fast nationwide Cash on Delivery across all 64 districts.',
    metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: '/en',
        bn: '/bn',
      },
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!LOCALES.includes(locale as Locale)) {
    notFound()
  }

  const typedLocale = locale as Locale
  const categories = await getStoreCategories()

  return (
    <div
      lang={typedLocale}
      className={`${inter.variable} ${hindSiliguri.variable} font-sans min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-emerald-500 selection:text-white`}
    >
      <CartProvider>
        <Navbar locale={typedLocale} categories={categories} />
        <main className="flex-1">{children}</main>
        <Footer locale={typedLocale} categories={categories} />
        <MiniCart locale={typedLocale} />
      </CartProvider>
    </div>
  )
}
