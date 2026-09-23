import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { ChatCitation, ChatFeedbackValue } from '@/api/chat'
import { ChatMarkdown } from '@/lib/chat-markdown'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/stores/chat'

interface ChatMessageBubbleProps {
  message: ChatMessage
  onRate: (messageId: string, feedback: ChatFeedbackValue) => void
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-1" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"
          style={{ animationDelay: `${index * 120}ms` }}
        />
      ))}
    </span>
  )
}

function CitationList({ items }: { items: ChatCitation[] }) {
  const { t } = useTranslation('chat')

  return (
    <div className="mt-2 border-gray-200 border-t pt-2 dark:border-gray-700">
      <p className="mb-1 font-medium text-gray-500 text-xs dark:text-gray-400">{t('sources')}</p>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={`${item.entry_id}-${item.uuid}`} className="text-xs">
            {item.url?.startsWith('/') ? (
              <Link to={item.url} className="text-blue-600 underline hover:text-blue-700">
                {item.title}
              </Link>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">{item.title}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ChatMessageBubble({ message, onRate }: ChatMessageBubbleProps) {
  const { t } = useTranslation('chat')
  const isUser = message.role === 'user'
  const isThinking = !isUser && message.isStreaming === true && message.content.trim() === ''
  const canRate = !isUser && Boolean(message.serverId) && !message.isStreaming && !message.isError

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100',
          message.isError && 'bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100'
        )}
      >
        {isThinking ? (
          <TypingDots />
        ) : isUser ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <ChatMarkdown content={message.content} />
        )}

        {message.citations.length > 0 && <CitationList items={message.citations} />}

        {canRate && (
          <div className="mt-2 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onRate(message.id, 'helpful')}
              aria-pressed={message.feedback === 'helpful'}
              aria-label={t('rating_helpful')}
              title={t('rating_helpful')}
              className={cn(
                'rounded p-1 transition-colors',
                message.feedback === 'helpful'
                  ? 'text-green-600'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              )}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onRate(message.id, 'unhelpful')}
              aria-pressed={message.feedback === 'unhelpful'}
              aria-label={t('rating_unhelpful')}
              title={t('rating_unhelpful')}
              className={cn(
                'rounded p-1 transition-colors',
                message.feedback === 'unhelpful'
                  ? 'text-amber-600'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              )}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
            {message.feedback && (
              <span className="text-gray-400 text-xs dark:text-gray-500">
                {t('thanks_feedback')}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
