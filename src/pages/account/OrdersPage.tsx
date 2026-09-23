import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Loader2, Package, Search } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { accountApi } from '@/api/account'
import { OrderStatusBadge } from '@/components/account/OrderStatusBadge'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { QueryErrorState } from '@/components/ui/query-error'
import { formatMoney } from '@/lib/money'
import { paths } from '@/routes/paths'

const STATUS_FILTERS = [
  { value: '', labelKey: 'account.status.all' },
  { value: 'pending', labelKey: 'account.status.pending' },
  { value: 'confirmed', labelKey: 'account.status.confirmed' },
  { value: 'processing', labelKey: 'account.status.processing' },
  { value: 'shipped', labelKey: 'account.status.shipped' },
  { value: 'delivered', labelKey: 'account.status.delivered' },
  { value: 'cancelled', labelKey: 'account.status.cancelled' },
  { value: 'refunded', labelKey: 'account.status.refunded' },
]

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: a filterable, paginated order list with distinct loading/error/empty/ready states is inherently branch-heavy; the states share this one query and are not worth splitting further
export default function OrdersPage() {
  const { t, i18n } = useTranslation()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const navigate = useNavigate()

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['account-orders', search, status, page],
    queryFn: () =>
      accountApi.orders({
        search: search || undefined,
        status: status || undefined,
        page,
        per_page: 8,
      }),
    staleTime: 30 * 1000,
  })

  const orders = data?.data ?? []
  const meta = data?.meta

  const goToPage = (p: number) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-gray-900 dark:text-white">
          {t('account.orders_title')}
        </h1>
        <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
          {t('account.orders_subtitle')}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder={t('account.orders_search_placeholder')}
            className="h-10 ps-10"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
          className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm sm:w-52 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s.value} value={s.value}>
              {t(s.labelKey)}
            </option>
          ))}
        </select>
      </div>

      {isError ? (
        <QueryErrorState title={t('account.orders_error')} onRetry={() => void refetch()} />
      ) : isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title={t('account.orders_empty_title')}
          description={
            search || status ? t('account.orders_empty_filtered') : t('account.orders_empty_body')
          }
          action={
            search || status
              ? undefined
              : { label: t('account.start_shopping'), onClick: () => navigate(paths.products) }
          }
        />
      ) : (
        <div className="space-y-3">
          {isFetching && <p className="text-gray-400 text-xs">{t('account.orders_updating')}</p>}
          {orders.map((order) => (
            <Link
              key={order.uuid}
              to={`${paths.accountOrders}/${order.uuid}`}
              className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md sm:flex-row sm:items-center dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                <Package className="h-5 w-5 text-gray-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">{order.order_number}</p>
                <p className="mt-0.5 text-gray-500 text-xs dark:text-gray-400">
                  {t('account.orders_placed_on', {
                    date: order.placed_at
                      ? new Date(order.placed_at).toLocaleDateString(i18n.language, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—',
                    count: order.items?.length ?? 0,
                  })}
                </p>
              </div>
              <div className="font-bold text-gray-900 text-sm dark:text-white">
                {formatMoney(order.total_amount, order.currency)}
              </div>
              <OrderStatusBadge status={order.status} />
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => goToPage(meta.current_page - 1)}
            disabled={meta.current_page <= 1}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-300 px-3 font-medium text-gray-700 text-sm disabled:opacity-40 dark:border-gray-700 dark:text-gray-200"
          >
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" /> {t('account.previous')}
          </button>
          <span className="text-gray-500 text-sm dark:text-gray-400">
            {t('account.page_of', {
              current: meta.current_page,
              total: meta.last_page,
            })}
          </span>
          <button
            type="button"
            onClick={() => goToPage(meta.current_page + 1)}
            disabled={meta.current_page >= meta.last_page}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-300 px-3 font-medium text-gray-700 text-sm disabled:opacity-40 dark:border-gray-700 dark:text-gray-200"
          >
            {t('account.next')} <ChevronRight className="h-4 w-4 rtl:rotate-180" />
          </button>
        </div>
      )}
    </div>
  )
}
