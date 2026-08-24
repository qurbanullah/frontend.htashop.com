import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

// ── Variant configuration map — single source of truth ──

interface VariantConfig {
  icon: typeof CheckCircle
  container: string
  text: string
  description: string
}

const VARIANTS: Record<ToastType, VariantConfig> = {
  success: {
    icon: CheckCircle,
    container: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    text: 'text-green-900 dark:text-green-100',
    description: 'text-green-700 dark:text-green-300',
  },
  error: {
    icon: XCircle,
    container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    text: 'text-red-900 dark:text-red-100',
    description: 'text-red-700 dark:text-red-300',
  },
  warning: {
    icon: AlertTriangle,
    container: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
    text: 'text-orange-900 dark:text-orange-100',
    description: 'text-orange-700 dark:text-orange-300',
  },
  info: {
    icon: Info,
    container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    text: 'text-blue-900 dark:text-blue-100',
    description: 'text-blue-700 dark:text-blue-300',
  },
}

// ── Animation variants ──

const slideIn = {
  hidden: { opacity: 0, x: 80, scale: 0.95 },
  visible: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: 80, scale: 0.95, transition: { duration: 0.2 } },
}

// ── Props ──

export interface ToastProps {
  id: string
  type: ToastType
  message: string
  description?: string
  duration?: number
  onClose: (id: string) => void
}

export function Toast({ id, type, message, description, duration = 5000, onClose }: ToastProps) {
  const timerRef = useRef<number | null>(null)
  const remainingRef = useRef(duration)

  const variant = VARIANTS[type]
  const Icon = variant.icon

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startTimer = useCallback(() => {
    clearTimer()
    if (duration <= 0) return
    timerRef.current = setTimeout(() => onClose(id), remainingRef.current)
  }, [id, duration, onClose, clearTimer])

  // Start timer on mount
  useEffect(() => {
    startTimer()
    return clearTimer
  }, [startTimer, clearTimer])

  const handleMouseEnter = () => {
    clearTimer()
  }

  const handleMouseLeave = () => {
    remainingRef.current = duration
    startTimer()
  }

  return (
    <motion.div
      layout
      variants={slideIn}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      className={`flex items-start gap-3 rounded-lg border p-4 shadow-lg ${variant.container}`}
      role="alert"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />

      <div className="min-w-0 flex-1">
        <p className={`font-medium text-sm ${variant.text}`}>{message}</p>
        {description && <p className={`mt-1 text-sm ${variant.description}`}>{description}</p>}
      </div>

      <button
        type="button"
        onClick={() => onClose(id)}
        className="shrink-0 rounded p-0.5 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  )
}
