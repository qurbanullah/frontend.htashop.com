import { describe, expect, it } from 'vitest'
import deAuth from './locales/de/auth.json'
import deChat from './locales/de/chat.json'
import deCommon from './locales/de/common.json'
import enAuth from './locales/en/auth.json'
import enChat from './locales/en/chat.json'
import enCommon from './locales/en/common.json'
import urAuth from './locales/ur/auth.json'
import urChat from './locales/ur/chat.json'
import urCommon from './locales/ur/common.json'

/**
 * Translation files must stay structurally identical.
 *
 * A key present in `en` but missing from `ur`/`de` silently falls back to English
 * (or, worse, renders the raw key), so drift here is a user-visible bug rather
 * than a build error. These tests make it a build error.
 */

type Bundle = Record<string, unknown>
type Locale = 'en' | 'ur' | 'de'

interface LocaleSet {
  en: Bundle
  ur: Bundle
  de: Bundle
}

const NAMESPACES: Record<string, LocaleSet> = {
  common: { en: enCommon, ur: urCommon, de: deCommon },
  auth: { en: enAuth, ur: urAuth, de: deAuth },
  chat: { en: enChat, ur: urChat, de: deChat },
}

/** English is the source of truth; the others must match it exactly. */
const COMPARED: Locale[] = ['ur', 'de']

/** Flattens a bundle to dot-paths so nested and leaf keys compare uniformly. */
function flattenKeys(bundle: Bundle, prefix = ''): string[] {
  return Object.entries(bundle).flatMap(([key, value]) =>
    value !== null && typeof value === 'object'
      ? flattenKeys(value as Bundle, `${prefix}${key}.`)
      : [`${prefix}${key}`]
  )
}

/** Every leaf value, as [key, value] pairs. */
function flattenEntries(bundle: Bundle, prefix = ''): Array<[string, unknown]> {
  return Object.entries(bundle).flatMap(([key, value]) =>
    value !== null && typeof value === 'object'
      ? flattenEntries(value as Bundle, `${prefix}${key}.`)
      : [[`${prefix}${key}`, value] as [string, unknown]]
  )
}

// Resolved by i18next when a translation is empty — never a valid value.
const PLACEHOLDER = /^(todo|tbd|fixme|xxx|n\/a|\?\?+|placeholder|translation needed|missing)$/i

describe('i18n locale parity', () => {
  for (const [namespace, bundles] of Object.entries(NAMESPACES)) {
    it(`${namespace}: ur and de define exactly the same keys as en`, () => {
      const expected = flattenKeys(bundles.en).sort()

      for (const locale of COMPARED) {
        expect(flattenKeys(bundles[locale]).sort(), `${locale}/${namespace}`).toEqual(expected)
      }
    })

    it(`${namespace}: no locale has an empty or placeholder value`, () => {
      for (const [locale, bundle] of Object.entries(bundles)) {
        const offenders = flattenEntries(bundle)
          .filter(([, value]) => typeof value !== 'string' || value.trim() === '')
          .map(([key]) => key)

        expect(offenders, `${locale}/${namespace} has empty values`).toEqual([])

        const placeholders = flattenEntries(bundle)
          .filter(([, value]) => typeof value === 'string' && PLACEHOLDER.test(value.trim()))
          .map(([key]) => key)

        expect(placeholders, `${locale}/${namespace} has placeholder values`).toEqual([])
      }
    })

    it(`${namespace}: interpolation placeholders match across locales`, () => {
      const placeholdersOf = (bundle: Bundle) =>
        Object.fromEntries(
          flattenEntries(bundle)
            .filter(([, value]) => typeof value === 'string')
            .map(([key, value]) => [
              key,
              [...(value as string).matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map((m) => m[1]).sort(),
            ])
            .filter(([, names]) => (names as string[]).length > 0)
        )

      const expected = placeholdersOf(bundles.en)
      for (const locale of COMPARED) {
        expect(placeholdersOf(bundles[locale]), `${locale}/${namespace}`).toEqual(expected)
      }
    })
  }
})
