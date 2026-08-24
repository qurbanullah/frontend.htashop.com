import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { paths } from '@/routes/paths'
import { useConsentStore } from '@/stores/consent'

/**
 * First-visit consent banner — bottom slide-up card.
 * Non-blocking, plain-language, one-click accept/reject plus a customize path.
 */
export function CookieConsentBanner() {
  const { t } = useTranslation()
  const acceptAll = useConsentStore((s) => s.acceptAll)
  const rejectAll = useConsentStore((s) => s.rejectAll)
  const openSettings = useConsentStore((s) => s.openSettings)

  return (
    <motion.div
      key="cookie-banner"
      role="dialog"
      aria-live="polite"
      aria-label={t('consent.banner_title')}
      className="fixed inset-x-0 bottom-0 z-[80] p-4 sm:p-6"
      initial={{ y: 32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 32, opacity: 0 }}
      transition={{ type: 'tween', duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
    >
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-gray-200 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/95">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start">
          {/* Icon */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-blue-500/25 shadow-lg">
            <ShieldCheck className="h-6 w-6" />
          </div>

          {/* Copy */}
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-base text-gray-900 dark:text-white">
              {t('consent.banner_title')}
            </h2>
            <p className="mt-1 text-gray-600 text-sm leading-relaxed dark:text-gray-300">
              {t('consent.banner_description')}{' '}
              <Link
                to={paths.policiesCookies}
                className="font-medium text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
              >
                {t('consent.cookies_policy')}
              </Link>{' '}
              ·{' '}
              <Link
                to={paths.policiesPrivacy}
                className="font-medium text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
              >
                {t('consent.privacy_policy')}
              </Link>
            </p>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
            <button
              type="button"
              onClick={acceptAll}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-5 font-semibold text-sm text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
            >
              {t('consent.accept_all')}
            </button>
            <button
              type="button"
              onClick={openSettings}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-300 bg-white px-5 font-semibold text-gray-700 text-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              {t('consent.customize')}
            </button>
            <button
              type="button"
              onClick={rejectAll}
              className="inline-flex h-10 items-center justify-center rounded-xl px-4 font-medium text-gray-500 text-sm transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {t('consent.reject_all')}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
