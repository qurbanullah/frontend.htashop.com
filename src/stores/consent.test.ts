import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ALL_CONSENT,
  CONSENT_POLICY_VERSION,
  CONSENT_STORAGE_KEY,
  DEFAULT_CONSENT,
} from '@/lib/consent/constants'
import { useConsentStore } from '@/stores/consent'

vi.mock('@/api/gdpr', () => ({
  gdprApi: {
    record: vi.fn().mockResolvedValue(undefined),
    latest: vi.fn().mockResolvedValue(null),
    withdraw: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('@/lib/consent/analytics', () => ({
  applyConsent: vi.fn(),
}))

describe('consent store', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    useConsentStore.setState({
      status: 'unknown',
      categories: { ...DEFAULT_CONSENT },
      policyVersion: null,
      consentedAt: null,
      isSettingsOpen: false,
    })
  })

  it('starts with unknown status and necessary-only categories', () => {
    const state = useConsentStore.getState()
    expect(state.status).toBe('unknown')
    expect(state.categories).toEqual(DEFAULT_CONSENT)
    expect(state.categories.necessary).toBe(true)
    expect(state.categories.analytics).toBe(false)
  })

  it('acceptAll grants every category and persists the choice', () => {
    useConsentStore.getState().acceptAll()

    const state = useConsentStore.getState()
    expect(state.status).toBe('accepted')
    expect(state.categories).toEqual(ALL_CONSENT)
    expect(state.policyVersion).toBe(CONSENT_POLICY_VERSION)
    expect(state.consentedAt).not.toBeNull()

    const stored = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY) ?? '{}')
    expect(stored.state.status).toBe('accepted')
    expect(stored.state.categories.analytics).toBe(true)
  })

  it('rejectAll keeps only strictly necessary categories', () => {
    useConsentStore.getState().rejectAll()

    const state = useConsentStore.getState()
    expect(state.status).toBe('rejected')
    expect(state.categories).toEqual(DEFAULT_CONSENT)
    expect(state.categories.marketing).toBe(false)
  })

  it('savePreferences stores a customized choice', () => {
    useConsentStore.getState().savePreferences({
      necessary: true,
      preferences: true,
      analytics: true,
      marketing: false,
    })

    const state = useConsentStore.getState()
    expect(state.status).toBe('customized')
    expect(state.categories.preferences).toBe(true)
    expect(state.categories.marketing).toBe(false)
  })

  it('records the choice server-side with the consent token', async () => {
    const { gdprApi } = await import('@/api/gdpr')

    useConsentStore.getState().acceptAll()

    expect(gdprApi.record).toHaveBeenCalledTimes(1)
    const payload = (gdprApi.record as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]
    expect(payload).toMatchObject({
      categories: ALL_CONSENT,
      policy_version: CONSENT_POLICY_VERSION,
      source: 'banner',
    })
    expect(payload.consent_token).toEqual(expect.any(String))
  })

  it('initialize resets consent when it has expired (12 months)', () => {
    useConsentStore.getState().acceptAll()

    const old = new Date(Date.now() - 366 * 24 * 60 * 60 * 1000).toISOString()
    useConsentStore.setState({ consentedAt: old })

    useConsentStore.getState().initialize()

    const state = useConsentStore.getState()
    expect(state.status).toBe('unknown')
    expect(state.categories).toEqual(DEFAULT_CONSENT)
    expect(state.consentedAt).toBeNull()
  })

  it('initialize resets consent when the policy version changed', () => {
    useConsentStore.getState().acceptAll()
    useConsentStore.setState({ policyVersion: '0.9' })

    useConsentStore.getState().initialize()

    expect(useConsentStore.getState().status).toBe('unknown')
  })

  it('initialize keeps fresh consent untouched', () => {
    useConsentStore.getState().acceptAll()

    useConsentStore.getState().initialize()

    expect(useConsentStore.getState().status).toBe('accepted')
  })

  it('openSettings/closeSettings toggle the preferences modal', () => {
    const store = useConsentStore.getState()
    store.openSettings()
    expect(useConsentStore.getState().isSettingsOpen).toBe(true)
    useConsentStore.getState().closeSettings()
    expect(useConsentStore.getState().isSettingsOpen).toBe(false)
  })
})
