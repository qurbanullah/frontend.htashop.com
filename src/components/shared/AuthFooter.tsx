import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { COMPANY } from '@/lib/company'
import { paths } from '@/routes/paths'
import { useConsentStore } from '@/stores/consent'

const HTASOL_URL = 'https://htasol.com'

/**
 * Slim footer for the auth pages (login, register, forgot/reset password, check
 * account, verify email). Mirrors the manage/admin portals — a couple of short
 * lines of legal links and the company line — instead of the full storefront
 * footer, so the focused auth task is not buried under the marketing chrome.
 *
 * `RootLayout` swaps this in for the full `Footer` on the auth routes.
 */
export function AuthFooter() {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  const linkClass = 'transition-colors hover:text-gray-700 hover:underline dark:hover:text-gray-200'

  return (
    <footer className="border-gray-200 border-t bg-gray-50 py-3 text-center text-gray-500 text-xs dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
      <div className="mx-auto max-w-[1440px] space-y-1 px-4">
        <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <Link to={paths.policiesTerms} className={linkClass}>
            {t('footer.terms_of_use')}
          </Link>
          <span aria-hidden="true">|</span>
          <Link to={paths.policiesPrivacy} className={linkClass}>
            {t('footer.privacy_policy')}
          </Link>
          <span aria-hidden="true">|</span>
          <Link to={paths.policiesRefund} className={linkClass}>
            {t('footer.refund_policy')}
          </Link>
          <span aria-hidden="true">|</span>
          <Link to={paths.contact} className={linkClass}>
            {t('footer.contact_us')}
          </Link>
          <span aria-hidden="true">|</span>
          <button
            type="button"
            onClick={() => useConsentStore.getState().openSettings()}
            className={linkClass}
          >
            {t('footer.cookie_settings')}
          </button>
        </p>
        <p>
          <Trans
            i18nKey="footer.copyright_line"
            values={{ year, company: COMPANY.name, cuin: COMPANY.cuin }}
            components={{
              companyLink: (
                // Children are injected by i18next from the translation string.
                // biome-ignore lint/a11y/useAnchorContent: anchor text comes from the translation
                <a
                  href={HTASOL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                />
              ),
            }}
          />
        </p>
      </div>
    </footer>
  )
}
