import { api, getApiUrl } from '@/api/client'
import i18n from '@/i18n/config'
import { parseApiResponse } from '@/lib/api-response'
import { getChatToken, loadChatToken } from '@/lib/chat-token'
import { getNativeToken } from '@/lib/native-auth'
import { readSseStream } from '@/lib/sse'

export type ChatFeedbackValue = 'helpful' | 'unhelpful'

export interface ChatCitation {
  entry_id: number
  uuid: string
  title: string
  url: string | null
  score: number
}

export interface ChatMessageDto {
  uuid: string
  role: string
  content: string
  citations: ChatCitation[]
  tool_calls: unknown[]
  feedback: ChatFeedbackValue | null
  created_at: string | null
}

export interface ChatConfigDto {
  enabled: boolean
  preview: boolean
  configured: boolean
  tickets_enabled: boolean
  restore_transcript: boolean
  max_history_messages: number
  locale: string
  greeting: string
  suggestions: string[]
}

export interface ChatConversationDto {
  uuid: string
  status: string
  locale: string
  message_count: number
  needs_attention: boolean
  created_at: string | null
}

export interface ChatHistoryDto {
  conversation: ChatConversationDto | null
  messages: ChatMessageDto[]
}

export interface ChatStreamHandlers {
  onMeta?: (data: { conversation_id?: string; model?: string }) => void
  onToken?: (delta: string) => void
  onTool?: (name: string, status: string) => void
  onCitations?: (items: ChatCitation[]) => void
  onDone?: (data: { message_id?: string }) => void
  onError?: (message: string) => void
  signal?: AbortSignal
}

/** Resolved lazily so the message follows the language active when it fails. */
function genericErrorMessage(): string {
  return i18n.t('chat.error_unavailable')
}

/**
 * Visitor identity for assistant requests. Empty on the web, where the API's
 * httpOnly `chat_visitor` cookie carries it.
 */
function visitorHeaders(): Record<string, string> {
  const token = getChatToken()
  return token ? { 'X-Chat-Token': token } : {}
}

/**
 * Same as `visitorHeaders`, but guarantees the device-stored token has been
 * read first — otherwise the request would fall back to the API's cookie path
 * and, on native, land on the shared empty-token visitor.
 */
async function readyVisitorHeaders(): Promise<Record<string, string>> {
  await loadChatToken()
  return visitorHeaders()
}

/**
 * Headers for the streaming endpoint, which uses `fetch` instead of `ky` and so
 * does not inherit the API client's bearer-token hook.
 */
async function streamHeaders(): Promise<Record<string, string>> {
  const bearer = getNativeToken()

  return {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
    ...(await readyVisitorHeaders()),
    ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
  }
}

/** Pull the message out of the standard error envelope, if there is one. */
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string }
    if (body?.message) return body.message
  } catch {
    // Non-JSON error body.
  }

  return genericErrorMessage()
}

export const chatApi = {
  async config(locale: string): Promise<ChatConfigDto> {
    const res = await api.get('chat/config', {
      searchParams: { locale },
      headers: visitorHeaders(),
      throwHttpErrors: false,
    })
    const body = await parseApiResponse<ChatConfigDto>(res)
    return body.data
  },

  async history(): Promise<ChatHistoryDto> {
    const res = await api.get('chat/conversation', {
      headers: await readyVisitorHeaders(),
      throwHttpErrors: false,
    })
    const body = await parseApiResponse<ChatHistoryDto>(res)
    return body.data
  },

  async reset(): Promise<void> {
    const res = await api.post('chat/conversation/actions/reset', {
      headers: await readyVisitorHeaders(),
      throwHttpErrors: false,
    })
    await parseApiResponse(res)
  },

  async feedback(uuid: string, feedback: ChatFeedbackValue, comment?: string): Promise<void> {
    const res = await api.post(`chat/messages/${encodeURIComponent(uuid)}/actions/feedback`, {
      json: { feedback, comment },
      headers: await readyVisitorHeaders(),
      throwHttpErrors: false,
    })
    await parseApiResponse(res)
  },
}

/**
 * Send a message and consume the streamed reply.
 *
 * Uses `fetch` rather than the shared `ky` client because the reply must be
 * read incrementally as it arrives.
 */
export async function streamChatMessage(
  message: string,
  locale: string,
  handlers: ChatStreamHandlers
): Promise<void> {
  const response = await fetch(`${getApiUrl()}/chat/stream`, {
    method: 'POST',
    credentials: 'include',
    headers: await streamHeaders(),
    body: JSON.stringify({ message, locale }),
    signal: handlers.signal,
  })

  if (!response.ok || !response.body) {
    handlers.onError?.(await readErrorMessage(response))
    return
  }

  for await (const frame of readSseStream(response.body)) {
    switch (frame.event) {
      case 'meta':
        handlers.onMeta?.((frame.data ?? {}) as { conversation_id?: string; model?: string })
        break
      case 'token': {
        const delta = (frame.data as { delta?: string } | null)?.delta
        if (delta) handlers.onToken?.(delta)
        break
      }
      case 'tool': {
        const payload = frame.data as { name?: string; status?: string } | null
        handlers.onTool?.(payload?.name ?? '', payload?.status ?? '')
        break
      }
      case 'citations': {
        const payload = frame.data as { items?: ChatCitation[] } | null
        handlers.onCitations?.(payload?.items ?? [])
        break
      }
      case 'done':
        handlers.onDone?.((frame.data ?? {}) as { message_id?: string })
        break
      case 'error': {
        const payload = frame.data as { message?: string } | null
        handlers.onError?.(payload?.message ?? genericErrorMessage())
        break
      }
      default:
        break
    }
  }
}
