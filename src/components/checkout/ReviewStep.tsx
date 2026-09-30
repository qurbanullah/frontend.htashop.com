import { useQuery } from '@tanstack/react-query'
import { Banknote, CreditCard, Mail, MapPin, Pencil, Receipt, Truck } from 'lucide-react'
import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import { countriesApi } from '@/api/countries'
import { type AddressFormValue, formatAddressLine } from '@/lib/address'
import type { CheckoutStep } from '@/lib/checkout-schema'

interface Props {
  email: string
  shipping: AddressFormValue
  billingSame: boolean
  billing: AddressFormValue
  paymentLabel: string
  paymentRequiresRedirect: boolean
  notes: string
  isAuthenticated: boolean
  onEdit: (step: CheckoutStep) => void
}

function Section({
  icon: Icon,
  title,
  onEdit,
  editLabel,
  children,
}: {
  icon: React.ElementType
  title: string
  onEdit?: () => void
  /** Defaults to the shared "Edit" label. */
  editLabel?: string
  children: React.ReactNode
}) {
  const { t } = useTranslation()

  return (
    <div className="flex gap-3 py-4 first:pt-0 last:pb-0">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-gray-900 text-sm dark:text-white">{title}</h3>
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="flex shrink-0 items-center gap-1 font-medium text-blue-600 text-xs hover:underline dark:text-blue-400"
            >
              <Pencil className="h-3 w-3" aria-hidden="true" />
              {editLabel ?? t('buttons.edit')}
            </button>
          )}
        </div>
        <div className="mt-1 text-gray-600 text-sm dark:text-gray-300">{children}</div>
      </div>
    </div>
  )
}

/**
 * Final review.
 *
 * A read-only recap before the irreversible action, so the customer checks the
 * delivery address and payment method rather than trusting that the previous
 * screens captured them.
 */
export function ReviewStep({
  email,
  shipping,
  billingSame,
  billing,
  paymentLabel,
  paymentRequiresRedirect,
  notes,
  isAuthenticated,
  onEdit,
}: Props) {
  const { t } = useTranslation()

  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: () => countriesApi.list(),
    staleTime: 24 * 60 * 60 * 1000,
  })

  const countryName = (countryId: number | null) =>
    countries.find((country) => country.id === countryId)?.name ?? ''

  const recipientLines = (address: AddressFormValue) =>
    [address.contact_name, address.phone].filter((part) => part?.trim())

  const PaymentIcon = paymentRequiresRedirect ? CreditCard : Banknote

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      <Section
        icon={Mail}
        title={t('checkout.contact_title')}
        onEdit={() => onEdit('information')}
        editLabel={t('buttons.edit')}
      >
        {isAuthenticated && !email ? (
          <p>{t('checkout.review_account_email')}</p>
        ) : (
          <p className="break-all">{email || t('checkout.not_provided')}</p>
        )}
      </Section>

      <Section
        icon={Truck}
        title={t('checkout.shipping_address')}
        onEdit={() => onEdit('information')}
        editLabel={t('buttons.edit')}
      >
        {recipientLines(shipping).map((line) => (
          <p key={line}>{line}</p>
        ))}
        <p>{formatAddressLine(shipping)}</p>
        <p>{countryName(shipping.country_id)}</p>
      </Section>

      <Section
        icon={MapPin}
        title={t('checkout.billing_address')}
        onEdit={() => onEdit('payment')}
        editLabel={t('buttons.edit')}
      >
        {billingSame ? (
          <p>{t('checkout.review_billing_same')}</p>
        ) : (
          <>
            <p>{formatAddressLine(billing)}</p>
            <p>{countryName(billing.country_id)}</p>
          </>
        )}
      </Section>

      <Section
        icon={PaymentIcon}
        title={t('checkout.payment_method')}
        onEdit={() => onEdit('payment')}
        editLabel={t('buttons.edit')}
      >
        <p className="font-medium text-gray-900 dark:text-white">{paymentLabel}</p>
        {paymentRequiresRedirect && (
          <p className="mt-0.5 text-gray-500 text-xs dark:text-gray-400">
            {t('checkout.review_redirect_notice')}
          </p>
        )}
      </Section>

      {notes.trim() !== '' && (
        <Section icon={Receipt} title={t('checkout.notes_label')}>
          <p className="whitespace-pre-line">{notes}</p>
        </Section>
      )}
    </div>
  )
}
