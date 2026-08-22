import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Package, MapPin, Banknote, ChevronRight, Home } from "lucide-react";
import { ordersApi, type Order } from "@/api/orders";
import { paths } from "@/routes/paths";

function formatMoney(value: number | string | null | undefined, currency?: string | null) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return `${currency ?? "USD"} ${num.toLocaleString()}`;
}

function addressLines(address: Order["shipping_address"]) {
  if (!address) return [];
  return [
    address.contact_name,
    [address.address_line_1, address.address_line_2].filter(Boolean).join(", "),
    [address.city, address.state, address.postal_code].filter(Boolean).join(", "),
    address.country,
  ].filter(Boolean) as string[];
}

export default function OrderConfirmationPage() {
  const { uuid } = useParams<{ uuid: string }>();

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["order", uuid],
    queryFn: () => ordersApi.get(uuid ?? ""),
    enabled: Boolean(uuid),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-24 text-center">
        <Package className="h-12 w-12 text-gray-300 dark:text-gray-600" />
        <h1 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Order not found</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">We could not find this order.</p>
        <Link to={paths.products} className="mt-6 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
          Browse products
        </Link>
      </div>
    );
  }

  const payment = order.payment?.[0] ?? null;

  return (
    <div className="mx-auto max-w-[1920px] px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
        <Link to={paths.home} className="hover:text-gray-900 dark:hover:text-white">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-gray-700 dark:text-gray-300">Order confirmation</span>
      </nav>

      {/* Success banner */}
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-900/50 dark:bg-green-900/20">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
        <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">Thank you! Your order is placed</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Order <span className="font-semibold text-gray-900 dark:text-white">{order.order_number}</span> —{" "}
          <span className="capitalize">{order.status_label}</span>
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          A confirmation has been sent to {order.customer_email || "your email"}. Our team will contact you shortly to confirm delivery.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Link
            to={paths.products}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <Home className="h-4 w-4" />
            Continue shopping
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        {/* Left: details */}
        <div className="space-y-6 lg:col-span-8">
          {/* Items */}
          <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Items ({order.items.length})</h2>
            <div className="mt-3 space-y-3">
              {order.items.map((item) => (
                <div key={item.uuid} className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-5 w-5 text-gray-300 dark:text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.sku ? `SKU: ${item.sku} · ` : ""}Qty: {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatMoney(item.total, item.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Addresses */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                <MapPin className="h-4 w-4 text-gray-400" />
                Shipping address
              </h3>
              <div className="mt-2 space-y-0.5 text-sm text-gray-600 dark:text-gray-300">
                {addressLines(order.shipping_address).map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                <Banknote className="h-4 w-4 text-gray-400" />
                Payment
              </h3>
              <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                {payment?.payment_method_label ?? "Cash on Delivery"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {payment?.status === "paid" ? "Paid" : "Pay on delivery"} ·{" "}
                {formatMoney(order.total_amount, order.currency)}
              </p>
            </div>
          </div>
        </div>

        {/* Right: summary */}
        <div className="lg:col-span-4">
          <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Order summary</h3>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatMoney(order.subtotal, order.currency)}</span>
              </div>
              {order.shipping_fee > 0 && (
                <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                  <span>Shipping</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatMoney(order.shipping_fee, order.currency)}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-gray-100 pt-2 text-base font-bold text-gray-900 dark:border-gray-800 dark:text-white">
                <span>Total</span>
                <span>{formatMoney(order.total_amount, order.currency)}</span>
              </div>
            </div>
            {order.notes && (
              <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                <span className="font-semibold">Notes:</span> {order.notes}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
