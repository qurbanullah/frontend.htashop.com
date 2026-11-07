import api from '@/api/client'
import { parseApiResponse } from '@/lib/api-response'
import { getCartToken } from '@/lib/cart-token'

/** One delivery choice returned by the API; `id` is what the order sends back. */
export interface CheckoutShippingOption {
  id: string
  name: string
  code: string
  carrier: string
  amount: number
  currency: string
  free: boolean
  estimated_days_min: number | null
  estimated_days_max: number | null
  free_over_amount: number | null
}

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
  duty_estimate?: number
  landed_cost?: number
  /** Delivery options priced for the destination; empty while checkout is off. */
  shipping_options?: CheckoutShippingOption[]
  shipping_method?: string | null
  shipping_rate_uuid?: string | null
  shipping_source?: string
}

/** The destination fields that decide which zone and rate apply. */
export interface CheckoutDestination {
  country_id: number
  city_id?: number | null
  state?: string | null
  postal_code?: string | null
}

/** Controls whether the storefront offers checkout or a "temporarily unavailable" state. */
export interface CheckoutStatus {
  enabled: boolean
  message: string
}

export const checkoutApi = {
  /**
   * Read the storefront's checkout switch. This is the API's master flag — the
   * checkout endpoints stay fail-closed even if the client ignores it.
   */
  async status(): Promise<CheckoutStatus> {
    const res = await api.get('checkout/status', { throwHttpErrors: false })
    const body = await parseApiResponse<CheckoutStatus>(res)
    return body.data as CheckoutStatus
  },
  /**
   * Price the current cart.
   *
   * An unusable `couponCode` rejects with an `ApiError` whose
   * `errors.coupon_code[0]` is a stable reason token (see `lib/coupon-error.ts`)
   * rather than prose, so the caller can translate it.
   */
  async quote(
    options: {
      couponCode?: string
      shippingAddress?: CheckoutDestination
      shippingRateUuid?: string
      signal?: AbortSignal
    } = {}
  ): Promise<CheckoutQuote> {
    const coupon = options.couponCode?.trim()

    const payload: Record<string, unknown> = {}
    if (coupon) payload.coupon_code = coupon
    if (options.shippingAddress) payload.shipping_address = options.shippingAddress
    if (options.shippingRateUuid) payload.shipping_rate_uuid = options.shippingRateUuid

    const res = await api.post('checkout/quote', {
      json: payload,
      headers: { 'X-Cart-Token': getCartToken() },
      throwHttpErrors: false,
      signal: options.signal,
    })

    const body = await parseApiResponse<CheckoutQuote>(res)

    return body.data as CheckoutQuote
  },
}
