import { Package, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CatalogProduct } from '@/api/catalog'
import { paths } from '@/routes/paths'
import { useCartStore } from '@/stores/cart'

function priceInfo(product: CatalogProduct) {
  const price = Number(product.price)
  const sale = Number(product.sale_price)

  if (Number.isFinite(sale) && sale > 0 && sale < price) {
    return { display: sale, original: price }
  }

  return { display: price, original: null }
}

export function ProductCard({ product }: { product: CatalogProduct }) {
  const brand = product.brands?.[0]?.name
  const price = priceInfo(product)
  const addToCart = useCartStore((s) => s.addItem)
  const cartLoading = useCartStore((s) => s.isLoading)

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-shadow hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
      <Link to={`${paths.products}/${product.route_key}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-12 w-12 text-gray-300 dark:text-gray-600" />
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        {brand && (
          <p className="font-medium text-gray-400 text-xs uppercase tracking-wide">{brand}</p>
        )}
        <Link to={`${paths.products}/${product.route_key}`}>
          <h3 className="mt-1 line-clamp-2 font-semibold text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400">
            {product.name}
          </h3>
        </Link>
        {product.summary && (
          <p className="mt-1 line-clamp-2 text-gray-500 text-sm dark:text-gray-400">
            {product.summary}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-3 pt-3">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-gray-900 text-lg dark:text-white">
              ${Number.isFinite(price.display) ? price.display.toLocaleString() : '—'}
            </span>
            {price.original !== null && (
              <span className="text-gray-400 text-sm line-through">
                ${price.original.toLocaleString()}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => addToCart({ product_id: product.id, quantity: 1 })}
            disabled={cartLoading}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            aria-label="Add to cart"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
