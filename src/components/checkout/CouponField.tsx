import { Check, Loader2, Tag, X } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export type CouponStatus = 'idle' | 'checking' | 'applied' | 'error'

interface Props {
  value: string
  onChange: (value: string) => void
  /** Commit the typed code now instead of waiting for the debounce. */
  onApply: () => void
  onRemove: () => void
  status: CouponStatus
  /** Already-translated status line; absent while the field is idle. */
  message?: string
  disabled?: boolean
}

/**
 * Discount-code entry.
 *
 * The code is validated by the API as it settles (see `useDebouncedValue`), so
 * the customer learns it is unusable before they reach the review step rather
 * than at the moment of placing the order.
 */
export function CouponField({
  value,
  onChange,
  onApply,
  onRemove,
  status,
  message,
  disabled = false,
}: Props) {
  const { t } = useTranslation()
  const inputId = useId()
  const statusId = `${inputId}-status`
  const applied = status === 'applied'

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        className="flex items-center gap-1.5 font-semibold text-gray-900 text-sm dark:text-white"
      >
        <Tag className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
        {t('checkout.coupon_label')}
      </label>

      <div className="flex gap-2">
        <Input
          id={inputId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              onApply()
            }
          }}
          placeholder={t('checkout.coupon_placeholder')}
          disabled={disabled || applied}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={status === 'error' ? true : undefined}
          aria-describedby={message ? statusId : undefined}
          className={cn(
            'font-mono uppercase tracking-wide',
            status === 'error' && 'border-red-500'
          )}
        />

        {applied ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onRemove}
            disabled={disabled}
            className="shrink-0"
          >
            <X aria-hidden="true" />
            {t('checkout.coupon_remove')}
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={onApply}
            disabled={disabled || status === 'checking' || value.trim() === ''}
            className="shrink-0"
          >
            {status === 'checking' && <Loader2 className="animate-spin" aria-hidden="true" />}
            {t('buttons.apply')}
          </Button>
        )}
      </div>

      {message && (
        <p
          id={statusId}
          role="status"
          className={cn(
            'flex items-center gap-1 text-xs',
            applied
              ? 'text-green-600 dark:text-green-400'
              : status === 'error'
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-500 dark:text-gray-400'
          )}
        >
          {applied && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
          {message}
        </p>
      )}
    </div>
  )
}
