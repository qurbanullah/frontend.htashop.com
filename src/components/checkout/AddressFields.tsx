import { useQuery } from '@tanstack/react-query'
import { Check, ChevronDown, MapPin, Search } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { citiesApi } from '@/api/cities'
import { countriesApi } from '@/api/countries'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface AddressFormValue {
  contact_name: string
  phone: string
  address_line_1: string
  address_line_2: string
  city: string
  city_id: number | null
  state: string
  postal_code: string
  country_id: number | null
}

export const EMPTY_ADDRESS: AddressFormValue = {
  contact_name: '',
  phone: '',
  address_line_1: '',
  address_line_2: '',
  city: '',
  city_id: null,
  state: '',
  postal_code: '',
  country_id: null,
}

interface Props {
  value: AddressFormValue
  onChange: (value: AddressFormValue) => void
  title: string
}

export function AddressFields({ value, onChange, title }: Props) {
  const [countryOpen, setCountryOpen] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  const countryRef = useRef<HTMLDivElement>(null)

  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: () => countriesApi.list(),
    staleTime: 24 * 60 * 60 * 1000,
  })

  const countryId = value.country_id
  const { data: cities = [] } = useQuery({
    queryKey: ['cities', countryId],
    queryFn: () => citiesApi.list(countryId as number),
    enabled: !!countryId,
  })

  const selectedCountry = countries.find((c) => c.id === countryId) ?? null

  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase()
    if (!q) return countries
    return countries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    )
  }, [countries, countrySearch])

  const set = <K extends keyof AddressFormValue>(key: K, v: AddressFormValue[K]) =>
    onChange({ ...value, [key]: v })

  const field = (
    labelText: string,
    key: keyof AddressFormValue,
    type = 'text',
    placeholder = '',
    required = false
  ) => (
    <div className="space-y-1.5">
      <Label className="font-medium text-gray-700 text-sm dark:text-gray-300">
        {labelText}
        {required && <span className="text-red-500"> *</span>}
      </Label>
      <Input
        type={type}
        value={String(value[key] ?? '')}
        onChange={(e) => set(key, e.target.value as AddressFormValue[typeof key])}
        placeholder={placeholder}
        className="h-10"
      />
    </div>
  )

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900 text-sm dark:text-white">{title}</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        {field('Contact Name', 'contact_name', 'text', 'John Doe', true)}
        {field('Phone', 'phone', 'tel', '+92 300 0000000')}

        <div className="sm:col-span-2">
          {field('Address Line 1', 'address_line_1', 'text', 'Street address, P.O. box', true)}
        </div>
        <div className="sm:col-span-2">
          {field(
            'Address Line 2',
            'address_line_2',
            'text',
            'Apartment, suite, unit, building, floor'
          )}
        </div>

        {/* Country */}
        <div className="space-y-1.5">
          <Label className="font-medium text-gray-700 text-sm dark:text-gray-300">
            Country <span className="text-red-500"> *</span>
          </Label>
          <div ref={countryRef} className="relative">
            <button
              type="button"
              onClick={() => setCountryOpen((v) => !v)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 text-left text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            >
              {selectedCountry ? (
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  {selectedCountry.name}
                </span>
              ) : (
                <span className="text-gray-400">Select country...</span>
              )}
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>

            {countryOpen && (
              <div className="absolute top-full left-0 z-20 mt-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                <div className="border-gray-100 border-b p-2 dark:border-gray-800">
                  <div className="relative">
                    <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      placeholder="Search countries..."
                      className="h-8 pl-8 text-xs"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-56 overflow-y-auto">
                  {filteredCountries.length === 0 ? (
                    <p className="px-3 py-4 text-center text-gray-400 text-xs">
                      No countries found
                    </p>
                  ) : (
                    filteredCountries.map((country) => {
                      const active = country.id === countryId
                      return (
                        <button
                          key={country.id}
                          type="button"
                          onClick={() => {
                            onChange({
                              ...value,
                              country_id: country.id,
                              city_id: null,
                              city: '',
                            })
                            setCountryOpen(false)
                            setCountrySearch('')
                          }}
                          className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${
                            active ? 'bg-blue-50 dark:bg-blue-950/30' : ''
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="font-semibold text-gray-400 text-xs uppercase">
                              {country.code}
                            </span>
                            {country.name}
                          </span>
                          {active && <Check className="h-4 w-4 text-blue-600" />}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* City */}
        <div className="space-y-1.5">
          <Label className="font-medium text-gray-700 text-sm dark:text-gray-300">City</Label>
          {countryId && cities.length > 0 ? (
            <div className="relative">
              <select
                value={value.city_id ?? ''}
                onChange={(e) => {
                  const id = e.target.value ? Number(e.target.value) : null
                  const city = cities.find((c) => c.id === id)
                  onChange({
                    ...value,
                    city_id: id,
                    city: city?.name ?? '',
                  })
                }}
                className="h-10 w-full appearance-none rounded-md border border-gray-300 bg-white px-3 pr-9 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              >
                <option value="">Select city...</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          ) : (
            <Input
              value={value.city}
              onChange={(e) => set('city', e.target.value)}
              placeholder={countryId ? 'Type a city...' : 'Select a country first'}
              className="h-10"
            />
          )}
        </div>

        {field('State / Province', 'state', 'text', 'Punjab')}
        {field('Postal Code', 'postal_code', 'text', '54000')}
      </div>
    </div>
  )
}
