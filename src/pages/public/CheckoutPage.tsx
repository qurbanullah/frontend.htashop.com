import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Loader2, Lock, ShoppingCart } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { addressesApi } from '@/api/addresses'
import { type CheckoutQuote, checkoutApi } from '@/api/checkout'
import { ordersApi, type PlaceOrderPayload, type PlaceOrderResult } from '@/api/orders'
import { type PaymentMethodOption, paymentsApi } from '@/api/payments'
import { CheckoutStepper, type StepperStep } from '@/components/checkout/CheckoutStepper'
import type { CouponStatus } from '@/components/checkout/CouponField'
import { InformationStep } from '@/components/checkout/InformationStep'
import { OrderSummaryPanel } from '@/components/checkout/OrderSummaryPanel'
import { PaymentStep } from '@/components/checkout/PaymentStep'
import { ReviewStep } from '@/components/checkout/ReviewStep'
import { Seo } from '@/components/seo/Seo'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useDebouncedValue } from '@/hooks/shared/useDebouncedValue'
import {
  type AddressFormValue,
  addressToForm,
  EMPTY_ADDRESS,
  toAddressPayload,
} from '@/lib/address'
import { isApiError } from '@/lib/api-response'
import {
  type CheckoutFormValues,
  type CheckoutStep,
  errorsForPrefix,
  type FieldErrors,
  validateCheckoutStep,
} from '@/lib/checkout-schema'
import { couponErrorKey } from '@/lib/coupon-error'
import { scrollBehavior } from '@/lib/motion'
import { rememberPendingPayment } from '@/lib/pending-payment'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'

/**
 * Checkout.
 *
 * Three steps — information, payment, review — over a single source of truth
 * for the values. Each step is validated on its own (`lib/checkout-schema`) so
 * the customer is never shown errors for fields they have not reached, and the
 * step they are on can be revisited from the progress bar.
 *
 * Payment methods are server-driven. Totals are deliberately conservative:
 * shipping is quoted when the order is placed, not invented here.
 */

const STEPS: StepperStep[] = [
  { id: 'information', labelKey: 'checkout.step_information' },
  { id: 'payment', labelKey: 'checkout.step_payment' },
  { id: 'review', labelKey: 'checkout.step_review' },
]

/** Ordered ids — indexing this is safe to guard, unlike a derived array. */
const STEP_ORDER: CheckoutStep[] = ['information', 'payment', 'review']

/** Heading per step. A record, not an indexed array, so lookups cannot be undefined. */
const STEP_LABELS: Record<CheckoutStep, string> = {
  information: 'checkout.step_information',
  payment: 'checkout.step_payment',
  review: 'checkout.step_review',
}

const INITIAL_VALUES: CheckoutFormValues = {
  email: '',
  shipping: EMPTY_ADDRESS,
  billingSame: true,
  billing: EMPTY_ADDRESS,
  payment_method: 'cod',
  coupon_code: '',
  notes: '',
}

type SubmitStatus = 'idle' | 'placing' | 'redirecting'

/** Turn any thrown value into a message worth showing at checkout. */
function describeSubmitError(error: unknown, fallback: string): string {
  if (isApiError(error)) {
    const firstFieldError = error.errors ? Object.values(error.errors).flat()[0] : undefined
    return firstFieldError ?? error.message
  }

  if (error instanceof Error) return error.message

  return fallback
}

/** The coupon reason token on an API error, when a rejection was a bad code. */
function couponReasonFromError(error: unknown): string | undefined {
  if (!isApiError(error)) return undefined

  return error.errors?.coupon_code?.[0]
}

/**
 * How to present a failed order submission.
 *
 * A code that went bad between the quote and the submit (it expired, or its
 * last use was taken) is fixable by the customer, so it is reported as
 * something to go back and change rather than a generic failure.
 */
function describeOrderFailure(
  error: unknown,
  t: (key: string) => string
): { message: string; coupon: boolean } {
  const reason = couponReasonFromError(error)

  if (reason) {
    return { message: t(couponErrorKey(reason)), coupon: true }
  }

  return { message: describeSubmitError(error, t('checkout.error_generic')), coupon: false }
}

