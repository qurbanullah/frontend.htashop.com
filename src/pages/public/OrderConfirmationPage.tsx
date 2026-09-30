import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  ChevronRight,
  Clock,
  Home,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { type Order, ordersApi } from '@/api/orders'
import { Seo } from '@/components/seo/Seo'
import { Alert, type AlertTone } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { isApiError } from '@/lib/api-response'
import { formatMoney } from '@/lib/money'
import { paths } from '@/routes/paths'

function addressLines(address: Order['shipping_address']) {
  if (!address) return []
  return [
    address.contact_name,
    [address.address_line_1, address.address_line_2].filter(Boolean).join(', '),
    [address.city, address.state, address.postal_code].filter(Boolean).join(', '),
    address.country,
  ].filter(Boolean) as string[]
}

/** Terminal payment states, plus the ones that need the customer to act. */
const PAYMENT_LABEL_KEYS: Record<string, string> = {
  paid: 'order_confirmation.payment_status_paid',
  pending: 'order_confirmation.payment_status_pending',
  authorized: 'order_confirmation.payment_status_authorized',
  failed: 'order_confirmation.payment_status_failed',
  cancelled: 'order_confirmation.payment_status_cancelled',
  refunded: 'order_confirmation.payment_status_refunded',
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: renders the full confirmation (status banner, line items, addresses, payment and totals) from one order payload; splitting it further would only shuffle the same branches
export default function OrderConfirmationPage() {
  const { t } = useTranslation()
  const { uuid } = useParams<{ uuid: string }>()

  const {
    data: order,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['order', uuid],
    queryFn: () => ordersApi.get(uuid ?? ''),
    enabled: Boolean(uuid),
  })

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" aria-hidden="true" />
      </div>
    )
  }

  if (isError || !order) {
    const unauthorized = isApiError(error) && (error.status === 401 || error.status === 403)
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-24 text-center">
        <Package className="h-12 w-12 text-gray-300 dark:text-gray-600" aria-hidden="true" />
        <h1 className="mt-4 font-semibold text-gray-900 text-lg dark:text-white">
          {unauthorized
            ? t('order_confirmation.sign_in_title')
            : t('order_confirmation.not_found_title')}
        </h1>
        <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
          {unauthorized
            ? t('order_confirmation.sign_in_body')
            : t('order_confirmation.not_found_body')}
        </p>
        <Link
          to={unauthorized ? paths.login : paths.products}
          className="mt-6 font-medium text-blue-600 text-sm hover:underline dark:text-blue-400"
        >
          {unauthorized ? t('order_confirmation.sign_in') : t('order_confirmation.browse')}
        </Link>
      </div>
    )
  }

  const payment = order.payment?.[0] ?? null
  const isPaid = payment?.status === 'paid'
  const isHostedPending =
    payment != null && payment.status === 'pending' && payment.payment_method !== 'cod'
  const paymentFailed = payment?.status === 'failed' || payment?.status === 'cancelled'

  /**
   * The banner must not congratulate a customer whose card was declined, or
   * whose bank has not confirmed yet — both are common and both need action.
   */
  const banner: { tone: AlertTone; icon: typeof CheckCircle2; titleKey: string; bodyKey: string } =
    paymentFailed
      ? {
          tone: 'warning',
          icon: AlertTriangle,
          titleKey: 'order_confirmation.payment_incomplete_title',
          bodyKey: 'order_confirmation.payment_incomplete_body',
        }
      : isHostedPending
        ? {
            tone: 'info',
            icon: Clock,
            titleKey: 'order_confirmation.awaiting_payment_title',
            bodyKey: 'order_confirmation.awaiting_payment_body',
          }
        : {
            tone: 'success',
            icon: CheckCircle2,
            titleKey: 'order_confirmation.thank_you',
            bodyKey: 'order_confirmation.email_sent',
          }

  const BannerIcon = banner.icon
  const paymentLabel = payment
    ? t(PAYMENT_LABEL_KEYS[payment.status] ?? 'order_confirmation.payment_status_pending')
    : t('order_confirmation.pay_on_delivery')

  return (
    <div className="shell-narrow mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <Seo title={t('order_confirmation.seo_title')} noindex />
      <nav
        className="mb-6 flex flex-wrap items-center gap-1 text-gray-500 text-sm dark:text-gray-400"
        aria-label={t('breadcrumb.label')}
      >
        <Link to={paths.home} className="hover:text-gray-900 dark:hover:text-white">
          {t('breadcrumb.home')}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
        <span className="text-gray-700 dark:text-gray-300">
          {t('breadcrumb.order_confirmation')}
        </span>
      </nav>

      {/* Status banner */}
      <Alert tone={banner.tone} className="flex-col items-center text-center">
        <div className="flex flex-col items-center py-2">
          <BannerIcon
            className={
              banner.tone === 'success'
                ? 'h-12 w-12 text-green-500'
                : banner.tone === 'info'
                  ? 'h-12 w-12 text-blue-500'
                  : 'h-12 w-12 text-orange-500'
            }
            aria-hidden="true"
          />

          <h1 className="mt-3 font-bold text-2xl text-gray-900 dark:text-white">
            {t(banner.titleKey)}
          </h1>

          <p className="mt-2 text-gray-600 text-sm dark:text-gray-300">
            {t(banner.bodyKey, {
              email: order.customer_email || t('order_confirmation.your_email'),
            })}
          </p>

          <p className="mt-2 text-gray-500 text-sm dark:text-gray-400">
            {t('order_confirmation.order_line', {
              number: order.order_number,
              status: order.status_label,
            })}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            {(isHostedPending || paymentFailed) && (
              <Button
                type="button"
                variant="outline"
                onClick={() => void refetch()}
                disabled={isFetching}
              >
                <RefreshCw
                  className={isFetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'}
                  aria-hidden="true"
                />
                {t('order_confirmation.refresh_status')}
              </Button>
            )}

            {paymentFailed && (
              <Button asChild>
                <Link to={paths.checkout}>{t('order_confirmation.retry_payment')}</Link>
              </Button>
            )}

            <Button asChild variant="ghost">
              <Link to={paths.products}>
                <Home className="h-4 w-4" aria-hidden="true" />
                {t('order_confirmation.continue_shopping')}
              </Link>
            </Button>
          </div>
        </div>
      </Alert>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        {/* Left: details */}
        <div className="space-y-6 lg:col-span-8">
          {/* Items */}
          <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
            <h2 className="font-semibold text-base text-gray-900 dark:text-white">
              {t('order_confirmation.items_heading', { count: order.items.length })}
            </h2>
            <ul className="mt-3 space-y-3">
              {order.items.map((item) => (
                <li key={item.uuid} className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package
                          className="h-5 w-5 text-gray-300 dark:text-gray-600"
                          aria-hidden="true"
                        />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900 text-sm dark:text-white">
                      {item.name}
                    </p>
                    <p className="text-gray-500 text-xs dark:text-gray-400">
                      {item.sku ? `SKU: ${item.sku} · ` : ''}
                      {t('checkout.qty', { count: item.quantity })}
                    </p>
                  </div>
                  <span className="font-medium text-gray-900 text-sm dark:text-white">
                    {formatMoney(item.total, item.currency)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Addresses and payment */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
              <h3 className="flex items-center gap-2 font-semibold text-gray-900 text-sm dark:text-white">
                <MapPin className="h-4 w-4 text-gray-400" aria-hidden="true" />
                {t('order_confirmation.shipping_address')}
              </h3>
              <div className="mt-2 space-y-0.5 text-gray-600 text-sm dark:text-gray-300">
                {addressLines(order.shipping_address).map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
              <h3 className="flex items-center gap-2 font-semibold text-gray-900 text-sm dark:text-white">
                <Banknote className="h-4 w-4 text-gray-400" aria-hidden="true" />
                {t('order_confirmation.payment')}
              </h3>
              <p className="mt-2 font-medium text-gray-900 text-sm dark:text-white">
                {payment?.payment_method_label ?? t('checkout.cod')}
              </p>
              <p className="text-gray-500 text-xs dark:text-gray-400">
                {isPaid ? t('order_confirmation.paid') : paymentLabel}
                {' · '}
                {formatMoney(order.total_amount, order.currency)}
              </p>
            </div>
          </div>
        </div>

        {/* Right: summary */}
        <div className="lg:col-span-4">
          <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 text-sm dark:text-white">
              {t('order_confirmation.order_summary')}
            </h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                <dt>{t('summary.subtotal')}</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {formatMoney(order.subtotal, order.currency)}
                </dd>
              </div>
              {order.shipping_fee > 0 && (
                <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                  <dt>{t('summary.shipping')}</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {formatMoney(order.shipping_fee, order.currency)}
                  </dd>
                </div>
              )}
              {order.tax > 0 && (
                <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                  <dt>{t('summary.tax')}</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {formatMoney(order.tax, order.currency)}
                  </dd>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                  <dt>{t('summary.discount')}</dt>
                  <dd className="font-medium text-green-700 dark:text-green-400">
                    −{formatMoney(order.discount, order.currency)}
                  </dd>
                </div>
              )}
              <div className="flex items-center justify-between border-gray-100 border-t pt-2 font-bold text-base text-gray-900 dark:border-gray-800 dark:text-white">
                <dt>{t('summary.total')}</dt>
                <dd>{formatMoney(order.total_amount, order.currency)}</dd>
              </div>
            </dl>

            {order.notes && (
              <div className="mt-4 rounded-lg bg-gray-50 p-3 text-gray-600 text-xs dark:bg-gray-800 dark:text-gray-300">
                <span className="font-semibold">{t('order_confirmation.notes')}</span> {order.notes}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
