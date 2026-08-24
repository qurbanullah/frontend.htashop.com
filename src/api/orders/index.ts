import api from '@/api/client'
import { parseApiResponse } from '@/lib/api-response'
import { getCartToken } from '@/lib/cart-token'

export interface OrderItem {
  id: number
  uuid: string
  product_id: number | null
  variant_id: number | null
  name: string
  sku: string | null
  quantity: number
  unit_price: number
  base_price: number | null
  total: number
  currency: string
  image_url: string | null
}

export interface OrderPayment {
  uuid: string
  payment_method: string
  payment_method_label: string
  status: string
  amount: number
  currency: string
  transaction_reference: string | null
}

export interface OrderAddress {
  label: string | null
  contact_name: string | null
  phone: string | null
  address_line_1: string | null
  address_line_2: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string | null
}

export interface Order {
  id: number
  uuid: string
  order_number: string
  status: string
  status_label: string
  source: string
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  subtotal: number
  shipping_fee: number
  tax: number
  discount: number
  total_amount: number
  currency: string
  shipping_address: OrderAddress | null
  billing_address: OrderAddress | null
  notes: string | null
  placed_at: string | null
  items: OrderItem[]
  payment: OrderPayment[] | null
}

export interface PlaceOrderPayload {
  checkout_token: string
  payment_method: 'cod' | 'jazzcash' | 'easypaisa' | 'upaisa' | 'safepay'
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  shipping_address?: Record<string, unknown>
  billing_address?: Record<string, unknown>
  notes?: string
}

export interface PlaceOrderResult {
  order: Order
  payment: {
    uuid: string
    payment_method: string
    status: string
    amount: number
    currency: string
  } | null
  requires_redirect: boolean
  redirect_url: string | null
}

function cartHeaders(): Record<string, string> {
  return { 'X-Cart-Token': getCartToken() }
}

export const ordersApi = {
  async placeOrder(payload: PlaceOrderPayload): Promise<PlaceOrderResult> {
    const res = await api.post('checkout', {
      json: payload,
      headers: cartHeaders(),
      throwHttpErrors: false,
    })
    const body = await parseApiResponse<PlaceOrderResult>(res)
    return body.data as PlaceOrderResult
  },

  async get(uuid: string): Promise<Order> {
    const res = await api.get(`checkout/orders/${uuid}`, {
      headers: cartHeaders(),
      throwHttpErrors: false,
    })
    const body = await parseApiResponse<Order>(res)
    return body.data as Order
  },
}
