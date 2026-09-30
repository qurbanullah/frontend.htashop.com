import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { CheckoutStep } from '@/lib/checkout-schema'
import { cn } from '@/lib/utils'

export interface StepperStep {
  id: CheckoutStep
  /** i18n key, e.g. `checkout.step_information`. */
  labelKey: string
}

interface ItemProps {
  step: StepperStep
  index: number
  isComplete: boolean
  isCurrent: boolean
  canNavigate: boolean
  isLast: boolean
  onNavigate: (step: CheckoutStep) => void
}

function StepperItem({
  step,
  index,
  isComplete,
  isCurrent,
  canNavigate,
  isLast,
  onNavigate,
}: ItemProps) {
  const { t } = useTranslation()

  return (
    <li className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
      <button
        type="button"
        onClick={() => canNavigate && onNavigate(step.id)}
        disabled={!canNavigate}
        aria-current={isCurrent ? 'step' : undefined}
        className={cn(
          'flex min-w-0 items-center gap-2 rounded-full py-1 pe-2 text-start transition-colors',
          canNavigate && 'hover:opacity-80',
          !canNavigate && 'cursor-default'
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-semibold text-xs transition-colors',
            isComplete && 'border-blue-600 bg-blue-600 text-white',
            isCurrent && 'border-blue-600 text-blue-700 dark:text-blue-300',
            !isComplete && !isCurrent && 'border-gray-300 text-gray-400 dark:border-gray-700'
          )}
        >
          {isComplete ? <Check className="h-4 w-4" /> : index + 1}
        </span>
        <span
          className={cn(
            'hidden truncate font-medium text-sm sm:block',
            isCurrent && 'text-gray-900 dark:text-white',
            isComplete && 'text-gray-700 dark:text-gray-200',
            !isComplete && !isCurrent && 'text-gray-400 dark:text-gray-500'
          )}
        >
          {t(step.labelKey)}
        </span>
      </button>

      {!isLast && (
        <span
          aria-hidden="true"
          className={cn(
            'h-px min-w-3 flex-1',
            isComplete ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'
          )}
        />
      )}
    </li>
  )
}

interface Props {
  steps: StepperStep[]
  current: CheckoutStep
  /**
   * Furthest step the customer has unlocked. Anything at or before this is
   * clickable, so a completed step can be corrected without losing the rest.
   */
  furthestIndex: number
  onNavigate: (step: CheckoutStep) => void
}

/**
 * Checkout progress.
 *
 * Uses an ordered list so the sequence is conveyed to assistive tech as
 * structure, not just as colour, and marks the active step with `aria-current`.
 */
export function CheckoutStepper({ steps, current, furthestIndex, onNavigate }: Props) {
  const { t } = useTranslation()
  const currentIndex = steps.findIndex((step) => step.id === current)

  return (
    <nav aria-label={t('checkout.progress_label')}>
      <ol className="flex items-center gap-2 sm:gap-4">
        {steps.map((step, index) => (
          <StepperItem
            key={step.id}
            step={step}
            index={index}
            isComplete={index < currentIndex}
            isCurrent={index === currentIndex}
            canNavigate={index <= furthestIndex && index !== currentIndex}
            isLast={index === steps.length - 1}
            onNavigate={onNavigate}
          />
        ))}
      </ol>

      {/* Announced to screen readers as the name of the current step. */}
      <p className="sr-only">
        {t('checkout.step_of', { current: currentIndex + 1, total: steps.length })}:{' '}
        {t(steps[currentIndex]?.labelKey ?? '')}
      </p>
    </nav>
  )
}
