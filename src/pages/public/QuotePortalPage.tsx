import type { TFunction } from 'i18next'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { type PortalQuote, type PortalQuoteResponse, quoteApi } from '@/api/quotes'
import { Seo } from '@/components/seo/Seo'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { isApiError } from '@/lib/api-response'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'

type LoadState = 'loading' | 'ready' | 'invalid' | 'error'
type Decision = 'accepted' | 'declined'

const STATUS_TONES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  replied: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  accepted: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  declined: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  expired: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  cancelled: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
}

function money(value: number | null, currency: string | null): string {
  const code = currency ?? 'PKR'
  return `${code} ${Number(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function QuotePortalPage() {
  const { uuid } = useParams<{ uuid: string }>()
  const [searchParams] = useSearchParams()
  const { t } = useTranslation()

  const expires = searchParams.get('expires') ?? ''
  const signature = searchParams.get('signature') ?? ''

  const [quote, setQuote] = useState<PortalQuote | null>(null)
  const [state, setState] = useState<LoadState>('loading')
  const [decision, setDecision] = useState<Decision | null>(null)
  const [action, setAction] = useState<'accept' | 'decline' | null>(null)
  const [declineOpen, setDeclineOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!uuid || !expires || !signature) {
      setState('invalid')
      return
    }

    setState('loading')

    try {
      setQuote(await quoteApi.portal(uuid, { expires, signature }))
      setState('ready')
    } catch (error) {
      setState(isApiError(error) && error.status === 403 ? 'invalid' : 'error')
    }
  }, [uuid, expires, signature])

  useEffect(() => {
    void load()
  }, [load])

  const handleAccept = async () => {
    if (!uuid || !quote?.actions.accept) {
      setActionError(t('quotePortal.action_expired'))
      return
    }

    setAction('accept')
    setActionError(null)

    try {
      await quoteApi.accept(uuid, quote.actions.accept)
      setDecision('accepted')
    } catch (error) {
      setActionError(
        isApiError(error) && error.status === 403
          ? t('quotePortal.action_expired')
          : isApiError(error)
            ? error.message
            : t('quotePortal.error_body')
      )
    } finally {
      setAction(null)
    }
  }

  const handleDecline = async () => {
    if (!uuid || !quote?.actions.decline) {
      setActionError(t('quotePortal.action_expired'))
      return
    }

    setAction('decline')
    setActionError(null)

    try {
      await quoteApi.decline(uuid, quote.actions.decline, reason)
      setDecision('declined')
    } catch (error) {
      setActionError(
        isApiError(error) && error.status === 403
          ? t('quotePortal.action_expired')
          : isApiError(error)
            ? error.message
            : t('quotePortal.error_body')
      )
    } finally {
      setAction(null)
    }
  }

  return (
    <div className="min-h-[70vh] bg-gray-50 dark:bg-gray-950">
      <Seo title={t('quotePortal.title')} noindex />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          to={paths.home}
          className="mb-6 inline-flex items-center gap-2 text-gray-500 text-sm hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('quotePortal.back_to_store')}
        </Link>

        {state === 'loading' && <LoadingCard label={t('quotePortal.loading')} />}

        {state === 'invalid' && (
          <NoticeCard
            tone="warning"
            icon={AlertTriangle}
            title={t('quotePortal.invalid_title')}
            body={t('quotePortal.invalid_body')}
            action={
              <Link to={paths.contact}>
                <Button variant="outline">{t('quotePortal.contact_sales')}</Button>
              </Link>
            }
          />
        )}

        {state === 'error' && (
          <NoticeCard
            tone="error"
            icon={XCircle}
            title={t('quotePortal.error_title')}
            body={t('quotePortal.error_body')}
            action={
              <Button variant="outline" onClick={() => void load()}>
                {t('quotePortal.retry')}
              </Button>
            }
          />
        )}

        {state === 'ready' && quote && decision === null && (
          <QuoteBody
            quote={quote}
            action={action}
            actionError={actionError}
            declineOpen={declineOpen}
            reason={reason}
            onReason={setReason}
            onAccept={() => void handleAccept()}
            onOpenDecline={() => setDeclineOpen(true)}
            onCancelDecline={() => {
              setDeclineOpen(false)
              setReason('')
            }}
            onDecline={() => void handleDecline()}
          />
        )}

        {decision !== null && (
          <NoticeCard
            tone="success"
            icon={decision === 'accepted' ? CheckCircle2 : XCircle}
            title={t(
              decision === 'accepted' ? 'quotePortal.accepted_title' : 'quotePortal.declined_title'
            )}
            body={t(
              decision === 'accepted' ? 'quotePortal.accepted_body' : 'quotePortal.declined_body'
            )}
            action={
              <Link to={paths.home}>
                <Button variant="outline">{t('quotePortal.back_to_store')}</Button>
              </Link>
            }
          />
        )}
      </div>
    </div>
  )
}

function LoadingCard({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white p-16 dark:border-gray-700 dark:bg-gray-900">
      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      <span className="text-gray-600 text-sm dark:text-gray-300">{label}</span>
    </div>
  )
}

function NoticeCard({
  tone,
  icon: Icon,
  title,
  body,
  action,
}: {
  tone: 'success' | 'warning' | 'error'
  icon: typeof CheckCircle2
  title: string
  body: string
  action?: ReactNode
}) {
  const tones = {
    success: 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-900/20',
    warning: 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-900/20',
    error: 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20',
  }
  const iconTones = {
    success: 'text-emerald-600 dark:text-emerald-400',
    warning: 'text-amber-600 dark:text-amber-400',
    error: 'text-red-600 dark:text-red-400',
  }

  return (
    <div className={cn('rounded-2xl border p-8 text-center', tones[tone])}>
      <Icon className={cn('mx-auto mb-3 h-10 w-10', iconTones[tone])} />
      <h1 className="font-semibold text-gray-900 text-xl dark:text-white">{title}</h1>
      <p className="mx-auto mt-2 max-w-lg text-gray-600 text-sm dark:text-gray-300">{body}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}

function QuoteBody({
  quote,
  action,
  actionError,
  declineOpen,
  reason,
  onReason,
  onAccept,
  onOpenDecline,
  onCancelDecline,
  onDecline,
}: {
  quote: PortalQuote
  action: 'accept' | 'decline' | null
  actionError: string | null
  declineOpen: boolean
  reason: string
  onReason: (value: string) => void
  onAccept: () => void
  onOpenDecline: () => void
  onCancelDecline: () => void
  onDecline: () => void
}) {
  const { t } = useTranslation()
  const response = quote.latest_response

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-medium text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
              {t('quotePortal.reference')}
            </p>
            <h1 className="mt-1 font-bold text-2xl text-gray-900 dark:text-white">
              {quote.quote_number ?? quote.reference_number}
            </h1>
            <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
              {t('quotePortal.prepared_for', { name: quote.customer_name })}
              {quote.organization ? ` · ${quote.organization}` : ''}
            </p>
          </div>
          <span
            className={cn(
              'inline-flex rounded-full px-3 py-1 font-medium text-xs',
              STATUS_TONES[quote.status] ?? 'bg-gray-100 text-gray-700'
            )}
          >
            {quote.status_label}
          </span>
        </div>

        <dl className="mt-5 grid gap-4 border-gray-100 border-t pt-4 sm:grid-cols-3 dark:border-gray-800">
          <Meta label={t('quotePortal.valid_until')} value={formatDate(quote.expires_at)} />
          <Meta label={t('quotePortal.issued')} value={formatDate(quote.created_at)} />
          <Meta
            label={t('quotePortal.total')}
            value={money(response?.total_amount ?? null, response?.currency ?? quote.currency)}
          />
        </dl>
      </header>

      {response === null ? (
        <NoticeCard
          tone="warning"
          icon={FileText}
          title={t('quotePortal.no_offer_title')}
          body={t('quotePortal.no_offer_body')}
        />
      ) : (
        <>
          <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="font-semibold text-gray-900 text-lg dark:text-white">
              {response.subject}
            </h2>
            <p className="mt-3 whitespace-pre-line text-gray-700 text-sm dark:text-gray-300">
              {response.message}
            </p>
          </section>

          <ItemsTable response={response} />
          <Totals response={response} />
          <Logistics response={response} />

          {response.terms && (
            <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
              <h2 className="font-semibold text-gray-900 text-sm dark:text-white">
                {t('quotePortal.terms')}
              </h2>
              <p className="mt-2 whitespace-pre-line text-gray-600 text-sm dark:text-gray-300">
                {response.terms}
              </p>
            </section>
          )}

          <DecisionPanel
            pdfUrl={quote.pdf_url}
            canRespond={quote.can_respond}
            action={action}
            actionError={actionError}
            declineOpen={declineOpen}
            reason={reason}
            onReason={onReason}
            onAccept={onAccept}
            onOpenDecline={onOpenDecline}
            onCancelDecline={onCancelDecline}
            onDecline={onDecline}
          />
        </>
      )}
    </div>
  )
}

function DecisionPanel({
  pdfUrl,
  canRespond,
  action,
  actionError,
  declineOpen,
  reason,
  onReason,
  onAccept,
  onOpenDecline,
  onCancelDecline,
  onDecline,
}: {
  pdfUrl: string | null
  canRespond: boolean
  action: 'accept' | 'decline' | null
  actionError: string | null
  declineOpen: boolean
  reason: string
  onReason: (value: string) => void
  onAccept: () => void
  onOpenDecline: () => void
  onCancelDecline: () => void
  onDecline: () => void
}) {
  const { t } = useTranslation()

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {pdfUrl && (
          <a href={pdfUrl} target="_blank" rel="noreferrer">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              {t('quotePortal.download_pdf')}
            </Button>
          </a>
        )}
        <p className="inline-flex items-center gap-2 text-gray-500 text-xs dark:text-gray-400">
          <ShieldCheck className="h-4 w-4" />
          {t('quotePortal.secure_notice')}
        </p>
      </div>

      {actionError && (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-red-700 text-sm dark:bg-red-900/20 dark:text-red-300">
          {actionError}
        </p>
      )}

      {canRespond ? (
        declineOpen ? (
          <DeclineForm
            action={action}
            reason={reason}
            onReason={onReason}
            onCancel={onCancelDecline}
            onConfirm={onDecline}
          />
        ) : (
          <div className="mt-5 flex flex-wrap gap-3 border-gray-100 border-t pt-5 dark:border-gray-800">
            <Button onClick={onAccept} disabled={action !== null} className="min-w-40">
              {action === 'accept' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              {t('quotePortal.accept')}
            </Button>
            <Button variant="outline" onClick={onOpenDecline} disabled={action !== null}>
              {t('quotePortal.decline')}
            </Button>
          </div>
        )
      ) : (
        <p className="mt-5 rounded-lg bg-gray-50 p-3 text-gray-600 text-sm dark:bg-gray-800 dark:text-gray-300">
          {t('quotePortal.not_actionable')}
        </p>
      )}
    </section>
  )
}

function DeclineForm({
  action,
  reason,
  onReason,
  onCancel,
  onConfirm,
}: {
  action: 'accept' | 'decline' | null
  reason: string
  onReason: (value: string) => void
  onCancel: () => void
  onConfirm: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="mt-5 border-gray-100 border-t pt-5 dark:border-gray-800">
      <label
        htmlFor="decline-reason"
        className="font-medium text-gray-700 text-sm dark:text-gray-300"
      >
        {t('quotePortal.decline_reason')}
      </label>
      <Textarea
        id="decline-reason"
        className="mt-2"
        rows={3}
        maxLength={500}
        value={reason}
        onChange={(event) => onReason(event.target.value)}
        placeholder={t('quotePortal.decline_placeholder')}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="destructive" onClick={onConfirm} disabled={action !== null}>
          {action === 'decline' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('quotePortal.confirm_decline')}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={action !== null}>
          {t('quotePortal.cancel')}
        </Button>
      </div>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-gray-500 text-xs dark:text-gray-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-gray-900 text-sm dark:text-white">{value}</dd>
    </div>
  )
}

function ItemsTable({ response }: { response: PortalQuoteResponse }) {
  const { t } = useTranslation()

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="border-gray-200 border-b px-6 py-4 dark:border-gray-700">
        <h2 className="font-semibold text-gray-900 text-sm dark:text-white">
          {t('quotePortal.items')}
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
              <th className="px-6 py-3 font-medium">{t('quotePortal.item')}</th>
              <th className="px-3 py-3 text-right font-medium">{t('quotePortal.qty')}</th>
              <th className="px-3 py-3 text-right font-medium">{t('quotePortal.unit_price')}</th>
              <th className="px-6 py-3 text-right font-medium">{t('quotePortal.amount')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {response.items.map((item) => (
              <tr key={`${item.name}-${item.sku ?? ''}-${item.quantity}`}>
                <td className="px-6 py-3">
                  <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                  {item.sku && <p className="text-gray-400 text-xs">SKU {item.sku}</p>}
                </td>
                <td className="px-3 py-3 text-right text-gray-700 dark:text-gray-300">
                  {item.quantity}
                </td>
                <td className="px-3 py-3 text-right text-gray-700 dark:text-gray-300">
                  {money(item.unit_price, response.currency)}
                </td>
                <td className="px-6 py-3 text-right font-medium text-gray-900 dark:text-white">
                  {money(item.line_total, response.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Totals({ response }: { response: PortalQuoteResponse }) {
  const { t } = useTranslation()

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <dl className="ml-auto max-w-sm space-y-1.5 text-sm">
        <Row
          label={t('quotePortal.subtotal')}
          value={money(response.subtotal, response.currency)}
        />
        <Row
          label={t('quotePortal.discount')}
          value={`− ${money(response.discount_amount, response.currency)}`}
        />
        <Row label={t('quotePortal.tax')} value={money(response.tax_amount, response.currency)} />
        <Row
          label={t('quotePortal.shipping')}
          value={money(response.shipping_amount, response.currency)}
        />
        <div className="flex items-center justify-between border-gray-200 border-t pt-2 dark:border-gray-700">
          <dt className="font-semibold text-gray-900 dark:text-white">{t('quotePortal.total')}</dt>
          <dd className="font-bold text-gray-900 text-lg dark:text-white">
            {money(response.total_amount, response.currency)}
          </dd>
        </div>
      </dl>
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="font-medium text-gray-900 dark:text-gray-200">{value}</dd>
    </div>
  )
}

function logisticsRows(response: PortalQuoteResponse, t: TFunction): Array<[string, string]> {
  return [...commercialRows(response, t), ...packingRows(response, t)]
}

function commercialRows(response: PortalQuoteResponse, t: TFunction): Array<[string, string]> {
  const rows: Array<[string, string]> = []

  if (response.incoterm_label) {
    rows.push([
      t('quotePortal.incoterm'),
      response.incoterm_location
        ? `${response.incoterm} — ${response.incoterm_location}`
        : response.incoterm_label,
    ])
  }
  if (response.payment_terms_label) {
    rows.push([t('quotePortal.payment_terms'), response.payment_terms_label])
  }
  if (response.shipping_method_label) {
    rows.push([t('quotePortal.shipping_method'), response.shipping_method_label])
  }
  if (response.lead_time_days != null) {
    rows.push([
      t('quotePortal.lead_time'),
      t('quotePortal.lead_time_days', { days: response.lead_time_days }),
    ])
  }
  if (response.estimated_ship_date) {
    rows.push([t('quotePortal.dispatch'), formatDate(response.estimated_ship_date)])
  }

  return rows
}

function packingRows(response: PortalQuoteResponse, t: TFunction): Array<[string, string]> {
  const rows: Array<[string, string]> = []

  if (response.country_of_origin) {
    rows.push([t('quotePortal.origin'), response.country_of_origin])
  }
  if (response.hs_code) rows.push([t('quotePortal.hs_code'), response.hs_code])
  if (response.package_count != null) {
    rows.push([t('quotePortal.packages'), String(response.package_count)])
  }
  if (response.gross_weight_kg != null || response.net_weight_kg != null) {
    rows.push([
      t('quotePortal.weight'),
      `${response.gross_weight_kg ?? '—'} / ${response.net_weight_kg ?? '—'} kg`,
    ])
  }
  if (response.package_dimensions) {
    rows.push([t('quotePortal.dimensions'), response.package_dimensions])
  }
  if (response.warranty_months) {
    rows.push([
      t('quotePortal.warranty'),
      t('quotePortal.warranty_months', { months: response.warranty_months }),
    ])
  }
  if (response.partial_shipment_allowed === false) {
    rows.push([t('quotePortal.partial_shipments'), t('quotePortal.not_allowed')])
  }

  return rows
}

function Logistics({ response }: { response: PortalQuoteResponse }) {
  const { t } = useTranslation()
  const rows = logisticsRows(response, t)

  if (rows.length === 0) return null

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-3 font-semibold text-gray-900 text-sm dark:text-white">
        {t('quotePortal.commercial')}
      </h2>
      <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-4">
            <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
            <dd className="text-right font-medium text-gray-900 dark:text-white">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
