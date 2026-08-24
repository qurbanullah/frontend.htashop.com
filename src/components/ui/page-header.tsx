import { ChevronLeft } from 'lucide-react'
import type * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  backButton?: boolean
  backTo?: string
  className?: string
  titleClassName?: string
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  backButton = false,
  backTo,
  className,
  titleClassName,
}) => {
  const navigate = useNavigate()

  const handleBack = () => {
    if (backTo) {
      navigate(backTo)
    } else {
      navigate(-1)
    }
  }

  return (
    <div className={cn('mb-6', className)}>
      {backButton && (
        <Button variant="ghost" size="sm" onClick={handleBack} className="mb-4 -ml-2">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
      )}

      <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
          <h1
            className={cn(
              'font-bold text-base text-gray-900 tracking-tight sm:pr-36 sm:text-xl lg:text-2xl dark:text-gray-100',
              titleClassName || 'line-clamp-2'
            )}
          >
            {title}
          </h1>
          {description && (
            <p className="line-clamp-1 text-base text-gray-800 dark:text-gray-400">{description}</p>
          )}
        </div>
        {actions && <div className="w-full flex-shrink-0 lg:w-auto">{actions}</div>}
      </div>
    </div>
  )
}
