import { NextResponse } from 'next/server'
import { getMedusaGeoData } from '@/lib/medusa'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const divisionCode = searchParams.get('division_code') || undefined
  const districtCode = searchParams.get('district_code') || undefined

  try {
    const geo = await getMedusaGeoData(divisionCode, districtCode)
    return NextResponse.json(geo)
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch geo data' },
      { status: 500 }
    )
  }
}
