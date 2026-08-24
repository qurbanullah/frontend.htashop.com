import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { CatalogProduct } from '@/api/catalog'
import { ProductCard } from '@/components/catalog/ProductCard'

interface ProductRailProps {
  products: CatalogProduct[]
  isLoading?: boolean
  emptyLabel?: string
}

function RailSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholder
          key={index}
          className="w-44 shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-white sm:w-52 md:w-56 dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="aspect-[4/3] animate-pulse bg-gray-200 dark:bg-gray-800" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            <div className="flex justify-between pt-2">
              <div className="h-5 w-1/4 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-9 w-9 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Amazon-style horizontal product carousel: equal-width cards that scroll
 * by page with prev/next arrows. Cards stretch to the tallest card in the rail.
 */
export function ProductRail({
  products,
  isLoading = false,
  emptyLabel = 'No products to show yet.',
}: ProductRailProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(true)

  const updateArrows = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 8)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
  }, [])

  useEffect(() => {
    updateArrows()
    window.addEventListener('resize', updateArrows)
    return () => window.removeEventListener('resize', updateArrows)
  }, [updateArrows, products.length])

  const scrollByPage = (direction: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    // Scroll roughly one viewport-width at a time (at least one card).
    const amount = Math.max(el.clientWidth * 0.85, 224)
    el.scrollBy({ left: direction * amount, behavior: 'smooth' })
  }

  if (isLoading) return <RailSkeleton />

  if (products.length === 0) {
    return (
      <p className="rounded-2xl border-2 border-gray-200 border-dashed py-12 text-center text-gray-500 text-sm dark:border-gray-800 dark:text-gray-400">
        {emptyLabel}
      </p>
    )
  }

  return (
    <div className="group/rail relative">
      <div
        ref={trackRef}
        onScroll={updateArrows}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto scroll-smooth px-4 sm:-mx-6 sm:px-6"
      >
        {products.map((product) => (
          <div key={product.id} className="flex w-44 shrink-0 snap-start sm:w-52 md:w-56">
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {canPrev && (
        <button
          type="button"
          onClick={() => scrollByPage(-1)}
          className="absolute top-1/2 left-0 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-700 shadow-lg transition-colors hover:bg-white hover:text-blue-600 dark:border-gray-700 dark:bg-gray-900/95 dark:text-gray-200 dark:hover:bg-gray-900 dark:hover:text-blue-400"
          aria-label="Scroll products left"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {canNext && (
        <button
          type="button"
          onClick={() => scrollByPage(1)}
          className="absolute top-1/2 right-0 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-700 shadow-lg transition-colors hover:bg-white hover:text-blue-600 dark:border-gray-700 dark:bg-gray-900/95 dark:text-gray-200 dark:hover:bg-gray-900 dark:hover:text-blue-400"
          aria-label="Scroll products right"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}
