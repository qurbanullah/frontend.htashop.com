import { CONSENT_TOKEN_KEY } from '@/lib/consent/constants'

/**
 * Returns (and lazily creates) the pseudonymous consent token for this
 * browser. Used as the guest identifier in the server-side audit trail —
 * it never contains personal data and can be rotated at any time.
 */
export function getConsentToken(): string {
  try {
    const existing = localStorage.getItem(CONSENT_TOKEN_KEY)
    if (existing) return existing

    const token =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `consent-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

    localStorage.setItem(CONSENT_TOKEN_KEY, token)
    return token
  } catch {
    return `consent-${Date.now()}`
  }
}
