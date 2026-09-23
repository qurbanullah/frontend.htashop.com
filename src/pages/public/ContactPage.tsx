import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Send,
} from 'lucide-react'
import { type ChangeEvent, type FormEvent, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { type ContactSubjectKey, contactApi } from '@/api/contact'
import { Seo } from '@/components/seo/Seo'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { isApiError } from '@/lib/api-response'
import { COMPANY, COMPANY_ADDRESS_LINE } from '@/lib/company'
import { paths } from '@/routes/paths'

const SUBJECT_OPTIONS: Array<{ value: ContactSubjectKey; labelKey: string }> = [
  { value: 'order', labelKey: 'contact.subject_order' },
  { value: 'shipping', labelKey: 'contact.subject_shipping' },
  { value: 'returns', labelKey: 'contact.subject_returns' },
  { value: 'product', labelKey: 'contact.subject_product' },
  { value: 'supplier', labelKey: 'contact.subject_supplier' },
  { value: 'general', labelKey: 'contact.subject_general' },
]

const ORDER_TOPICS = new Set<ContactSubjectKey>(['order', 'shipping', 'returns'])

interface ContactFormState {
  first_name: string
  last_name: string
  email: string
  phone: string
  order_uuid: string
  subject: ContactSubjectKey | ''
  message: string
  consent: boolean
}

const INITIAL_FORM: ContactFormState = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  order_uuid: '',
  subject: '',
  message: '',
  consent: false,
}

type Translate = (key: string, options?: Record<string, unknown>) => string

function validateContactForm(t: Translate, form: ContactFormState): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!form.first_name.trim()) errors.first_name = t('contact.err_first_name')
  if (!form.last_name.trim()) errors.last_name = t('contact.err_last_name')

  if (!form.email.trim()) {
    errors.email = t('contact.err_email_required')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = t('contact.err_email_invalid')
  }

  if (!form.subject) errors.subject = t('contact.err_subject')
  if (form.message.trim().length < 10) errors.message = t('contact.err_message')
  if (!form.consent) errors.consent = t('contact.err_consent')

  return errors
}

