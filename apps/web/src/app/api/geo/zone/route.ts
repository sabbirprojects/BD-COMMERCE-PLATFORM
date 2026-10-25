import { NextResponse } from 'next/server'
import { getMedusaDeliveryZone } from '@/lib/medusa'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const districtCode = searchParams.get('district_code')

  if (!districtCode) {
    return NextResponse.json(
      { error: "Query parameter 'district_code' is required" },
      { status: 400 }
    )
  }

  try {
    const zone = await getMedusaDeliveryZone(districtCode)
    if (!zone) {
      return NextResponse.json(
        { error: `No delivery zone found for district: ${districtCode}` },
        { status: 404 }
      )
    }
    return NextResponse.json({ district_code: districtCode, delivery_zone: zone })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to resolve delivery zone' },
      { status: 500 }
    )
  }
}
