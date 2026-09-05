import type { CatalogProduct } from '@/api/catalog'
import { ProductCard } from '@/components/catalog/ProductCard'

interface ProductGridProps {
  products: CatalogProduct[]
  isLoading?: boolean
  emptyLabel?: string
}

function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="aspect-[4/3] animate-pulse bg-gray-200 dark:bg-gray-800" />
      <div className="space-y-2 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-5 w-1/4 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-9 w-9 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    </div>
  )
}

/**
 * Responsive product grid — every card shares the same width in its row.
 */
export function ProductGrid({
  products,
  isLoading = false,
  emptyLabel = 'No products to show yet.',
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="product-grid">
        {Array.from({ length: 10 }, (_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholder
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <p className="rounded-2xl border-2 border-gray-200 border-dashed py-12 text-center text-gray-500 text-sm dark:border-gray-800 dark:text-gray-400">
        {emptyLabel}
      </p>
    )
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
