import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // IP rate limiting: 10 req/min for tracking (architecture.md §7.3)
  const clientIp = getClientIp(request)
  const rateLimit = await checkRateLimit(clientIp, 'track', 10, 60)

  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: 'Too many tracking requests. Please try again shortly.',
        error_bn: 'অতিরিক্ত ট্র্যাকিং অনুরোধ। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
      },
      { status: 429 }
    )
  }

  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get('order_id')
  const phone = searchParams.get('phone')

  if (!orderId || !phone) {
    return NextResponse.json(
      {
        error: 'Both order_id and phone are required.',
        error_bn: 'অর্ডার নম্বর এবং মোবাইল নম্বর উভয়ই আবশ্যক।',
      },
      { status: 400 }
    )
  }

  try {
    const medusaBackendUrl = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
    const apiKey =
      process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
      'pk_e03efb8523c1542172c95fe34dc90955a3389f3ee3592faa16171966d4699096'

    const res = await fetch(
      `${medusaBackendUrl}/store/orders/track?order_id=${encodeURIComponent(
        orderId
      )}&phone=${encodeURIComponent(phone)}`,
      {
        headers: {
          'x-publishable-api-key': apiKey,
        },
        cache: 'no-store',
      }
    )

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    return NextResponse.json(
      {
        error: err.message || 'Failed to contact order tracking service',
      },
      { status: 500 }
    )
  }
}
