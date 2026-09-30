import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import type * as React from 'react'
import { cn } from '@/lib/utils'

export type AlertTone = 'info' | 'success' | 'warning' | 'error'

const TONES: Record<AlertTone, { container: string; icon: string; title: string; body: string }> = {
  info: {
    container: 'border-blue-200 bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/30',
    icon: 'text-blue-600 dark:text-blue-400',
    title: 'text-blue-900 dark:text-blue-100',
    body: 'text-blue-800 dark:text-blue-200',
  },
  success: {
    container: 'border-green-200 bg-green-50 dark:border-green-900/60 dark:bg-green-950/30',
    icon: 'text-green-600 dark:text-green-400',
    title: 'text-green-900 dark:text-green-100',
    body: 'text-green-800 dark:text-green-200',
  },
  warning: {
    container: 'border-orange-200 bg-orange-50 dark:border-orange-900/60 dark:bg-orange-950/30',
    icon: 'text-orange-600 dark:text-orange-400',
    title: 'text-orange-900 dark:text-orange-100',
    body: 'text-orange-800 dark:text-orange-200',
  },
  error: {
    container: 'border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30',
    icon: 'text-red-600 dark:text-red-400',
    title: 'text-red-900 dark:text-red-100',
    body: 'text-red-800 dark:text-red-200',
  },
}

const ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
}

export interface AlertProps {
  tone?: AlertTone
  title?: React.ReactNode
  children?: React.ReactNode
  className?: string
  /** Extra action rendered under the message (e.g. "Try again"). */
  action?: React.ReactNode
}

/**
 * Inline, contextual message.
 *
 * Deliberately not a toast: at checkout a failure must stay on screen until the
 * customer has dealt with it, and it has to be reachable by screen readers after
 * a re-render (hence `role="alert"` on the assertive tones).
 */
export function Alert({ tone = 'info', title, children, className, action }: AlertProps) {
  const styles = TONES[tone]
  const Icon = ICONS[tone]

  return (
    <div
      role={tone === 'error' || tone === 'warning' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-xl border p-4', styles.container, className)}
    >
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', styles.icon)} aria-hidden="true" />
      <div className="min-w-0 flex-1 text-sm">
        {title && <p className={cn('font-semibold', styles.title)}>{title}</p>}
        {children && <div className={cn(title ? 'mt-1' : '', styles.body)}>{children}</div>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  )
}
