import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const MEDUSA_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'

export async function GET() {
  try {
    const res = await fetch(`${MEDUSA_URL}/admin/settings/gateways`, {
      cache: 'no-store',
    })

    if (!res.ok) {
      // Fallback: only COD enabled if backend gateway query fails
      return NextResponse.json({
        gateways: [
          { code: 'cod', is_enabled: true, is_configured: true },
          { code: 'bkash', is_enabled: false, is_configured: false },
          { code: 'nagad', is_enabled: false, is_configured: false },
        ],
      })
    }

    const data = await res.json()
    const gateways = (data.gateways || []).map((g: any) => ({
      code: g.code,
      display_name_en: g.display_name_en,
      display_name_bn: g.display_name_bn,
      is_enabled: Boolean(g.is_enabled && (g.is_configured || !g.requires_credentials)),
      requires_credentials: g.requires_credentials,
    }))

    return NextResponse.json({ gateways })
  } catch (err: any) {
    return NextResponse.json({
      gateways: [
        { code: 'cod', is_enabled: true, is_configured: true },
        { code: 'bkash', is_enabled: false, is_configured: false },
        { code: 'nagad', is_enabled: false, is_configured: false },
      ],
    })
  }
}
