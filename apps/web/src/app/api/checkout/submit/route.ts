import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import {
  saveCheckoutAddressService,
  validateCheckoutService,
  placeCodOrderService,
  initiateOnlinePaymentService,
} from '@/lib/cart'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  // 1. IP Rate Limiting (architecture.md §7.3: 5 req/min/IP for checkout)
  const clientIp = getClientIp(request)
  const rateLimit = await checkRateLimit(clientIp, 'checkout', 5, 60)

  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: 'Too many checkout attempts. Please try again in a minute.',
        error_bn: 'অতিরিক্ত চেকআউট চেষ্টার কারণে সাময়িকভাবে স্থগিত করা হয়েছে। অনুগ্রহ করে ১ মিনিট পর আবার চেষ্টা করুন।',
        retry_after: rateLimit.resetSeconds,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.resetSeconds),
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      }
    )
  }

  // 2. Idempotency Header
  const idempotencyKey = request.headers.get('x-idempotency-key') || undefined

  try {
    const body = await request.json()
    const {
      first_name,
      last_name,
      phone,
      alt_phone,
      division_code,
      district_code,
      thana_code,
      street_address,
      postal_code,
      utm_params,
      acknowledge_price_changes,
      payment_method = 'cod',
      locale = 'en',
    } = body

    // 3. Save and validate 4-tier address + phone number (CHK-CHK-05)
    const addressResult = await saveCheckoutAddressService({
      firstName: first_name || '',
      lastName: last_name || '',
      phone: phone || '',
      altPhone: alt_phone || undefined,
      divisionCode: division_code || '',
      districtCode: district_code || '',
      thanaCode: thana_code || '',
      streetAddress: street_address || '',
      postalCode: postal_code || undefined,
      utmParams: utm_params || undefined,
      idempotencyKey,
    })

    if (!addressResult.success) {
      return NextResponse.json(
        {
          error: addressResult.errorEn || 'Invalid address or phone number',
          error_bn: addressResult.errorBn || 'সঠিক ঠিকানা ও মোবাইল নম্বর দিন',
        },
        { status: 400 }
      )
    }

    // 4. Server-Side Price & Stock Integrity Check (CHK-CHK-07)
    const validationResult = await validateCheckoutService(Boolean(acknowledge_price_changes))

    if (!validationResult.valid) {
      if (validationResult.hasStockIssue) {
        return NextResponse.json(
          {
            error: 'One or more items in your cart have insufficient stock.',
            error_bn: 'আপনার কার্টের এক বা একাধিক পণ্যের পর্যাপ্ত স্টক নেই।',
            stock_issues: validationResult.stockIssues,
          },
          { status: 400 }
        )
      }

      if (validationResult.hasPriceChange) {
        return NextResponse.json(
          {
            error: 'Product price has changed. Please review and acknowledge updated price.',
            error_bn: 'পণ্যের মূল্য পরিবর্তিত হয়েছে। অনুগ্রহ করে পরিবর্তিত মূল্য নিশ্চিত করুন।',
            price_changes: validationResult.priceChanges,
            requires_acknowledgement: true,
          },
          { status: 400 }
        )
      }
    }

    // 5. Prompt 09: COD Order Placement
    if (payment_method === 'cod') {
      const codResult = await placeCodOrderService({ idempotencyKey })

      if (!codResult.success || !codResult.order) {
        return NextResponse.json(
          {
            error: codResult.error || 'Failed to place COD order.',
            error_bn: 'ক্যাশ অন ডেলিভারি অর্ডার সম্পন্ন করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।',
          },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        order: codResult.order,
        order_bd_details: codResult.order_bd_details,
        redirect_url: `/${locale}/orders/${codResult.order.id}`,
        message: 'Order placed successfully via Cash on Delivery.',
      })
    }

    // 6. Prompt 11: bKash / Nagad Online Payment Initiation (Zero-Orphan flow, CHK-PAY-04, FR-7.3.7)
    if (payment_method === 'bkash' || payment_method === 'nagad' || payment_method === 'pp_bkash' || payment_method === 'pp_nagad') {
      const providerCode = payment_method.replace(/^pp_/, '')
      const payResult = await initiateOnlinePaymentService({
        providerCode,
        idempotencyKey,
      })

      if (!payResult.success || !payResult.redirect_url) {
        return NextResponse.json(
          {
            error: payResult.error || `Payment initiation failed for ${providerCode}`,
            error_bn: payResult.error_bn || 'অনলাইন পেমেন্ট শুরু করা যায়নি। অনুগ্রহ করে ক্যাশ অন ডেলিভারি বেছে নিন।',
          },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        redirect_url: payResult.redirect_url,
        payment_id: payResult.payment_id,
        is_online_payment: true,
        message: 'Payment session initiated. Redirecting to secure gateway.',
      })
    }

    return NextResponse.json(
      {
        error: `Payment method ${payment_method} is not yet supported in this phase.`,
        error_bn: 'এই পেমেন্ট পদ্ধতিটি বর্তমানে উপলব্ধ নয়।',
      },
      { status: 400 }
    )
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error during checkout submission' },
      { status: 500 }
    )
  }
}
