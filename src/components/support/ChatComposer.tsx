import { Send, Square } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface ChatComposerProps {
  onSend: (text: string) => void
  onStop: () => void
  isStreaming: boolean
  disabled?: boolean
}

export function ChatComposer({ onSend, onStop, isStreaming, disabled = false }: ChatComposerProps) {
  const { t } = useTranslation('chat')
  const [value, setValue] = useState('')

  const submit = () => {
    const text = value.trim()
    if (text === '' || isStreaming || disabled) return

    setValue('')
    onSend(text)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    submit()
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 border-gray-200 border-t p-3">
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            submit()
          }
        }}
        rows={1}
        maxLength={2000}
        disabled={disabled}
        placeholder={t('placeholder')}
        aria-label={t('placeholder')}
        className="max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-900 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
      />

      {isStreaming ? (
        <button
          type="button"
          onClick={onStop}
          aria-label={t('stop')}
          title={t('stop')}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-300 text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <Square className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="submit"
          disabled={disabled || value.trim() === ''}
          aria-label={t('send')}
          title={t('send')}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      )}
    </form>
  )
}
