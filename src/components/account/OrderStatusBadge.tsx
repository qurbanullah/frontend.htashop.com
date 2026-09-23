import { useTranslation } from 'react-i18next'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  processing: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  shipped: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  refunded: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

const DEFAULT_STYLE = 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'

/** Statuses with a translated label; anything else falls back to the raw value. */
const TRANSLATED_STATUSES = new Set([
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
])

/**
 * Order status pill — shared by the orders list and the account overview so the
 * colour map and labels live in exactly one place.
 */
export function OrderStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation()

  const label = TRANSLATED_STATUSES.has(status)
    ? t(`account.status.${status}`)
    : status.charAt(0).toUpperCase() + status.slice(1)

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-xs ${STATUS_STYLES[status] ?? DEFAULT_STYLE}`}
    >
      {label}
    </span>
  )
}
