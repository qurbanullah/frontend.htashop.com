import { Banknote, CreditCard, Loader2, Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { PaymentMethodOption } from '@/api/payments'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  methods: PaymentMethodOption[]
  value: string
  onChange: (method: string) => void
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  /** Translated validation message. */
  error?: string
  idPrefix?: string
}

function iconFor(method: string, requiresRedirect: boolean) {
  if (method === 'cod') return Banknote
  return requiresRedirect ? CreditCard : Banknote
}

/**
 * Payment choice.
 *
 * The options come from `GET /payments/methods`, so enabling a gateway in the
 * API config makes it appear here with no frontend change. Cash on Delivery is
 * always among them — the API keeps it available even when every hosted gateway
 * is switched off — so this list is never empty.
 */
export function PaymentMethodSelector({
  methods,
  value,
  onChange,
  isLoading = false,
  isError = false,
  onRetry,
  error,
  idPrefix = 'payment',
}: Props) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-live="polite">
        <span className="sr-only">{t('checkout.payment_loading')}</span>
        {[0, 1].map((index) => (
          <div
            key={index}
            className="h-[76px] animate-pulse rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
          />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/30">
        <p className="font-medium text-red-900 text-sm dark:text-red-100">
          {t('checkout.payment_unavailable_title')}
        </p>
        <p className="mt-1 text-red-800 text-xs dark:text-red-200">
          {t('checkout.payment_unavailable_body')}
        </p>
        {onRetry && (
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onRetry}>
            {t('query_error.retry')}
          </Button>
        )}
      </div>
    )
  }

  return (
    <fieldset>
      <legend className="sr-only">{t('checkout.payment_method')}</legend>

      <div className="space-y-3">
        {methods.map((option) => {
          const selected = option.method === value
          const Icon = iconFor(option.method, option.requires_redirect)
          const inputId = `${idPrefix}-${option.method}`

          return (
            <div key={option.method}>
              <input
                type="radio"
                id={inputId}
                name={`${idPrefix}-method`}
                value={option.method}
                checked={selected}
                onChange={() => onChange(option.method)}
                className="peer sr-only"
              />
              <label
                htmlFor={inputId}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                  'peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2 dark:peer-focus-visible:ring-offset-gray-950',
                  selected
                    ? 'border-blue-600 bg-blue-50/60 dark:border-blue-500 dark:bg-blue-950/30'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700'
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                    selected
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 text-sm dark:text-white">
                      {option.label}
                    </span>
                    {selected && (
                      <span className="rounded-full bg-blue-600 px-2 py-0.5 font-medium text-[10px] text-white uppercase tracking-wide">
                        {t('checkout.selected')}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-gray-500 text-xs dark:text-gray-400">
                    {option.requires_redirect
                      ? t('checkout.payment_redirect_description', { gateway: option.label })
                      : t('checkout.cod_description')}
                  </span>
                </span>

                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    selected ? 'border-blue-600' : 'border-gray-300 dark:border-gray-600'
                  )}
                >
                  {selected && <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />}
                </span>
              </label>
            </div>
          )
        })}
      </div>

      {error && (
        <p className="mt-2 text-red-600 text-xs dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      <p className="mt-3 flex items-center gap-1.5 text-gray-400 text-xs dark:text-gray-500">
        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
        {t('checkout.payment_secure_note')}
      </p>
    </fieldset>
  )
}

/** Loading placeholder re-used by the page while the cart settles. */
export function PaymentMethodsSkeleton() {
  return (
    <div className="flex items-center gap-2 text-gray-400 text-sm">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
    </div>
  )
}
