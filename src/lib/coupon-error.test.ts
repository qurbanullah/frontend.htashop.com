import { describe, expect, it } from 'vitest'
import { couponErrorKey } from '@/lib/coupon-error'

/**
 * The API answers a bad coupon with a stable token; the customer must always
 * see a translated message, never the token itself.
 */
describe('couponErrorKey', () => {
  it('maps each known reason token to its translation key', () => {
    expect(couponErrorKey('coupon_not_found')).toBe('checkout.coupon_error_not_found')
    expect(couponErrorKey('coupon_expired')).toBe('checkout.coupon_error_expired')
    expect(couponErrorKey('coupon_min_order')).toBe('checkout.coupon_error_min_order')
    expect(couponErrorKey('coupon_usage_limit_reached')).toBe(
      'checkout.coupon_error_usage_limit_reached'
    )
  })

  it('falls back to a generic message for anything unrecognised', () => {
    expect(couponErrorKey('coupon_something_new')).toBe('checkout.coupon_error_generic')
    expect(couponErrorKey('not a token')).toBe('checkout.coupon_error_generic')
    expect(couponErrorKey(undefined)).toBe('checkout.coupon_error_generic')
    expect(couponErrorKey(null)).toBe('checkout.coupon_error_generic')
  })
})
