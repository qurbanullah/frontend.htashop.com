import type { AddressData } from '@/api/addresses'

/**
 * The editable shape of an address, shared by the address book and checkout.
 *
 * Kept out of the `AddressFields` component so the checkout validation schema
 * and payload builders can depend on the shape without pulling in React.
 */
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

export function addressToForm(address: AddressData): AddressFormValue {
  return {
    contact_name: address.contact_name ?? '',
    phone: address.phone ?? '',
    address_line_1: address.address_line_1 ?? '',
    address_line_2: address.address_line_2 ?? '',
    city: address.city ?? '',
    city_id: address.city_id,
    state: address.state ?? '',
    postal_code: address.postal_code ?? '',
    country_id: address.country_id,
  }
}

/**
 * The order stores a snapshot of the address, so blanks are dropped rather than
 * sent as empty strings — the API's `snapshot()` reads only what is present.
 */
export function toAddressPayload(value: AddressFormValue): Record<string, unknown> {
  const optional: Array<keyof AddressFormValue> = [
    'phone',
    'address_line_2',
    'state',
    'postal_code',
    'city_id',
  ]

  const payload: Record<string, unknown> = {
    contact_name: value.contact_name.trim(),
    address_line_1: value.address_line_1.trim(),
    city: value.city.trim(),
    country_id: value.country_id,
  }

  for (const key of optional) {
    const raw = value[key]
    if (typeof raw === 'string') {
      const trimmed = raw.trim()
      if (trimmed !== '') payload[key] = trimmed
    } else if (raw !== null) {
      payload[key] = raw
    }
  }

  return payload
}

/** One-line summary for review screens, e.g. "12 Allama Iqbal Rd, Lahore, Punjab". */
export function formatAddressLine(value: AddressFormValue): string {
  return [value.address_line_1, value.address_line_2, value.city, value.state, value.postal_code]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ')
}
