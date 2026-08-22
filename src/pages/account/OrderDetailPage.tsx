import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  MapPin,
  CreditCard,
  Loader2,
  ShoppingCart,
  Check,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { accountApi } from "@/api/account";
import { useCartStore } from "@/stores/cart";
import { paths } from "@/routes/paths";
import { useToast } from "@/components/ui/Toaster";
import { EmptyState } from "@/components/ui/empty-state";

function formatMoney(value: number | string | null | undefined, currency?: string | null) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return `${currency ?? "USD"} ${num.toLocaleString()}`;
}

const TIMELINE = ["pending", "confirmed", "processing", "shipped", "delivered"];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  processing: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  shipped: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  refunded: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export default function OrderDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const { success: showSuccess, error: showError } = useToast();
  const addToCart = useCartStore((s) => s.addItem);

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["account-order", uuid],
    queryFn: () => accountApi.order(uuid ?? ""),
    enabled: Boolean(uuid),
  });

  const handleReorder = async () => {
    if (!order?.items?.length) return;
    const reorderable = order.items.filter((item) => item.product_id != null);
    if (reorderable.length === 0) {
      showError("No reorderable items found");
      return;
    }
    try {
      for (const item of reorderable) {
        await addToCart({
          product_id: item.product_id!,
          variant_id: item.variant_id ?? null,
          quantity: Math.max(1, Math.round(Number(item.quantity) || 1)),
        });
      }
      showSuccess("Items added to your cart");
    } catch {
      showError("Some items could not be added to the cart");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <EmptyState
        icon={Package}
        title="Order not found"
        description="This order may not exist or you may not have access to it."
        action={{ label: "Back to orders", onClick: () => (window.location.href = paths.accountOrders) }}
      />
    );
  }

  const statusIndex = TIMELINE.indexOf(order.status);
  const isTerminal = order.status === "cancelled" || order.status === "refunded";
  const primaryPayment = order.payment?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link to={paths.accountOrders} className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to orders
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{order.order_number}</h1>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[order.status] ?? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}>
            {order.status_label ?? order.status}
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Placed on {order.placed_at ? new Date(order.placed_at).toLocaleString() : "—"}
        </p>
      </div>

      {/* Status timeline */}
      {!isTerminal && statusIndex >= 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center">
            {TIMELINE.map((step, index) => (
              <div key={step} className={`flex items-center ${index < TIMELINE.length - 1 ? "flex-1" : ""}`}>
                <div className="flex flex-col items-center">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                    index < statusIndex
                      ? "bg-green-500 text-white"
                      : index === statusIndex
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-500 dark:bg-gray-700"
                  }`}>
                    {index < statusIndex ? <Check className="h-4 w-4" /> : index + 1}
                  </div>
                  <span className={`mt-2 hidden text-xs font-medium sm:block ${index <= statusIndex ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
                    {step.charAt(0).toUpperCase() + step.slice(1)}
                  </span>
                </div>
                {index < TIMELINE.length - 1 && (
                  <div className={`mx-2 mb-5 h-0.5 flex-1 ${index < statusIndex ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {isTerminal && (
        <div className={`rounded-2xl border p-5 text-sm font-medium ${
          order.status === "cancelled"
            ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400"
            : "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
        }`}>
          This order has been {order.status}.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">Items ({order.items?.length ?? 0})</h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {(order.items ?? []).map((item) => (
                <div key={item.uuid} className="flex items-center gap-4 px-5 py-4">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="h-16 w-16 shrink-0 rounded-xl border border-gray-200 object-cover dark:border-gray-700" />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                      <Package className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium text-gray-900 dark:text-white">
                      {item.name}
                    </p>
                    {item.sku && <p className="mt-0.5 text-xs text-gray-400">SKU: {item.sku}</p>}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Qty: {item.quantity} × {formatMoney(item.unit_price, item.currency)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{formatMoney(item.total, item.currency)}</p>
                    {item.base_price != null && Number(item.base_price) > Number(item.unit_price) && (
                      <p className="text-xs text-gray-400 line-through">{formatMoney(item.base_price, item.currency)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-2 border-t border-gray-100 bg-gray-50/60 px-5 py-4 dark:border-gray-800 dark:bg-gray-900/50">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                <span>Subtotal</span><span>{formatMoney(order.subtotal, order.currency)}</span>
              </div>
              {Number(order.shipping_fee) > 0 && (
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                  <span>Shipping</span><span>{formatMoney(order.shipping_fee, order.currency)}</span>
                </div>
              )}
              {Number(order.tax) > 0 && (
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                  <span>Tax</span><span>{formatMoney(order.tax, order.currency)}</span>
                </div>
              )}
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>Discount</span><span>−{formatMoney(order.discount, order.currency)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900 dark:border-gray-700 dark:text-white">
                <span>Total</span><span>{formatMoney(order.total_amount, order.currency)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          {/* Payment */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Payment</h3>
            </div>
            {primaryPayment ? (
              <div className="mt-3 space-y-1.5 text-sm">
                <p className="text-gray-600 dark:text-gray-300">
                  {primaryPayment.payment_method_label ?? primaryPayment.payment_method}
                </p>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  primaryPayment.status === "paid" || primaryPayment.status === "completed"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                }`}>
                  {primaryPayment.status}
                </span>
                <p className="text-xs text-gray-400">Amount: {formatMoney(primaryPayment.amount, primaryPayment.currency)}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-gray-400">No payment recorded yet.</p>
            )}
          </div>

          {/* Shipping address */}
          {order.shipping_address && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Shipping address</h3>
              </div>
              <address className="mt-3 space-y-0.5 text-sm not-italic leading-relaxed text-gray-600 dark:text-gray-300">
                {order.shipping_address.contact_name && <p className="font-medium text-gray-900 dark:text-white">{order.shipping_address.contact_name}</p>}
                {order.shipping_address.address_line_1 && <p>{order.shipping_address.address_line_1}</p>}
                {order.shipping_address.address_line_2 && <p>{order.shipping_address.address_line_2}</p>}
                <p>
                  {[order.shipping_address.city, order.shipping_address.state, order.shipping_address.postal_code].filter(Boolean).join(", ")}
                </p>
                {order.shipping_address.country && <p>{order.shipping_address.country}</p>}
                {order.shipping_address.phone && <p className="pt-1">📞 {order.shipping_address.phone}</p>}
              </address>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <button
              onClick={handleReorder}
              disabled={order.status === "cancelled"}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              <ShoppingCart className="h-4 w-4" /> Reorder
            </button>
            <a
              href={`mailto:support@htashop.com?subject=${encodeURIComponent(`Help with order ${order.order_number}`)}`}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <FileText className="h-4 w-4" /> Order support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
