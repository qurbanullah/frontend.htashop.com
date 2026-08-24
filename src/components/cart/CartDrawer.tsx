import { AnimatePresence, motion } from 'framer-motion'
import { Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { paths } from '@/routes/paths'
import { useCartStore } from '@/stores/cart'

function formatMoney(value: number, currency: string) {
  return `${currency} ${value.toLocaleString()}`
}

export function CartDrawer() {
  const navigate = useNavigate()
  const items = useCartStore((s) => s.items)
  const count = useCartStore((s) => s.count)
  const subtotal = useCartStore((s) => s.subtotal)
  const currency = useCartStore((s) => s.currency)
  const isOpen = useCartStore((s) => s.isDrawerOpen)
  const isLoading = useCartStore((s) => s.isLoading)
  const closeDrawer = useCartStore((s) => s.closeDrawer)
  const updateItem = useCartStore((s) => s.updateItem)
  const removeItem = useCartStore((s) => s.removeItem)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="cart-overlay"
          className="fixed inset-0 z-40 bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={closeDrawer}
        />
      )}

      {isOpen && (
        <motion.div
          key="cart-panel"
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl dark:bg-gray-900"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'tween', duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        >
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-gray-200 border-b px-5 dark:border-gray-800">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900 text-lg dark:text-white">
              <ShoppingCart className="h-5 w-5" />
              Your cart
              {count > 0 && <span className="font-normal text-gray-400 text-sm">({count})</span>}
            </h2>
            <button
              type="button"
              onClick={closeDrawer}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Close cart"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <ShoppingCart className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                <p className="mt-4 font-medium text-gray-900 dark:text-white">Your cart is empty</p>
                <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
                  Add products to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.uuid}
                    className="flex gap-4 rounded-xl border border-gray-100 p-3 dark:border-gray-800"
                  >
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ShoppingCart className="h-6 w-6 text-gray-300 dark:text-gray-600" />
                        </div>
                      )}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate font-medium text-gray-900 text-sm dark:text-white">
                            {item.name}
                          </h3>
                          {item.variant_name && (
                            <p className="truncate text-gray-500 text-xs dark:text-gray-400">
                              {item.variant_name}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.uuid)}
                          className="rounded p-1 text-gray-400 hover:text-red-500"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700">
                          <button
                            type="button"
                            onClick={() => updateItem(item.uuid, Math.max(1, item.quantity - 1))}
                            className="flex h-8 w-8 items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-8 text-center font-medium text-gray-900 text-sm dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateItem(item.uuid, item.quantity + 1)}
                            className="flex h-8 w-8 items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="text-right">
                          <div className="font-semibold text-gray-900 text-sm dark:text-white">
                            {formatMoney(
                              item.unit_price * item.quantity,
                              item.currency ?? currency
                            )}
                          </div>
                          {item.base_price && item.base_price > item.unit_price && (
                            <div className="text-gray-400 text-xs line-through">
                              {formatMoney(
                                item.base_price * item.quantity,
                                item.currency ?? currency
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-gray-200 border-t px-5 py-4 dark:border-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-gray-500 text-sm dark:text-gray-400">Subtotal</span>
                <span className="font-bold text-gray-900 text-lg dark:text-white">
                  {formatMoney(subtotal, currency)}
                </span>
              </div>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  closeDrawer()
                  navigate(paths.checkout)
                }}
                className="flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 font-semibold text-sm text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
              >
                {isLoading ? 'Updating…' : 'Proceed to checkout'}
              </button>
              <p className="mt-2 text-center text-gray-400 text-xs">
                Shipping and taxes calculated at checkout.
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
