import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { type AddressData, type AddressPayload, addressesApi } from '@/api/addresses'
import { type City, citiesApi } from '@/api/cities'
import { type Country, countriesApi } from '@/api/countries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/Toaster'
import { isApiError } from '@/lib/api-response'

interface Props {
  isOpen: boolean
  onClose: () => void
  address: AddressData | null
  onSaved: () => void
}

interface FormState {
  label: string
  contact_name: string
  phone: string
  address_line_1: string
  address_line_2: string
  city: string
  city_id: string
  state: string
  postal_code: string
  country_id: string
  is_primary: boolean
}

const EMPTY: FormState = {
  label: '',
  contact_name: '',
  phone: '',
  address_line_1: '',
  address_line_2: '',
  city: '',
  city_id: '',
  state: '',
  postal_code: '',
  country_id: '',
  is_primary: false,
}

function nullableString(value: string | number | null | undefined): string {
  return value != null ? String(value) : ''
}

function toFormState(address: AddressData | null): FormState {
  if (!address) return EMPTY

  return {
    label: nullableString(address.label),
    contact_name: nullableString(address.contact_name),
    phone: nullableString(address.phone),
    address_line_1: nullableString(address.address_line_1),
    address_line_2: nullableString(address.address_line_2),
    city: nullableString(address.city),
    city_id: nullableString(address.city_id),
    state: nullableString(address.state),
    postal_code: nullableString(address.postal_code),
    country_id: nullableString(address.country_id),
    is_primary: address.is_primary ?? false,
  }
}

function toPayload(form: FormState): AddressPayload {
  return {
    type: 'shipping',
    label: form.label || undefined,
    contact_name: form.contact_name || undefined,
    phone: form.phone || undefined,
    address_line_1: form.address_line_1 || undefined,
    address_line_2: form.address_line_2 || undefined,
    city: form.city || undefined,
    city_id: form.city_id ? Number(form.city_id) : undefined,
    state: form.state || undefined,
    postal_code: form.postal_code || undefined,
    country_id: form.country_id ? Number(form.country_id) : undefined,
    is_primary: form.is_primary,
  }
}

export function AddressModal({ isOpen, onClose, address, onSaved }: Props) {
  const { success: showSuccess, error: showError } = useToast()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)

  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: () => countriesApi.list(),
    staleTime: 24 * 60 * 60 * 1000,
    enabled: isOpen,
  })

  const { data: cities = [] } = useQuery({
    queryKey: ['cities', form.country_id],
    queryFn: () => citiesApi.list(Number(form.country_id)),
    enabled: isOpen && Boolean(form.country_id),
    staleTime: 24 * 60 * 60 * 1000,
  })

  useEffect(() => {
    if (isOpen) {
      setForm(toFormState(address))
    }
  }, [isOpen, address])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = toPayload(form)

      if (address) {
        await addressesApi.update(address.uuid, payload)
        showSuccess('Address updated')
      } else {
        await addressesApi.create(payload)
        showSuccess('Address added')
      }
      onSaved()
      onClose()
    } catch (e) {
      if (isApiError(e) && e.errors) {
        showError(Object.values(e.errors).flat()[0] || e.message)
      } else {
        showError(isApiError(e) ? e.message : 'Failed to save address')
      }
    } finally {
      setSaving(false)
    }
  }

  const field = (labelText: string, key: keyof FormState, type = 'text', placeholder = '') => (
    <div className="space-y-1.5">
      <Label className="font-medium text-gray-700 text-sm dark:text-gray-300">{labelText}</Label>
      <Input
        type={type}
        value={form[key] as string}
        onChange={(e) => set(key, e.target.value as FormState[typeof key])}
        placeholder={placeholder}
        className="h-10"
      />
    </div>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={address ? 'Edit Address' : 'Add Address'}
      maxWidth="2xl"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="font-medium text-gray-700 text-sm dark:text-gray-300">Label</Label>
          <Input
            value={form.label}
            onChange={(e) => set('label', e.target.value)}
            placeholder="e.g. Home, Office"
            className="h-10"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="font-medium text-gray-700 text-sm dark:text-gray-300">
            Contact name <span className="text-red-500">*</span>
          </Label>
          <Input
            value={form.contact_name}
            onChange={(e) => set('contact_name', e.target.value)}
            placeholder="Full name"
            className="h-10"
            required
          />
        </div>

        {field('Phone', 'phone', 'tel', 'e.g. +92 300 0000000')}
        <div className="space-y-1.5">
          <Label className="font-medium text-gray-700 text-sm dark:text-gray-300">Country</Label>
          <select
            value={form.country_id}
            onChange={(e) => {
              set('country_id', e.target.value)
              set('city_id', '')
              set('city', '')
            }}
            className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
          >
            <option value="">Select country</option>
            {countries.map((c: Country) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          {field('Address line 1', 'address_line_1', 'text', 'Street address, P.O. box')}
        </div>
        <div className="sm:col-span-2">
          {field(
            'Address line 2 (optional)',
            'address_line_2',
            'text',
            'Apartment, suite, unit, building'
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="font-medium text-gray-700 text-sm dark:text-gray-300">City</Label>
          {form.country_id && cities.length > 0 ? (
            <select
              value={form.city_id}
              onChange={(e) => {
                const city = cities.find((c: City) => String(c.id) === e.target.value)
                set('city_id', e.target.value)
                set('city', city?.name ?? '')
              }}
              className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            >
              <option value="">Select city</option>
              {cities.map((c: City) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : (
            <Input
              value={form.city}
              onChange={(e) => set('city', e.target.value)}
              placeholder="City"
              className="h-10"
            />
          )}
        </div>
        <div className="space-y-1.5">
          <Label className="font-medium text-gray-700 text-sm dark:text-gray-300">
            State / Province
          </Label>
          <Input
            value={form.state}
            onChange={(e) => set('state', e.target.value)}
            placeholder="State / Province"
            className="h-10"
          />
        </div>
        {field('Postal code', 'postal_code', 'text', 'e.g. 54000')}

        <label className="flex items-center gap-2 text-gray-700 text-sm sm:pt-6 dark:text-gray-300">
          <input
            type="checkbox"
            checked={form.is_primary}
            onChange={(e) => set('is_primary', e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Set as primary address
        </label>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
          {address ? 'Update' : 'Save'}
        </Button>
      </div>
    </Modal>
  )
}
