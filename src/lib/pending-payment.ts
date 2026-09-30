/**
 * The hosted-checkout hand-off.
 *
 * A gateway redirects the customer off-site and back again, so the return page
 * has no React state to fall back on. We stash which payment we just started in
 * `sessionStorage` (deliberately not `localStorage`: this is per-tab, short-lived
 * state) and reconcile it on return.
 *
 * The gateway's own query parameters are never trusted — they are useful for
 * showing the right screen, but the payment status always comes from the API.
 */

const STORAGE_KEY = 'htashop.pending_payment'

/** A hand-off older than this is stale; the customer has clearly moved on. */
const MAX_AGE_MS = 24 * 60 * 60 * 1000

export interface PendingPayment {
  paymentUuid: string
  orderUuid: string
  orderNumber: string | null
  paymentMethod: string
  /** Epoch millis, used to expire stale hand-offs. */
  startedAt: number
}

/** `sessionStorage` throws in private-mode/Safari and when storage is blocked. */
function storage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null
    return window.sessionStorage
  } catch {
    return null
  }
}

function isPendingPayment(value: unknown): value is PendingPayment {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.paymentUuid === 'string' &&
    candidate.paymentUuid.length > 0 &&
    typeof candidate.orderUuid === 'string' &&
    candidate.orderUuid.length > 0 &&
    typeof candidate.paymentMethod === 'string' &&
    typeof candidate.startedAt === 'number'
  )
}

export function rememberPendingPayment(
  payment: Omit<PendingPayment, 'startedAt'> & { startedAt?: number }
): void {
  const store = storage()
  if (!store) return

  const record: PendingPayment = { ...payment, startedAt: payment.startedAt ?? Date.now() }

  try {
    store.setItem(STORAGE_KEY, JSON.stringify(record))
  } catch {
    // Storage full or blocked — the return page falls back to the plain
    // "thank you" screen, which is a degraded but correct experience.
  }
}

/**
 * The most recent hand-off, or null when there is none (or it has expired).
 * Expired records are cleared so they cannot resurface later.
 */
export function readPendingPayment(now: number = Date.now()): PendingPayment | null {
  const store = storage()
  if (!store) return null

  let raw: string | null = null
  try {
    raw = store.getItem(STORAGE_KEY)
  } catch {
    return null
  }

  if (!raw) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    forgetPendingPayment()
    return null
  }

  if (!isPendingPayment(parsed) || now - parsed.startedAt > MAX_AGE_MS) {
    forgetPendingPayment()
    return null
  }

  return parsed
}

export function forgetPendingPayment(): void {
  const store = storage()
  if (!store) return

  try {
    store.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to do — an unremovable stale record still expires on its own.
  }
}
