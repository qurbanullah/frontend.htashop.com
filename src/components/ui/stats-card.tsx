import { type LucideIcon, TrendingDown, TrendingUp } from 'lucide-react'
import type * as React from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
    label?: string
  }
  description?: string
  className?: string
  iconClassName?: string
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  description,
  className,
  iconClassName,
}) => {
  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-medium text-gray-600 text-sm dark:text-gray-400">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="font-bold text-gray-900 text-sm dark:text-gray-100">{value}</h3>
            {trend && (
              <span
                className={cn(
                  'flex items-center font-medium text-sm',
                  trend.isPositive
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                )}
              >
                {trend.isPositive ? (
                  <TrendingUp className="mr-1 h-4 w-4" />
                ) : (
                  <TrendingDown className="mr-1 h-4 w-4" />
                )}
                {trend.value}%
              </span>
            )}
          </div>
          {(description || trend?.label) && (
            <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
              {description || trend?.label}
            </p>
          )}
        </div>
        <div className={cn('rounded-full bg-blue-100 p-3 dark:bg-blue-900/30', iconClassName)}>
          <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
    </Card>
  )
}
