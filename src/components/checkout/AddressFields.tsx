import { useTranslation } from 'react-i18next'
import { CityField } from '@/components/checkout/CityField'
import { CountrySelect } from '@/components/checkout/CountrySelect'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type AddressFormValue, EMPTY_ADDRESS } from '@/lib/address'
import { cn } from '@/lib/utils'

// Re-exported so existing import sites keep working; the canonical definition
// lives in `@/lib/address` so non-React code can depend on the shape.
export type { AddressFormValue }
export { EMPTY_ADDRESS }

interface Props {
  value: AddressFormValue
  onChange: (value: AddressFormValue) => void
  title?: string
  /**
   * Namespaces DOM ids and error lookups. Two address groups on one page
   * (shipping and billing) must not mint duplicate `id`s, or their labels point
   * at the wrong input.
   */
  idPrefix: string
  /** Messages keyed by field name, already translated. */
  errors?: Record<string, string>
  disabled?: boolean
  /** Billing drops the recipient name/phone — the invoice is addressed to the buyer. */
  showContact?: boolean
}

export function AddressFields({
  value,
  onChange,
  title,
  idPrefix,
  errors = {},
  disabled = false,
  showContact = true,
}: Props) {
  const { t } = useTranslation()

  const set = <K extends keyof AddressFormValue>(key: K, next: AddressFormValue[K]) =>
    onChange({ ...value, [key]: next })

  const renderField = (
    key: keyof AddressFormValue,
    options: {
      type?: string
      placeholder?: string
      required?: boolean
      autoComplete?: string
      span?: boolean
    } = {}
  ) => {
    const { type = 'text', placeholder = '', required = false, autoComplete, span } = options
    const message = errors[key]
    const fieldId = `${idPrefix}-${key}`
    const errorId = `${fieldId}-error`

    return (
      <div key={key} className={cn('space-y-1.5', span && 'sm:col-span-2')}>
        <Label htmlFor={fieldId} className="font-medium text-gray-700 text-sm dark:text-gray-300">
          {t(`address_fields.${key}`)}
          {required && (
            <span className="text-red-500" aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </Label>

        <Input
          id={fieldId}
          type={type}
          value={String(value[key] ?? '')}
          onChange={(event) => set(key, event.target.value as AddressFormValue[typeof key])}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={message ? true : undefined}
          aria-describedby={message ? errorId : undefined}
          className={cn('h-10', message && 'border-red-500 focus-visible:ring-red-500')}
        />

        {message && (
          <p id={errorId} className="text-red-600 text-xs dark:text-red-400">
            {message}
          </p>
        )}
      </div>
    )
  }

  return (
    <fieldset className="space-y-4" disabled={disabled}>
      {title && (
        <legend className="font-semibold text-gray-900 text-sm dark:text-white">{title}</legend>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {showContact && (
          <>
            {renderField('contact_name', {
              required: true,
              autoComplete: 'name',
              placeholder: t('address_fields.contact_name_placeholder'),
            })}
            {renderField('phone', {
              type: 'tel',
              required: true,
              autoComplete: 'tel',
              placeholder: t('address_fields.phone_placeholder'),
            })}
          </>
        )}

        {renderField('address_line_1', {
          span: true,
          required: true,
          autoComplete: 'address-line1',
          placeholder: t('address_fields.address_line_1_placeholder'),
        })}
        {renderField('address_line_2', {
          span: true,
          autoComplete: 'address-line2',
          placeholder: t('address_fields.address_line_2_placeholder'),
        })}

        <CountrySelect
          idPrefix={idPrefix}
          value={value.country_id}
          disabled={disabled}
          error={errors.country_id}
          onSelect={(countryId) =>
            onChange({ ...value, country_id: countryId, city_id: null, city: '' })
          }
        />

        <CityField
          idPrefix={idPrefix}
          countryId={value.country_id}
          cityId={value.city_id}
          city={value.city}
          disabled={disabled}
          error={errors.city}
          onChange={({ city_id, city }) => onChange({ ...value, city_id, city })}
        />

        {renderField('state', { autoComplete: 'address-level1' })}
        {renderField('postal_code', { autoComplete: 'postal-code' })}
      </div>
    </fieldset>
  )
}
