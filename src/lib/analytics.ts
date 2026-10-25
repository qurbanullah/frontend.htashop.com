import { isGranted, isPrerender, subscribe } from './consent'

/**
 * Google Analytics 4 integration (Consent Mode v2 aware).
 *
 * The HTAShop property is `G-XE1P8GG082`. `VITE_GA4_ID` (or `VITE_GA_ID`)
 * overrides the measurement ID for preview/test builds. The measurement ID is
 * all gtag.js needs; the data-stream ID is only used by the Measurement
 * Protocol.
 *
 * In production builds, `index.html` bootstraps gtag.js with a denied Consent
 * Mode v2 default so Google can detect the tag before the visitor answers the
 * cookie banner. Page views and events stay withheld until `analytics` consent
 * is granted, and the consent state is updated whenever it changes. Revoking
 * consent removes the tag script and clears the queue.
 */
const DEFAULT_GA_ID = 'G-XE1P8GG082'

/** Production-only by default so local/dev traffic never pollutes the property. */
function getGaId(): string | undefined {
  const override = (import.meta.env.VITE_GA4_ID || import.meta.env.VITE_GA_ID) as string | undefined
  if (override) return override
  return import.meta.env.PROD ? DEFAULT_GA_ID : undefined
}

type Gtag = (...args: unknown[]) => void

type GtagWindow = Window & {
  dataLayer?: unknown[]
  gtag?: Gtag
  __htashopGaBootstrapped?: boolean
}

interface ConsentModeState {
  ad_storage: 'granted' | 'denied'
  ad_user_data: 'granted' | 'denied'
  ad_personalization: 'granted' | 'denied'
  analytics_storage: 'granted' | 'denied'
  functionality_storage: 'granted'
  personalization_storage: 'granted' | 'denied'
  security_storage: 'granted'
}

/** Declared before any tag runs; the granted state is applied via `update`. */
const DENIED_CONSENT: ConsentModeState = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'granted',
  personalization_storage: 'denied',
  security_storage: 'granted',
}

let loaded = false
let consentSyncRegistered = false
let unsubscribeConsent: (() => void) | null = null
let lastPageLocation: string | null = null

/**
 * Get (or install) the `gtag` queue shim. Calls made before gtag.js finishes
 * downloading are queued on `dataLayer` and replayed by the library.
 *
 * gtag.js reads array-like `arguments` objects; pushing a real Array is
 * silently ignored, which leaves GA unconfigured and sends no hits.
 */
function getGtag(): Gtag {
  const w = window as GtagWindow
  w.dataLayer = w.dataLayer || []
  if (typeof w.gtag !== 'function') {
    function gtagShim() {
      // biome-ignore lint/complexity/noArguments: gtag.js requires the arguments object
      w.dataLayer?.push(arguments)
    }
    w.gtag = gtagShim
  }
  return w.gtag
}

/** Map consent preferences to Google Consent Mode v2 storage states. */
function consentModeMapping(): ConsentModeState {
  return {
    ad_storage: isGranted('marketing') ? 'granted' : 'denied',
    ad_user_data: isGranted('marketing') ? 'granted' : 'denied',
    ad_personalization: isGranted('marketing') ? 'granted' : 'denied',
    analytics_storage: isGranted('analytics') ? 'granted' : 'denied',
    functionality_storage: 'granted',
    personalization_storage: isGranted('preferences') ? 'granted' : 'denied',
    security_storage: 'granted',
  }
}

function currentPath(): string {
  return window.location.pathname + window.location.search
}

function absoluteUrl(path: string): string {
  try {
    return new URL(path, window.location.origin).toString()
  } catch {
    return window.location.href
  }
}

/** Toggle Google's official "stop collecting" switch for this measurement ID. */
function setGaDisabled(id: string, disabled: boolean): void {
  ;(window as unknown as Record<string, unknown>)[`ga-disable-${id}`] = disabled
}

