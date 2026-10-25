import { MetadataRoute } from 'next'
import { MEDUSA_BACKEND_URL, MEDUSA_PUBLISHABLE_KEY } from '@/lib/medusa'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/en`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/bn`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/en/track-order`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/bn/track-order`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ]

  const headers = {
    'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY,
  }

  // 1. Fetch published products
  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/store/products?limit=100`, {
      headers,
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      for (const prod of data.products || []) {
        if (prod.handle && prod.status === 'published') {
          routes.push({
            url: `${baseUrl}/en/products/${prod.handle}`,
            lastModified: prod.updated_at ? new Date(prod.updated_at) : new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
          })
          routes.push({
            url: `${baseUrl}/bn/products/${prod.handle}`,
            lastModified: prod.updated_at ? new Date(prod.updated_at) : new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
          })
        }
      }
    }
  } catch {}

  // 2. Fetch published landing pages (Unpublished pages omitted, CHK-UX-03)
  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/store/landing-pages`, {
      headers,
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      for (const lp of data.landing_pages || []) {
        if (lp.slug) {
          routes.push({
            url: `${baseUrl}/en/lp/${lp.slug}`,
            lastModified: lp.updated_at ? new Date(lp.updated_at) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
          })
          routes.push({
            url: `${baseUrl}/bn/lp/${lp.slug}`,
            lastModified: lp.updated_at ? new Date(lp.updated_at) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
          })
        }
      }
    }
  } catch {}

  // 3. Fetch published content/policy pages
  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/store/content/pages`, {
      headers,
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      for (const page of data.pages || []) {
        if (page.slug) {
          routes.push({
            url: `${baseUrl}/en/pages/${page.slug}`,
            lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
          })
          routes.push({
            url: `${baseUrl}/bn/pages/${page.slug}`,
            lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
          })
        }
      }
    }
  } catch {}

  return routes
}
