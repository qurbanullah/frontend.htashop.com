import { useQuery } from '@tanstack/react-query'
import { Cookie, History, Loader2, ShieldCheck } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { type GdprConsentDto, gdprApi } from '@/api/gdpr'
import { cn } from '@/lib/utils'
import { useConsentStore } from '@/stores/consent'

const STATUS_LABELS: Record<string, string> = {
  accepted: 'consent.status_accepted',
  rejected: 'consent.status_rejected',
  customized: 'consent.status_customized',
  unknown: 'consent.status_unknown',
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function CategoryPill({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-[11px] text-gray-600 dark:bg-gray-800 dark:text-gray-300">
      {label}
    </span>
  )
}

function ConsentHistoryRow({ consent }: { consent: GdprConsentDto }) {
  const { t } = useTranslation()
  const enabled = Object.entries(consent.categories)
    .filter(([, value]) => value)
    .map(([key]) => t(`consent.${key}`))

  return (
    <li className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-medium text-gray-900 text-sm dark:text-white">
          {formatDate(consent.accepted_at)}
        </p>
        <p className="mt-0.5 text-gray-500 text-xs capitalize dark:text-gray-400">
          {t('consent.source')}: {consent.source}
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {enabled.map((label) => (
          <CategoryPill key={label} label={label} />
        ))}
      </div>
    </li>
  )
}

export default function PrivacyPage() {
  const { t } = useTranslation()
  const status = useConsentStore((s) => s.status)
  const categories = useConsentStore((s) => s.categories)
  const openSettings = useConsentStore((s) => s.openSettings)
  const isSettingsOpen = useConsentStore((s) => s.isSettingsOpen)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['gdpr-consent-history'],
    queryFn: () => gdprApi.history(),
    staleTime: 60_000,
  })

  // Refresh history after the global preferences modal closes (a choice
  // may have just been recorded server-side).
  const wasSettingsOpen = useConsentStore((s) => s.isSettingsOpen)
  useEffect(() => {
    if (wasSettingsOpen && !isSettingsOpen) {
      void refetch()
    }
  }, [isSettingsOpen, wasSettingsOpen, refetch])

  const enabledCount = Object.values(categories).filter(Boolean).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-gray-900 dark:text-white">
          {t('consent.privacy_title')}
        </h1>
        <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
          {t('consent.privacy_description')}
        </p>
      </div>

      {/* Preferences */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <Cookie className="h-4 w-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {t('consent.preferences_title')}
          </h2>
        </div>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold text-xs',
                status === 'accepted'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                  : status === 'rejected'
                    ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                    : status === 'customized'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
              )}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {t(STATUS_LABELS[status] ?? 'consent.status_unknown')}
            </div>
            <span className="text-gray-500 text-sm dark:text-gray-400">
              {enabledCount}/{Object.keys(categories).length} {t('consent.categories_on')}
            </span>
          </div>

          <button
            type="button"
            onClick={openSettings}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-5 font-semibold text-sm text-white transition-colors hover:bg-blue-700"
          >
            {t('consent.change_preferences')}
          </button>
        </div>
      </div>

      {/* Consent history */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {t('consent.history_title')}
          </h2>
        </div>

        {isLoading ? (
          <div className="mt-6 flex items-center justify-center py-8 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : data?.data.length ? (
          <ul className="mt-2 divide-y divide-gray-100 dark:divide-gray-800">
            {data.data.map((consent) => (
              <ConsentHistoryRow key={consent.uuid} consent={consent} />
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-gray-500 text-sm dark:text-gray-400">
            {t('consent.history_empty')}
          </p>
        )}
      </div>
    </div>
  )
}
