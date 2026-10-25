import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { applyConsent, resetTrackers } from '@/lib/consent/analytics'
import { ALL_CONSENT, DEFAULT_CONSENT } from '@/lib/consent/constants'

vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  close: vi.fn().mockResolvedValue(true),
  browserTracingIntegration: vi.fn(() => ({ name: 'browserTracing' })),
  replayIntegration: vi.fn(() => ({ name: 'replay' })),
}))

function metaScriptCount(): number {
  return document.querySelectorAll('script[data-gdpr-meta]').length
}

describe('consent-gated trackers', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123')
    vi.stubEnv('VITE_META_PIXEL_ID', '1234567890')
    document.head.innerHTML = ''
    delete window.fbq
    resetTrackers()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('does not load the Meta pixel before consent', async () => {
    await applyConsent(DEFAULT_CONSENT)

    expect(metaScriptCount()).toBe(0)
  })

  it('loads the Meta pixel only when marketing consent is granted', async () => {
    await applyConsent({ ...ALL_CONSENT, marketing: true, analytics: false })

    expect(metaScriptCount()).toBe(1)
    const script = document.querySelector('script[data-gdpr-meta]')
    expect(script?.getAttribute('src')).toContain('connect.facebook.net')
    expect(window.fbq).toBeTypeOf('function')
  })

  it('discards pixel events when marketing consent is revoked', async () => {
    await applyConsent(ALL_CONSENT)
    const queueFn = window.fbq
    expect(queueFn).toBeTypeOf('function')

    await applyConsent(DEFAULT_CONSENT)

    expect(metaScriptCount()).toBe(0)
    expect(window.fbq).toBeTypeOf('function')
  })

  it('initializes Sentry only with analytics consent and closes it on revoke', async () => {
    const Sentry = await import('@sentry/react')

    await applyConsent(DEFAULT_CONSENT)
    expect(Sentry.init).not.toHaveBeenCalled()

    await applyConsent(ALL_CONSENT)
    expect(Sentry.init).toHaveBeenCalledTimes(1)
    const initOptions = (Sentry.init as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]
    expect(initOptions.dsn).toBe('https://test@sentry.io/123')

    await applyConsent(DEFAULT_CONSENT)
    expect(Sentry.close).toHaveBeenCalledTimes(1)
  })

  it('does not duplicate scripts when consent is applied repeatedly', async () => {
    await applyConsent(ALL_CONSENT)
    await applyConsent(ALL_CONSENT)
    await applyConsent(ALL_CONSENT)

    expect(metaScriptCount()).toBe(1)
  })
})