function sendPageView(path: string): void {
  const pageLocation = absoluteUrl(path)
  lastPageLocation = pageLocation

  // GA4 has no `page_path` parameter — `page_location` is the URL dimension.
  getGtag()('event', 'page_view', {
    page_location: pageLocation,
    page_title: document.title,
  })
}

function loadGtag(): boolean {
  if (typeof window === 'undefined') return false

  const id = getGaId()
  if (!id) return false
  if (loaded) return true

  const w = window as GtagWindow
  const bootstrapped = w.__htashopGaBootstrapped === true
  if (bootstrapped && document.querySelector('script[data-gdpr-ga4]')) {
    // The production HTML bootstrap already declared the denied Consent Mode
    // default and queued `config` before gtag.js loaded. Re-declaring them
    // would duplicate the commands.
    setGaDisabled(id, false)
    loaded = true
    return true
  }

  const gtag = getGtag()

  // Consent Mode v2 — declare the denied default before any tag runs.
  gtag('consent', 'default', DENIED_CONSENT)
  gtag('js', new Date())
  gtag('config', id, {
    send_page_view: false, // we send page views explicitly on route change
  })

  // Undo `ga-disable-<id>` left behind by an earlier revoke.
  setGaDisabled(id, false)

  if (!document.querySelector('script[data-gdpr-ga4]')) {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`
    script.dataset.gdprGa4 = 'true'
    document.head.appendChild(script)
  }

  loaded = true
  return true
}

/** Load gtag.js (once) and sync the current consent decision to it. */
function ensureLoaded(): boolean {
  if (!loadGtag()) return false
  getGtag()('consent', 'update', consentModeMapping())
  return true
}

/** Stop GA on revoke: disable the tag, drop the queue and remove the script. */
function disableGtag(): void {
  if (!loaded) return

  const id = getGaId()
  if (id) {
    setGaDisabled(id, true)

    // Reset so a later grant starts from a clean gtag/dataLayer state.
    const w = window as GtagWindow
    w.dataLayer = []
    delete w.gtag
  }

  document.querySelectorAll('script[data-gdpr-ga4]').forEach((el) => {
    el.remove()
  })

  loaded = false
  lastPageLocation = null
}

function applyGranted(granted: boolean): void {
  if (!getGaId() || typeof window === 'undefined' || isPrerender()) return

  if (!granted) {
    disableGtag()
    return
  }

  if (!ensureLoaded()) return

  // The page shown while consent was withheld was never measured.
  if (lastPageLocation === null && !isPrerender()) sendPageView(currentPath())
}

/**
 * Register consent → GA4 synchronisation once. Granting `analytics` loads gtag
 * immediately and records the current page; revoking it unloads the tag.
 */
function registerConsentSync(): void {
  if (consentSyncRegistered || typeof window === 'undefined') return
  consentSyncRegistered = true

  unsubscribeConsent = subscribe((prefs) => {
    applyGranted(prefs.analytics)
  })
}

/** Send a GA4 page_view hit (fire-and-forget; gated on analytics consent). */
export function trackPageView(path: string): void {
  if (!getGaId() || typeof window === 'undefined' || isPrerender()) return

  registerConsentSync()
  if (!isGranted('analytics')) return
  if (!ensureLoaded()) return

  const pageLocation = absoluteUrl(path)
  if (lastPageLocation === pageLocation) return
  sendPageView(path)
}

/** Send a GA4 custom event (e.g. `add_to_cart`, `begin_checkout`). */
export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (!getGaId() || typeof window === 'undefined' || isPrerender()) return

  registerConsentSync()
  if (!isGranted('analytics')) return
  if (!ensureLoaded()) return

  getGtag()('event', name, params ?? {})
}

/** Reset module state (used by tests). */
export function resetAnalytics(): void {
  unsubscribeConsent?.()
  unsubscribeConsent = null
  consentSyncRegistered = false
  loaded = false
  lastPageLocation = null
}
