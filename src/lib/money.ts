/**
 * Money formatting — single implementation for the storefront.
 *
 * Defaults to PKR (this is a Pakistan-first store): an order/cart payload that
 * omits `currency` must never display as USD.
 */
export function formatMoney(
  value: number | string | null | undefined,
  currency?: string | null
): string {
  const num = Number(value)
  if (!Number.isFinite(num)) return '—'

  const code = currency?.trim() || 'PKR'
  return `${code} ${num.toLocaleString()}`
}
