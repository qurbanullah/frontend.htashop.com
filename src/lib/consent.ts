/**
 * Consent gate for analytics code that runs outside React.
 *
 * The storefront's single source of truth is the persisted Zustand store in
 * `@/stores/consent` (server-synced and recorded in the GDPR audit trail).
 * This module exposes the small synchronous `isGranted` / `subscribe` API that
 * tag managers need, without duplicating consent storage.
 */
import type { ConsentCategories, ConsentCategory } from '@/lib/consent/constants'
import { useConsentStore } from '@/stores/consent'

export type ConsentPurposeSlug = ConsentCategory
export type ConsentPreferences = ConsentCategories

export function isGranted(purpose: ConsentPurposeSlug): boolean {
  if (purpose === 'necessary') return true
  return useConsentStore.getState().categories[purpose] === true
}

/** Notify only when a consent category actually changes. */
export function subscribe(listener: (prefs: ConsentPreferences) => void): () => void {
  return useConsentStore.subscribe((state, previous) => {
    const next = state.categories
    const before = previous.categories

    if (
      next.necessary === before.necessary &&
      next.preferences === before.preferences &&
      next.analytics === before.analytics &&
      next.marketing === before.marketing
    ) {
      return
    }

    listener({ ...next })
  })
}

/**
 * Headless prerender / automation traffic must never inflate analytics.
 * The prerender service marks its pages with `__PRERENDER__`; WebDriver
 * (the prerender browser) also sets `navigator.webdriver`.
 */
export function isPrerender(): boolean {
  if (typeof window === 'undefined') return false
  if ((window as Window & { __PRERENDER__?: boolean }).__PRERENDER__ === true) return true
  return typeof navigator !== 'undefined' && navigator.webdriver === true
}
