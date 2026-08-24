import api from '@/api/client'
import { parseApiResponse } from '@/lib/api-response'
import { authHeaders } from '@/lib/auth-header'
import { getCartToken } from '@/lib/cart-token'

export interface CartItem {
  id: number
  uuid: string
  product_id: number
  variant_id: number | null
  quantity: number
  unit_price: number
  base_price: number | null
  currency: string | null
  name: string
  slug: string
  sku: string | null
  variant_name: string | null
  image_url: string | null
}

export interface CartData {
  uuid: string
  session_id: string | null
  currency: string
  status: string
  items: CartItem[]
  count: number
  subtotal: number
}

export interface AddToCartPayload {
  product_id: number
  variant_id?: number | null
  quantity?: number
}

function cartHeaders(): Record<string, string> {
  return {
    ...authHeaders(),
    'X-Cart-Token': getCartToken(),
  }
}

export const cartApi = {
  async get(): Promise<CartData> {
    const res = await api.get('cart', { headers: cartHeaders() })
    const body = await parseApiResponse<CartData>(res)
    return body.data as CartData
  },

  async add(payload: AddToCartPayload): Promise<CartData> {
    const res = await api.post('cart/items', {
      json: payload,
      headers: cartHeaders(),
      throwHttpErrors: false,
    })
    const body = await parseApiResponse<CartData>(res)
    return body.data as CartData
  },

  async update(itemUuid: string, quantity: number): Promise<CartData> {
    const res = await api.patch(`cart/items/${itemUuid}`, {
      json: { quantity },
      headers: cartHeaders(),
      throwHttpErrors: false,
    })
    const body = await parseApiResponse<CartData>(res)
    return body.data as CartData
  },

  async remove(itemUuid: string): Promise<CartData> {
    const res = await api.delete(`cart/items/${itemUuid}`, {
      headers: cartHeaders(),
      throwHttpErrors: false,
    })
    const body = await parseApiResponse<CartData>(res)
    return body.data as CartData
  },

  async clear(): Promise<CartData> {
    const res = await api.delete('cart', {
      headers: cartHeaders(),
      throwHttpErrors: false,
    })
    const body = await parseApiResponse<CartData>(res)
    return body.data as CartData
  },
}
