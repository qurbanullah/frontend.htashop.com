import api from '@/api/client'
import type { Order } from '@/api/orders'
import { parseApiResponse } from '@/lib/api-response'
import { authHeaders } from '@/lib/auth-header'

export interface AccountOrdersResponse {
  data: Order[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
}

export interface AccountProfile {
  id: number
  uuid: string
  name: string
  first_name: string | null
  last_name: string | null
  email: string
  email_verified_at: string | null
  avatar_url?: string | null
  avatar_urls?: {
    original?: string | null
    thumb?: string | null
    small?: string | null
    medium?: string | null
    large?: string | null
  }
  created_at: string
}

export const accountApi = {
  async orders(
    params: { search?: string; status?: string; page?: number; per_page?: number } = {}
  ): Promise<AccountOrdersResponse> {
    const searchParams = new URLSearchParams()
    if (params.search) searchParams.set('search', params.search)
    if (params.status) searchParams.set('status', params.status)
    if (params.page) searchParams.set('page', String(params.page))
    if (params.per_page) searchParams.set('per_page', String(params.per_page))

    const res = await api.get('account/orders', { searchParams, headers: authHeaders() })
    const body = await parseApiResponse<AccountOrdersResponse>(res)
    return (
      (body.data as AccountOrdersResponse) ?? {
        data: [],
        meta: { current_page: 1, last_page: 1, per_page: 10, total: 0, from: null, to: null },
      }
    )
  },

  async order(uuid: string): Promise<Order> {
    const res = await api.get(`account/orders/${uuid}`, { headers: authHeaders() })
    const body = await parseApiResponse<Order>(res)
    return body.data as Order
  },

  async profile(): Promise<AccountProfile> {
    const res = await api.get('account/profile', { headers: authHeaders() })
    const body = await parseApiResponse<AccountProfile>(res)
    return body.data as AccountProfile
  },

  async updateProfile(data: {
    name: string
    first_name?: string | null
    last_name?: string | null
  }): Promise<AccountProfile> {
    const res = await api.put('account/profile', {
      json: data,
      headers: authHeaders(),
      throwHttpErrors: false,
    })
    const body = await parseApiResponse<AccountProfile>(res)
    return body.data as AccountProfile
  },

  async changePassword(data: {
    current_password: string
    new_password: string
    new_password_confirmation: string
  }) {
    return parseApiResponse(
      await api.post('account/change-password', {
        json: data,
        headers: authHeaders(),
        throwHttpErrors: false,
      })
    )
  },

  async deactivateAccount(password: string) {
    return parseApiResponse(
      await api.post('account/deactivate', {
        json: { password },
        headers: authHeaders(),
        throwHttpErrors: false,
      })
    )
  },
}