/** Assemble the order payload from the form values. */
function buildOrderPayload(
  values: CheckoutFormValues,
  context: { checkoutToken: string; accountEmail?: string | null }
): PlaceOrderPayload {
  const shipping = toAddressPayload(values.shipping)

  return {
    checkout_token: context.checkoutToken,
    payment_method: values.payment_method as PlaceOrderPayload['payment_method'],
    customer_name: values.shipping.contact_name.trim(),
    customer_email: values.email.trim() || context.accountEmail || undefined,
    customer_phone: values.shipping.phone.trim() || undefined,
    shipping_address: shipping,
    billing_address: values.billingSame ? shipping : toAddressPayload(values.billing),
    coupon_code: values.coupon_code.trim() || undefined,
    notes: values.notes.trim() || undefined,
  }
}

/** The label for the forward button, which changes meaning per step and status. */
function primaryActionKey(step: CheckoutStep, status: SubmitStatus): string {
  if (step !== 'review') {
    return step === 'information' ? 'checkout.continue_to_payment' : 'checkout.continue_to_review'
  }

  if (status === 'redirecting') return 'checkout.redirecting_to_gateway'
  if (status === 'placing') return 'checkout.placing'

  return 'checkout.place_order'
}

/** A hosted gateway session to send the customer to, when there is one. */
function hostedRedirect(result: PlaceOrderResult): string | null {
  return result.requires_redirect ? result.redirect_url : null
}

/**
 * Record the hand-off so the return page can reconcile it. Without this a
 * customer who is redirected off-site has no way back to their payment.
 */
function rememberHostedPayment(result: PlaceOrderResult): void {
  const payment = result.payment
  if (!payment?.uuid) return

  rememberPendingPayment({
    paymentUuid: payment.uuid,
    orderUuid: result.order.uuid,
    orderNumber: result.order.order_number,
    paymentMethod: payment.payment_method,
  })
}

type StepAdvance =
  | { ok: false; errors: FieldErrors }
  | { ok: true; nextStep: CheckoutStep; nextIndex: number }

/**
 * Decide whether the customer may leave the current step, and where they land.
 * Pure, so the rule is unit-testable without a browser.
 */
function evaluateStepAdvance(
  step: CheckoutStep,
  values: CheckoutFormValues,
  options: { requireEmail: boolean },
  currentIndex: number
): StepAdvance {
  const errors = validateCheckoutStep(step, values, options)

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors }
  }

  const nextIndex = Math.min(currentIndex + 1, STEP_ORDER.length - 1)

  return { ok: true, nextStep: STEP_ORDER[nextIndex] ?? step, nextIndex }
}

/** Which address fields actually changed, so only those errors are cleared. */
function changedAddressKeys(
  current: AddressFormValue,
  next: AddressFormValue
): Array<keyof AddressFormValue> {
  return (Object.keys(next) as Array<keyof AddressFormValue>).filter(
    (key) => next[key] !== current[key]
  )
}

/**
 * Seed the form from the account. Guests get nothing; a signed-in customer
 * should never have to retype their own name and email.
 */
function applyAccountDefaults(
  previous: CheckoutFormValues,
  user: { name?: string | null; email?: string | null } | null
): CheckoutFormValues {
  if (!user) return previous

  const next = { ...previous }

  if (!next.email && user.email) next.email = user.email
  if (!next.shipping.contact_name && user.name) {
    next.shipping = { ...next.shipping, contact_name: user.name }
  }

  return next
}

/**
 * The method to fall back to when the current selection is no longer offered —
 * a gateway can be switched off between visits. Null when nothing needs to
 * change, so callers can skip the state update.
 */
function fallbackPaymentMethod(methods: PaymentMethodOption[], current: string): string | null {
  const first = methods[0]
  if (!first) return null
  if (methods.some((method) => method.method === current)) return null

  return first.method
}

/** Translate a field group's error keys into display messages. */
function translateFieldErrors(
  errors: Record<string, string>,
  prefix: string,
  t: (key: string) => string
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(errorsForPrefix(errors, prefix)).map(([key, message]) => [key, t(message)])
  )
}

