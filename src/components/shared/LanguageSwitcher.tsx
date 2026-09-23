import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getLanguageFlag } from '@/i18n/config'

interface Language {
  code: string
  name: string
}

const DEFAULT_LANGUAGE: Language = { code: 'en', name: 'English' }

const languages: Language[] = [
  DEFAULT_LANGUAGE,
  { code: 'ur', name: 'اردو' },
  { code: 'de', name: 'Deutsch' },
]

/**
 * Flag emoji rather than flagcdn.com images: no third-party request (and no
 * visitor-IP leak) for what is purely decorative chrome.
 */
function FlagIcon({ languageCode }: { languageCode: string }) {
  return (
    <span aria-hidden="true" className="inline-block text-base leading-none">
      {getLanguageFlag(languageCode)}
    </span>
  )
}

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const currentLanguage = i18n.language
  const [isOpen, setIsOpen] = useState(false)

  // <html lang>/<html dir> are handled by the i18n instance (see i18n/config.ts)
  // so they stay correct on routes that render no language UI.

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setIsOpen(false)
    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
    }
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isOpen])

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode)
    setIsOpen(false)
  }

  // i18n.language can be region-qualified ("en-US"), so match on the base code.
  const getCurrentLanguage = (): Language =>
    languages.find((lang) => lang.code === currentLanguage.split('-')[0]) ?? DEFAULT_LANGUAGE

  const current = getCurrentLanguage()

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="flex items-center gap-1.5 rounded-lg p-2 text-white transition-colors hover:bg-white/10"
        aria-label="Change language"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        title={current.name}
      >
        <FlagIcon languageCode={current.code} />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute end-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
        >
          {languages.map((language) => (
            <button
              key={language.code}
              type="button"
              role="menuitem"
              onClick={() => changeLanguage(language.code)}
              className={`flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
                current.code === language.code
                  ? 'bg-blue-50 dark:bg-blue-900/30'
                  : 'dark:text-gray-100'
              }`}
              title={language.name}
            >
              <FlagIcon languageCode={language.code} />
              <span className="flex-1 text-start font-medium text-sm dark:text-gray-100">
                {language.name}
              </span>
              {current.code === language.code && (
                <span className="text-blue-600 dark:text-blue-400">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
