import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Loader2, MapPin, Package, ShoppingBag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { accountApi } from '@/api/account'
import { addressesApi } from '@/api/addresses'
import { OrderStatusBadge } from '@/components/account/OrderStatusBadge'
import { EmptyState } from '@/components/ui/empty-state'
import { QueryErrorState } from '@/components/ui/query-error'
import { formatMoney } from '@/lib/money'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/stores/auth'

export default function AccountOverviewPage() {
  const { t, i18n } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  const {
    data: ordersData,
    isLoading: ordersLoading,
    isError: ordersError,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ['account-orders', 'recent'],
    queryFn: () => accountApi.orders({ per_page: 3 }),
    staleTime: 30 * 1000,
  })

  const { data: addresses = [], isLoading: addressesLoading } = useQuery({
    queryKey: ['account-addresses'],
    queryFn: () => addressesApi.list(),
    staleTime: 30 * 1000,
  })

  const orders = ordersData?.data ?? []
  const totalOrders = ordersData?.meta?.total ?? 0
  const firstName = user?.first_name || user?.name?.split(' ')[0] || 'there'
  const memberSince = user?.created_at ? new Date(user.created_at).getFullYear() : null

  const stats = [
    { icon: ShoppingBag, label: t('account.stat_total_orders'), value: String(totalOrders) },
    { icon: MapPin, label: t('account.stat_saved_addresses'), value: String(addresses.length) },
    {
      icon: Package,
      label: t('account.stat_member_since'),
      value: memberSince ? String(memberSince) : '—',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-r from-blue-50 via-white to-white p-6 sm:p-8 dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <h1 className="font-bold text-2xl text-gray-900 sm:text-3xl dark:text-white">
          {t('account.greeting', { name: firstName })}
        </h1>
        <p className="mt-2 text-gray-500 text-sm dark:text-gray-400">{t('account.welcome')}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-2xl text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-gray-500 text-sm dark:text-gray-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-lg dark:text-white">
            {t('account.recent_orders')}
          </h2>
          <Link
            to={paths.accountOrders}
            className="inline-flex items-center gap-1 font-medium text-blue-600 text-sm hover:underline dark:text-blue-400"
          >
            {t('account.view_all')} <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </Link>
        </div>

        {ordersError ? (
          <QueryErrorState title={t('account.orders_error')} onRetry={() => void refetchOrders()} />
        ) : ordersLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-gray-400" />
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title={t('account.orders_empty_title')}
            description={t('account.orders_empty_body')}
            action={{
              label: t('account.start_shopping'),
              onClick: () => navigate(paths.products),
            }}
          />
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.uuid}
                to={`${paths.accountOrders}/${order.uuid}`}
                className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                  <Package className="h-5 w-5 text-gray-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-900 dark:text-white">
                    {order.order_number}
                  </p>
                  <p className="mt-0.5 text-gray-500 text-xs dark:text-gray-400">
                    {order.placed_at
                      ? new Date(order.placed_at).toLocaleDateString(i18n.language)
                      : '—'}{' '}
                    · {t('account.items_count', { count: order.items?.length ?? 0 })}
                  </p>
                </div>
                <div className="hidden text-end sm:block">
                  <p className="font-bold text-gray-900 text-sm dark:text-white">
                    {formatMoney(order.total_amount, order.currency)}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to={paths.accountAddresses}
          className="group flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 transition-colors hover:border-blue-200 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-900"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {t('account.manage_addresses')}
              </p>
              <p className="text-gray-500 text-sm dark:text-gray-400">
                {addressesLoading
                  ? t('account.loading')
                  : t('account.saved_addresses_count', { count: addresses.length })}
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
        </Link>

        <Link
          to={paths.accountProfile}
          className="group flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 transition-colors hover:border-blue-200 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-900"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {t('account.profile_security')}
              </p>
              <p className="text-gray-500 text-sm dark:text-gray-400">
                {t('account.profile_security_body')}
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
        </Link>
      </div>
    </div>
  )
}