export default function ContactPage() {
  const { t } = useTranslation()
  const [form, setForm] = useState<ContactFormState>(INITIAL_FORM)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [bannerError, setBannerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [honeypot, setHoneypot] = useState('')
  const [submitted, setSubmitted] = useState<{
    firstName: string
    email: string
    uuid: string
  } | null>(null)

  const subjectOptions = useMemo(
    () => SUBJECT_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) })),
    [t]
  )

  const setField = (name: keyof ContactFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [name]: value }))
    setFieldErrors((prev) => {
      if (!(name in prev)) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })
  }

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setField(name as keyof ContactFormState, (e.target as HTMLInputElement).checked)
      return
    }
    setField(name as keyof ContactFormState, value)
  }

  const resetForm = () => {
    setForm(INITIAL_FORM)
    setFieldErrors({})
    setBannerError(null)
    setSubmitted(null)
    setHoneypot('')
  }

  const handleContactSubmitError = (error: unknown) => {
    if (isApiError(error) && error.errors && Object.keys(error.errors).length > 0) {
      setFieldErrors(
        Object.fromEntries(
          Object.entries(error.errors).map(([key, messages]) => [
            key,
            messages[0] ?? t('common.invalid_value'),
          ])
        )
      )
    }
    setBannerError(isApiError(error) && error.message ? error.message : t('contact.err_generic'))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBannerError(null)

    // Honeypot trap — pretend success for bots without hitting the API.
    if (honeypot.trim() !== '') {
      setSubmitted({ firstName: form.first_name || 'there', email: form.email, uuid: '—' })
      return
    }

    const errors = validateContactForm(t, form)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setSubmitting(true)
    try {
      const result = await contactApi.submit({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone || undefined,
        order_uuid: form.order_uuid || undefined,
        subject: form.subject as ContactSubjectKey,
        message: form.message,
        consent: form.consent,
        source_page: window.location.href,
      })
      setSubmitted({
        firstName: form.first_name,
        email: form.email,
        uuid: result.uuid,
      })
    } catch (error) {
      handleContactSubmitError(error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Seo
        title={t('contact.seo_title')}
        description={t('contact.intro')}
        keywords={['HTAShop contact', 'customer support', 'help', 'order help']}
        canonical="/contact"
        type="website"
      />

      <div className="shell mx-auto px-4 py-10 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav
          className="mb-6 flex items-center gap-1 text-gray-500 text-sm dark:text-gray-400"
          aria-label={t('breadcrumb.label')}
        >
          <Link to={paths.home} className="hover:text-gray-900 dark:hover:text-white">
            {t('breadcrumb.home')}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
          <span className="text-gray-700 dark:text-gray-300">{t('breadcrumb.contact')}</span>
        </nav>

        <header className="mb-10 max-w-3xl">
          <h1 className="font-bold text-3xl text-gray-900 tracking-tight sm:text-4xl dark:text-white">
            {t('contact.title')}
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-300">{t('contact.intro')}</p>
        </header>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Contact channels + quick help */}
          <aside className="space-y-6 lg:col-span-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-gray-900/[0.06] shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:shadow-[0_2px_6px_rgba(0,0,0,0.5),0_16px_36px_-14px_rgba(226,232,240,0.12)]">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {t('contact.talk_to_us')}
              </h2>
              <ul className="mt-4 space-y-4 text-gray-600 text-sm dark:text-gray-300">
                <li className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
                  <a
                    href={COMPANY.phoneHref}
                    className="transition-colors hover:text-blue-600 dark:hover:text-white"
                  >
                    {COMPANY.phoneDisplay}
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
                  <a
                    href={`mailto:${COMPANY.email}`}
                    className="transition-colors hover:text-blue-600 dark:hover:text-white"
                  >
                    {COMPANY.email}
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
                  <span>{COMPANY_ADDRESS_LINE}</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-gray-900/[0.06] shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:shadow-[0_2px_6px_rgba(0,0,0,0.5),0_16px_36px_-14px_rgba(226,232,240,0.12)]">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {t('contact.quick_help')}
              </h2>
              <ul className="mt-3 divide-y divide-gray-100 dark:divide-gray-800">
                {[
                  { label: t('contact.track_order'), to: paths.accountOrders },
                  { label: t('contact.returns_refunds'), to: paths.policiesRefund },
                  { label: t('contact.browse'), to: paths.products },
                ].map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      className="group flex items-center justify-between py-3 text-gray-600 text-sm transition-colors hover:text-blue-600 dark:text-gray-300 dark:hover:text-white"
                    >
                      {item.label}
                      <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-gray-900/[0.06] shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:shadow-[0_2px_6px_rgba(0,0,0,0.5),0_16px_36px_-14px_rgba(226,232,240,0.12)]">
              <p className="flex items-center gap-3 text-gray-600 text-sm dark:text-gray-300">
                <Clock className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
                {t('contact.reply_time')}
              </p>
            </div>
          </aside>

          {/* Form */}
          <div className="lg:col-span-8">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-gray-900/[0.08] shadow-xl sm:p-8 dark:border-gray-800 dark:bg-gray-900 dark:shadow-[0_2px_6px_rgba(0,0,0,0.55),0_22px_48px_-16px_rgba(226,232,240,0.16)]">
              {submitted ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/15">
                    <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
                  </span>
                  <h2 className="mt-5 font-bold text-2xl text-gray-900 dark:text-white">
                    {t('contact.success_title')}
                  </h2>
                  <p className="mt-3 max-w-md text-gray-600 dark:text-gray-300">
                    <Trans
                      i18nKey="contact.success_body"
                      values={{
                        name: submitted.firstName,
                        reference: submitted.uuid,
                        email: submitted.email,
                      }}
                      components={{
                        ref: <span className="font-medium text-gray-900 dark:text-white" />,
                      }}
                    />
                  </p>
                  <Button type="button" variant="outline" className="mt-7" onClick={resetForm}>
                    {t('contact.send_another')}
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="font-bold text-2xl text-gray-900 dark:text-white">
                    {t('contact.form_title')}
                  </h2>
                  <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
                    {t('contact.form_subtitle')}
                  </p>

                  {bannerError && (
                    <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      {bannerError}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                    {/* Honeypot (hidden from humans) */}
                    <label htmlFor="company" className="sr-only">
                      {t('contact.honeypot')}
                    </label>
                    <input
                      id="company"
                      name="company"
                      type="text"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                      autoComplete="off"
                      tabIndex={-1}
                      className="hidden"
                      aria-hidden="true"
                    />

                    <FormField
                      label={t('contact.subject_label')}
                      name="subject"
                      type="select"
                      required
                      value={form.subject}
                      onChange={handleChange}
                      error={fieldErrors.subject}
                      options={subjectOptions}
                      emptyOptionLabel={t('contact.subject_empty')}
                    />

                    {form.subject && ORDER_TOPICS.has(form.subject as ContactSubjectKey) && (
                      <FormField
                        label={t('contact.order_number')}
                        name="order_uuid"
                        placeholder={t('contact.order_number_placeholder')}
                        value={form.order_uuid}
                        onChange={handleChange}
                        error={fieldErrors.order_uuid}
                        helpText={t('contact.order_number_help')}
                      />
                    )}

                    <div className="grid gap-5 sm:grid-cols-2">
                      <FormField
                        label={t('contact.first_name')}
                        name="first_name"
                        required
                        placeholder={t('contact.first_name_placeholder')}
                        value={form.first_name}
                        onChange={handleChange}
                        error={fieldErrors.first_name}
                      />
                      <FormField
                        label={t('contact.last_name')}
                        name="last_name"
                        required
                        placeholder={t('contact.last_name_placeholder')}
                        value={form.last_name}
                        onChange={handleChange}
                        error={fieldErrors.last_name}
                      />
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <FormField
                        label={t('contact.email')}
                        name="email"
                        type="email"
                        required
                        placeholder={t('contact.email_placeholder')}
                        value={form.email}
                        onChange={handleChange}
                        error={fieldErrors.email}
                      />
                      <FormField
                        label={t('contact.phone')}
                        name="phone"
                        placeholder={t('contact.phone_placeholder')}
                        value={form.phone}
                        onChange={handleChange}
                        error={fieldErrors.phone}
                        helpText={t('contact.phone_help')}
                      />
                    </div>

                    <FormField
                      label={t('contact.message')}
                      name="message"
                      type="textarea"
                      required
                      rows={6}
                      placeholder={t('contact.message_placeholder')}
                      value={form.message}
                      onChange={handleChange}
                      error={fieldErrors.message}
                      helpText={t('contact.message_help', { count: form.message.length })}
                    />

                    <div className="space-y-1">
                      <label className="flex items-start gap-2.5 text-gray-600 text-sm dark:text-gray-300">
                        <input
                          type="checkbox"
                          name="consent"
                          checked={form.consent}
                          onChange={handleChange}
                          className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-blue-600"
                        />
                        <span>
                          <Trans
                            i18nKey="contact.consent"
                            components={{
                              privacyLink: (
                                <Link
                                  to={paths.policiesPrivacy}
                                  target="_blank"
                                  className="text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
                                />
                              ),
                            }}
                          />
                        </span>
                      </label>
                      {fieldErrors.consent && (
                        <p className="text-red-600 text-xs dark:text-red-400">
                          {fieldErrors.consent}
                        </p>
                      )}
                    </div>

                    <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> {t('contact.sending')}
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" /> {t('contact.submit')}
                        </>
                      )}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
