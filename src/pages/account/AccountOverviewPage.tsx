import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Package, MapPin, ArrowRight, ShoppingBag, Loader2 } from "lucide-react";
import { accountApi } from "@/api/account";
import { addressesApi } from "@/api/addresses";
import { useAuthStore } from "@/stores/auth";
import { paths } from "@/routes/paths";
import { EmptyState } from "@/components/ui/empty-state";

function formatMoney(value: number | string | null | undefined, currency?: string | null) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return `${currency ?? "USD"} ${num.toLocaleString()}`;
}

function OrderStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    processing: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
    shipped: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    refunded: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}>
      {label}
    </span>
  );
}

export default function AccountOverviewPage() {
  const user = useAuthStore((s) => s.user);

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["account-orders", "recent"],
    queryFn: () => accountApi.orders({ per_page: 3 }),
    staleTime: 30 * 1000,
  });

  const { data: addresses = [], isLoading: addressesLoading } = useQuery({
    queryKey: ["account-addresses"],
    queryFn: () => addressesApi.list(),
    staleTime: 30 * 1000,
  });

  const orders = ordersData?.data ?? [];
  const totalOrders = ordersData?.meta.total ?? 0;
  const firstName = user?.first_name || user?.name?.split(" ")[0] || "there";
  const memberSince = user?.created_at ? new Date(user.created_at).getFullYear() : null;

  const stats = [
    { icon: ShoppingBag, label: "Total orders", value: String(totalOrders) },
    { icon: MapPin, label: "Saved addresses", value: String(addresses.length) },
    { icon: Package, label: "Member since", value: memberSince ? String(memberSince) : "—" },
  ];

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-r from-blue-50 via-white to-white p-6 dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
          Hello, {firstName} 👋
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Welcome back to your HTAShop account. Manage your orders, addresses, and profile.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent orders</h2>
          <Link to={paths.accountOrders} className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {ordersLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-gray-400" />
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No orders yet"
            description="When you place an order, it will appear here so you can track it."
            action={{ label: "Start shopping", onClick: () => (window.location.href = paths.products) }}
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
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {order.placed_at ? new Date(order.placed_at).toLocaleDateString() : "—"} · {order.items?.length ?? 0} item(s)
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
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
              <p className="font-semibold text-gray-900 dark:text-white">Manage addresses</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {addressesLoading ? "Loading…" : `${addresses.length} saved address(es)`}
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-1" />
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
              <p className="font-semibold text-gray-900 dark:text-white">Profile & security</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Update your details and password</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
