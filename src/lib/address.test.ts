import { describe, expect, it } from 'vitest'
import type { AddressData } from '@/api/addresses'
import { addressToForm, EMPTY_ADDRESS, formatAddressLine, toAddressPayload } from '@/lib/address'

describe('address form mapping', () => {
  it('maps an address book entry into the form shape', () => {
    const address = {
      uuid: 'a1',
      label: 'Home',
      contact_name: 'Ayesha Khan',
      phone: '+92 300 1234567',
      address_line_1: '12 Allama Iqbal Road',
      address_line_2: null,
      city: 'Lahore',
      city_id: 5,
      state: 'Punjab',
      postal_code: '54000',
      country_id: 1,
    } as unknown as AddressData

    expect(addressToForm(address)).toEqual({
      contact_name: 'Ayesha Khan',
      phone: '+92 300 1234567',
      address_line_1: '12 Allama Iqbal Road',
      address_line_2: '',
      city: 'Lahore',
      city_id: 5,
      state: 'Punjab',
      postal_code: '54000',
      country_id: 1,
    })
  })

  it('drops blank optional fields from the order snapshot', () => {
    const payload = toAddressPayload({
      ...EMPTY_ADDRESS,
      contact_name: '  Ayesha Khan  ',
      address_line_1: ' 12 Allama Iqbal Road ',
      city: ' Lahore ',
      country_id: 1,
      phone: '',
      address_line_2: '   ',
      state: '',
      postal_code: '',
      city_id: null,
    })

    expect(payload).toEqual({
      contact_name: 'Ayesha Khan',
      address_line_1: '12 Allama Iqbal Road',
      city: 'Lahore',
      country_id: 1,
    })
    expect(payload).not.toHaveProperty('phone')
    expect(payload).not.toHaveProperty('city_id')
  })

  it('keeps a chosen city id', () => {
    const payload = toAddressPayload({ ...EMPTY_ADDRESS, city_id: 7, country_id: 1 })

    expect(payload.city_id).toBe(7)
  })

  it('builds a one-line address, skipping missing parts', () => {
    expect(
      formatAddressLine({
        ...EMPTY_ADDRESS,
        address_line_1: '12 Allama Iqbal Road',
        city: 'Lahore',
        state: 'Punjab',
      })
    ).toBe('12 Allama Iqbal Road, Lahore, Punjab')
  })

  it('returns an empty line when nothing is filled in', () => {
    expect(formatAddressLine(EMPTY_ADDRESS)).toBe('')
  })
})
