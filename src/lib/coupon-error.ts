/**
 * Coupon rejection tokens.
 *
 * The API answers an unusable discount code with a stable token
 * (`coupon_expired`, `coupon_min_order`, …) instead of English prose, so the
 * same failure can be shown in every locale. This maps that token to an i18n
 * key; anything unrecognised falls back to a generic message rather than
 * leaking a raw token to the customer.
 */

const PREFIX = 'coupon_'

const KNOWN_REASONS = new Set([
  'not_found',
  'inactive',
  'not_started',
  'expired',
  'min_order',
  'usage_limit_reached',
  'already_used',
])

export function couponErrorKey(reason: string | null | undefined): string {
  const token =
    typeof reason === 'string' && reason.startsWith(PREFIX) ? reason.slice(PREFIX.length) : ''

  return `checkout.coupon_error_${KNOWN_REASONS.has(token) ? token : 'generic'}`
}
