import api from '@/api/client'
import { parseApiResponse } from '@/lib/api-response'
import { authHeaders } from '@/lib/auth-header'

export interface AddressData {
  id: number
  uuid: string
  type: string
  label: string | null
  contact_name: string | null
  phone: string | null
  email: string | null
  address_line_1: string | null
  address_line_2: string | null
  city: string | null
  city_id: number | null
  state: string | null
  postal_code: string | null
  country_id: number | null
  is_primary: boolean
  country?: { id: number; name: string; code: string } | null
}

export interface AddressPayload {
  type?: string
  label?: string
  contact_name?: string
  phone?: string
  email?: string
  address_line_1?: string
  address_line_2?: string
  city?: string
  city_id?: number
  state?: string
  postal_code?: string
  country_id?: number
  is_primary?: boolean
}

export const addressesApi = {
  async list(): Promise<AddressData[]> {
    const res = await api.get('users/me/addresses', { headers: authHeaders() })
    const body = await parseApiResponse<AddressData[]>(res)
    return (body.data as AddressData[]) ?? []
  },

  async create(payload: AddressPayload): Promise<AddressData> {
    const res = await api.post('users/me/addresses', {
      json: payload,
      headers: authHeaders(),
      throwHttpErrors: false,
    })
    const body = await parseApiResponse<AddressData>(res)
    return body.data as AddressData
  },

  async update(uuid: string, payload: AddressPayload): Promise<AddressData> {
    const res = await api.put(`addresses/${uuid}`, {
      json: payload,
      headers: authHeaders(),
      throwHttpErrors: false,
    })
    const body = await parseApiResponse<AddressData>(res)
    return body.data as AddressData
  },

  async remove(uuid: string) {
    return parseApiResponse(
      await api.delete(`addresses/${uuid}`, {
        headers: authHeaders(),
        throwHttpErrors: false,
      })
    )
  },

  async setPrimary(uuid: string): Promise<AddressData> {
    const res = await api.post(`addresses/${uuid}/primary`, {
      headers: authHeaders(),
      throwHttpErrors: false,
    })
    const body = await parseApiResponse<AddressData>(res)
    return body.data as AddressData
  },
}
