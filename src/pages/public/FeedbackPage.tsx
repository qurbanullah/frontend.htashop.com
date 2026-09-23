import {
  AlertCircle,
  Bug,
  CheckCircle2,
  ChevronRight,
  Clock,
  Lightbulb,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Rocket,
  Send,
} from 'lucide-react'
import { type ChangeEvent, type FormEvent, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { type FeedbackPriority, type FeedbackType, feedbackApi } from '@/api/feedback'
import { Seo } from '@/components/seo/Seo'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { isApiError } from '@/lib/api-response'
import { COMPANY } from '@/lib/company'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'

interface FeedbackTypeOption {
  type: FeedbackType
  titleKey: string
  descriptionKey: string
  icon: typeof MessageSquare
}

const TYPE_OPTIONS: FeedbackTypeOption[] = [
  {
    type: 'feedback',
    titleKey: 'feedback.type_feedback_title',
    descriptionKey: 'feedback.type_feedback_description',
    icon: MessageSquare,
  },
  {
    type: 'suggestion',
    titleKey: 'feedback.type_suggestion_title',
    descriptionKey: 'feedback.type_suggestion_description',
    icon: Lightbulb,
  },
  {
    type: 'feature_request',
    titleKey: 'feedback.type_feature_title',
    descriptionKey: 'feedback.type_feature_description',
    icon: Rocket,
  },
  {
    type: 'bug_report',
    titleKey: 'feedback.type_bug_title',
    descriptionKey: 'feedback.type_bug_description',
    icon: Bug,
  },
]

const PRIORITY_OPTIONS: Array<{ value: FeedbackPriority; labelKey: string }> = [
  { value: 'low', labelKey: 'feedback.priority_low' },
  { value: 'medium', labelKey: 'feedback.priority_medium' },
  { value: 'high', labelKey: 'feedback.priority_high' },
  { value: 'critical', labelKey: 'feedback.priority_critical' },
]

const QUICK_HELP_LINKS: Array<{ labelKey: string; to: string }> = [
  { labelKey: 'contact.track_order', to: paths.accountOrders },
  { labelKey: 'contact.returns_refunds', to: paths.policiesRefund },
  { labelKey: 'contact.browse', to: paths.products },
]

interface FeedbackFormState {
  name: string
  email: string
  subject: string
  message: string
  priority: FeedbackPriority | ''
}

const INITIAL_FORM: FeedbackFormState = {
  name: '',
  email: '',
  subject: '',
  message: '',
  priority: 'medium',
}

type Translate = (key: string, options?: Record<string, unknown>) => string

function validateFeedbackForm(t: Translate, form: FeedbackFormState): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!form.name.trim()) errors.name = t('feedback.err_name')

  if (!form.email.trim()) {
    errors.email = t('feedback.err_email_required')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = t('feedback.err_email_invalid')
  }

  if (!form.subject.trim()) errors.subject = t('feedback.err_subject')
  if (form.message.trim().length < 10) errors.message = t('feedback.err_message')

  return errors
}

