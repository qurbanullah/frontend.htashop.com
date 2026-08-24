import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './button'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl'
  closeOnBackdropClick?: boolean
  showCloseButton?: boolean
  noPadding?: boolean
  fullScreen?: boolean
  className?: string
  enterDuration?: number // in milliseconds
  exitDuration?: number // in milliseconds
  initialFocusRef?: React.RefObject<HTMLElement | null> // Element to focus instead of modal
}

const MAX_WIDTH_CLASSES: Record<NonNullable<ModalProps['maxWidth']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
}

function panelClasses(
  fullScreen: boolean,
  isAnimating: boolean,
  maxWidth: string,
  className: string
): string {
  const size = fullScreen
    ? 'h-full max-h-none w-full max-w-none rounded-none shadow-none'
    : `w-full rounded-xl shadow-2xl ${maxWidth} max-h-[90vh]`
  const state = fullScreen
    ? isAnimating
      ? 'opacity-100'
      : 'opacity-0'
    : isAnimating
      ? 'translate-y-0 scale-100 opacity-100'
      : 'translate-y-4 scale-95 opacity-0'
  return `flex flex-col bg-white transition-all ease-out dark:bg-gray-800 ${size} ${state} ${className}`
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = '2xl',
  closeOnBackdropClick = true,
  showCloseButton = true,
  noPadding = false,
  fullScreen = false,
  className = '',
  enterDuration = 300,
  exitDuration = 200,
  initialFocusRef,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)
  // Keep onClose in a ref so the escape handler always has the latest version
  // without needing it as a useEffect dependency (which would steal focus on re-renders)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // Animation states
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  // Handle modal open/close with animations
  useEffect(() => {
    if (isOpen) {
      // Opening: Show immediately and start enter animation
      setIsVisible(true)
      // Use setTimeout instead of requestAnimationFrame for more reliable animation trigger
      const timer = setTimeout(() => {
        setIsAnimating(true)
      }, 10) // Small delay to ensure initial render completes
      return () => clearTimeout(timer)
    } else if (isVisible) {
      // Closing: Start exit animation
      setIsAnimating(false)
      // Wait for exit animation to complete before hiding
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, exitDuration)
      return () => clearTimeout(timer)
    }
  }, [isOpen, exitDuration, isVisible])

  // Handle escape key press and body scroll
  // NOTE: onClose is intentionally accessed via ref — do NOT add it to deps.
  // Adding onClose (a non-memoized function) would cause this effect to re-run on every
  // parent render, which calls modalRef.current?.focus() and steals focus from textareas.
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAnimating) {
        onCloseRef.current()
      }
    }

    if (isVisible) {
      document.addEventListener('keydown', handleEscape)
      const scrollY = window.scrollY
      const bodyWidth = document.body.offsetWidth
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = `${bodyWidth}px`
      // Store currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement
    } else {
      const scrollY = Math.abs(parseInt(document.body.style.top || '0', 10))
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, scrollY)
      // Restore focus to previously focused element
      previousActiveElement.current?.focus()
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      const scrollY = Math.abs(parseInt(document.body.style.top || '0', 10))
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, scrollY)
    }
  }, [isVisible, isAnimating]) // onClose excluded intentionally — accessed via ref above

  // Focus once when the modal finishes opening (isAnimating transitions false → true).
  // Kept separate so it never re-fires while the modal is already open and the user is typing.
  const prevIsAnimating = useRef(false)
  useEffect(() => {
    if (isAnimating && !prevIsAnimating.current) {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus()
      } else {
        modalRef.current?.focus()
      }
    }
    prevIsAnimating.current = isAnimating
  }, [isAnimating, initialFocusRef])

  // Don't render if not visible
  if (!isVisible) return null

  const maxWidthClass = MAX_WIDTH_CLASSES[maxWidth]

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose()
    }
  }

  const backdropClass = `fixed inset-0 z-50 flex bg-black/50 backdrop-blur-sm transition-opacity ease-out ${
    fullScreen ? '' : 'items-center justify-center p-4'
  } ${isAnimating ? 'opacity-100' : 'opacity-0'}`

  return createPortal(
    <>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop click is a pointer convenience — Escape closes the dialog (handled below) */}
      <div
        className={backdropClass}
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? 'modal-description' : undefined}
        style={{
          transitionDuration: `${isAnimating ? enterDuration : exitDuration}ms`,
        }}
      >
        {/* biome-ignore lint/a11y/noStaticElementInteractions: modal panel — stopPropagation is structural; keyboard access is handled by the dialog focus + Escape listener */}
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: modal panel — stopPropagation is structural; keyboard access is handled by the dialog focus + Escape listener */}
        <div
          ref={modalRef}
          tabIndex={-1}
          className={panelClasses(fullScreen, isAnimating, maxWidthClass, className)}
          onClick={(e) => e.stopPropagation()}
          style={{
            transitionDuration: `${isAnimating ? enterDuration : exitDuration}ms`,
          }}
        >
          {/* Header */}
          <div className="shrink-0 border-gray-200 border-b px-6 py-4 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-8">
                <h3
                  id="modal-title"
                  className="font-semibold text-gray-900 text-xl dark:text-gray-100"
                >
                  {title}
                </h3>
                {description && (
                  <p
                    id="modal-description"
                    className="mt-1 text-gray-500 text-sm dark:text-gray-400"
                  >
                    {description}
                  </p>
                )}
              </div>
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-shrink-0 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className={`min-h-0 flex-1 overflow-y-auto ${noPadding ? '' : 'px-6 py-4'}`}>
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="shrink-0 border-gray-200 border-t bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  )
}

// Optional: Separate ModalFooter component for consistency
export interface ModalFooterProps {
  children: React.ReactNode
  className?: string
}

export function ModalFooter({ children, className = '' }: ModalFooterProps) {
  return <div className={`flex items-center justify-end gap-3 ${className}`}>{children}</div>
}

// Optional: ModalActions component for common action patterns
export interface ModalActionsProps {
  onCancel?: () => void
  onConfirm?: () => void
  cancelText?: string
  confirmText?: string
  isLoading?: boolean
  cancelVariant?: 'outline' | 'ghost' | 'secondary'
  confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost'
  disableConfirm?: boolean
  additionalInfo?: React.ReactNode
}

export function ModalActions({
  onCancel,
  onConfirm,
  cancelText = 'Cancel',
  confirmText = 'Confirm',
  isLoading = false,
  cancelVariant = 'outline',
  confirmVariant = 'default',
  disableConfirm = false,
  additionalInfo,
}: ModalActionsProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-gray-600 text-sm dark:text-gray-400">{additionalInfo}</div>
      <div className="flex gap-3">
        {onCancel && (
          <Button variant={cancelVariant} onClick={onCancel} disabled={isLoading}>
            {cancelText}
          </Button>
        )}
        {onConfirm && (
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={isLoading || disableConfirm}
            className="min-w-[120px]"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Loading...
              </div>
            ) : (
              confirmText
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
