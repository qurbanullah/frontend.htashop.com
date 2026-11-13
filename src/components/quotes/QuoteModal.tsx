import { useQuery } from '@tanstack/react-query'
import { Check, CheckCircle2, ChevronRight, Loader2, Package, Search, Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { type CatalogProduct, catalogApi } from '@/api/catalog'
import { countriesApi } from '@/api/countries'
import { industriesApi } from '@/api/industries'
import { type QuoteRequestPayload, quoteApi } from '@/api/quotes'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'
import { isApiError } from '@/lib/api-response'
import { formatMoney } from '@/lib/money'
import { type User, useAuthStore } from '@/stores/auth'

/** The product a quote is being requested for (optional — the modal also works standalone). */
export interface QuoteProductContext {
  id: number
  name: string
  routeKey?: string
  sku?: string | null
  partNumber?: string | null
  modelNumber?: string | null
  gtin?: string | null
  manufacturer?: string | null
  brand?: string | null
  variantName?: string | null
  quantity?: number
  unitPrice?: number | null
  currency?: string | null
  imageUrl?: string | null
}

interface QuoteModalProps {
  isOpen: boolean
  onClose: () => void
  product?: QuoteProductContext | null
}

interface QuoteFormState {
  productName: string
  partNumber: string
  quantity: string
  message: string
  firstName: string
  lastName: string
  email: string
  phone: string
  organization: string
  department: string
  jobTitle: string
  companySize: string
  industryId: string
  country: string
  state: string
  city: string
  postalCode: string
}

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']

const EMPTY_FORM: QuoteFormState = {
  productName: '',
  partNumber: '',
  quantity: '1',
  message: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  organization: '',
  department: '',
  jobTitle: '',
  companySize: '',
  industryId: '',
  country: '',
  state: '',
  city: '',
  postalCode: '',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function firstFieldError(error: unknown): string | undefined {
  if (!isApiError(error) || !error.errors) return undefined
  const values = Object.values(error.errors).flat()
  return values.length > 0 ? values[0] : undefined
}

type ValidationError = 'required' | 'email' | 'message'

function validate(form: QuoteFormState): ValidationError | null {
  const required = [
    form.productName,
    form.firstName,
    form.lastName,
    form.email,
    form.organization,
    form.jobTitle,
    form.country,
    form.city,
    form.postalCode,
  ]

  if (required.some((value) => value.trim() === '')) return 'required'
  if (!EMAIL_RE.test(form.email.trim())) return 'email'
  if (form.message.trim().length < 10) return 'message'

  return null
}

function isProductStepComplete(form: QuoteFormState): boolean {
  return form.productName.trim() !== '' && Number(form.quantity) >= 1
}

function isUserStepComplete(form: QuoteFormState): boolean {
  const required = [
    form.firstName,
    form.lastName,
    form.email,
    form.organization,
    form.jobTitle,
    form.country,
    form.city,
    form.postalCode,
  ]

  return required.every((value) => value.trim() !== '') && EMAIL_RE.test(form.email.trim())
}

/** Identifiers are sent with the request even though most are not shown to the buyer. */
function buildRequirements(
  form: QuoteFormState,
  product: QuoteProductContext | null
): Record<string, unknown> {
  return {
    quantity: Math.max(1, Number(form.quantity) || 1),
    product_name: form.productName.trim(),
    part_number: form.partNumber.trim() || null,
    sku: product?.sku ?? null,
    model_number: product?.modelNumber ?? null,
    gtin: product?.gtin ?? null,
    manufacturer: product?.manufacturer ?? null,
    brand: product?.brand ?? null,
    variant_name: product?.variantName ?? null,
    ...(product ? { product_id: product.id, route: product.routeKey ?? null } : {}),
  }
}

function buildPayload(
  form: QuoteFormState,
  product: QuoteProductContext | null,
  sourcePage: string
): QuoteRequestPayload {
  return {
    first_name: form.firstName.trim(),
    last_name: form.lastName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim() || null,
    organization: form.organization.trim(),
    department: form.department.trim() || null,
    job_title: form.jobTitle.trim(),
    company_size: form.companySize || null,
    industry_id: form.industryId ? Number(form.industryId) : null,
    country: form.country,
    state: form.state.trim() || null,
    city: form.city.trim(),
    postal_code: form.postalCode.trim(),
    message: form.message.trim(),
    requirements: buildRequirements(form, product),
    quotable_type: product ? 'App\\Models\\Product' : null,
    quotable_id: product?.id ?? null,
    source_page: sourcePage,
  }
}

function initialForm(user: User | null, product: QuoteProductContext | null): QuoteFormState {
  const [firstName = '', ...rest] = (user?.name ?? '').split(' ')

  return {
    ...EMPTY_FORM,
    productName: product?.name ?? '',
    partNumber: product?.partNumber ?? '',
    quantity: String(product?.quantity ?? 1),
    firstName: user?.first_name ?? firstName,
    lastName: user?.last_name ?? rest.join(' '),
    email: user?.email ?? '',
  }
}

function productFromCatalog(product: CatalogProduct): QuoteProductContext {
  return {
    id: product.id,
    name: product.name,
    routeKey: product.route_key,
    sku: product.seller_sku ?? null,
    partNumber: product.part_number ?? null,
    modelNumber: product.model_number ?? null,
    gtin: product.gtin ?? null,
    brand: product.brands?.[0]?.name ?? null,
    quantity: 1,
    unitPrice: Number(product.price ?? 0) || null,
    currency: product.currency ?? null,
    imageUrl: product.image_url,
  }
}

/**
 * Two-step quote request wizard, laid out like the manage portal's Add Product
 * modal. Step one shows the product being quoted and the buyer's requirement;
 * step two collects their contact and company details.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: two-step wizard with step-gated navigation, inline product picker and success state
export function QuoteModal({ isOpen, onClose, product = null }: QuoteModalProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<QuoteFormState>(EMPTY_FORM)
  const [selectedProduct, setSelectedProduct] = useState<QuoteProductContext | null>(product)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerQuery, setPickerQuery] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reference, setReference] = useState<string | null>(null)

  const { data: industries = [] } = useQuery({
    queryKey: ['industries'],
    queryFn: () => industriesApi.list(),
    enabled: isOpen,
    staleTime: 60 * 60 * 1000,
  })

  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: () => countriesApi.list(),
    enabled: isOpen,
    staleTime: 24 * 60 * 60 * 1000,
  })

  const { data: searchResults, isFetching: searching } = useQuery({
    queryKey: ['quote-product-search', pickerQuery],
    queryFn: () => catalogApi.products({ search: pickerQuery.trim(), per_page: 8 }),
    enabled: isOpen && pickerOpen && pickerQuery.trim().length >= 2,
    staleTime: 30 * 1000,
  })

  // Re-seed when the dialog opens. The ref guard keeps later parent re-renders
  // (a new `product` object identity) from wiping what is being typed.
  const seeded = useRef(false)

  useEffect(() => {
    if (!isOpen) {
      seeded.current = false
      return
    }

    if (seeded.current) return
    seeded.current = true

    setStep(0)
    setForm(initialForm(user, product))
    setSelectedProduct(product)
    setPickerOpen(false)
    setPickerQuery('')
    setError(null)
    setReference(null)
  }, [isOpen, user, product])

  function update<K extends keyof QuoteFormState>(key: K, value: QuoteFormState[K]) {
    setForm((previous) => ({ ...previous, [key]: value }))
  }

  const chooseProduct = (next: QuoteProductContext) => {
    setSelectedProduct(next)
    setForm((previous) => ({
      ...previous,
      productName: next.name,
      partNumber: next.partNumber ?? '',
    }))
    setPickerOpen(false)
    setPickerQuery('')
  }

  const enterManually = () => {
    setSelectedProduct(null)
    setForm((previous) => ({ ...previous, productName: '', partNumber: '' }))
    setPickerOpen(false)
    setPickerQuery('')
  }

  const steps = [
    {
      key: 'product',
      label: t('quote.step_product'),
      complete: isProductStepComplete(form),
    },
    {
      key: 'user',
      label: t('quote.step_user'),
      complete: isUserStepComplete(form),
    },
  ]

  const stepAccessible = (index: number) =>
    index < step || steps.slice(0, index).every((item) => item.complete)

  const handleNext = () => {
    if (step < steps.length - 1) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const invalid = validate(form)
    if (invalid) {
      // Send lives on the last step, so return the buyer to whichever step owns
      // the missing field instead of leaving them on the summary.
      if (invalid === 'message' || form.productName.trim() === '') {
        setStep(0)
      }

      setError(t(`quote.error_${invalid}`))
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      const result = await quoteApi.submit(buildPayload(form, selectedProduct, location.pathname))
      setReference(result.reference_number)
    } catch (submitError) {
      setError(
        firstFieldError(submitError) ??
          (submitError instanceof Error ? submitError.message : t('quote.error_generic'))
      )
    } finally {
      setSubmitting(false)
    }
  }

  const isLastStep = step === steps.length - 1
  const currentComplete = steps[step]?.complete ?? false

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('quote.title')}
      closeOnBackdropClick={false}
      fullScreen
      noPadding
    >
      <div className="mx-auto flex h-full w-full max-w-7xl">
        {/* Left: Step indicator */}
        <div className="hidden w-72 shrink-0 overflow-y-auto border-gray-100 border-r bg-gray-50 p-6 sm:block dark:border-gray-700 dark:bg-gray-800/50">
          <h3 className="mb-6 font-semibold text-gray-900 text-sm dark:text-white">
            {t('quote.steps_title')}
          </h3>
          <div className="space-y-1">
            {steps.map((item, index) => {
              const complete = item.complete && stepAccessible(index)
              const current = index === step

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    if (stepAccessible(index)) setStep(index)
                  }}
                  disabled={index > step && !item.complete}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    current
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                      : complete
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full font-bold text-xs ${
                      complete
                        ? 'bg-green-500 text-white'
                        : current
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-500 dark:bg-gray-700'
                    }`}
                  >
                    {complete ? <Check className="h-3.5 w-3.5" /> : index + 1}
                  </span>
                  <span className="whitespace-nowrap font-medium">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right: Content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-center gap-2 border-gray-100 border-b px-6 py-3 sm:hidden dark:border-gray-700">
            {steps.map((item, index) => (
              <div
                key={item.key}
                className={`h-2 w-2 rounded-full ${index <= step ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
              />
            ))}
          </div>

          <div className="flex flex-1 flex-col overflow-y-auto px-6 py-6">
            <p className="mb-4 font-medium text-gray-400 text-xs uppercase tracking-wide sm:hidden">
              {t('quote.step_of', { current: step + 1, total: steps.length })} —{' '}
              {steps[step]?.label}
            </p>

            {reference ? (
              <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
                <CheckCircle2 className="h-14 w-14 text-green-500" aria-hidden="true" />
                <h3 className="mt-4 font-bold text-2xl text-gray-900 dark:text-white">
                  {t('quote.success_title')}
                </h3>
                <p className="mt-2 max-w-xl text-gray-600 dark:text-gray-300">
                  {t('quote.success_body', { reference })}
                </p>
              </div>
            ) : (
              <form
                id="quote-form"
                onSubmit={handleSubmit}
                noValidate
                className="mx-auto w-full max-w-5xl space-y-6"
              >
                {error && (
                  <Alert tone="error" title={t('quote.error_title')}>
                    {error}
                  </Alert>
                )}

                {step === 0 && (
                  <>
                    <div>
                      <h2 className="font-semibold text-gray-900 text-xl dark:text-white">
                        {t('quote.step_product_heading')}
                      </h2>
                      <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
                        {t('quote.step_product_subtitle')}
                      </p>
                    </div>

                    {/* Product being quoted */}
                    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700">
                      <div className="flex min-w-0 items-center gap-3">
                        {selectedProduct?.imageUrl ? (
                          <img
                            src={selectedProduct.imageUrl}
                            alt=""
                            className="h-16 w-16 shrink-0 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                            <Package className="h-7 w-7 text-gray-300 dark:text-gray-600" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900 dark:text-white">
                            {selectedProduct?.name ||
                              form.productName ||
                              t('quote.no_product_selected')}
                          </p>
                          {(selectedProduct?.brand || selectedProduct?.sku || form.partNumber) && (
                            <p className="mt-0.5 truncate text-gray-500 text-xs dark:text-gray-400">
                              {[selectedProduct?.brand, selectedProduct?.sku, form.partNumber]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          )}
                          {selectedProduct?.unitPrice != null && selectedProduct.currency && (
                            <p className="mt-1 text-gray-500 text-xs dark:text-gray-400">
                              {t('quote.listed_price', {
                                price: formatMoney(
                                  selectedProduct.unitPrice,
                                  selectedProduct.currency
                                ),
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={() => setPickerOpen((open) => !open)}
                      >
                        {selectedProduct ? t('quote.change_product') : t('quote.search_products')}
                      </Button>
                    </div>

                    {pickerOpen && (
                      <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
                        <div className="relative">
                          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <Input
                            value={pickerQuery}
                            onChange={(e) => setPickerQuery(e.target.value)}
                            placeholder={t('quote.search_products_placeholder')}
                            className="pl-9"
                            autoFocus
                          />
                        </div>

                        {pickerQuery.trim().length < 2 ? (
                          <p className="mt-2 text-gray-500 text-xs dark:text-gray-400">
                            {t('quote.search_products_hint')}
                          </p>
                        ) : searching ? (
                          <div className="flex justify-center py-6">
                            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                          </div>
                        ) : (searchResults?.data ?? []).length === 0 ? (
                          <p className="mt-2 text-gray-500 text-xs dark:text-gray-400">
                            {t('quote.no_products_found')}
                          </p>
                        ) : (
                          <ul className="mt-2 max-h-72 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">
                            {(searchResults?.data ?? []).map((item) => (
                              <li key={item.id}>
                                <button
                                  type="button"
                                  onClick={() => chooseProduct(productFromCatalog(item))}
                                  className="flex w-full items-center gap-3 px-1 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                >
                                  {item.image_url ? (
                                    <img
                                      src={item.image_url}
                                      alt=""
                                      className="h-10 w-10 shrink-0 rounded border border-gray-200 object-cover dark:border-gray-700"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                                      <Package className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                                    </span>
                                  )}
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate font-medium text-gray-900 text-sm dark:text-white">
                                      {item.name}
                                    </span>
                                    <span className="block truncate text-gray-500 text-xs dark:text-gray-400">
                                      {[item.brands?.[0]?.name, item.seller_sku]
                                        .filter(Boolean)
                                        .join(' · ')}
                                    </span>
                                  </span>
                                  <span className="shrink-0 font-semibold text-gray-900 text-sm dark:text-white">
                                    {formatMoney(item.price, item.currency)}
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}

                        <div className="mt-2 border-gray-100 border-t pt-2 dark:border-gray-800">
                          <Button type="button" variant="ghost" size="sm" onClick={enterManually}>
                            {t('quote.enter_manually')}
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="quote-product-name">{t('quote.product_name')} *</Label>
                        <Input
                          id="quote-product-name"
                          value={form.productName}
                          onChange={(e) => update('productName', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="quote-part-number">
                          {t('quote.part_number')}{' '}
                          <span className="font-normal text-gray-400">({t('quote.optional')})</span>
                        </Label>
                        <Input
                          id="quote-part-number"
                          value={form.partNumber}
                          onChange={(e) => update('partNumber', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="quote-quantity">{t('quote.quantity')} *</Label>
                        <Input
                          id="quote-quantity"
                          type="number"
                          min={1}
                          value={form.quantity}
                          onChange={(e) => update('quantity', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
                        <Label htmlFor="quote-message">{t('quote.message')} *</Label>
                        <Textarea
                          id="quote-message"
                          rows={7}
                          value={form.message}
                          onChange={(e) => update('message', e.target.value)}
                          placeholder={t('quote.message_placeholder')}
                          required
                        />
                        <p className="text-gray-500 text-xs dark:text-gray-400">
                          {t('quote.message_hint')}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <div>
                      <h2 className="font-semibold text-gray-900 text-xl dark:text-white">
                        {t('quote.step_user_heading')}
                      </h2>
                      <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
                        {t('quote.step_user_subtitle')}
                      </p>
                    </div>

                    <section>
                      <h3 className="mb-3 font-semibold text-gray-900 text-sm uppercase tracking-wide dark:text-gray-100">
                        {t('quote.contact_section')}
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="quote-first-name">{t('quote.first_name')} *</Label>
                          <Input
                            id="quote-first-name"
                            value={form.firstName}
                            onChange={(e) => update('firstName', e.target.value)}
                            autoComplete="given-name"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="quote-last-name">{t('quote.last_name')} *</Label>
                          <Input
                            id="quote-last-name"
                            value={form.lastName}
                            onChange={(e) => update('lastName', e.target.value)}
                            autoComplete="family-name"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="quote-email">{t('quote.email')} *</Label>
                          <Input
                            id="quote-email"
                            type="email"
                            value={form.email}
                            onChange={(e) => update('email', e.target.value)}
                            autoComplete="email"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="quote-phone">{t('quote.phone')}</Label>
                          <Input
                            id="quote-phone"
                            type="tel"
                            value={form.phone}
                            onChange={(e) => update('phone', e.target.value)}
                            autoComplete="tel"
                          />
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="mb-3 font-semibold text-gray-900 text-sm uppercase tracking-wide dark:text-gray-100">
                        {t('quote.company_section')}
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="quote-organization">{t('quote.organization')} *</Label>
                          <Input
                            id="quote-organization"
                            value={form.organization}
                            onChange={(e) => update('organization', e.target.value)}
                            autoComplete="organization"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="quote-job-title">{t('quote.job_title')} *</Label>
                          <Input
                            id="quote-job-title"
                            value={form.jobTitle}
                            onChange={(e) => update('jobTitle', e.target.value)}
                            autoComplete="organization-title"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="quote-department">{t('quote.department')}</Label>
                          <Input
                            id="quote-department"
                            value={form.department}
                            onChange={(e) => update('department', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="quote-company-size">{t('quote.company_size')}</Label>
                          <select
                            id="quote-company-size"
                            value={form.companySize}
                            onChange={(e) => update('companySize', e.target.value)}
                            className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-gray-900 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                          >
                            <option value="">{t('quote.company_size_placeholder')}</option>
                            {COMPANY_SIZES.map((size) => (
                              <option key={size} value={size}>
                                {size}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="quote-industry">{t('quote.industry')}</Label>
                          <select
                            id="quote-industry"
                            value={form.industryId}
                            onChange={(e) => update('industryId', e.target.value)}
                            className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-gray-900 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                          >
                            <option value="">{t('quote.industry_placeholder')}</option>
                            {industries.map((industry) => (
                              <option key={industry.id} value={industry.id}>
                                {industry.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="mb-3 font-semibold text-gray-900 text-sm uppercase tracking-wide dark:text-gray-100">
                        {t('quote.location_section')}
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="quote-country">{t('quote.country')} *</Label>
                          <select
                            id="quote-country"
                            value={form.country}
                            onChange={(e) => update('country', e.target.value)}
                            className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-gray-900 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                            required
                          >
                            <option value="">{t('quote.country_placeholder')}</option>
                            {countries.map((country) => (
                              <option key={country.id} value={country.name}>
                                {country.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="quote-state">{t('quote.state')}</Label>
                          <Input
                            id="quote-state"
                            value={form.state}
                            onChange={(e) => update('state', e.target.value)}
                            autoComplete="address-level1"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="quote-city">{t('quote.city')} *</Label>
                          <Input
                            id="quote-city"
                            value={form.city}
                            onChange={(e) => update('city', e.target.value)}
                            autoComplete="address-level2"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="quote-postal-code">{t('quote.postal_code')} *</Label>
                          <Input
                            id="quote-postal-code"
                            value={form.postalCode}
                            onChange={(e) => update('postalCode', e.target.value)}
                            autoComplete="postal-code"
                            required
                          />
                        </div>
                      </div>
                    </section>
                  </>
                )}
              </form>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 border-gray-100 border-t px-6 py-4 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={reference ? onClose : step === 0 ? onClose : handleBack}
              disabled={submitting}
            >
              {reference
                ? t('quote.success_close')
                : step === 0
                  ? t('quote.cancel')
                  : t('quote.back')}
            </Button>

            {!reference &&
              (isLastStep ? (
                <Button
                  type="submit"
                  form="quote-form"
                  disabled={!currentComplete || submitting}
                  className="inline-flex items-center gap-1"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {submitting ? t('quote.submitting') : t('quote.submit')}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!currentComplete}
                  className="inline-flex items-center gap-1"
                >
                  {t('quote.next')}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
