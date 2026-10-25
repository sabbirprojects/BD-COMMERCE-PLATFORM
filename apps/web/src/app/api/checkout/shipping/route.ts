import { NextResponse } from 'next/server'
import { applyShippingService } from '@/lib/cart'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const idempotencyKey = request.headers.get('x-idempotency-key') || undefined

  try {
    const body = await request.json()
    const { district_code } = body

    if (!district_code) {
      return NextResponse.json(
        { error: 'Field district_code is required' },
        { status: 400 }
      )
    }

    const result = await applyShippingService({
      districtCode: district_code,
      idempotencyKey,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to apply shipping' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      cart: result.cart,
      zone: result.zone,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
