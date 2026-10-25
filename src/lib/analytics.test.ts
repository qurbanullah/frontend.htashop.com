import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetAnalytics, trackEvent, trackPageView } from '@/lib/analytics'
import { DEFAULT_CONSENT } from '@/lib/consent/constants'
import { useConsentStore } from '@/stores/consent'

function setAnalyticsConsent(granted: boolean): void {
  useConsentStore.setState({
    status: granted ? 'accepted' : 'unknown',
    categories: { ...DEFAULT_CONSENT, analytics: granted },
    policyVersion: granted ? '1.0' : null,
    consentedAt: granted ? new Date().toISOString() : null,
  })
}

function gaScriptCount(): number {
  return document.querySelectorAll('script[data-gdpr-ga4]').length
}

describe('Google Analytics 4', () => {
  let gtag: ReturnType<typeof vi.fn>

  function eventCalls(name: string): unknown[][] {
    return gtag.mock.calls.filter(
      ([command, eventName]) => command === 'event' && eventName === name
    )
  }

  beforeEach(() => {
    vi.stubEnv('VITE_GA4_ID', 'G-TEST123')
    window.history.replaceState({}, '', '/landing')
    document.head.innerHTML = ''
    document.title = 'Test page'
    resetAnalytics()
    setAnalyticsConsent(false)

    gtag = vi.fn()
    window.gtag = gtag as unknown as (...args: unknown[]) => void
    window.dataLayer = []
  })

  afterEach(() => {
    resetAnalytics()
    vi.unstubAllEnvs()
    document.head.innerHTML = ''
    delete window.gtag
    delete window.dataLayer
    delete (window as Window & { __PRERENDER__?: boolean }).__PRERENDER__
  })

  it('does not load gtag before analytics consent', () => {
    trackPageView('/products/a')

    expect(gaScriptCount()).toBe(0)
    expect(gtag).not.toHaveBeenCalled()
  })

  it('loads gtag and records the current page when consent is granted', () => {
    trackPageView('/products/a') // installs the consent subscription
    gtag.mockClear()

    setAnalyticsConsent(true)

    expect(gaScriptCount()).toBe(1)
    expect(document.querySelector('script[data-gdpr-ga4]')?.getAttribute('src')).toContain(
      'G-TEST123'
    )
    expect(gtag).toHaveBeenCalledWith('consent', 'default', expect.any(Object))
    expect(gtag).toHaveBeenCalledWith('config', 'G-TEST123', expect.any(Object))

    const pageViews = eventCalls('page_view')
    expect(pageViews).toHaveLength(1)
    expect(pageViews[0]?.[2]).toMatchObject({
      page_location: expect.stringContaining('/landing'),
      page_title: 'Test page',
    })
  })

  it('sends one page view per route and ignores consecutive duplicates', () => {
    setAnalyticsConsent(true)

    trackPageView('/a')
    trackPageView('/a')
    trackPageView('/b')

    const pageViews = eventCalls('page_view')
    expect(pageViews).toHaveLength(2)
    expect(pageViews[0]?.[2]).toMatchObject({ page_location: expect.stringContaining('/a') })
    expect(pageViews[1]?.[2]).toMatchObject({ page_location: expect.stringContaining('/b') })
  })

  it('gates custom events on analytics consent', () => {
    trackEvent('add_to_cart', { value: 10, currency: 'PKR' })
    expect(gtag).not.toHaveBeenCalled()

    setAnalyticsConsent(true)
    trackEvent('add_to_cart', { value: 10, currency: 'PKR' })

    expect(eventCalls('add_to_cart')).toHaveLength(1)
  })

  it('removes the tag and disables collection when consent is revoked', () => {
    trackPageView('/') // installs the consent subscription
    setAnalyticsConsent(true)
    expect(gaScriptCount()).toBe(1)

    setAnalyticsConsent(false)

    expect(gaScriptCount()).toBe(0)
    expect((window as unknown as Record<string, unknown>)['ga-disable-G-TEST123']).toBe(true)
  })

  it('never loads on prerendered pages', () => {
    ;(window as Window & { __PRERENDER__?: boolean }).__PRERENDER__ = true

    setAnalyticsConsent(true)
    trackPageView('/')

    expect(gaScriptCount()).toBe(0)
    expect(gtag).not.toHaveBeenCalled()
  })
})
