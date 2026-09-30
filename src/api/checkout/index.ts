import api from '@/api/client'
import { parseApiResponse } from '@/lib/api-response'
import { getCartToken } from '@/lib/cart-token'

/**
 * Server-authoritative checkout totals.
 *
 * Delivery, tax and any discount are decided by the API (`config/shipping.php`
 * and the coupon table). The storefront only ever displays what it is told — a
 * total computed here would be a promise the order could not keep.
 */
export interface CheckoutQuote {
  subtotal: number
  shipping_fee: number
  tax: number
  discount: number
  total: number
  currency: string
  free_shipping: boolean
  free_shipping_threshold: number | null
  /** How much more to spend for free delivery, or null when it does not apply. */
  amount_until_free_shipping: number | null
  coupon_code: string | null
  coupon_label: string | null
}

export const checkoutApi = {
  /**
   * Price the current cart.
   *
   * An unusable `couponCode` rejects with an `ApiError` whose
   * `errors.coupon_code[0]` is a stable reason token (see `lib/coupon-error.ts`)
   * rather than prose, so the caller can translate it.
   */
  async quote(options: { couponCode?: string; signal?: AbortSignal } = {}): Promise<CheckoutQuote> {
    const coupon = options.couponCode?.trim()

    const res = await api.post('checkout/quote', {
      json: coupon ? { coupon_code: coupon } : {},
      headers: { 'X-Cart-Token': getCartToken() },
      throwHttpErrors: false,
      signal: options.signal,
    })

    const body = await parseApiResponse<CheckoutQuote>(res)

    return body.data as CheckoutQuote
  },
}
