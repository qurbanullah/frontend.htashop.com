import { AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '@/components/ui/empty-state'

interface QueryErrorStateProps {
  /** Short, specific headline, e.g. "Couldn't load your orders". */
  title: string
  description?: string
  /** Shows a "Try again" action wired to the query's `refetch`. */
  onRetry?: () => void
}

/**
 * Consistent "this request failed" state. Pages must distinguish a failed load
 * from an empty result — showing "no orders yet" when the API errored is
 * misleading and hides outages.
 */
export function QueryErrorState({ title, description, onRetry }: QueryErrorStateProps) {
  const { t } = useTranslation()

  return (
    <EmptyState
      icon={AlertCircle}
      title={title}
      description={description ?? t('query_error.body')}
      action={onRetry ? { label: t('query_error.retry'), onClick: onRetry } : undefined}
    />
  )
}
