'use client'

import { useState } from 'react'
import Image from 'next/image'
import { StoreImage } from '@/lib/medusa'

interface ProductGalleryProps {
  images?: StoreImage[]
  thumbnail?: string | null
  title: string
}

export function ProductGallery({ images = [], thumbnail, title }: ProductGalleryProps) {
  // Aggregate distinct images
  const allImageUrls: string[] = []
  if (thumbnail) allImageUrls.push(thumbnail)
  images.forEach((img) => {
    if (img.url && !allImageUrls.includes(img.url)) {
      allImageUrls.push(img.url)
    }
  })

  const [selectedImage, setSelectedImage] = useState<string | null>(
    allImageUrls[0] || null
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Primary Main Image Frame */}
      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm">
        {selectedImage ? (
          <Image
            src={selectedImage}
            alt={title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-center transition-all duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <span className="text-4xl font-extrabold mb-2">BD</span>
            <span className="text-sm font-medium">No Product Image Available</span>
          </div>
        )}
      </div>

      {/* Thumbnails Row */}
      {allImageUrls.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
          {allImageUrls.map((url, idx) => {
            const isSelected = selectedImage === url
            return (
              <button
                key={url + idx}
                type="button"
                onClick={() => setSelectedImage(url)}
                className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                  isSelected
                    ? 'border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
                }`}
                aria-label={`View photo ${idx + 1}`}
              >
                <Image
                  src={url}
                  alt={`${title} thumbnail ${idx + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover object-center"
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
