import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Package, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { accountApi } from "@/api/account";
import { paths } from "@/routes/paths";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";

const STATUS_FILTERS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  processing: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  shipped: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  refunded: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

function formatMoney(value: number | string | null | undefined, currency?: string | null) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return `${currency ?? "USD"} ${num.toLocaleString()}`;
}

function OrderStatusBadge({ status }: { status: string }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}>
      {label}
    </span>
  );
}

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["account-orders", search, status, page],
    queryFn: () => accountApi.orders({ search: search || undefined, status: status || undefined, page, per_page: 8 }),
    staleTime: 30 * 1000,
  });

  const orders = data?.data ?? [];
  const meta = data?.meta;

  const goToPage = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Orders</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Track, view, and manage everything you've ordered.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by order number…"
            className="h-10 pl-10"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 sm:w-52"
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders found"
          description={search || status ? "Try adjusting your search or filters." : "When you place an order, it will appear here."}
          action={search || status ? undefined : { label: "Start shopping", onClick: () => (window.location.href = paths.products) }}
        />
      ) : (
        <div className="space-y-3">
          {isFetching && <p className="text-xs text-gray-400">Updating…</p>}
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
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Placed {order.placed_at ? new Date(order.placed_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—"} · {order.items?.length ?? 0} item(s)
                </p>
              </div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">
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
            onClick={() => goToPage(meta.current_page - 1)}
            disabled={meta.current_page <= 1}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 disabled:opacity-40 dark:border-gray-700 dark:text-gray-200"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {meta.current_page} of {meta.last_page}
          </span>
          <button
            onClick={() => goToPage(meta.current_page + 1)}
            disabled={meta.current_page >= meta.last_page}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 disabled:opacity-40 dark:border-gray-700 dark:text-gray-200"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
