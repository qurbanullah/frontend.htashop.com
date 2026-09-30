import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  HelpCircle,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { type PaymentStatus, paymentsApi } from '@/api/payments'
import { Seo } from '@/components/seo/Seo'
import { Alert, type AlertTone } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  forgetPendingPayment,
  type PendingPayment,
  readPendingPayment,
} from '@/lib/pending-payment'
import { paths } from '@/routes/paths'

/**
 * Where a hosted gateway sends the customer back.
 *
 * The gateway's query string is *not* trusted — a redirect parameter is a claim,
 * not a receipt. The status comes from the API, which reconciles against the
 * gateway itself, so a customer who closes the tab mid-payment still lands on a
 * truthful screen.
 *
 * Polls because the webhook may still be in flight when the browser arrives.
 */

const TERMINAL: PaymentStatus[] = ['paid', 'failed', 'cancelled', 'refunded']

const POLL_INTERVAL_MS = 2500
/** ~40s. Past that the gateway has not decided, and neither will we. */
const MAX_POLLS = 16

interface Props {
  mode: 'success' | 'cancel'
}

interface Outcome {
  tone: AlertTone
  icon: typeof CheckCircle2
  titleKey: string
  bodyKey: string
}

function waitingOutcome(): Outcome {
  return {
    tone: 'info',
    icon: Clock,
    titleKey: 'payment_return.confirming_title',
    bodyKey: 'payment_return.confirming_body',
  }
}

function outcomeForStatus(status: PaymentStatus): Outcome {
  switch (status) {
    case 'paid':
      return {
        tone: 'success',
        icon: CheckCircle2,
        titleKey: 'payment_return.paid_title',
        bodyKey: 'payment_return.paid_body',
      }
    case 'refunded':
      return {
        tone: 'info',
        icon: CheckCircle2,
        titleKey: 'payment_return.refunded_title',
        bodyKey: 'payment_return.refunded_body',
      }
    case 'failed':
      return {
        tone: 'error',
        icon: XCircle,
        titleKey: 'payment_return.failed_title',
        bodyKey: 'payment_return.failed_body',
      }
    case 'cancelled':
      return {
        tone: 'warning',
        icon: AlertTriangle,
        titleKey: 'payment_return.cancelled_title',
        bodyKey: 'payment_return.cancelled_body',
      }
    default:
      return {
        tone: 'warning',
        icon: Clock,
        titleKey: 'payment_return.pending_title',
        bodyKey: 'payment_return.pending_body',
      }
  }
}

/** Icon tint per tone — kept out of the JSX so the markup stays flat. */
function iconColorClass(tone: AlertTone): string {
  if (tone === 'success') return 'h-14 w-14 text-green-500'
  if (tone === 'error') return 'h-14 w-14 text-red-500'
  return 'h-14 w-14 text-orange-500'
}

function PaymentFacts({
  pending,
  status,
  statusUnknown,
}: {
  pending: PendingPayment
  status: PaymentStatus | undefined
  statusUnknown: boolean
}) {
  const { t } = useTranslation()

  const statusLabel = statusUnknown
    ? t('payment_return.status_unknown')
    : status
      ? t(`payment_return.status_${status}`)
      : t('payment_return.status_checking')

  return (
    <dl className="mt-6 w-full space-y-2 rounded-xl border border-gray-200 p-4 text-start text-sm dark:border-gray-800">
      {pending.orderNumber && (
        <div className="flex items-center justify-between gap-4">
          <dt className="text-gray-500 dark:text-gray-400">
            {t('payment_return.order_number_label')}
          </dt>
          <dd className="font-medium text-gray-900 dark:text-white">{pending.orderNumber}</dd>
        </div>
      )}
      <div className="flex items-center justify-between gap-4">
        <dt className="text-gray-500 dark:text-gray-400">{t('payment_return.status_label')}</dt>
        <dd className="font-medium text-gray-900 capitalize dark:text-white">{statusLabel}</dd>
      </div>
    </dl>
  )
}

interface ActionsProps {
  orderUrl: string | null
  canRetry: boolean
  stillChecking: boolean
  isFetching: boolean
  onRefresh: () => void
}

