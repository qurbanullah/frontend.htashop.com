import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Seo } from '@/components/seo/Seo'
import { paths } from '@/routes/paths'

/**
 * 404 — catch-all for unmatched routes.
 *
 * `noindex` because the nginx SPA fallback serves this shell with HTTP 200 for
 * any unknown path, which would otherwise be an indexable soft 404.
 */
export default function NotFound() {
  const { t } = useTranslation()

  return (
    <>
      <Seo title={t('notFound.title')} noindex />
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <h1 className="mb-2 font-bold text-4xl text-gray-800 dark:text-gray-200">404</h1>
        <p className="font-medium text-gray-700 dark:text-gray-300">{t('notFound.title')}</p>
        <p className="mt-2 max-w-md text-gray-500 text-sm dark:text-gray-400">
          {t('notFound.message')}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to={paths.home}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-blue-700"
          >
            {t('notFound.go_home')}
          </Link>
          <Link
            to={paths.products}
            className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 text-sm transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            {t('notFound.browse_products')}
          </Link>
        </div>
        <p className="mt-6 text-gray-400 text-xs dark:text-gray-500">
          {t('notFound.still_stuck')}{' '}
          <Link
            to={paths.contact}
            className="underline hover:text-blue-600 dark:hover:text-blue-400"
          >
            {t('notFound.contact_support')}
          </Link>
        </p>
      </div>
    </>
  )
}
