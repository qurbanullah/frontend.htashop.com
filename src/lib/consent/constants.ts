/**
 * GDPR consent constants — categories, storage keys, policy version.
 *
 * Consent categories follow the industry-standard grouping used by major
 * consent management platforms (OneTrust, Cookiebot, IAB TCF 2.0).
 */

export const CONSENT_CATEGORIES = ['necessary', 'preferences', 'analytics', 'marketing'] as const

export type ConsentCategory = (typeof CONSENT_CATEGORIES)[number]

export type ConsentCategories = Record<ConsentCategory, boolean>

/** Zustand persist key for the user's consent choice. */
export const CONSENT_STORAGE_KEY = 'htashop-consent'

/** Pseudonymous token identifying this browser across requests (audit trail). */
export const CONSENT_TOKEN_KEY = 'htashop-consent-token'

/** Bump when the consent policy text changes — users are asked again. */
export const CONSENT_POLICY_VERSION = '1.0'

/** Re-ask for consent after 12 months (industry standard). */
export const CONSENT_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 365

export type ConsentStatus = 'unknown' | 'accepted' | 'rejected' | 'customized'

export type ConsentSource = 'banner' | 'settings' | 'account'

/** No choice made yet — only strictly necessary processing is active. */
export const DEFAULT_CONSENT: ConsentCategories = {
  necessary: true,
  preferences: false,
  analytics: false,
  marketing: false,
}

/** Everything granted ("Accept all"). */
export const ALL_CONSENT: ConsentCategories = {
  necessary: true,
  preferences: true,
  analytics: true,
  marketing: true,
}
