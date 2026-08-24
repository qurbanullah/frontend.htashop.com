import { AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import { type GdprConsentDto, gdprApi } from '@/api/gdpr'
import { ConsentPreferencesModal } from '@/components/consent/ConsentPreferencesModal'
import { ConsentSettingsButton } from '@/components/consent/ConsentSettingsButton'
import { CookieConsentBanner } from '@/components/consent/CookieConsentBanner'
import type { ConsentStatus } from '@/lib/consent/constants'
import { type PersistedConsentState, useConsentStore } from '@/stores/consent'

/**
 * Map a server-side consent record onto the client state shape.
 * Returns null when the record carries no usable timestamp.
 */
function mapServerConsent(serverConsent: GdprConsentDto | null): PersistedConsentState | null {
  if (!serverConsent?.accepted_at) return null

  const status: ConsentStatus =
    serverConsent.source === 'settings'
      ? 'customized'
      : Object.values(serverConsent.categories).every(Boolean)
        ? 'accepted'
        : 'rejected'

  return {
    status,
    categories: serverConsent.categories,
    policyVersion: serverConsent.policy_version,
    consentedAt: serverConsent.accepted_at,
  }
}

/**
 * Renders the GDPR consent banner, preferences modal and floating re-open
 * button. Also syncs the latest consent record from the server so a
 * logged-in user's choice follows them across devices.
 *
 * Mount once at the app root (see RootLayout).
 */
export function ConsentManager() {
  const status = useConsentStore((s) => s.status)
  const isSettingsOpen = useConsentStore((s) => s.isSettingsOpen)
  const consentedAt = useConsentStore((s) => s.consentedAt)
  const initialize = useConsentStore((s) => s.initialize)
  const closeSettings = useConsentStore((s) => s.closeSettings)
  const applyServerState = useConsentStore((s) => s.applyServerState)

  // Boot: re-ask if consent expired or the policy version changed.
  useEffect(() => {
    initialize()
  }, [initialize])

  // Cross-device sync: adopt a newer server-side consent record if present.
  useEffect(() => {
    let cancelled = false

    gdprApi
      .latest()
      .then((serverConsent) => {
        if (cancelled) return
        const serverState = mapServerConsent(serverConsent)
        if (!serverState) return

        const localTime = consentedAt ? new Date(consentedAt).getTime() : 0
        const serverTime = new Date(serverState.consentedAt ?? '').getTime()
        if (serverTime > localTime) applyServerState(serverState)
      })
      .catch(() => {
        // Server sync is best-effort — local choice always wins on failure.
      })

    return () => {
      cancelled = true
    }
  }, [applyServerState, consentedAt])

  const showBanner = status === 'unknown'
  const showSettingsButton = status !== 'unknown'

  return (
    <>
      <AnimatePresence>{showBanner && !isSettingsOpen && <CookieConsentBanner />}</AnimatePresence>

      <ConsentPreferencesModal open={isSettingsOpen} onClose={closeSettings} />

      <AnimatePresence>
        {showSettingsButton && !isSettingsOpen && <ConsentSettingsButton />}
      </AnimatePresence>
    </>
  )
}
