import { Inbox, type LucideIcon } from 'lucide-react'
import type * as React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn('flex flex-col items-center justify-center px-4 py-12 text-center', className)}
    >
      <div className="mb-4 rounded-full bg-gray-100 p-3 dark:bg-gray-800">
        <Icon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="mb-2 font-semibold text-gray-900 text-lg dark:text-gray-100">{title}</h3>
      {description && (
        <p className="mb-6 max-w-md text-gray-500 text-sm dark:text-gray-400">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
    </div>
  )
}
