import { NextResponse, type NextRequest } from 'next/server'
import { buyNowService } from '@/lib/cart'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const idempotencyKey =
      request.headers.get('x-idempotency-key') ||
      request.headers.get('X-Idempotency-Key') ||
      body.idempotencyKey ||
      `buynow_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    const result = await buyNowService({
      variantId: body.variantId || body.variant_id,
      locale: body.locale || 'en',
      idempotencyKey,
    })

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to process Buy Now' },
      { status: 500 }
    )
  }
}
