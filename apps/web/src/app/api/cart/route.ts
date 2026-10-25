import { NextResponse, type NextRequest } from 'next/server'
import { getOrSetCart, addToCartService } from '@/lib/cart'

export async function GET() {
  try {
    const cart = await getOrSetCart()
    return NextResponse.json({ success: true, cart })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve cart' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const idempotencyKey =
      request.headers.get('x-idempotency-key') ||
      request.headers.get('X-Idempotency-Key') ||
      body.idempotencyKey ||
      `atc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    const result = await addToCartService({
      variantId: body.variantId || body.variant_id,
      quantity: body.quantity || body.qty || 1,
      idempotencyKey,
    })

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to add item to cart' },
      { status: 500 }
    )
  }
}
