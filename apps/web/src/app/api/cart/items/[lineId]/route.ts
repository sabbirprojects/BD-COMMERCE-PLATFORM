import { NextResponse, type NextRequest } from 'next/server'
import { updateLineItemService, removeLineItemService } from '@/lib/cart'

interface RouteContext {
  params: Promise<{ lineId: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { lineId } = await context.params
    const body = await request.json()
    const idempotencyKey =
      request.headers.get('x-idempotency-key') ||
      request.headers.get('X-Idempotency-Key') ||
      body.idempotencyKey ||
      `patch_${lineId}_${Date.now()}`

    const result = await updateLineItemService({
      lineId,
      quantity: body.quantity,
      idempotencyKey,
    })

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update line item' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { lineId } = await context.params
    const idempotencyKey =
      request.headers.get('x-idempotency-key') ||
      request.headers.get('X-Idempotency-Key') ||
      `del_${lineId}_${Date.now()}`

    const result = await removeLineItemService({
      lineId,
      idempotencyKey,
    })

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to remove line item' },
      { status: 500 }
    )
  }
}
