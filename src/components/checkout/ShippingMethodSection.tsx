import { Check, Loader2, Truck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { CheckoutShippingOption } from '@/api/checkout'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

interface Props {
  options: CheckoutShippingOption[]
  selectedId: string | null
  currency: string
  loading?: boolean
  onSelect: (id: string) => void
}

function estimateLabel(
  option: CheckoutShippingOption,
  t: (key: string, opts?: Record<string, unknown>) => string
): string | null {
  if (option.estimated_days_min == null && option.estimated_days_max == null) return null

  if (
    option.estimated_days_min != null &&
    option.estimated_days_max != null &&
    option.estimated_days_min !== option.estimated_days_max
  ) {
    return t('checkout.delivery_days_range', {
      min: option.estimated_days_min,
      max: option.estimated_days_max,
    })
  }

  return t('checkout.delivery_days', {
    count: option.estimated_days_max ?? option.estimated_days_min,
  })
}

/**
 * Delivery method picker.
 *
 * The prices are whatever the API quoted for the destination; selecting one
 * only tells the server *which* option, never what it costs.
 */
export function ShippingMethodSection({
  options,
  selectedId,
  currency,
  loading = false,
  onSelect,
}: Props) {
  const { t } = useTranslation()

  if (!loading && options.length === 0) return null

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Truck className="h-4 w-4 text-gray-400" aria-hidden="true" />
        <h3 className="font-semibold text-gray-900 text-sm dark:text-white">
          {t('checkout.delivery_method')}
        </h3>
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />}
      </div>

      <div className="space-y-2">
        {options.map((option) => {
          const selected = option.id === selectedId
          const estimate = estimateLabel(option, t)

          return (
            <label
              key={option.id}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors',
                selected
                  ? 'border-blue-500 bg-blue-50/60 dark:border-blue-400 dark:bg-blue-900/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
              )}
            >
              <input
                type="radio"
                name="shipping_method"
                value={option.id}
                checked={selected}
                onChange={() => onSelect(option.id)}
                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
              />

              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="font-medium text-gray-900 text-sm dark:text-white">
                    {option.name}
                  </span>
                  {selected && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
                </span>
                {estimate && (
                  <span className="mt-0.5 block text-gray-500 text-xs dark:text-gray-400">
                    {estimate}
                  </span>
                )}
              </span>

              <span className="shrink-0 font-semibold text-gray-900 text-sm dark:text-white">
                {option.amount <= 0 ? t('summary.free') : formatMoney(option.amount, currency)}
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
