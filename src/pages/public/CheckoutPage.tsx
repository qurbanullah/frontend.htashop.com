import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Loader2, Truck, Banknote, MapPin, ChevronRight, Package } from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { useAuthStore } from "@/stores/auth";
import { paths } from "@/routes/paths";
import { addressesApi, type AddressData } from "@/api/addresses";
import { ordersApi } from "@/api/orders";
import { isApiError } from "@/lib/api-response";
import { AddressFields, EMPTY_ADDRESS, type AddressFormValue } from "@/components/checkout/AddressFields";

function formatMoney(value: number | string | null | undefined, currency?: string | null) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return `${currency ?? "USD"} ${num.toLocaleString()}`;
}

function addressToForm(address: AddressData): AddressFormValue {
  return {
    contact_name: address.contact_name ?? "",
    phone: address.phone ?? "",
    address_line_1: address.address_line_1 ?? "",
    address_line_2: address.address_line_2 ?? "",
    city: address.city ?? "",
    city_id: address.city_id,
    state: address.state ?? "",
    postal_code: address.postal_code ?? "",
    country_id: address.country_id,
  };
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, currency, isLoading, sync, clear } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [shipping, setShipping] = useState<AddressFormValue>(EMPTY_ADDRESS);
  const [billingSame, setBillingSame] = useState(true);
  const [billing, setBilling] = useState<AddressFormValue>(EMPTY_ADDRESS);
  const [selectedAddressUuid, setSelectedAddressUuid] = useState("");
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: savedAddresses = [] } = useQuery({
    queryKey: ["my-addresses"],
    queryFn: () => addressesApi.list(),
    enabled: isAuthenticated,
  });

  const checkoutToken = useMemo(
    () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `co-${Date.now()}`),
    [],
  );

  const selectSavedAddress = (uuid: string) => {
    setSelectedAddressUuid(uuid);
    const address = savedAddresses.find((a) => a.uuid === uuid);
    if (address) setShipping(addressToForm(address));
  };

  const handlePlaceOrder = async () => {
    setError(null);

    if (!shipping.contact_name.trim() || !shipping.address_line_1.trim() || !shipping.country_id) {
      setError("Please complete the shipping address (contact name, address line 1 and country are required).");
      return;
    }
    if (!shipping.city.trim()) {
      setError("Please enter a city for the shipping address.");
      return;
    }

    const shippingAddress = {
      contact_name: shipping.contact_name,
      phone: shipping.phone || undefined,
      address_line_1: shipping.address_line_1,
      address_line_2: shipping.address_line_2 || undefined,
      city: shipping.city,
      state: shipping.state || undefined,
      postal_code: shipping.postal_code || undefined,
      country_id: shipping.country_id,
    };

    setPlacing(true);
    try {
      const result = await ordersApi.placeOrder({
        checkout_token: checkoutToken,
        payment_method: "cod",
        customer_name: user?.name || shipping.contact_name,
        customer_email: user?.email,
        customer_phone: shipping.phone || undefined,
        shipping_address: shippingAddress,
        billing_address: billingSame ? shippingAddress : {
          contact_name: billing.contact_name || undefined,
          phone: billing.phone || undefined,
          address_line_1: billing.address_line_1 || undefined,
          address_line_2: billing.address_line_2 || undefined,
          city: billing.city || undefined,
          state: billing.state || undefined,
          postal_code: billing.postal_code || undefined,
          country_id: billing.country_id || undefined,
        },
        notes: notes.trim() || undefined,
      });

      await clear();
      await sync();
      navigate(`${paths.orderConfirmation}/${result.order.uuid}/confirmation`);
    } catch (e) {
      if (isApiError(e)) {
        if (e.errors) {
          setError(Object.values(e.errors).flat()[0] || e.message);
        } else {
          setError(e.message);
        }
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Failed to place order. Please try again.");
      }
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0 && !isLoading) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-24 text-center">
        <ShoppingCart className="h-12 w-12 text-gray-300 dark:text-gray-600" />
        <h1 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Your cart is empty</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Add some products before checking out.</p>
        <Link to={paths.products} className="mt-6 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1920px] px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
        <Link to={paths.home} className="hover:text-gray-900 dark:hover:text-white">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to={paths.products} className="hover:text-gray-900 dark:hover:text-white">Products</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-gray-700 dark:text-gray-300">Checkout</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Checkout</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-12">
        {/* Left: details */}
        <div className="space-y-6 lg:col-span-8">
          {/* Shipping address */}
          <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
            {isAuthenticated && savedAddresses.length > 0 && (
              <div className="mb-4">
                <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Saved addresses</h3>
                <div className="flex flex-wrap gap-2">
                  {savedAddresses.map((address) => (
                    <button
                      key={address.uuid}
                      type="button"
                      onClick={() => selectSavedAddress(address.uuid)}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                        selectedAddressUuid === address.uuid
                          ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300"
                          : "border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      {address.label || `${address.city}, ${address.country?.name ?? ""}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AddressFields value={shipping} onChange={setShipping} title="Shipping address" />
          </div>

          {/* Billing */}
          <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={billingSame}
                onChange={(e) => setBillingSame(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Billing address same as shipping</span>
            </label>
            {!billingSame && (
              <div className="mt-4">
                <AddressFields value={billing} onChange={setBilling} title="Billing address" />
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Payment method</h3>
            <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/40 p-4 dark:border-blue-800 dark:bg-blue-950/20">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                  <Banknote className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Cash on Delivery</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Pay in cash when your order is delivered. Online payment (JazzCash, EasyPaisa, UPaisa, Safepay) coming soon.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
            <label className="text-sm font-semibold text-gray-900 dark:text-white">Order notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Delivery instructions, gate codes, etc."
              className="mt-2 w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Right: summary */}
        <div className="lg:col-span-4">
          <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Order summary</h3>
            <div className="mt-3 space-y-3">
              {items.map((item) => (
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatMoney(item.unit_price * item.quantity, currency)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm dark:border-gray-800">
              <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatMoney(subtotal, currency)}</span>
              </div>
              <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                <span>Shipping</span>
                <span>Calculated at delivery</span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 pt-2 text-base font-bold text-gray-900 dark:border-gray-800 dark:text-white">
                <span>Total</span>
                <span>{formatMoney(subtotal, currency)}</span>
              </div>
            </div>

            {error && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={placing || isLoading}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {placing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
              {placing ? "Placing order…" : "Place Order (Cash on Delivery)"}
            </button>
            <p className="mt-2 text-center text-xs text-gray-400">
              By placing your order you agree to our terms & conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
