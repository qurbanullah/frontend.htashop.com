import { RotateCcw, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ChatComposer } from '@/components/support/ChatComposer'
import { ChatMessageBubble } from '@/components/support/ChatMessageBubble'
import { ChatSuggestions } from '@/components/support/ChatSuggestions'
import { isRTL } from '@/i18n/config'
import { useChatStore } from '@/stores/chat'

export function ChatPanel() {
  const { t, i18n } = useTranslation('chat')

  const messages = useChatStore((s) => s.messages)
  const status = useChatStore((s) => s.status)
  const error = useChatStore((s) => s.error)
  const activeTool = useChatStore((s) => s.activeTool)
  const config = useChatStore((s) => s.config)
  const send = useChatStore((s) => s.send)
  const stop = useChatStore((s) => s.stop)
  const close = useChatStore((s) => s.close)
  const rate = useChatStore((s) => s.rate)
  const startNewConversation = useChatStore((s) => s.startNewConversation)

  const scrollRef = useRef<HTMLDivElement>(null)

  // Keep the newest message in view as tokens stream in.
  // biome-ignore lint/correctness/useExhaustiveDependencies: scrolling is the intended effect of new content
  useEffect(() => {
    const container = scrollRef.current
    if (container) container.scrollTop = container.scrollHeight
  }, [messages, status, activeTool])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }

    window.addEventListener('keydown', handleKey)

    return () => window.removeEventListener('keydown', handleKey)
  }, [close])

  const isStreaming = status === 'streaming'
  const suggestions = config?.suggestions ?? []

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      dir={isRTL(String(i18n.language)) ? 'rtl' : 'ltr'}
    >
      <header className="flex items-center justify-between gap-2 border-gray-200 border-b px-4 py-3 dark:border-gray-800">
        <div className="min-w-0">
          <h2 className="truncate font-semibold text-gray-900 text-sm dark:text-white">
            {t('title')}
          </h2>
          <p className="truncate text-gray-500 text-xs dark:text-gray-400">{t('subtitle')}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => void startNewConversation()}
            aria-label={t('new_conversation')}
            title={t('new_conversation')}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={close}
            aria-label={t('close')}
            title={t('close')}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <div className="rounded-2xl bg-gray-100 px-3.5 py-2.5 text-gray-900 text-sm leading-relaxed dark:bg-gray-800 dark:text-gray-100">
              {config?.greeting || t('greeting')}
            </div>
            <ChatSuggestions suggestions={suggestions} onSelect={(text) => void send(text)} />
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessageBubble
              key={message.id}
              message={message}
              onRate={(id, value) => void rate(id, value)}
            />
          ))
        )}

        {activeTool && (
          <p className="text-gray-400 text-xs dark:text-gray-500" aria-live="polite">
            {t('working')}
          </p>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800 text-xs dark:bg-amber-950 dark:text-amber-200"
          >
            {error}
          </div>
        )}
      </div>

      <ChatComposer
        onSend={(text) => void send(text)}
        onStop={stop}
        isStreaming={isStreaming}
        disabled={config?.preview === true}
      />

      <p className="border-gray-200 border-t px-4 py-2 text-[10px] text-gray-400 leading-snug dark:border-gray-800 dark:text-gray-500">
        {t('disclaimer')}
      </p>
    </div>
  )
}
