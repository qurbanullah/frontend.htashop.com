import { motion } from 'framer-motion'
import { Cookie } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useConsentStore } from '@/stores/consent'

/**
 * Floating re-open button shown after a choice is made —
 * keeps the user's right to change preferences one click away.
 */
export function ConsentSettingsButton() {
  const { t } = useTranslation()
  const openSettings = useConsentStore((s) => s.openSettings)

  return (
    <motion.button
      key="consent-settings-button"
      type="button"
      onClick={openSettings}
      className="fixed start-4 bottom-4 z-[75] inline-flex h-10 items-center gap-2 rounded-full border border-gray-200 bg-white/95 px-4 font-medium text-gray-700 text-sm shadow-lg backdrop-blur transition-colors hover:border-blue-500 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-900/95 dark:text-gray-200 dark:hover:text-blue-400"
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 16, opacity: 0 }}
      transition={{ type: 'tween', duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
    >
      <Cookie className="h-4 w-4" />
      {t('consent.cookie_settings')}
    </motion.button>
  )
}
