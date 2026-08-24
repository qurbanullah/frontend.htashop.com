import { cn } from '@/lib/utils'

interface ToggleProps {
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
  label: string
}

/**
 * Accessible switch used by the consent preferences modal.
 * Rendered as a button with role="switch" (no external dependency needed).
 */
export function Toggle({ checked, disabled, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
        checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700',
        disabled && 'cursor-not-allowed opacity-60'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-[22px]' : 'translate-x-[4px]'
        )}
      />
    </button>
  )
}
