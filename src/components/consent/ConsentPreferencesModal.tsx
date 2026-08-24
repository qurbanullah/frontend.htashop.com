import { Lock, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Toggle } from '@/components/consent/Toggle'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ConsentCategories, ConsentCategory } from '@/lib/consent/constants'
import { useConsentStore } from '@/stores/consent'

interface ConsentPreferencesModalProps {
  open: boolean
  onClose: () => void
}

interface CategoryRow {
  key: ConsentCategory
  titleKey: string
  descriptionKey: string
  locked?: boolean
}

const CATEGORY_ROWS: CategoryRow[] = [
  {
    key: 'necessary',
    titleKey: 'consent.necessary',
    descriptionKey: 'consent.necessary_description',
    locked: true,
  },
  {
    key: 'preferences',
    titleKey: 'consent.preferences',
    descriptionKey: 'consent.preferences_description',
  },
  {
    key: 'analytics',
    titleKey: 'consent.analytics',
    descriptionKey: 'consent.analytics_description',
  },
  {
    key: 'marketing',
    titleKey: 'consent.marketing',
    descriptionKey: 'consent.marketing_description',
  },
]

/**
 * Granular cookie preferences — category toggles with "strictly necessary"
 * locked on, matching the consent management platform standard.
 */
export function ConsentPreferencesModal({ open, onClose }: ConsentPreferencesModalProps) {
  const { t } = useTranslation()
  const categories = useConsentStore((s) => s.categories)
  const acceptAll = useConsentStore((s) => s.acceptAll)
  const savePreferences = useConsentStore((s) => s.savePreferences)

  const [draft, setDraft] = useState<ConsentCategories>(categories)

  // Reset the draft to the current choice every time the modal opens.
  useEffect(() => {
    if (open) setDraft(categories)
  }, [open, categories])

  const toggleCategory = (key: ConsentCategory) => {
    setDraft((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = () => {
    savePreferences(draft)
    onClose()
  }

  const handleAcceptAll = () => {
    acceptAll()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-lg sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-blue-500/25 shadow-lg">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <DialogTitle>{t('consent.settings_title')}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            {t('consent.settings_description')}
          </DialogDescription>
        </DialogHeader>

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {CATEGORY_ROWS.map((row) => {
            const isLocked = row.locked === true
            return (
              <div key={row.key} className="flex items-start justify-between gap-4 py-3.5">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-semibold text-gray-900 text-sm dark:text-white">
                    {t(row.titleKey)}
                    {isLocked && <Lock className="h-3.5 w-3.5 text-gray-400" />}
                  </p>
                  <p className="mt-0.5 text-gray-500 text-xs leading-relaxed dark:text-gray-400">
                    {t(row.descriptionKey)}
                  </p>
                </div>
                <Toggle
                  checked={isLocked ? true : draft[row.key]}
                  disabled={isLocked}
                  onChange={() => toggleCategory(row.key)}
                  label={t(row.titleKey)}
                />
              </div>
            )
          })}
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={handleAcceptAll}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 font-semibold text-gray-700 text-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            {t('consent.accept_all')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-5 font-semibold text-sm text-white transition-colors hover:bg-blue-700"
          >
            {t('consent.save_preferences')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