function ResultActions({ orderUrl, canRetry, stillChecking, isFetching, onRefresh }: ActionsProps) {
  const { t } = useTranslation()

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
      {stillChecking && (
        <Button type="button" variant="outline" onClick={onRefresh} disabled={isFetching}>
          <RefreshCw
            className={isFetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'}
            aria-hidden="true"
          />
          {t('payment_return.check_again')}
        </Button>
      )}

      {orderUrl && (
        <Button asChild>
          <Link to={orderUrl}>{t('payment_return.view_order')}</Link>
        </Button>
      )}

      {canRetry && (
        <Button asChild variant={orderUrl ? 'outline' : 'default'}>
          <Link to={paths.checkout}>{t('payment_return.try_again')}</Link>
        </Button>
      )}

      <Button asChild variant="ghost">
        <Link to={paths.products}>{t('buttons.continue_shopping')}</Link>
      </Button>
    </div>
  )
}

export default function PaymentReturnPage({ mode }: Props) {
  const { t } = useTranslation()

  // Read once: the record is cleared as soon as the gateway has decided.
  const pending = useMemo(() => readPendingPayment(), [])
  const polls = useRef(0)

  const { data, isError, isFetching, refetch } = useQuery({
    queryKey: ['payment-status', pending?.paymentUuid],
    queryFn: async () => {
      polls.current += 1
      return paymentsApi.get(pending?.paymentUuid as string, { refresh: true })
    },
    enabled: Boolean(pending),
    retry: 1,
    gcTime: 0,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status && TERMINAL.includes(status)) return false
      return polls.current >= MAX_POLLS ? false : POLL_INTERVAL_MS
    },
  })

  const resolved = Boolean(data && TERMINAL.includes(data.status))

  useEffect(() => {
    if (resolved) forgetPendingPayment()
  }, [resolved])

  const stillChecking = Boolean(pending) && !resolved && !isError && polls.current < MAX_POLLS

  const outcome = useMemo<Outcome>(() => {
    if (!pending) {
      // Nothing in flight: the customer may have arrived here directly.
      const cancelMode = mode === 'cancel'
      return {
        tone: 'warning',
        icon: HelpCircle,
        titleKey: cancelMode ? 'payment_return.cancelled_title' : 'payment_return.missing_title',
        bodyKey: cancelMode ? 'payment_return.cancelled_body' : 'payment_return.missing_body',
      }
    }

    if (isError) {
      return {
        tone: 'warning',
        icon: AlertTriangle,
        titleKey: 'payment_return.unknown_title',
        bodyKey: 'payment_return.unknown_body',
      }
    }

    if (!data && !stillChecking) return outcomeForStatus('pending')
    if (!data) return waitingOutcome()

    return outcomeForStatus(data.status)
  }, [pending, mode, isError, data, stillChecking])

  const Icon = outcome.icon
  const orderUrl = pending ? `${paths.orderConfirmation}/${pending.orderUuid}/confirmation` : null
  const canRetry = outcome.tone === 'error' || outcome.tone === 'warning'

  return (
    <div className="shell-narrow mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <Seo title={t('payment_return.seo_title')} noindex />

      <nav
        className="mb-6 flex flex-wrap items-center gap-1 text-gray-500 text-sm dark:text-gray-400"
        aria-label={t('breadcrumb.label')}
      >
        <Link to={paths.home} className="hover:text-gray-900 dark:hover:text-white">
          {t('breadcrumb.home')}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
        <span className="text-gray-700 dark:text-gray-300">{t('payment_return.breadcrumb')}</span>
      </nav>

      <div className="mx-auto max-w-2xl">
        <div
          className="flex flex-col items-center text-center"
          aria-live="polite"
          aria-busy={stillChecking}
        >
          <div className="flex h-16 w-16 items-center justify-center">
            {stillChecking ? (
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" aria-hidden="true" />
            ) : (
              <Icon className={iconColorClass(outcome.tone)} aria-hidden="true" />
            )}
          </div>

          <h1 className="mt-4 font-bold text-2xl text-gray-900 dark:text-white">
            {t(outcome.titleKey)}
          </h1>
          <p className="mt-2 text-gray-600 text-sm dark:text-gray-300">{t(outcome.bodyKey)}</p>

          {pending && (
            <PaymentFacts pending={pending} status={data?.status} statusUnknown={isError} />
          )}

          {!pending && (
            <Alert tone={outcome.tone} className="mt-6 text-start">
              {t('payment_return.missing_hint')}
            </Alert>
          )}

          {isError && (
            <Alert tone="info" className="mt-6 text-start">
              {t('payment_return.unknown_hint')}
            </Alert>
          )}

          <ResultActions
            orderUrl={orderUrl}
            canRetry={canRetry}
            stillChecking={stillChecking}
            isFetching={isFetching}
            onRefresh={() => void refetch()}
          />
        </div>
      </div>
    </div>
  )
}
