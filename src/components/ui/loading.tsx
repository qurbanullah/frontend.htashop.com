import { Loader2 } from 'lucide-react'
import type * as React from 'react'
import { cn } from '@/lib/utils'

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  text?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className, text }) => {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin text-blue-600 dark:text-blue-400', sizeClasses[size])} />
      {text && <p className="text-gray-600 text-sm dark:text-gray-400">{text}</p>}
    </div>
  )
}

export interface LoadingOverlayProps {
  visible: boolean
  text?: string
  className?: string
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  text = 'Loading...',
  className,
}) => {
  if (!visible) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm dark:bg-black/70',
        className
      )}
    >
      <div className="rounded-lg bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:bg-gray-900/80">
        <LoadingSpinner size="lg" text={text} />
      </div>
    </div>
  )
}

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-gray-200 dark:bg-gray-800', className)}
      {...props}
    />
  )
}
