import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import deAuth from './locales/de/auth.json'
import deChat from './locales/de/chat.json'
import deCommon from './locales/de/common.json'
import enAuth from './locales/en/auth.json'
// Import translation files
import enChat from './locales/en/chat.json'
import enCommon from './locales/en/common.json'
import urAuth from './locales/ur/auth.json'
import urChat from './locales/ur/chat.json'
import urCommon from './locales/ur/common.json'

// Translation resources
const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    chat: enChat,
  },
  ur: {
    common: urCommon,
    auth: urAuth,
    chat: urChat,
  },
  de: {
    common: deCommon,
    auth: deAuth,
    chat: deChat,
  },
}

// Initialize i18next
i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources,
    fallbackLng: 'en', // Default language
    supportedLngs: ['en', 'ur', 'de'], // Supported languages
    debug: false, // Enable debug in development manually if needed

    // Namespace configuration
    defaultNS: 'common',
    ns: ['common', 'auth', 'chat'],

    // Detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'htashop_language',
    },

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    react: {
      useSuspense: false, // Disable suspense for now
    },
  })

export default i18n

// Helper function to get RTL status
export const isRTL = (lng: string): boolean => {
  return lng === 'ur' || lng === 'ar' || lng === 'he' || lng === 'fa'
}

/**
 * Keep <html lang> / <html dir> in step with the active language.
 *
 * This runs from the i18n instance (not a component) so it applies on every
 * route — including the auth/legal pages that render no language UI. Without it
 * an Urdu user (selected by the browser detector) would see RTL text laid out LTR.
 */
function syncDocumentLanguage(lng: string): void {
  if (typeof document === 'undefined') return

  const rtl = isRTL(lng)
  document.documentElement.setAttribute('lang', lng)
  document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr')
  document.body.classList.toggle('rtl', rtl)
}

i18n.on('languageChanged', syncDocumentLanguage)
syncDocumentLanguage(i18n.language)

// Helper to get language display name
export const getLanguageName = (code: string): string => {
  const languages: Record<string, string> = {
    en: 'English',
    ur: 'اردو', // Urdu in native script
    de: 'Deutsch', // German in native script
  }
  return languages[code] || code
}

// Helper to get language flag emoji
export const getLanguageFlag = (code: string): string => {
  const flags: Record<string, string> = {
    en: '🇬🇧',
    ur: '🇵🇰', // Pakistan flag for Urdu
    de: '🇩🇪', // Germany flag for German/Dutch
  }
  return flags[code] || '🌐'
}
