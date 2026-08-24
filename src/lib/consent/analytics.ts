import type { ConsentCategories } from '@/lib/consent/constants'

/**
 * Consent-gated tracker management.
 *
 * No non-essential script may load or send data before the user has
 * consented. This module is the single gatekeeper for:
 *
 *   analytics → Sentry (errors/tracing/replay), Google Analytics 4
 *   marketing → Meta (Facebook) Pixel
 *   necessary/preferences → no scripts (theme/language live in localStorage)
 *
 * `applyConsent()` is called at boot with the persisted choice and again
 * whenever the user changes their preferences.
 */

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[][] }
    [key: string]: unknown
  }
}

// ── Sentry ──

let sentryEnabled = false

async function applySentry(enabled: boolean): Promise<void> {
  // Capture env synchronously — later reads may race with dynamic imports
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
  const tracesSampleRate = import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE
    ? Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE)
    : 0.1
  if (!dsn) return

  if (enabled && !sentryEnabled) {
    sentryEnabled = true
    const Sentry = await import('@sentry/react')
    Sentry.init({
      dsn,
      environment: (import.meta.env.VITE_APP_ENV as string) || 'production',
      integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
      tracesSampleRate,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    })
    return
  }

  if (!enabled && sentryEnabled) {
    sentryEnabled = false
    const Sentry = await import('@sentry/react')
    await Sentry.close()
  }
}

// ── Google Analytics 4 (Consent Mode v2 aware) ──

function getGa4Id(): string | undefined {
  return import.meta.env.VITE_GA4_ID as string | undefined
}

function applyGoogleAnalytics(enabled: boolean): void {
  const ga4Id = getGa4Id()
  if (!ga4Id) return

  // ga-disable-{id} is the official GA "denied" switch — no cookies set, no data sent
  window[`ga-disable-${ga4Id}`] = !enabled

  if (!enabled) {
    removeScripts('googletagmanager.com/gtag/js')
    return
  }

  if (document.querySelector('script[data-gdpr-ga4]')) return

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`
  script.dataset.gdprGa4 = 'true'
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  window.gtag = (...args: unknown[]) => window.dataLayer?.push(args)
  window.gtag('js', new Date())
  window.gtag('config', ga4Id, { anonymize_ip: true })
}

// ── Meta (Facebook) Pixel ──

function getMetaPixelId(): string | undefined {
  return import.meta.env.VITE_META_PIXEL_ID as string | undefined
}

function applyMetaPixel(enabled: boolean): void {
  const pixelId = getMetaPixelId()
  if (!pixelId) return

  if (!enabled) {
    // Discard events and stop the library from loading
    window.fbq = () => {}
    removeScripts('connect.facebook.net')
    return
  }

  if (document.querySelector('script[data-gdpr-meta]')) return

  // Queue events until the library takes over — the standard pixel snippet
  window.fbq = (...args: unknown[]) => {
    const state = window.fbq as { queue?: unknown[][] }
    const queue = state.queue ?? []
    state.queue = queue
    queue.push(args)
  }

  const script = document.createElement('script')
  script.async = true
  script.defer = true
  script.src = 'https://connect.facebook.net/en_US/fbevents.js'
  script.dataset.gdprMeta = 'true'
  document.head.appendChild(script)

  window.fbq('init', pixelId)
  window.fbq('track', 'PageView')
}

// ── Orchestration ──

function removeScripts(srcPart: string): void {
  document.querySelectorAll(`script[src*="${srcPart}"]`).forEach((el) => {
    el.remove()
  })
}

/**
 * Apply the current consent choice to all trackers.
 * GA4/Meta script injection is synchronous; Sentry loads via dynamic import.
 * Safe to call repeatedly — each integration is idempotent.
 * Returns a promise so tests can await completion; callers use `void`.
 */
export async function applyConsent(categories: ConsentCategories): Promise<void> {
  applyGoogleAnalytics(categories.analytics)
  applyMetaPixel(categories.marketing)
  await applySentry(categories.analytics)
}

/**
 * Reset tracker module state (used by tests).
 */
export function resetTrackers(): void {
  sentryEnabled = false
}
