/**
 * First-party product-analytics event names.
 *
 * Keep this list in sync with `App\Enums\Analytics\EventName` in the API.
 * `purchase` and `refund` are deliberately absent: money events are emitted
 * server-side from the committed order.
 */
export type AnalyticsEventName =
  | 'page_view'
  | 'product_view'
  | 'product_impression'
  | 'search'
  | 'search_click'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'begin_checkout'
  | 'add_payment_info'
  | 'stock_out_view'
  | 'review_submitted'
  | 'coupon_rejected'

export interface AnalyticsEvent {
  event_name: AnalyticsEventName
  occurred_at: string
  session_id: string
  anonymous_id: string
  source: 'web'
  context: Record<string, unknown>
}
