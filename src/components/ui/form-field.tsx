import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export interface FormFieldProps {
  label: string
  name: string
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select'
  placeholder?: string
  value?: string | number
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
  error?: string
  required?: boolean
  disabled?: boolean
  className?: string
  /** Optional class applied to the inner input/textarea */
  inputClassName?: string
  options?: Array<{ value: string | number; label: string }>
  rows?: number
  helpText?: string
  /** Allow callers to provide a custom input element as children */
  children?: React.ReactNode
}

export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  (
    {
      label,
      name,
      type = 'text',
      placeholder,
      value,
      onChange,
      error,
      required = false,
      disabled = false,
      className,
      inputClassName,
      options = [],
      rows = 4,
      helpText,
      children,
    },
    ref
  ) => {
    const id = `field-${name}`

    return (
      <div ref={ref} className={cn('space-y-2', className)}>
        <Label htmlFor={id} className="font-medium text-gray-900 text-sm dark:text-gray-100">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </Label>

        {children ? (
          // If caller provides a custom input element, render it directly
          children
        ) : type === 'textarea' ? (
          <Textarea
            id={id}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            disabled={disabled}
            rows={rows}
            className={cn(inputClassName, error && 'border-red-500 focus-visible:ring-red-500')}
          />
        ) : type === 'select' ? (
          <select
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={cn(
              'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus-visible:ring-blue-600',
              error && 'border-red-500 focus-visible:ring-red-500',
              inputClassName
            )}
          >
            <option value="">Select {label}</option>
            {options.map((option) => (
              <option key={String(option.value)} value={option.value}>
                {option.label ?? String(option.value)}
              </option>
            ))}
          </select>
        ) : (
          <Input
            id={id}
            name={name}
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={cn(error && 'border-red-500 focus-visible:ring-red-500', inputClassName)}
          />
        )}

        {helpText && !error && (
          <p className="text-gray-500 text-xs dark:text-gray-400">{helpText}</p>
        )}

        {error && (
          <p className="flex items-center gap-1 text-red-600 text-xs dark:text-red-400">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    )
  }
)

FormField.displayName = 'FormField'
