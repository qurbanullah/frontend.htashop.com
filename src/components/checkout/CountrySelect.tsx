import { useQuery } from '@tanstack/react-query'
import { Check, ChevronDown, MapPin, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { countriesApi } from '@/api/countries'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface Props {
  value: number | null
  onSelect: (countryId: number) => void
  idPrefix: string
  error?: string
  disabled?: boolean
}

/**
 * Searchable country picker.
 *
 * Owns its own open/search state so the address form stays a plain layout, and
 * closes on outside click and Escape — a dropdown that survives a click
 * elsewhere reads as a broken page.
 */
export function CountrySelect({ value, onSelect, idPrefix, error, disabled = false }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: () => countriesApi.list(),
    staleTime: 24 * 60 * 60 * 1000,
  })

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return countries

    return countries.filter(
      (country) =>
        country.name.toLowerCase().includes(query) || country.code.toLowerCase().includes(query)
    )
  }, [countries, search])

  const selected = countries.find((country) => country.id === value) ?? null
  const fieldId = `${idPrefix}-country_id`
  const errorId = `${fieldId}-error`

  return (
    <div className="space-y-1.5">
      <Label htmlFor={fieldId} className="font-medium text-gray-700 text-sm dark:text-gray-300">
        {t('address_fields.country')}
        <span className="text-red-500" aria-hidden="true">
          {' '}
          *
        </span>
      </Label>

      <div ref={containerRef} className="relative">
        <button
          id={fieldId}
          type="button"
          onClick={() => setOpen((previous) => !previous)}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 text-left text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100',
            error && 'border-red-500 focus:ring-red-500'
          )}
        >
          {selected ? (
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" aria-hidden="true" />
              {selected.name}
            </span>
          ) : (
            <span className="text-gray-400">{t('address_fields.select_country')}</span>
          )}
          <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
        </button>

        {open && (
          <div className="absolute start-0 top-full z-20 mt-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
            <div className="border-gray-100 border-b p-2 dark:border-gray-800">
              <div className="relative">
                <Search
                  className="absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  aria-hidden="true"
                />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t('address_fields.search_countries')}
                  aria-label={t('address_fields.search_countries')}
                  className="h-8 ps-8 text-xs"
                />
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto" role="listbox">
              {filtered.length === 0 ? (
                <p className="px-3 py-4 text-center text-gray-400 text-xs">
                  {t('address_fields.no_countries')}
                </p>
              ) : (
                filtered.map((country) => {
                  const active = country.id === value

                  return (
                    <button
                      key={country.id}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        onSelect(country.id)
                        setOpen(false)
                        setSearch('')
                      }}
                      className={cn(
                        'flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800',
                        active && 'bg-blue-50 dark:bg-blue-950/30'
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-semibold text-gray-400 text-xs uppercase">
                          {country.code}
                        </span>
                        {country.name}
                      </span>
                      {active && <Check className="h-4 w-4 text-blue-600" aria-hidden="true" />}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p id={errorId} className="text-red-600 text-xs dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