function EmptyCartState() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-24 text-center">
      <Seo title={t('checkout.title')} noindex />
      <ShoppingCart className="h-12 w-12 text-gray-300 dark:text-gray-600" aria-hidden="true" />
      <h1 className="mt-4 font-semibold text-gray-900 text-lg dark:text-white">
        {t('checkout.empty_title')}
      </h1>
      <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">{t('checkout.empty_body')}</p>
      <Link
        to={paths.products}
        className="mt-6 font-medium text-blue-600 text-sm hover:underline dark:text-blue-400"
      >
        {t('checkout.browse')}
      </Link>
    </div>
  )
}

interface StepActionsProps {
  isFirstStep: boolean
  isReviewStep: boolean
  submitting: boolean
  primaryLabel: string
  primaryDisabled: boolean
  onBack: () => void
  onPrimary: () => void
}

function StepActions({
  isFirstStep,
  isReviewStep,
  submitting,
  primaryLabel,
  primaryDisabled,
  onBack,
  onPrimary,
}: StepActionsProps) {
  const { t } = useTranslation()
  const buttonClass = 'h-12 w-full sm:w-auto sm:min-w-56'

  return (
    <div className="mt-6 flex flex-col-reverse gap-3 border-gray-100 border-t pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
      <Button
        type="button"
        variant="ghost"
        onClick={onBack}
        disabled={isFirstStep || submitting}
        className={cn(isFirstStep && 'invisible')}
      >
        {t('buttons.back')}
      </Button>

      <Button
        type="button"
        size="lg"
        onClick={onPrimary}
        disabled={primaryDisabled}
        className={buttonClass}
      >
        {submitting && isReviewStep && (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        {primaryLabel}
      </Button>
    </div>
  )
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: the page is the coordinator for a multi-step flow — it owns the step machine, validation gating, and the submit hand-off. The rendering, address form, payment selector, review recap and progress bar all live in dedicated components; further fragmentation would only spread the same state across files
export default function CheckoutPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { items, subtotal, currency, isLoading, clear } = useCartStore()
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const [step, setStep] = useState<CheckoutStep>('information')
  const [furthestStep, setFurthestStep] = useState(0)
  const [values, setValues] = useState<CheckoutFormValues>(INITIAL_VALUES)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [status, setStatus] = useState<SubmitStatus>('idle')

  const stepHeadingRef = useRef<HTMLHeadingElement>(null)
  const stepPanelRef = useRef<HTMLDivElement>(null)

  /**
   * Stable for the life of the page; the API is idempotent on it, which is what
   * makes "try payment again" safe after a provider hiccup.
   */
  const checkoutToken = useMemo(
    () =>
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `co-${Date.now()}`,
    []
  )

  const { data: savedAddresses = [] } = useQuery({
    queryKey: ['my-addresses'],
    queryFn: () => addressesApi.list(),
    enabled: isAuthenticated,
  })

  const methodsQuery = useQuery({
    queryKey: ['payment-methods', currency],
    queryFn: () => paymentsApi.methods(currency),
    staleTime: 5 * 60 * 1000,
    enabled: items.length > 0,
  })

  const methods = useMemo(() => methodsQuery.data ?? [], [methodsQuery.data])

  /**
   * Whether there is a payment method to choose from. React Query keeps the
   * last good list when a *refetch* fails, so a transient blip must not blank
   * out the options for a customer who already had them.
   */
  const methodsReady = methods.length > 0
  const methodsUnavailable = methodsQuery.isError && !methodsReady

  /**
   * Checkout totals come from the API, never from arithmetic here.
   *
   * Two queries: a baseline quote without a code, and — only once a code has
   * settled — a second quote with it. Keeping them apart means a rejected code
   * shows an error without blanking the shipping and total the customer was
   * already reading.
   */
  const couponCode = values.coupon_code.trim()
  const debouncedCoupon = useDebouncedValue(couponCode, 450)
  const cartReady = items.length > 0

  const baseQuoteQuery = useQuery({
    queryKey: ['checkout-quote', currency, subtotal, items.length],
    queryFn: ({ signal }) => checkoutApi.quote({ signal }),
    enabled: cartReady,
    staleTime: 60 * 1000,
  })

  const couponQuoteQuery = useQuery({
    queryKey: ['checkout-quote-coupon', currency, subtotal, items.length, debouncedCoupon],
    queryFn: ({ signal }) => checkoutApi.quote({ couponCode: debouncedCoupon, signal }),
    enabled: cartReady && debouncedCoupon !== '' && debouncedCoupon === couponCode,
    staleTime: 60 * 1000,
  })

  const couponApplied =
    couponCode !== '' && couponQuoteQuery.isSuccess && !couponQuoteQuery.isFetching
  const quote: CheckoutQuote | null = couponApplied
    ? (couponQuoteQuery.data ?? null)
    : (baseQuoteQuery.data ?? null)

  let couponStatus: CouponStatus = 'idle'
  if (couponCode !== '') {
    if (couponQuoteQuery.isError) couponStatus = 'error'
    else if (couponApplied) couponStatus = 'applied'
    else couponStatus = 'checking'
  }

  const couponReason =
    isApiError(couponQuoteQuery.error) && couponQuoteQuery.error.errors?.coupon_code?.length
      ? couponQuoteQuery.error.errors.coupon_code[0]
      : undefined

  const couponMessage =
    couponStatus === 'checking'
      ? t('checkout.coupon_checking')
      : couponStatus === 'error'
        ? t(couponErrorKey(couponReason))
        : couponStatus === 'applied'
          ? t('checkout.coupon_applied', { code: quote?.coupon_code ?? couponCode })
          : undefined

  // Prefill from the account once it is known.
  useEffect(() => {
    setValues((previous) => applyAccountDefaults(previous, user))
  }, [user])

  // Keep the selection valid: the default is whatever the API lists first.
  useEffect(() => {
    const next = fallbackPaymentMethod(methods, values.payment_method)
    if (next) setValues((previous) => ({ ...previous, payment_method: next }))
  }, [methods, values.payment_method])

  const clearError = useCallback((path: string) => {
    setErrors((previous) => {
      if (!(path in previous)) return previous
      const next = { ...previous }
      delete next[path]
      return next
    })
  }, [])

  const updateAddress = useCallback(
    (field: 'shipping' | 'billing') => (next: AddressFormValue) => {
      setValues((previous) => {
        for (const key of changedAddressKeys(previous[field], next)) {
          clearError(`${field}.${key}`)
        }
        return { ...previous, [field]: next }
      })
    },
    [clearError]
  )

  const currentIndex = STEP_ORDER.indexOf(step)
  const submitting = status !== 'idle'

  const focusFirstInvalid = useCallback(() => {
    const root = stepPanelRef.current
    if (!root) return

    const target =
      root.querySelector<HTMLElement>('[aria-invalid="true"]') ??
      root.querySelector<HTMLElement>('[data-checkout-error]')

    target?.focus({ preventScroll: true })
    target?.scrollIntoView({ block: 'center', behavior: scrollBehavior() })
  }, [])

  const goToStep = useCallback((next: CheckoutStep) => {
    setStep(next)
    setFormError(null)

    requestAnimationFrame(() => {
      stepHeadingRef.current?.focus({ preventScroll: true })
      stepPanelRef.current?.scrollIntoView({ block: 'start', behavior: scrollBehavior() })
    })
  }, [])

  const handleContinue = useCallback(() => {
    const advance = evaluateStepAdvance(
      step,
      values,
      { requireEmail: !isAuthenticated },
      currentIndex
    )

    if (!advance.ok) {
      setErrors(advance.errors)
      requestAnimationFrame(focusFirstInvalid)
      return
    }

    setErrors({})
    setFurthestStep((previous) => Math.max(previous, advance.nextIndex))
    goToStep(advance.nextStep)
  }, [step, values, isAuthenticated, currentIndex, goToStep, focusFirstInvalid])

  const handleBack = useCallback(() => {
    const previousStep = STEP_ORDER[currentIndex - 1]
    if (!previousStep) return
    goToStep(previousStep)
  }, [currentIndex, goToStep])

  const handlePlaceOrder = useCallback(async () => {
    const nextErrors = validateCheckoutStep('review', values, { requireEmail: !isAuthenticated })

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      goToStep('payment')
      return
    }

    setFormError(null)
    setStatus('placing')

    try {
      const result = await ordersApi.placeOrder(
        buildOrderPayload(values, { checkoutToken, accountEmail: user?.email })
      )

      // The order exists now, so the cart is spent either way.

      const redirectUrl = hostedRedirect(result)

      if (redirectUrl) {
        await clear()
        rememberHostedPayment(result)
        setStatus('redirecting')
        window.location.assign(redirectUrl)
        return
      }

      if (result.payment_error) {
        // The order is saved but the gateway session could not be opened. Stay
        // put with the basket intact so the customer can retry against the same
        // order — clearing the cart here would strand them on an empty basket
        // with no way to pay for the order we just created.
        setStatus('idle')
        setFormError(result.payment_error)
        return
      }

      await clear()
      navigate(`${paths.orderConfirmation}/${result.order.uuid}/confirmation`)
      // `status` stays 'placing' so the form cannot flash an empty cart before
      // the route change commits.
    } catch (error) {
      const failure = describeOrderFailure(error, t)

      setStatus('idle')
      setFormError(failure.message)

      if (failure.coupon) {
        goToStep('payment')
      }
    }
  }, [values, isAuthenticated, goToStep, user, checkoutToken, clear, navigate, t])

  const selectSavedAddress = useCallback(
    (uuid: string) => {
      const address = savedAddresses.find((candidate) => candidate.uuid === uuid)
      if (address) updateAddress('shipping')(addressToForm(address))
    },
    [savedAddresses, updateAddress]
  )

  const shippingErrors = translateFieldErrors(errors, 'shipping', t)
  const billingErrors = translateFieldErrors(errors, 'billing', t)

  const selectedMethod = methods.find((method) => method.method === values.payment_method) ?? null

  const primaryLabel = t(primaryActionKey(step, status), {
    gateway: selectedMethod?.label ?? '',
  })

  // ── Empty cart ──────────────────────────────────────────────────────────────

  if (items.length === 0 && !isLoading && !submitting) {
    return <EmptyCartState />
  }

  return (
    <div className="shell-narrow mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <Seo title={t('checkout.title')} noindex />

      <nav
        className="mb-6 flex flex-wrap items-center gap-1 text-gray-500 text-sm dark:text-gray-400"
        aria-label={t('breadcrumb.label')}
      >
        <Link to={paths.home} className="hover:text-gray-900 dark:hover:text-white">
          {t('breadcrumb.home')}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
        <Link to={paths.products} className="hover:text-gray-900 dark:hover:text-white">
          {t('breadcrumb.products')}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
        <span className="text-gray-700 dark:text-gray-300">{t('breadcrumb.checkout')}</span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-bold text-2xl text-gray-900 dark:text-white">{t('checkout.title')}</h1>
        <p className="flex items-center gap-1.5 text-gray-400 text-xs dark:text-gray-500">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          {t('checkout.secure_badge')}
        </p>
      </div>

      <div className="mt-6">
        <CheckoutStepper
          steps={STEPS}
          current={step}
          furthestIndex={furthestStep}
          onNavigate={goToStep}
        />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        {/* Order summary — first on phones so the total is always in view. */}
        <div className="order-1 lg:order-2 lg:col-span-4">
          <OrderSummaryPanel
            items={items}
            subtotal={subtotal}
            currency={currency}
            totals={quote}
            totalsLoading={baseQuoteQuery.isLoading}
            collapsible
            className="lg:hidden"
          />
          <OrderSummaryPanel
            items={items}
            subtotal={subtotal}
            currency={currency}
            totals={quote}
            totalsLoading={baseQuoteQuery.isLoading}
            className="hidden lg:sticky lg:top-24 lg:block"
          />
        </div>

        {/* Step content */}
        <div className="order-2 lg:order-1 lg:col-span-8" ref={stepPanelRef}>
          <section
            aria-labelledby="checkout-step-heading"
            className="rounded-2xl border border-gray-200 p-5 sm:p-6 dark:border-gray-800"
          >
            <h2
              id="checkout-step-heading"
              ref={stepHeadingRef}
              tabIndex={-1}
              className="font-semibold text-gray-900 text-lg outline-none dark:text-white"
            >
              {t(STEP_LABELS[step])}
            </h2>

            {formError && (
              <Alert tone="error" className="mt-4">
                {formError}
              </Alert>
            )}

            {step === 'information' && (
              <InformationStep
                email={values.email}
                emailError={errors.email ? t(errors.email) : undefined}
                requireEmail={!isAuthenticated}
                onEmailChange={(email) => {
                  setValues((previous) => ({ ...previous, email }))
                  clearError('email')
                }}
                isAuthenticated={isAuthenticated}
                savedAddresses={savedAddresses}
                onSelectSavedAddress={selectSavedAddress}
                shipping={values.shipping}
                onShippingChange={updateAddress('shipping')}
                shippingErrors={shippingErrors}
                disabled={submitting}
              />
            )}

            {step === 'payment' && (
              <PaymentStep
                billingSame={values.billingSame}
                onBillingSameChange={(billingSame) => {
                  setValues((previous) => ({ ...previous, billingSame }))
                  setErrors((previous) =>
                    Object.fromEntries(
                      Object.entries(previous).filter(([path]) => !path.startsWith('billing.'))
                    )
                  )
                }}
                billing={values.billing}
                onBillingChange={updateAddress('billing')}
                billingErrors={billingErrors}
                methods={methods}
                paymentMethod={values.payment_method}
                onPaymentMethodChange={(paymentMethod) => {
                  setValues((previous) => ({ ...previous, payment_method: paymentMethod }))
                  clearError('payment_method')
                }}
                methodsLoading={methodsQuery.isLoading}
                methodsError={methodsUnavailable}
                onMethodsRetry={() => void methodsQuery.refetch()}
                paymentError={errors.payment_method ? t(errors.payment_method) : undefined}
                couponCode={values.coupon_code}
                onCouponCodeChange={(couponCode) => {
                  setValues((previous) => ({ ...previous, coupon_code: couponCode }))
                }}
                onCouponApply={() => {
                  setValues((previous) => ({
                    ...previous,
                    coupon_code: previous.coupon_code.trim().toUpperCase(),
                  }))
                }}
                onCouponRemove={() => {
                  setValues((previous) => ({ ...previous, coupon_code: '' }))
                }}
                couponStatus={couponStatus}
                couponMessage={couponMessage}
                notes={values.notes}
                onNotesChange={(notes) => {
                  setValues((previous) => ({ ...previous, notes }))
                  clearError('notes')
                }}
                notesError={errors.notes ? t(errors.notes) : undefined}
                disabled={submitting}
              />
            )}

            {step === 'review' && (
              <div className="mt-5">
                <ReviewStep
                  email={values.email}
                  shipping={values.shipping}
                  billingSame={values.billingSame}
                  billing={values.billing}
                  paymentLabel={selectedMethod?.label ?? ''}
                  paymentRequiresRedirect={selectedMethod?.requires_redirect ?? false}
                  notes={values.notes}
                  isAuthenticated={isAuthenticated}
                  onEdit={goToStep}
                />
              </div>
            )}

            {/* Step actions */}
            <StepActions
              isFirstStep={currentIndex === 0}
              isReviewStep={step === 'review'}
              submitting={submitting}
              primaryLabel={primaryLabel}
              primaryDisabled={submitting || (step !== 'information' && !methodsReady)}
              onBack={handleBack}
              onPrimary={step === 'review' ? () => void handlePlaceOrder() : handleContinue}
            />

            <p className="mt-3 text-gray-400 text-xs dark:text-gray-500">
              {t('checkout.terms_notice')}
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
