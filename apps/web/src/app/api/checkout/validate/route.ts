import { NextResponse } from 'next/server'
import { validateCheckoutService } from '@/lib/cart'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    let acknowledge = false
    try {
      const body = await request.json()
      acknowledge = Boolean(body?.acknowledge_price_changes)
    } catch {
      // Empty body is acceptable
    }

    const result = await validateCheckoutService(acknowledge)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json(
      { valid: false, error: err.message || 'Validation failed' },
      { status: 500 }
    )
  }
}
