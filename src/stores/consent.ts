import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { gdprApi } from '@/api/gdpr'
import { applyConsent } from '@/lib/consent/analytics'
import { getConsentToken } from '@/lib/consent/consent-token'
import {
  ALL_CONSENT,
  CONSENT_MAX_AGE_MS,
  CONSENT_POLICY_VERSION,
  CONSENT_STORAGE_KEY,
  type ConsentCategories,
  type ConsentSource,
  type ConsentStatus,
  DEFAULT_CONSENT,
} from '@/lib/consent/constants'

export interface PersistedConsentState {
  status: ConsentStatus
  categories: ConsentCategories
  policyVersion: string | null
  consentedAt: string | null
}

interface ConsentState extends PersistedConsentState {
  isSettingsOpen: boolean
  acceptAll: () => void
  rejectAll: () => void
  savePreferences: (categories: ConsentCategories, source?: ConsentSource) => void
  openSettings: () => void
  closeSettings: () => void
  /** Boot-time check: re-ask when consent expired or the policy changed. */
  initialize: () => void
  /** Apply a consent record synced from the server (cross-device). */
  applyServerState: (state: PersistedConsentState) => void
}

/**
 * Commit a choice: persist locally, re-gate trackers, and record the
 * audit-trail entry server-side (best-effort, never blocks the UI).
 */
function commitChoice(
  set: (partial: Partial<ConsentState>) => void,
  status: ConsentStatus,
  categories: ConsentCategories,
  source: ConsentSource
): void {
  set({
    status,
    categories,
    policyVersion: CONSENT_POLICY_VERSION,
    consentedAt: new Date().toISOString(),
  })
  void applyConsent(categories)
  void gdprApi
    .record({
      consent_token: getConsentToken(),
      categories,
      policy_version: CONSENT_POLICY_VERSION,
      source,
    })
    .catch(() => {
      // Consent is recorded locally regardless of network state.
    })
}

export const useConsentStore = create<ConsentState>()(
  persist(
    (set) => ({
      status: 'unknown',
      categories: { ...DEFAULT_CONSENT },
      policyVersion: null,
      consentedAt: null,
      isSettingsOpen: false,

      acceptAll: () => commitChoice(set, 'accepted', { ...ALL_CONSENT }, 'banner'),

      rejectAll: () => commitChoice(set, 'rejected', { ...DEFAULT_CONSENT }, 'banner'),

      savePreferences: (categories, source = 'settings') =>
        commitChoice(set, 'customized', { ...categories }, source),

      openSettings: () => set({ isSettingsOpen: true }),
      closeSettings: () => set({ isSettingsOpen: false }),

      initialize: () => {
        const { consentedAt, policyVersion, status } = useConsentStore.getState()
        if (status === 'unknown') return

        const expired =
          !consentedAt || Date.now() - new Date(consentedAt).getTime() > CONSENT_MAX_AGE_MS
        const policyChanged = policyVersion !== CONSENT_POLICY_VERSION

        if (expired || policyChanged) {
          set({
            status: 'unknown',
            categories: { ...DEFAULT_CONSENT },
            policyVersion: null,
            consentedAt: null,
          })
          // Trackers stay in their denied state until a new choice is made.
        }
      },

      applyServerState: (state) => {
        set({
          status: state.status,
          categories: { ...state.categories },
          policyVersion: state.policyVersion,
          consentedAt: state.consentedAt,
        })
        void applyConsent(state.categories)
      },
    }),
    {
      name: CONSENT_STORAGE_KEY,
      partialize: (state) => ({
        status: state.status,
        categories: state.categories,
        policyVersion: state.policyVersion,
        consentedAt: state.consentedAt,
      }),
    }
  )
)
