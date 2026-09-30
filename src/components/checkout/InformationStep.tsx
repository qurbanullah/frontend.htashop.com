import { useTranslation } from 'react-i18next'
import type { AddressData } from '@/api/addresses'
import { AddressFields } from '@/components/checkout/AddressFields'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { AddressFormValue } from '@/lib/address'
import { cn } from '@/lib/utils'

interface Props {
  email: string
  emailError?: string
  /** Guests must give an address so the confirmation can reach them. */
  requireEmail: boolean
  onEmailChange: (value: string) => void
  isAuthenticated: boolean
  savedAddresses: AddressData[]
  onSelectSavedAddress: (uuid: string) => void
  shipping: AddressFormValue
  onShippingChange: (value: AddressFormValue) => void
  shippingErrors: Record<string, string>
  disabled?: boolean
}

/** Step 1 — who the order is for and where it goes. */
export function InformationStep({
  email,
  emailError,
  requireEmail,
  onEmailChange,
  isAuthenticated,
  savedAddresses,
  onSelectSavedAddress,
  shipping,
  onShippingChange,
  shippingErrors,
  disabled = false,
}: Props) {
  const { t } = useTranslation()

  return (
    <div className="mt-5 space-y-6">
      <div className="space-y-1.5">
        <Label
          htmlFor="checkout-email"
          className="font-medium text-gray-700 text-sm dark:text-gray-300"
        >
          {t('checkout.email_label')}
          {requireEmail && (
            <span className="text-red-500" aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </Label>

        <Input
          id="checkout-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder={t('checkout.email_placeholder')}
          required={requireEmail}
          disabled={disabled}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? 'checkout-email-error' : 'checkout-email-help'}
          className={cn('h-10', emailError && 'border-red-500 focus-visible:ring-red-500')}
        />

        {emailError ? (
          <p id="checkout-email-error" className="text-red-600 text-xs dark:text-red-400">
            {emailError}
          </p>
        ) : (
          <p id="checkout-email-help" className="text-gray-500 text-xs dark:text-gray-400">
            {t('checkout.email_help')}
          </p>
        )}
      </div>

      {isAuthenticated && savedAddresses.length > 0 && (
        <div>
          <h3 className="mb-2 font-semibold text-gray-900 text-sm dark:text-white">
            {t('checkout.saved_addresses')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {savedAddresses.map((address) => (
              <button
                key={address.uuid}
                type="button"
                onClick={() => onSelectSavedAddress(address.uuid)}
                disabled={disabled}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-gray-600 text-sm transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
              >
                {address.label || `${address.city}, ${address.country?.name ?? ''}`}
              </button>
            ))}
          </div>
        </div>
      )}

      <AddressFields
        idPrefix="shipping"
        value={shipping}
        onChange={onShippingChange}
        title={t('checkout.shipping_address')}
        errors={shippingErrors}
        disabled={disabled}
      />
    </div>
  )
}
