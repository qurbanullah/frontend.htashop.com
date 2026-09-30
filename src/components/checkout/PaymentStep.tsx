import { useTranslation } from 'react-i18next'
import type { PaymentMethodOption } from '@/api/payments'
import { AddressFields } from '@/components/checkout/AddressFields'
import { CouponField, type CouponStatus } from '@/components/checkout/CouponField'
import { PaymentMethodSelector } from '@/components/checkout/PaymentMethodSelector'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { AddressFormValue } from '@/lib/address'
import { MAX_NOTES } from '@/lib/checkout-schema'
import { cn } from '@/lib/utils'

interface Props {
  billingSame: boolean
  onBillingSameChange: (value: boolean) => void
  billing: AddressFormValue
  onBillingChange: (value: AddressFormValue) => void
  billingErrors: Record<string, string>
  methods: PaymentMethodOption[]
  paymentMethod: string
  onPaymentMethodChange: (method: string) => void
  methodsLoading: boolean
  methodsError: boolean
  onMethodsRetry: () => void
  paymentError?: string
  couponCode: string
  onCouponCodeChange: (value: string) => void
  onCouponApply: () => void
  onCouponRemove: () => void
  couponStatus: CouponStatus
  couponMessage?: string
  notes: string
  onNotesChange: (value: string) => void
  notesError?: string
  disabled?: boolean
}

/** Step 2 — how the customer pays, and anything they want us to know. */
export function PaymentStep({
  billingSame,
  onBillingSameChange,
  billing,
  onBillingChange,
  billingErrors,
  methods,
  paymentMethod,
  onPaymentMethodChange,
  methodsLoading,
  methodsError,
  onMethodsRetry,
  paymentError,
  couponCode,
  onCouponCodeChange,
  onCouponApply,
  onCouponRemove,
  couponStatus,
  couponMessage,
  notes,
  onNotesChange,
  notesError,
  disabled = false,
}: Props) {
  const { t } = useTranslation()

  return (
    <div className="mt-5 space-y-6">
      <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={billingSame}
            onChange={(event) => onBillingSameChange(event.target.checked)}
            disabled={disabled}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="font-semibold text-gray-900 text-sm dark:text-white">
            {t('checkout.billing_same')}
          </span>
        </label>

        {!billingSame && (
          <div className="mt-5">
            <AddressFields
              idPrefix="billing"
              value={billing}
              onChange={onBillingChange}
              title={t('checkout.billing_address')}
              errors={billingErrors}
              disabled={disabled}
              showContact={false}
            />
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 font-semibold text-gray-900 text-sm dark:text-white">
          {t('checkout.payment_method')}
        </h3>
        {/* Focus target for "choose a payment method" — radios are not focusable
            containers, so the invalid state is announced from here. */}
        <div data-checkout-error tabIndex={-1} className="outline-none">
          <PaymentMethodSelector
            methods={methods}
            value={paymentMethod}
            onChange={onPaymentMethodChange}
            isLoading={methodsLoading}
            isError={methodsError}
            onRetry={onMethodsRetry}
            error={paymentError}
          />
        </div>
      </div>

      <CouponField
        value={couponCode}
        onChange={onCouponCodeChange}
        onApply={onCouponApply}
        onRemove={onCouponRemove}
        status={couponStatus}
        message={couponMessage}
        disabled={disabled}
      />

      <div className="space-y-1.5">
        <Label
          htmlFor="order-notes"
          className="font-semibold text-gray-900 text-sm dark:text-white"
        >
          {t('checkout.notes_label')}
        </Label>
        <Textarea
          id="order-notes"
          value={notes}
          maxLength={MAX_NOTES}
          onChange={(event) => onNotesChange(event.target.value)}
          rows={2}
          disabled={disabled}
          placeholder={t('checkout.notes_placeholder')}
          aria-invalid={notesError ? true : undefined}
          className={cn('resize-none', notesError && 'border-red-500')}
        />
        {notesError && <p className="text-red-600 text-xs dark:text-red-400">{notesError}</p>}
      </div>
    </div>
  )
}
