import { NextResponse } from 'next/server'
import { MEDUSA_BACKEND_URL, MEDUSA_PUBLISHABLE_KEY } from '@/lib/medusa'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/store/pixel`, {
      headers: {
        'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY,
      },
      cache: 'no-store',
    })
    if (!res.ok) {
      return NextResponse.json({ meta_pixel_id: process.env.NEXT_PUBLIC_META_PIXEL_ID || null })
    }
    const data = await res.json()
    return NextResponse.json({
      meta_pixel_id: data.meta_pixel_id || process.env.NEXT_PUBLIC_META_PIXEL_ID || null,
    })
  } catch {
    return NextResponse.json({ meta_pixel_id: process.env.NEXT_PUBLIC_META_PIXEL_ID || null })
  }
}
