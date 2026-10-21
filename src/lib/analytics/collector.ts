import { getApiUrl } from '@/api/client'
import { useConsentStore } from '@/stores/consent'
import type { AnalyticsEvent, AnalyticsEventName } from './events'

/**
 * Consent-gated first-party analytics collector.
 *
 * Events are batched and sent with `keepalive` (or `sendBeacon` on page hide).
 * The collector never throws and never blocks the UI: an analytics failure is
 * invisible to the shopper.
 */

const ANONYMOUS_KEY = 'htashop-analytics-anon'
const SESSION_KEY = 'htashop-analytics-session'
const CAMPAIGN_KEY = 'htashop-analytics-campaign'
const SESSION_TTL_MS = 30 * 60 * 1000
const MAX_BATCH = 20
const MAX_QUEUE = 100
const FLUSH_DELAY_MS = 600

type EventContext = Record<string, unknown>

interface SessionRecord {
  id: string
  last: number
}

let queue: AnalyticsEvent[] = []
let timer: ReturnType<typeof setTimeout> | null = null
let flushing = false
let initialised = false

export function hasAnalyticsConsent(): boolean {
  return useConsentStore.getState().categories.analytics === true
}

export function getAnonymousId(): string {
  try {
    const existing = localStorage.getItem(ANONYMOUS_KEY)
    if (existing) return existing
  } catch {
    // Storage may be unavailable (private mode); fall through to a per-call id.
  }

  const id = randomId('anon')
  try {
    localStorage.setItem(ANONYMOUS_KEY, id)
  } catch {
    // ignore
  }

  return id
}

export function getSessionId(): string {
  const now = Date.now()

  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as SessionRecord
      if (parsed?.id && now - Number(parsed.last) < SESSION_TTL_MS) {
        parsed.last = now
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(parsed))
        return parsed.id
      }
    }
  } catch {
    // ignore
  }

  const id = randomId('sess')
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id, last: now }))
  } catch {
    // ignore
  }

  return id
}

/** Capture UTM/click ids at landing and keep them for the session. */
export function captureCampaign(): void {
  try {
    const params = new URLSearchParams(window.location.search)
    const campaign: Record<string, string> = {}

    for (const key of [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'gclid',
      'fbclid',
    ]) {
      const value = params.get(key)
      if (value) campaign[key] = value.slice(0, 200)
    }

    if (Object.keys(campaign).length > 0) {
      sessionStorage.setItem(CAMPAIGN_KEY, JSON.stringify(campaign))
    }
  } catch {
    // ignore
  }
}

export function getCampaign(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem(CAMPAIGN_KEY)
    const parsed = raw ? (JSON.parse(raw) as Record<string, string>) : null
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

/**
 * Queue one event. Safe to call from any component: it no-ops until analytics
 * consent is granted.
 */
export function track(eventName: AnalyticsEventName, context: EventContext = {}): void {
  if (!hasAnalyticsConsent()) return

  // Headless prerender/automation must never inflate demand metrics.
  if (typeof navigator !== 'undefined' && navigator.webdriver) return

  captureCampaign()

  queue.push({
    event_name: eventName,
    occurred_at: new Date().toISOString(),
    session_id: getSessionId(),
    anonymous_id: getAnonymousId(),
    source: 'web',
    context: {
      ...context,
      page: {
        ...(typeof context.page === 'object' && context.page ? context.page : {}),
        path: window.location.pathname,
        referrer_host: referrerHost(),
      },
      campaign: getCampaign(),
      consent: { analytics: true },
    },
  })

  if (queue.length > MAX_QUEUE) {
    queue = queue.slice(-MAX_QUEUE)
  }

  scheduleFlush()
}

export function initAnalytics(): void {
  if (initialised) return
  initialised = true

  captureCampaign()

  // `pagehide` fires on tab close/bfcache and is the reliable place to flush
  // the last batch. `visibilitychange` covers mobile backgrounding.
  window.addEventListener(
    'pagehide',
    () => {
      void flush()
    },
    { capture: true }
  )
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flush()
  })
}

async function flush(): Promise<void> {
  if (flushing || queue.length === 0) return

  flushing = true

  try {
    while (queue.length > 0) {
      const batch = queue.splice(0, MAX_BATCH)
      const body = JSON.stringify({ events: batch })

      await send(body)
    }
  } finally {
    flushing = false
  }
}

async function send(body: string): Promise<void> {
  const url = `${getApiUrl().replace(/\/$/, '')}/analytics/events`

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' })

      if (navigator.sendBeacon(url, blob)) return
    }
  } catch {
    // Fall through to fetch.
  }

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body,
      credentials: 'include',
      keepalive: true,
    })
  } catch {
    // Analytics must never break the storefront.
  }
}

function scheduleFlush(): void {
  if (timer !== null) return

  timer = setTimeout(() => {
    timer = null
    void flush()
  }, FLUSH_DELAY_MS)
}

function referrerHost(): string | null {
  try {
    return document.referrer ? new URL(document.referrer).hostname : null
  } catch {
    return null
  }
}

function randomId(prefix: string): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `${prefix}_${crypto.randomUUID()}`
    }
  } catch {
    // ignore
  }

  return `${prefix}_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}