export default function FeedbackPage() {
  const { t } = useTranslation()
  const [type, setType] = useState<FeedbackType>('feedback')
  const [form, setForm] = useState<FeedbackFormState>(INITIAL_FORM)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [bannerError, setBannerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [honeypot, setHoneypot] = useState('')
  const [submitted, setSubmitted] = useState<{ name: string; uuid: string } | null>(null)

  const priorityOptions = useMemo(
    () => PRIORITY_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) })),
    [t]
  )

  const setField = (name: keyof FeedbackFormState, value: string) => {
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
    setField(e.target.name as keyof FeedbackFormState, e.target.value)
  }

  const chooseType = (next: FeedbackType) => {
    setType(next)
  }

  const resetForm = () => {
    setType('feedback')
    setForm(INITIAL_FORM)
    setFieldErrors({})
    setBannerError(null)
    setSubmitted(null)
    setHoneypot('')
  }

  const handleFeedbackSubmitError = (error: unknown) => {
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
      setSubmitted({ name: form.name || 'there', uuid: '—' })
      return
    }

    const errors = validateFeedbackForm(t, form)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setSubmitting(true)
    try {
      const result = await feedbackApi.submit({
        type,
        name: form.name,
        email: form.email,
        subject: form.subject,
        message: form.message,
        priority: form.priority ? (form.priority as FeedbackPriority) : undefined,
        page_url: window.location.href,
      })
      setSubmitted({ name: form.name, uuid: result.uuid })
    } catch (error) {
      handleFeedbackSubmitError(error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Seo
        title={t('feedback.seo_title')}
        description={t('feedback.seo_description')}
        keywords={['HTAShop feedback', 'feature request', 'suggestions', 'report a problem']}
        canonical="/feedback"
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
          <span className="text-gray-700 dark:text-gray-300">{t('breadcrumb.feedback')}</span>
        </nav>

        <header className="mb-10 max-w-3xl">
          <h1 className="font-bold text-3xl text-gray-900 tracking-tight sm:text-4xl dark:text-white">
            {t('feedback.title')}
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-300">{t('feedback.intro')}</p>
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
              </ul>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-gray-900/[0.06] shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:shadow-[0_2px_6px_rgba(0,0,0,0.5),0_16px_36px_-14px_rgba(226,232,240,0.12)]">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {t('contact.quick_help')}
              </h2>
              <ul className="mt-3 divide-y divide-gray-100 dark:divide-gray-800">
                {QUICK_HELP_LINKS.map((item) => (
                  <li key={item.labelKey}>
                    <Link
                      to={item.to}
                      className="group flex items-center justify-between py-3 text-gray-600 text-sm transition-colors hover:text-blue-600 dark:text-gray-300 dark:hover:text-white"
                    >
                      {t(item.labelKey)}
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

          {/* Form — visible by default */}
          <div className="lg:col-span-8">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-gray-900/[0.08] shadow-xl sm:p-8 dark:border-gray-800 dark:bg-gray-900 dark:shadow-[0_2px_6px_rgba(0,0,0,0.55),0_22px_48px_-16px_rgba(226,232,240,0.16)]">
              {submitted ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/15">
                    <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
                  </span>
                  <h2 className="mt-5 font-bold text-2xl text-gray-900 dark:text-white">
                    {submitted.name !== 'there'
                      ? t('feedback.success_title_named', { name: submitted.name })
                      : t('feedback.success_title')}
                  </h2>
                  <p className="mt-3 max-w-md text-gray-600 dark:text-gray-300">
                    <Trans
                      i18nKey="feedback.success_body"
                      values={{ reference: submitted.uuid }}
                      components={{
                        ref: <span className="font-medium text-gray-900 dark:text-white" />,
                      }}
                    />
                  </p>
                  <Button type="button" variant="outline" className="mt-7" onClick={resetForm}>
                    {t('feedback.submit_another')}
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="font-bold text-2xl text-gray-900 dark:text-white">
                    {t('feedback.type_title')}
                  </h2>
                  <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
                    {t('feedback.type_subtitle')}
                  </p>

                  {bannerError && (
                    <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      {bannerError}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="mt-6">
                    {/* Honeypot (hidden from humans) */}
                    <label htmlFor="website" className="sr-only">
                      {t('feedback.honeypot')}
                    </label>
                    <input
                      id="website"
                      name="website"
                      type="text"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                      autoComplete="off"
                      tabIndex={-1}
                      className="hidden"
                      aria-hidden="true"
                    />

                    <fieldset>
                      <legend className="sr-only">{t('feedback.type_legend')}</legend>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {TYPE_OPTIONS.map((option) => {
                          const Icon = option.icon
                          const selected = type === option.type
                          return (
                            <button
                              key={option.type}
                              type="button"
                              aria-pressed={selected}
                              onClick={() => chooseType(option.type)}
                              className={cn(
                                'flex items-start gap-3 rounded-xl border p-4 text-left transition-colors',
                                selected
                                  ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600 dark:border-blue-500 dark:bg-blue-950/40'
                                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-600'
                              )}
                            >
                              <Icon
                                className={cn(
                                  'mt-0.5 h-5 w-5 shrink-0',
                                  selected
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-gray-400 dark:text-gray-500'
                                )}
                              />
                              <span>
                                <span className="block font-medium text-gray-900 text-sm dark:text-white">
                                  {t(option.titleKey)}
                                </span>
                                <span className="mt-0.5 block text-gray-500 text-xs dark:text-gray-400">
                                  {t(option.descriptionKey)}
                                </span>
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </fieldset>

                    <div className="mt-6 space-y-5">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <FormField
                          label={t('feedback.name')}
                          name="name"
                          required
                          placeholder={t('feedback.name_placeholder')}
                          value={form.name}
                          onChange={handleChange}
                          error={fieldErrors.name}
                        />
                        <FormField
                          label={t('contact.email')}
                          name="email"
                          type="email"
                          required
                          placeholder={t('contact.email_placeholder')}
                          value={form.email}
                          onChange={handleChange}
                          error={fieldErrors.email}
                          helpText={t('feedback.email_help')}
                        />
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <FormField
                          label={t('feedback.subject')}
                          name="subject"
                          required
                          placeholder={t('feedback.subject_placeholder')}
                          value={form.subject}
                          onChange={handleChange}
                          error={fieldErrors.subject}
                        />
                        {type === 'bug_report' && (
                          <FormField
                            label={t('feedback.priority_label')}
                            name="priority"
                            type="select"
                            value={form.priority}
                            onChange={handleChange}
                            error={fieldErrors.priority}
                            options={priorityOptions}
                          />
                        )}
                      </div>

                      <FormField
                        label={t('contact.message')}
                        name="message"
                        type="textarea"
                        required
                        rows={6}
                        placeholder={
                          type === 'bug_report'
                            ? t('feedback.message_placeholder_bug')
                            : t('feedback.message_placeholder')
                        }
                        value={form.message}
                        onChange={handleChange}
                        error={fieldErrors.message}
                        helpText={t('contact.message_help', { count: form.message.length })}
                      />

                      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> {t('contact.sending')}
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" /> {t('feedback.submit')}
                          </>
                        )}
                      </Button>
                    </div>
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
