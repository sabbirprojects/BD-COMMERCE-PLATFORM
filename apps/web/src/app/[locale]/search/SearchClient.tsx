'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Filter, X, ArrowUpDown, ChevronDown, Check } from 'lucide-react'
import { Locale, getDictionary, formatBdt } from '@/lib/i18n'
import {
  searchStorefrontProducts,
  StorefrontSearchHit,
  StorefrontSearchResult,
} from '@/lib/meilisearch'
import { SearchProductCard } from '@/components/product/SearchProductCard'

interface SearchClientProps {
  locale: Locale
}

export function SearchClient({ locale }: SearchClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const qParam = searchParams.get('q') || ''
  const catParam = searchParams.get('category') || ''
  const inStockParam = searchParams.get('in_stock') === 'true'
  const minPriceParam = searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined
  const maxPriceParam = searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined
  const sortParam = (searchParams.get('sort') as any) || 'popularity'
  const pageParam = searchParams.get('page') ? Number(searchParams.get('page')) : 1

  const [searchTerm, setSearchTerm] = useState(qParam)
  const [selectedCategory, setSelectedCategory] = useState(catParam)
  const [inStockOnly, setInStockOnly] = useState(inStockParam)
  const [minPrice, setMinPrice] = useState<number | undefined>(minPriceParam)
  const [maxPrice, setMaxPrice] = useState<number | undefined>(maxPriceParam)
  const [sortBy, setSortBy] = useState<'popularity' | 'price_asc' | 'price_desc' | 'newest'>(sortParam)
  const [page, setPage] = useState(pageParam)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  // Dynamic attribute filters e.g. attribute_fabric_type
  const [dynamicFilters, setDynamicFilters] = useState<Record<string, string>>({})

  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<StorefrontSearchResult>({
    hits: [],
    totalHits: 0,
    totalPages: 1,
    page: 1,
    pageSize: 12,
    facetDistribution: {},
  })

  // Sync state with URL params
  useEffect(() => {
    setSearchTerm(qParam)
    setSelectedCategory(catParam)
    setInStockOnly(inStockParam)
    setMinPrice(minPriceParam)
    setMaxPrice(maxPriceParam)
    setSortBy(sortParam)
    setPage(pageParam)
  }, [qParam, catParam, inStockParam, minPriceParam, maxPriceParam, sortParam, pageParam])

  // Update URL helper
  const updateUrl = useCallback(
    (updates: {
      q?: string
      category?: string
      in_stock?: boolean
      min_price?: number
      max_price?: number
      sort?: string
      page?: number
    }) => {
      const params = new URLSearchParams()
      const newQ = updates.q !== undefined ? updates.q : searchTerm
      const newCat = updates.category !== undefined ? updates.category : selectedCategory
      const newInStock = updates.in_stock !== undefined ? updates.in_stock : inStockOnly
      const newMin = updates.min_price !== undefined ? updates.min_price : minPrice
      const newMax = updates.max_price !== undefined ? updates.max_price : maxPrice
      const newSort = updates.sort !== undefined ? updates.sort : sortBy
      const newPage = updates.page !== undefined ? updates.page : page

      if (newQ) params.set('q', newQ)
      if (newCat) params.set('category', newCat)
      if (newInStock) params.set('in_stock', 'true')
      if (newMin) params.set('min_price', String(newMin))
      if (newMax) params.set('max_price', String(newMax))
      if (newSort && newSort !== 'popularity') params.set('sort', newSort)
      if (newPage && newPage > 1) params.set('page', String(newPage))

      router.push(`/${locale}/search?${params.toString()}`)
    },
    [router, locale, searchTerm, selectedCategory, inStockOnly, minPrice, maxPrice, sortBy, page]
  )

  // Fetch search results from Meilisearch using search-only key
  useEffect(() => {
    let active = true
    setLoading(true)

    searchStorefrontProducts({
      query: qParam,
      categoryHandle: catParam || undefined,
      inStockOnly: inStockParam,
      minPrice: minPriceParam,
      maxPrice: maxPriceParam,
      sortBy: sortParam,
      dynamicFilters,
      page: pageParam,
      pageSize: 12,
    })
      .then((res) => {
        if (active) {
          setResult(res)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (active) {
          console.error('[Search] Meilisearch query error:', err)
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [qParam, catParam, inStockParam, minPriceParam, maxPriceParam, sortParam, dynamicFilters, pageParam])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateUrl({ q: searchTerm.trim(), page: 1 })
  }

  const handleCategorySelect = (handle: string) => {
    const nextCat = selectedCategory === handle ? '' : handle
    setSelectedCategory(nextCat)
    updateUrl({ category: nextCat, page: 1 })
  }

  const handleInStockToggle = () => {
    const nextInStock = !inStockOnly
    setInStockOnly(nextInStock)
    updateUrl({ in_stock: nextInStock, page: 1 })
  }

  const handleDynamicFilterToggle = (key: string, val: string) => {
    setDynamicFilters((prev) => {
      const next = { ...prev }
      if (next[key] === val) {
        delete next[key]
      } else {
        next[key] = val
      }
      return next
    })
  }

  const handleSortChange = (newSort: any) => {
    setSortBy(newSort)
    updateUrl({ sort: newSort, page: 1 })
  }

  const clearAllFilters = () => {
    setSelectedCategory('')
    setInStockOnly(false)
    setMinPrice(undefined)
    setMaxPrice(undefined)
    setDynamicFilters({})
    updateUrl({ category: '', in_stock: false, min_price: undefined, max_price: undefined, page: 1 })
  }

  const hasActiveFilters =
    Boolean(selectedCategory) ||
    inStockOnly ||
    Boolean(minPrice) ||
    Boolean(maxPrice) ||
    Object.keys(dynamicFilters).length > 0

  // Category facets reflecting ONLY values that exist among listed products (FR-4.1.3)
  const categoryFacets = result.facetDistribution?.category_handle || {}
  const categoryNameMap = result.facetDistribution?.category_name || {}

  // Dynamic attributes facets
  const fabricFacets = result.facetDistribution?.attribute_fabric_type || {}
  const materialFacets = result.facetDistribution?.attribute_upper_material || {}

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Header & Input */}
      <div className="mb-8">
        <form onSubmit={handleSearchSubmit} className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              locale === 'bn'
                ? 'পণ্য খুঁজুন (যেমন: পাঞ্জাবি, sorishar tel, লোফার)...'
                : 'Search products (e.g. panjabi, mustard oil, loafers)...'
            }
            className="w-full pl-12 pr-28 py-3.5 text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white placeholder:text-slate-400"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl transition-colors shadow-sm"
          >
            {locale === 'bn' ? 'খুঁজুন' : 'Search'}
          </button>
        </form>

        {/* Query Summary & Results Count */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {qParam ? (
                <span>
                  {locale === 'bn' ? 'অনুসন্ধানের ফলাফল: ' : 'Search results for: '}
                  <span className="text-emerald-600 dark:text-emerald-400">"{qParam}"</span>
                </span>
              ) : (
                <span>{locale === 'bn' ? 'সকল পণ্য অনুসন্ধান' : 'Browse & Search Catalog'}</span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {locale === 'bn'
                ? `${result.totalHits} টি পণ্য পাওয়া গেছে`
                : `${result.totalHits} products found`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile Filter Toggle */}
            <button
              type="button"
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>{locale === 'bn' ? 'ফিল্টার' : 'Filters'}</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                {locale === 'bn' ? 'সাজান:' : 'Sort by:'}
              </span>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="popularity">
                  {locale === 'bn' ? 'জনপ্রিয়তা' : 'Most Popular'}
                </option>
                <option value="price_asc">
                  {locale === 'bn' ? 'মূল্য: কম থেকে বেশি' : 'Price: Low to High'}
                </option>
                <option value="price_desc">
                  {locale === 'bn' ? 'মূল্য: বেশি থেকে কম' : 'Price: High to Low'}
                </option>
                <option value="newest">
                  {locale === 'bn' ? 'নতুন পণ্য' : 'Newest First'}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout: Sidebar Facets + Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Facets Sidebar (Desktop & Mobile Drawer) */}
        <aside
          className={`lg:block ${
            mobileFilterOpen ? 'block' : 'hidden'
          } lg:col-span-1 bg-white dark:bg-slate-900 lg:bg-transparent rounded-2xl p-4 lg:p-0 border lg:border-none border-slate-200 dark:border-slate-800 space-y-6`}
        >
          <div className="flex items-center justify-between lg:hidden border-b border-slate-200 dark:border-slate-800 pb-3">
            <span className="font-bold text-slate-900 dark:text-white">
              {locale === 'bn' ? 'ফিল্টারসমূহ' : 'Filters'}
            </span>
            <button
              onClick={() => setMobileFilterOpen(false)}
              className="p-1 text-slate-500 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="w-full py-2 px-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>{locale === 'bn' ? 'সকল ফিল্টার মুছুন' : 'Clear all filters'}</span>
            </button>
          )}

          {/* Availability Filter (FR-4.1.2: OOS items shown by default, toggleable) */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-3">
              {locale === 'bn' ? 'স্টক প্রাপ্যতা' : 'Stock Availability'}
            </h3>
            <label className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={handleInStockToggle}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
              />
              <span>{locale === 'bn' ? 'শুধুমাত্র স্টকে থাকা পণ্য' : 'In-Stock Only'}</span>
            </label>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
              {locale === 'bn'
                ? '* স্টক শেষ হওয়া পণ্যসমূহ স্বাভাবিকভাবে তালিকায় চিহ্নিত থাকে।'
                : '* Out-of-stock items are marked clearly and shown by default.'}
            </p>
          </div>

          {/* Category Facets (FR-4.1.3: Reflect only existing values) */}
          {Object.keys(categoryFacets).length > 0 && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-3">
                {locale === 'bn' ? 'ক্যাটাগরি' : 'Categories'}
              </h3>
              <div className="space-y-1.5">
                {Object.entries(categoryFacets).map(([handle, count]) => {
                  const isSelected = selectedCategory === handle
                  return (
                    <button
                      key={handle}
                      onClick={() => handleCategorySelect(handle)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm text-left transition-colors ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="capitalize">{handle.replace('-', ' ')}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Dynamic Fabric Attribute Facets (FR-4.1.3) */}
          {Object.keys(fabricFacets).length > 0 && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-3">
                {locale === 'bn' ? 'কাপড়ের ধরন (Fabric)' : 'Fabric Type'}
              </h3>
              <div className="space-y-1.5">
                {Object.entries(fabricFacets).map(([fab, count]) => {
                  const isSelected = dynamicFilters['attribute_fabric_type'] === fab
                  return (
                    <button
                      key={fab}
                      onClick={() => handleDynamicFilterToggle('attribute_fabric_type', fab)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm text-left transition-colors ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="capitalize">{fab}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Dynamic Material Attribute Facets (FR-4.1.3) */}
          {Object.keys(materialFacets).length > 0 && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-3">
                {locale === 'bn' ? 'উপাদান (Material)' : 'Upper Material'}
              </h3>
              <div className="space-y-1.5">
                {Object.entries(materialFacets).map(([mat, count]) => {
                  const isSelected = dynamicFilters['attribute_upper_material'] === mat
                  return (
                    <button
                      key={mat}
                      onClick={() => handleDynamicFilterToggle('attribute_upper_material', mat)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm text-left transition-colors ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="capitalize">{mat}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </aside>

        {/* Product Grid Area */}
        <main className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-slate-100 dark:bg-slate-800 rounded-2xl aspect-square"
                />
              ))}
            </div>
          ) : result.hits.length > 0 ? (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                {result.hits.map((hit) => (
                  <SearchProductCard key={hit.id} hit={hit} locale={locale} />
                ))}
              </div>

              {/* Pagination */}
              {result.totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  {[...Array(result.totalPages)].map((_, idx) => {
                    const p = idx + 1
                    return (
                      <button
                        key={p}
                        onClick={() => updateUrl({ page: p })}
                        className={`w-9 h-9 rounded-xl font-medium text-sm flex items-center justify-center transition-colors ${
                          p === page
                            ? 'bg-emerald-600 text-white font-bold shadow-sm'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
              <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                {locale === 'bn' ? 'কোনো পণ্য পাওয়া যায়নি' : 'No matching products found'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                {locale === 'bn'
                  ? 'বানান পরীক্ষা করুন অথবা ভিন্ন কীওয়ার্ড ব্যবহার করে অনুসন্ধান করুন (যেমন: পাঞ্জাবি, সরিষার তেল, kurti)'
                  : 'Check your spelling or try broader search terms (e.g., panjabi, mustard oil, kurti)'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  {locale === 'bn' ? 'সকল ফিল্টার রিসেট করুন' : 'Reset all filters'}
                </button>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
