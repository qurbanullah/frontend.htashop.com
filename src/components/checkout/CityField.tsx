import { useQuery } from '@tanstack/react-query'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { citiesApi } from '@/api/cities'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface Props {
  countryId: number | null
  cityId: number | null
  city: string
  onChange: (patch: { city_id: number | null; city: string }) => void
  idPrefix: string
  error?: string
  disabled?: boolean
}

interface CitySelectProps {
  fieldId: string
  errorId: string
  cities: Array<{ id: number; name: string }>
  cityId: number | null
  error?: string
  disabled: boolean
  onChange: (patch: { city_id: number | null; city: string }) => void
}

function CitySelect({
  fieldId,
  errorId,
  cities,
  cityId,
  error,
  disabled,
  onChange,
}: CitySelectProps) {
  const { t } = useTranslation()

  return (
    <div className="relative">
      <select
        id={fieldId}
        value={cityId ?? ''}
        onChange={(event) => {
          const nextId = event.target.value ? Number(event.target.value) : null
          const match = cities.find((candidate) => candidate.id === nextId)
          onChange({ city_id: nextId, city: match?.name ?? '' })
        }}
        disabled={disabled}
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'h-10 w-full appearance-none rounded-md border border-gray-300 bg-white px-3 pe-9 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100',
          error && 'border-red-500 focus:ring-red-500'
        )}
      >
        <option value="">{t('address_fields.select_city')}</option>
        {cities.map((candidate) => (
          <option key={candidate.id} value={candidate.id}>
            {candidate.name}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        aria-hidden="true"
      />
    </div>
  )
}

/**
 * City.
 *
 * A dropdown when the backend knows the country's cities, free text otherwise —
 * a missing city list must never block an order.
 */
export function CityField({
  countryId,
  cityId,
  city,
  onChange,
  idPrefix,
  error,
  disabled = false,
}: Props) {
  const { t } = useTranslation()
  const fieldId = `${idPrefix}-city`
  const errorId = `${fieldId}-error`

  const { data: cities = [] } = useQuery({
    queryKey: ['cities', countryId],
    queryFn: () => citiesApi.list(countryId as number),
    enabled: Boolean(countryId),
  })

  const hasCityList = Boolean(countryId) && cities.length > 0

  return (
    <div className="space-y-1.5">
      <Label htmlFor={fieldId} className="font-medium text-gray-700 text-sm dark:text-gray-300">
        {t('address_fields.city')}
        <span className="text-red-500" aria-hidden="true">
          {' '}
          *
        </span>
      </Label>

      {hasCityList ? (
        <CitySelect
          fieldId={fieldId}
          errorId={errorId}
          cities={cities}
          cityId={cityId}
          error={error}
          disabled={disabled}
          onChange={onChange}
        />
      ) : (
        <Input
          id={fieldId}
          value={city}
          onChange={(event) => onChange({ city_id: null, city: event.target.value })}
          disabled={disabled}
          autoComplete="address-level2"
          placeholder={
            countryId
              ? t('address_fields.city_placeholder')
              : t('address_fields.select_country_first')
          }
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn('h-10', error && 'border-red-500 focus-visible:ring-red-500')}
        />
      )}

      {error && (
        <p id={errorId} className="text-red-600 text-xs dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
