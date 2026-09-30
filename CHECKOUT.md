# Checkout

The storefront checkout: a three-step flow over one source of truth, with
server-driven payment methods and a reconciliating return from hosted gateways.

## The flow

```
/checkout
  ┌ Information ─┬─ Payment ─┬─ Review ─┐        → place order
  │ email,       │ billing,  │ read-only│
  │ shipping     │ method,   │ recap    │
  │ address      │ notes     │          │
  └──────────────┴───────────┴──────────┘
/checkout/success | /checkout/cancel        → reconcile with the API
```

| Step | Validated by | Files |
| --- | --- | --- |
| Information | `informationStepSchema` | `components/checkout/InformationStep.tsx`, `AddressFields`, `CountrySelect`, `CityField` |
| Payment | `paymentStepSchema` | `components/checkout/PaymentStep.tsx`, `PaymentMethodSelector`, `CouponField` |
| Review | `reviewStepSchema` | `components/checkout/ReviewStep.tsx` |

The page itself (`pages/public/CheckoutPage.tsx`) owns only the step machine,
the values, and the submit hand-off. Everything visual lives in
`components/checkout/`.

### Why steps rather than one long form

- Validation is per step (`lib/checkout-schema.ts`), so nobody is shown an error
  for a field they have not reached.
- The progress bar doubles as navigation: completed steps are clickable, so the
  customer corrects the address from the review screen instead of losing the
  form.
- Errors are surfaced as an inline `Alert` and focus moves to the first invalid
  field, rather than a toast that disappears.

## Payment methods are server-driven

`GET /payments/methods?currency=…` decides what is offered. Nothing in the
storefront hard-codes a gateway:

- Turning a gateway on in `api/config/payment.php` makes it appear here.
- Cash on Delivery is always present — the API keeps it available even when
  every hosted gateway is off — so the list is never empty.
- A selection that is no longer offered (config changed between visits) falls
  back to the first returned method via `fallbackPaymentMethod()`.

## Hosted gateways: the hand-off

A gateway sends the customer off-site and back, so there is no React state to
return to:

1. Before `window.location.assign(redirectUrl)` the payment UUID, order UUID,
   order number and method are written to `sessionStorage`
   (`lib/pending-payment.ts`). Records expire after 24 hours and survive
   storage being unavailable.
2. The gateway returns to `/checkout/success` or `/checkout/cancel`, which are
   `paths.checkoutSuccess` / `paths.checkoutCancel`. **Keep these in step with
   `PAYMENT_SUCCESS_URL` / `PAYMENT_CANCEL_URL` in the API's
   `config/payment.php`.**
3. `PaymentReturnPage` polls `GET /payments/{uuid}?refresh=1` (~2.5s, stopped
   after ~40s or on a terminal status), because the webhook may still be in
   flight when the browser arrives. The gateway's own query string is never
   trusted — a redirect parameter is a claim, not a receipt.
4. The record is cleared once the gateway has decided, so a refresh cannot
   re-poll a finished payment.

If the gateway cannot be reached at checkout the API returns `payment_error`.
The storefront stays on the review step, says the order is saved, and lets the
customer retry: the same `checkout_token` re-opens the session server-side.

## Totals are priced by the server

The checkout screen never computes money. `OrderSummaryPanel` renders whatever
`POST /checkout/quote` returns — subtotal, delivery, tax, any discount and the
total — so the figure the customer reads is the figure the order is created
with. Until the first quote lands, or if it fails, the delivery line says
"calculated at checkout" rather than showing a made-up number.

The API is authoritative: `shipping_fee`, `tax` and `discount` are **not** read
from the request — a payload that sends them is ignored. The rules live in
`api/config/shipping.php` (per-currency flat rate and free-over threshold) and
the coupon table; see `api/app/Services/Checkout/`.

### Discount codes

`CouponField` (rendered from `PaymentStep`) feeds `values.coupon_code`. The code
is validated as it settles — `useDebouncedValue` plus a second quote query keyed
on the code — so an unusable code is reported before the review step. A rejected
code arrives as an `ApiError` whose `errors.coupon_code[0]` is a stable reason
token (`coupon_expired`, `coupon_min_order`, …), never prose;
`lib/coupon-error.ts` maps it to an i18n key. Because the baseline quote is a
separate query, a bad code does not blank the shipping and total the customer
was already reading.

The same principle drives the confirmation banner: it congratulates only a paid
(or COD) order. A pending hosted payment says we are waiting on the bank, and a
failed one says so with a retry action — instead of the unconditional "thank
you" that would mislead a customer whose card was declined.

## Accessibility

- Steps are an `<ol>` with `aria-current="step"`, and the step name is announced
  via a visually hidden `step_of` line.
- Every input is bound to its label; the address groups namespace their DOM ids
  by prefix (`shipping-`, `billing-`) so two groups on one page cannot collide.
- Invalid fields carry `aria-invalid` + `aria-describedby`; errors use
  `role="alert"`. Focus moves to the first invalid field when a step is blocked.
- The payment choice is a `fieldset`/`legend` with real radio inputs (visually
  styled), so it works with a keyboard and a screen reader.
- On phones the summary collapses into a native `<details>` and appears above
  the form.
- Directional utilities are logical (`pe-`, `start-`), so the Urdu RTL layout
  mirrors correctly.

## i18n

Every string is keyed; validation messages are **i18n keys** returned from zod
(`lib/checkout-schema.ts`) and translated at the edge. Adding a key to
`en/common.json` requires the same key in `ur/` and `de/` — `src/i18n/locales.test.ts`
fails the build otherwise, and also rejects empty or placeholder values.

## Tests

```bash
npm test            # vitest — includes the checkout suite
npm run type-check  # tsc
npm run lint        # biome
```

- `src/lib/checkout-schema.test.ts` — step gating, phone formats, guest-only
  email, conditional billing, error scoping.
- `src/lib/coupon-error.test.ts` — coupon reason tokens map to translation keys,
  with a generic fallback for anything unrecognised.
- `src/lib/pending-payment.test.ts` — hand-off round-trip, expiry, malformed
  records, storage unavailable.
- `src/lib/address.test.ts` — form mapping and order-snapshot payloads.

## Adding a gateway

Nothing to do here. Add the driver in the API, enable it in
`api/config/payment.php`, and it appears in the payment step with the label the
API returns. `requires_redirect` decides whether the customer is sent away or
the order completes in place.
