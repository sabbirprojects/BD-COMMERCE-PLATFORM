'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

declare global {
  interface Window {
    fbq?: any
    _fbq?: any
  }
}

/**
 * Centrally Managed Meta Pixel (D-21, PRD FR-5.3.1).
 * Queries operational_settings.meta_pixel_id. Per-page pixel IDs are forbidden.
 */
export function MetaPixel() {
  const [pixelId, setPixelId] = useState<string | null>(null)

  useEffect(() => {
    // Fetch centrally configured pixel ID
    fetch('/api/pixel')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.meta_pixel_id) {
          setPixelId(data.meta_pixel_id)
        }
      })
      .catch(() => {})
  }, [])

  if (!pixelId) return null

  return (
    <>
      <Script
        id="meta-pixel-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}

/**
 * Standard Meta Pixel event tracking helpers with event_id deduplication keys.
 */
export function trackMetaEvent(
  eventName: 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase',
  params?: Record<string, any>,
  eventId?: string
) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    const options = eventId ? { eventID: eventId } : undefined
    window.fbq('track', eventName, params || {}, options)
  }
}
