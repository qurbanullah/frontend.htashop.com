import { describe, expect, it } from 'vitest'
import { EMPTY_ADDRESS } from '@/lib/address'
import {
  type CheckoutFormValues,
  errorsForPrefix,
  validateCheckoutStep,
} from '@/lib/checkout-schema'

/**
 * Step gating. Getting this wrong is a checkout that either blocks a valid
 * order or accepts an undeliverable one, so the rules are pinned precisely.
 */

function values(overrides: Partial<CheckoutFormValues> = {}): CheckoutFormValues {
  return {
    email: 'buyer@example.com',
    shipping: {
      ...EMPTY_ADDRESS,
      contact_name: 'Ayesha Khan',
      phone: '+92 300 1234567',
      address_line_1: '12 Allama Iqbal Road',
      city: 'Lahore',
      country_id: 1,
    },
    billingSame: true,
    billing: EMPTY_ADDRESS,
    payment_method: 'cod',
    coupon_code: '',
    notes: '',
    ...overrides,
  }
}

describe('checkout validation', () => {
  it('accepts a complete information step', () => {
    expect(validateCheckoutStep('information', values(), { requireEmail: true })).toEqual({})
  })

  it('requires an email only for guests', () => {
    const guest = validateCheckoutStep('information', values({ email: '' }), {
      requireEmail: true,
    })
    const member = validateCheckoutStep('information', values({ email: '' }), {
      requireEmail: false,
    })

    expect(guest.email).toBe('checkout.error_email')
    expect(member).toEqual({})
  })

  it('rejects a malformed email even when it is optional', () => {
    const errors = validateCheckoutStep('information', values({ email: 'not-an-email' }), {
      requireEmail: false,
    })

    expect(errors.email).toBe('checkout.error_email')
  })

  it('validates the shipping address field by field', () => {
    const errors = validateCheckoutStep('information', values({ shipping: { ...EMPTY_ADDRESS } }), {
      requireEmail: true,
    })

    expect(errors['shipping.contact_name']).toBe('checkout.error_name')
    expect(errors['shipping.phone']).toBe('checkout.error_phone')
    expect(errors['shipping.address_line_1']).toBe('checkout.error_address_line')
    expect(errors['shipping.city']).toBe('checkout.error_city')
    expect(errors['shipping.country_id']).toBe('checkout.error_country')
  })

  it('accepts common Pakistani phone formats', () => {
    for (const phone of ['+92 300 1234567', '0300-1234567', '03001234567', '+923001234567']) {
      const errors = validateCheckoutStep(
        'information',
        values({ shipping: { ...values().shipping, phone } }),
        { requireEmail: true }
      )

      expect(errors['shipping.phone'], phone).toBeUndefined()
    }
  })

  it('rejects a phone that is too short or has no digits', () => {
    for (const phone of ['123', 'call me', '+']) {
      const errors = validateCheckoutStep(
        'information',
        values({ shipping: { ...values().shipping, phone } }),
        { requireEmail: true }
      )

      expect(errors['shipping.phone'], phone).toBe('checkout.error_phone')
    }
  })

  it('ignores the billing address when it matches shipping', () => {
    expect(
      validateCheckoutStep('payment', values({ billingSame: true }), { requireEmail: true })
    ).toEqual({})
  })

  it('requires the postal details when billing differs', () => {
    const errors = validateCheckoutStep(
      'payment',
      values({ billingSame: false, billing: EMPTY_ADDRESS }),
      { requireEmail: true }
    )

    expect(errors['billing.address_line_1']).toBe('checkout.error_address_line')
    expect(errors['billing.city']).toBe('checkout.error_city')
    expect(errors['billing.country_id']).toBe('checkout.error_country')
  })

  it('does not demand a recipient name or phone for billing', () => {
    const errors = validateCheckoutStep(
      'payment',
      values({
        billingSame: false,
        billing: {
          ...EMPTY_ADDRESS,
          address_line_1: '9 Jail Road',
          city: 'Karachi',
          country_id: 2,
        },
      }),
      { requireEmail: true }
    )

    expect(errors).toEqual({})
  })

  it('requires a payment method', () => {
    const errors = validateCheckoutStep('payment', values({ payment_method: '' }), {
      requireEmail: true,
    })

    expect(errors.payment_method).toBe('checkout.error_payment_method')
  })

  it('bounds the order notes', () => {
    const errors = validateCheckoutStep('payment', values({ notes: 'x'.repeat(2001) }), {
      requireEmail: true,
    })

    expect(errors.notes).toBe('checkout.error_notes')
  })

  it('re-validates only the payment method at the review step', () => {
    const errors = validateCheckoutStep('review', values({ payment_method: '' }), {
      requireEmail: true,
    })

    expect(Object.keys(errors)).toEqual(['payment_method'])
  })

  it('scopes flattened errors by group for a field set', () => {
    const errors = validateCheckoutStep('information', values({ shipping: { ...EMPTY_ADDRESS } }), {
      requireEmail: true,
    })
    const scoped = errorsForPrefix(errors, 'shipping')

    expect(scoped.address_line_1).toBe('checkout.error_address_line')
    expect(scoped).not.toHaveProperty('shipping.address_line_1')
    expect(errorsForPrefix(errors, 'billing')).toEqual({})
  })
})
