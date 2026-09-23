import { AlertCircle, CheckCircle2, Loader2, Mail } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { newsletterApi, type UnsubscribeStatus } from '@/api/newsletter'
import { Seo } from '@/components/seo/Seo'
import { Logo } from '@/components/shared/Logo'
import { Button } from '@/components/ui/button'
import { isApiError } from '@/lib/api-response'
import { paths } from '@/routes/paths'

type ViewState =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; status: UnsubscribeStatus }
  | { phase: 'updated'; status: UnsubscribeStatus; action: 'unsubscribed' | 'resubscribed' }

export default function UnsubscribePage() {
  const { t } = useTranslation()
  const { token = '' } = useParams<{ token: string }>()
  const [view, setView] = useState<ViewState>({ phase: 'loading' })
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setView({ phase: 'loading' })
    try {
      const status = await newsletterApi.status(token)
      setView({ phase: 'ready', status })
    } catch (error) {
      setView({
        phase: 'error',
        message: isApiError(error) ? error.message : t('unsubscribe.error_invalid_link'),
      })
    }
  }, [token, t])

  useEffect(() => {
    void load()
  }, [load])

  const runAction = async (action: 'unsubscribe' | 'resubscribe') => {
    setBusy(true)
    try {
      const status =
        action === 'unsubscribe'
          ? await newsletterApi.unsubscribe(token)
          : await newsletterApi.resubscribe(token)
      setView({
        phase: 'updated',
        status,
        action: action === 'unsubscribe' ? 'unsubscribed' : 'resubscribed',
      })
    } catch (error) {
      setView({
        phase: 'error',
        message: isApiError(error) ? error.message : t('unsubscribe.error_generic'),
      })
    } finally {
      setBusy(false)
    }
  }

  const email = view.phase === 'ready' || view.phase === 'updated' ? view.status.email : null

  return (
    <>
      <Seo title={t('unsubscribe.seo_title')} canonical="/unsubscribe" noindex />
      <div className="shell-narrow mx-auto flex min-h-[70vh] items-center justify-center px-4 py-14 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-gray-900/[0.06] shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/20">
          <div className="flex justify-center">
            <Link to={paths.home} aria-label={t('shell.home_link')}>
              <Logo width={56} />
            </Link>
          </div>

          {view.phase === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-10 text-gray-500 dark:text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm">{t('unsubscribe.loading')}</p>
            </div>
          )}

          {view.phase === 'error' && (
            <div className="py-8">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </span>
              <h1 className="mt-5 font-bold text-gray-900 text-xl dark:text-white">
                {t('unsubscribe.invalid_title')}
              </h1>
              <p className="mt-2 text-gray-500 text-sm dark:text-gray-400">{view.message}</p>
              <Link
                to={paths.home}
                className="mt-6 inline-block font-semibold text-blue-600 text-sm hover:underline dark:text-blue-400"
              >
                {t('unsubscribe.back')}
              </Link>
            </div>
          )}

          {(view.phase === 'ready' || view.phase === 'updated') && (
            <div className="py-4">
              {view.phase === 'updated' ? (
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/15">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </span>
              ) : (
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/10">
                  <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </span>
              )}

              {view.phase === 'ready' && view.status.is_subscribed && (
                <>
                  <h1 className="mt-5 font-bold text-gray-900 text-xl dark:text-white">
                    {t('unsubscribe.subscribed_title', { type: view.status.type_label })}
                  </h1>
                  <p className="mt-2 text-gray-500 text-sm dark:text-gray-400">
                    {email ? (
                      <Trans
                        i18nKey="unsubscribe.updates_go_to"
                        values={{ email }}
                        components={{
                          email: <span className="font-medium text-gray-900 dark:text-white" />,
                        }}
                      />
                    ) : (
                      t('unsubscribe.updates_active')
                    )}
                  </p>
                  <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                    <Button
                      type="button"
                      disabled={busy}
                      onClick={() => void runAction('unsubscribe')}
                      className="bg-red-600 font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60 dark:bg-red-600 dark:hover:bg-red-700"
                    >
                      {t('unsubscribe.unsubscribe')}
                    </Button>
                    <Link
                      to={paths.home}
                      className="inline-flex h-9 items-center justify-center rounded-md px-4 font-medium text-gray-700 text-sm transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      {t('unsubscribe.keep')}
                    </Link>
                  </div>
                </>
              )}

              {view.phase === 'ready' && !view.status.is_subscribed && (
                <>
                  <h1 className="mt-5 font-bold text-gray-900 text-xl dark:text-white">
                    {t('unsubscribe.unsubscribed_title')}
                  </h1>
                  <p className="mt-2 text-gray-500 text-sm dark:text-gray-400">
                    {t('unsubscribe.unsubscribed_body', { type: view.status.type_label })}
                  </p>
                  <div className="mt-7 flex justify-center">
                    <Button
                      type="button"
                      disabled={busy}
                      onClick={() => void runAction('resubscribe')}
                      className="bg-blue-600 font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-700"
                    >
                      {t('unsubscribe.resubscribe')}
                    </Button>
                  </div>
                </>
              )}

              {view.phase === 'updated' && (
                <>
                  <h1 className="mt-5 font-bold text-gray-900 text-xl dark:text-white">
                    {view.action === 'unsubscribed'
                      ? t('unsubscribe.updated_unsubscribed_title')
                      : t('unsubscribe.updated_resubscribed_title')}
                  </h1>
                  <p className="mt-2 text-gray-500 text-sm dark:text-gray-400">
                    {view.action === 'unsubscribed'
                      ? t('unsubscribe.updated_unsubscribed_body', { type: view.status.type_label })
                      : t('unsubscribe.updated_resubscribed_body', {
                          type: view.status.type_label,
                        })}
                  </p>
                  <Link
                    to={paths.home}
                    className="mt-6 inline-block font-semibold text-blue-600 text-sm hover:underline dark:text-blue-400"
                  >
                    {t('unsubscribe.back')}
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
