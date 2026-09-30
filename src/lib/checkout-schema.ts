import { z } from 'zod'
import type { AddressFormValue } from '@/lib/address'

/**
 * Checkout validation.
 *
 * Every message is an **i18n key**, not English prose, so the same schema can
 * drive three locales — the UI renders `t(message)`.
 *
 * The flow validates one step at a time against the same values, which is what
 * lets the customer move forward without being confronted by errors on fields
 * they have not reached yet.
 */

/** Punctuation-tolerant: Pakistani numbers are written +92 300 1234567, 0300-1234567, … */
const PHONE_PATTERN = /^\+?[0-9][0-9\s()-]{6,19}$/

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const MAX_NOTES = 2000

const addressSchema = z.object({
  contact_name: z.string().trim().min(2, 'checkout.error_name'),
  phone: z.string().trim().regex(PHONE_PATTERN, 'checkout.error_phone'),
  address_line_1: z.string().trim().min(3, 'checkout.error_address_line'),
  address_line_2: z.string(),
  city: z.string().trim().min(1, 'checkout.error_city'),
  city_id: z.number().nullable(),
  state: z.string(),
  postal_code: z.string(),
  country_id: z
    .number()
    .nullable()
    .refine((value) => value !== null && value > 0, 'checkout.error_country'),
})

/**
 * Billing never asks for a recipient name or phone: the invoice is addressed to
 * the buyer, who is already identified. Only the postal details are required.
 */
const billingAddressSchema = z.object({
  contact_name: z.string(),
  phone: z.string(),
  address_line_1: z.string().trim().min(3, 'checkout.error_address_line'),
  address_line_2: z.string(),
  city: z.string().trim().min(1, 'checkout.error_city'),
  city_id: z.number().nullable(),
  state: z.string(),
  postal_code: z.string(),
  country_id: z
    .number()
    .nullable()
    .refine((value) => value !== null && value > 0, 'checkout.error_country'),
})

export type CheckoutStep = 'information' | 'payment' | 'review'

export interface CheckoutFormValues {
  /** Only required for guests — an authenticated customer already has one. */
  email: string
  shipping: AddressFormValue
  billingSame: boolean
  billing: AddressFormValue
  payment_method: string
  /** Optional discount code; validated server-side (see `api/checkout`). */
  coupon_code: string
  notes: string
}

/** `{ "shipping.address_line_1": "checkout.error_address_line" }` */
export type FieldErrors = Record<string, string>

export function informationStepSchema(options: { requireEmail: boolean }) {
  return z.object({
    email: z
      .string()
      .trim()
      .refine((value) => !options.requireEmail || EMAIL_PATTERN.test(value), 'checkout.error_email')
      .refine((value) => value === '' || EMAIL_PATTERN.test(value), 'checkout.error_email'),
    shipping: addressSchema,
  })
}

export function paymentStepSchema(options: { requireBilling: boolean }) {
  return z.object({
    payment_method: z.string().trim().min(1, 'checkout.error_payment_method'),
    notes: z.string().max(MAX_NOTES, 'checkout.error_notes'),
    billing: options.requireBilling ? billingAddressSchema : z.unknown(),
  })
}

export const reviewStepSchema = z.object({
  payment_method: z.string().trim().min(1, 'checkout.error_payment_method'),
})

/** First message per field path; later issues for the same field are noise. */
export function flattenIssues(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {}

  for (const issue of error.issues) {
    const path = issue.path.join('.')
    if (path !== '' && !(path in errors)) {
      errors[path] = issue.message
    }
  }

  return errors
}

/**
 * Validate one step and return `{ fieldPath: i18nKey }`.
 *
 * @param requireEmail guests must give an address so the order confirmation can
 *   reach them.
 */
export function validateCheckoutStep(
  step: CheckoutStep,
  values: CheckoutFormValues,
  options: { requireEmail: boolean }
): FieldErrors {
  const schema =
    step === 'information'
      ? informationStepSchema({ requireEmail: options.requireEmail })
      : step === 'payment'
        ? paymentStepSchema({ requireBilling: !values.billingSame })
        : reviewStepSchema

  const result = schema.safeParse(values)

  return result.success ? {} : flattenIssues(result.error)
}

/**
 * Pull the errors for one nested object out of a flattened error map, so a
 * field group can render its own messages: `{ "address_line_1": "…" }`.
 */
export function errorsForPrefix(errors: FieldErrors, prefix: string): Record<string, string> {
  const scoped: Record<string, string> = {}

  for (const [path, message] of Object.entries(errors)) {
    if (path.startsWith(`${prefix}.`)) {
      scoped[path.slice(prefix.length + 1)] = message
    }
  }

  return scoped
}

export { MAX_NOTES }
