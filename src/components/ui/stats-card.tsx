import * as React from 'react'
import { Card } from '@/components/ui/card'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
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
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {value}
            </h3>
            {trend && (
              <span
                className={cn(
                  'flex items-center text-sm font-medium',
                  trend.isPositive
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                )}
              >
                {trend.isPositive ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                {trend.value}%
              </span>
            )}
          </div>
          {(description || trend?.label) && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {description || trend?.label}
            </p>
          )}
        </div>
        <div
          className={cn(
            'rounded-full p-3 bg-blue-100 dark:bg-blue-900/30',
            iconClassName
          )}
        >
          <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
    </Card>
  )
}
