import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

// Wrapper around Radix Dialog.Root that keeps children mounted briefly
// after `open` becomes false so CSS exit animations can run (matches Modal behavior).
type AnimContext = {
  isAnimating: boolean
  enterDuration: number
  exitDuration: number
}

const DialogAnimContext = createContext<AnimContext | null>(null)

function Dialog(props: React.ComponentProps<typeof DialogPrimitive.Root>) {
  const { open } = props as { open?: boolean }
  const enterDuration = 300
  const exitDuration = 200 // match Modal defaults

  const [isVisible, setIsVisible] = useState(Boolean(open))
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (open) {
      setIsVisible(true)
      // start enter animation shortly after mount
      const enterTimer = setTimeout(() => setIsAnimating(true), 10)
      return () => clearTimeout(enterTimer)
    }

    if (isVisible) {
      // start exit animation
      setIsAnimating(false)
      const t = setTimeout(() => setIsVisible(false), exitDuration)
      return () => clearTimeout(t)
    }
  }, [open, isVisible])

  return (
    <DialogPrimitive.Root {...props}>
      <DialogAnimContext.Provider value={{ isAnimating, enterDuration, exitDuration }}>
        {isVisible ? props.children : null}
      </DialogAnimContext.Provider>
    </DialogPrimitive.Root>
  )
}
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => {
  const ctx = useContext(DialogAnimContext)
  const isAnimating = ctx?.isAnimating ?? false
  const duration = isAnimating ? (ctx?.enterDuration ?? 300) : (ctx?.exitDuration ?? 200)
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-30 bg-black/50 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in dark:bg-black/70',
        isAnimating ? 'opacity-100' : 'opacity-0',
        className
      )}
      {...props}
      style={{ transitionDuration: `${duration}ms` }}
    />
  )
})
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  hideCloseButton?: boolean
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, hideCloseButton, ...props }, ref) => {
  const ctx = useContext(DialogAnimContext)
  const isAnimating = ctx?.isAnimating ?? false
  const duration = isAnimating ? (ctx?.enterDuration ?? 300) : (ctx?.exitDuration ?? 200)

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-40 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 bg-white p-6 shadow-lg duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in sm:rounded-lg dark:border-gray-800 dark:bg-gray-900',
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
          className
        )}
        {...props}
        style={{ transitionDuration: `${duration}ms` }}
      >
        {children}
        {!hideCloseButton && (
          <DialogPrimitive.Close className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100 data-[state=open]:text-gray-500 dark:ring-offset-gray-950 dark:data-[state=open]:bg-gray-800 dark:data-[state=open]:text-gray-400 dark:focus:ring-gray-300">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
)
DialogHeader.displayName = 'DialogHeader'

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
)
DialogFooter.displayName = 'DialogFooter'

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'font-semibold text-gray-900 text-lg leading-none tracking-tight dark:text-gray-100',
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-gray-500 text-sm dark:text-gray-400', className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
