import { ChevronDown, Package, ShieldCheck, ShoppingBag, Truck } from 'lucide-react'
import type * as React from 'react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { CartItem } from '@/api/cart'
import type { CheckoutQuote } from '@/api/checkout'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'

interface Props {
  items: CartItem[]
  subtotal: number
  currency: string
  /**
   * Server-priced totals. Absent only while the first quote is in flight, or
   * when the quote could not be loaded — in which case the summary falls back
   * to the subtotal rather than inventing a delivery charge.
   */
  totals?: CheckoutQuote | null
  totalsLoading?: boolean
  /**
   * Phones get a collapsed summary (total first, items on demand); from `lg`
   * up it is the sticky sidebar.
   */
  collapsible?: boolean
  className?: string
  children?: React.ReactNode
}

function ItemRow({ item, currency }: { item: CartItem; currency: string }) {
  return (
    <li className="flex items-center gap-3">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
        {item.image_url ? (
          <img src={item.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-5 w-5 text-gray-300 dark:text-gray-600" aria-hidden="true" />
          </div>
        )}
        <span className="absolute -end-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-900 px-1 font-semibold text-[11px] text-white dark:bg-gray-100 dark:text-gray-900">
          {item.quantity}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-gray-900 text-sm dark:text-white">{item.name}</p>
        {item.variant_name && (
          <p className="truncate text-gray-500 text-xs dark:text-gray-400">{item.variant_name}</p>
        )}
      </div>

      <span className="shrink-0 font-medium text-gray-900 text-sm dark:text-white">
        {formatMoney(item.unit_price * item.quantity, currency)}
      </span>
    </li>
  )
}

interface TotalsProps {
  subtotal: number
  currency: string
  totals?: CheckoutQuote | null
  loading: boolean
}

/**
 * The money side of the summary.
 *
 * Every figure except the subtotal comes from the API's quote, so what the
 * customer reads here is exactly what the order will be charged. Until the
 * quote lands the delivery line says so, instead of showing a made-up number.
 */
function Totals({ subtotal, currency, totals, loading }: TotalsProps) {
  const { t } = useTranslation()

  const discount = totals?.discount ?? 0
  const tax = totals?.tax ?? 0
  const dutyEstimate = totals?.duty_estimate ?? 0
  const total = totals?.total ?? subtotal
  const remaining = totals?.amount_until_free_shipping ?? null

  const shippingValue = () => {
    if (loading && !totals) return <span className="text-gray-400">…</span>
    if (!totals) return t('summary.shipping_pending')
    if (totals.free_shipping) return t('summary.free')

    return formatMoney(totals.shipping_fee, currency)
  }

  return (
    <dl className="space-y-2 border-gray-100 border-t pt-4 text-sm dark:border-gray-800">
      <div className="flex items-center justify-between">
        <dt className="text-gray-600 dark:text-gray-300">{t('summary.subtotal')}</dt>
        <dd className="font-medium text-gray-900 dark:text-white">
          {formatMoney(subtotal, currency)}
        </dd>
      </div>

      <div className="flex items-center justify-between">
        <dt className="text-gray-600 dark:text-gray-300">{t('summary.shipping')}</dt>
        <dd
          className={cn(
            'text-gray-500 dark:text-gray-400',
            totals?.free_shipping && 'font-medium text-green-600 dark:text-green-400'
          )}
        >
          {shippingValue()}
        </dd>
      </div>

      {discount > 0 && (
        <div className="flex items-center justify-between">
          <dt className="text-gray-600 dark:text-gray-300">
            {t('summary.discount')}
            {totals?.coupon_code && (
              <span className="ms-1 font-mono text-gray-400 text-xs">{totals.coupon_code}</span>
            )}
          </dt>
          <dd className="font-medium text-green-600 dark:text-green-400">
            -{formatMoney(discount, currency)}
          </dd>
        </div>
      )}

      {tax > 0 && (
        <div className="flex items-center justify-between">
          <dt className="text-gray-600 dark:text-gray-300">{t('summary.tax')}</dt>
          <dd className="font-medium text-gray-900 dark:text-white">
            {formatMoney(tax, currency)}
          </dd>
        </div>
      )}

      {dutyEstimate > 0 && (
        <div className="flex items-center justify-between">
          <dt className="text-gray-600 dark:text-gray-300">{t('summary.duty_estimate')}</dt>
          <dd className="font-medium text-gray-900 dark:text-white">
            {formatMoney(dutyEstimate, currency)}
          </dd>
        </div>
      )}

      <div className="flex items-center justify-between border-gray-100 border-t pt-3 font-bold text-base text-gray-900 dark:border-gray-800 dark:text-white">
        <dt>{t('summary.total')}</dt>
        <dd>{formatMoney(total, currency)}</dd>
      </div>

      {dutyEstimate > 0 && (
        <p className="flex items-start gap-1.5 pt-1 text-amber-600 text-xs dark:text-amber-400">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {t('summary.duty_estimate_note')}
        </p>
      )}

      {remaining !== null && remaining > 0 && (
        <p className="flex items-start gap-1.5 pt-1 text-green-600 text-xs dark:text-green-400">
          <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {t('summary.free_shipping_progress', { amount: formatMoney(remaining, currency) })}
        </p>
      )}
    </dl>
  )
}

function Assurances() {
  const { t } = useTranslation()

  const items = [
    { icon: ShieldCheck, label: t('checkout.assurance_secure') },
    { icon: Truck, label: t('checkout.assurance_delivery') },
    { icon: ShoppingBag, label: t('checkout.assurance_returns') },
  ]

  return (
    <ul className="mt-4 space-y-2 border-gray-100 border-t pt-4 dark:border-gray-800">
      {items.map(({ icon: Icon, label }) => (
        <li
          key={label}
          className="flex items-center gap-2 text-gray-500 text-xs dark:text-gray-400"
        >
          <Icon
            className="h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400"
            aria-hidden="true"
          />
          {label}
        </li>
      ))}
    </ul>
  )
}

/** Running order summary, priced by the server. */
export function OrderSummaryPanel({
  items,
  subtotal,
  currency,
  totals = null,
  totalsLoading = false,
  collapsible = false,
  className,
  children,
}: Props) {
  const { t } = useTranslation()
  const detailsId = useId()
  const runningTotal = totals?.total ?? subtotal

  const itemList = (
    <ul className="space-y-3">
      {items.map((item) => (
        <ItemRow key={item.uuid} item={item} currency={currency} />
      ))}
    </ul>
  )

  if (collapsible) {
    return (
      <section
        aria-label={t('checkout.order_summary')}
        className={cn(
          'rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950',
          className
        )}
      >
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
            <ShoppingBag className="h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
            <span className="flex-1 font-semibold text-gray-900 text-sm dark:text-white">
              {t('checkout.summary_items_count', { count: items.length })}
            </span>
            <span className="font-bold text-gray-900 dark:text-white">
              {formatMoney(runningTotal, currency)}
            </span>
            <ChevronDown
              className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>

          <div className="border-gray-100 border-t p-4 dark:border-gray-800">
            {itemList}
            <Totals
              subtotal={subtotal}
              currency={currency}
              totals={totals}
              loading={totalsLoading}
            />
            <Link
              to={paths.products}
              className="mt-3 inline-block font-medium text-blue-600 text-xs hover:underline dark:text-blue-400"
            >
              {t('checkout.edit_cart')}
            </Link>
          </div>
        </details>

        {children && (
          <div className="border-gray-100 border-t p-4 dark:border-gray-800">{children}</div>
        )}
      </section>
    )
  }

  return (
    <section
      aria-label={t('checkout.order_summary')}
      className={cn(
        'rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950',
        className
      )}
      id={detailsId}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 text-sm dark:text-white">
          {t('checkout.summary_items_count', { count: items.length })}
        </h2>
        <Link
          to={paths.products}
          className="font-medium text-blue-600 text-xs hover:underline dark:text-blue-400"
        >
          {t('checkout.edit_cart')}
        </Link>
      </div>

      <div className="mt-4">{itemList}</div>
      <Totals subtotal={subtotal} currency={currency} totals={totals} loading={totalsLoading} />
      <Assurances />

      {children && <div className="mt-5">{children}</div>}
    </section>
  )
}
