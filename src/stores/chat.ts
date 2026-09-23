import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import {
  type ChatCitation,
  type ChatConfigDto,
  type ChatFeedbackValue,
  chatApi,
  streamChatMessage,
} from '@/api/chat'
import i18n from '@/i18n/config'
import { generateId } from '@/lib/utils'

export interface ChatMessage {
  /** Stable client id, used as the React key before the server replies. */
  id: string
  /** Server uuid, needed to rate the reply. Absent until the reply is stored. */
  serverId?: string
  role: 'user' | 'assistant'
  content: string
  citations: ChatCitation[]
  feedback: ChatFeedbackValue | null
  isStreaming?: boolean
  isError?: boolean
}

export type ChatStatus = 'idle' | 'loading' | 'streaming'

/** Resolved lazily so the banner follows the language active when it fails. */
function genericErrorMessage(): string {
  return i18n.t('chat.error_generic')
}

const SUPPORTED_LOCALES = ['en', 'de', 'ur']

/** The visitor's language, so the assistant replies in it. */
export function currentLocale(): string {
  const candidate = String(i18n.language || 'en')
    .slice(0, 2)
    .toLowerCase()
  return SUPPORTED_LOCALES.includes(candidate) ? candidate : 'en'
}

interface ChatState {
  isOpen: boolean
  configLoaded: boolean
  config: ChatConfigDto | null
  messages: ChatMessage[]
  status: ChatStatus
  error: string | null
  activeTool: string | null
  open: () => void
  close: () => void
  toggle: () => void
  loadConfig: () => Promise<void>
  loadHistory: () => Promise<void>
  send: (text: string) => Promise<void>
  stop: () => void
  rate: (messageId: string, feedback: ChatFeedbackValue) => Promise<void>
  startNewConversation: () => Promise<void>
  reset: () => void
}

/** The in-flight request, kept out of state because it is not serialisable. */
let activeController: AbortController | null = null

export const useChatStore = create<ChatState>()(
  immer((set, get) => ({
    isOpen: false,
    configLoaded: false,
    config: null,
    messages: [],
    status: 'idle',
    error: null,
    activeTool: null,

    open: () => {
      set((state) => {
        state.isOpen = true
      })

      const { config, messages } = get()
      if (config?.restore_transcript && messages.length === 0) {
        void get().loadHistory()
      }
    },

    close: () =>
      set((state) => {
        state.isOpen = false
      }),

    toggle: () => (get().isOpen ? get().close() : get().open()),

    loadConfig: async () => {
      if (get().configLoaded) return

      try {
        const config = await chatApi.config(currentLocale())
        set((state) => {
          state.config = config
          state.configLoaded = true
        })
      } catch {
        // The widget simply stays hidden; the storefront must never break.
        set((state) => {
          state.configLoaded = true
          state.config = null
        })
      }
    },

    loadHistory: async () => {
      try {
        const history = await chatApi.history()
        set((state) => {
          state.messages = history.messages
            .filter((message) => message.role === 'user' || message.role === 'assistant')
            .map((message) => ({
              id: message.uuid,
              serverId: message.uuid,
              role: message.role === 'user' ? 'user' : 'assistant',
              content: message.content ?? '',
              citations: message.citations ?? [],
              feedback: message.feedback,
            }))
        })
      } catch {
        // A missing transcript is not an error worth surfacing.
      }
    },

    send: async (text) => {
      const trimmed = text.trim()
      if (trimmed === '' || get().status === 'streaming') return

      const assistantId = generateId()

      set((state) => {
        state.messages.push(
          {
            id: generateId(),
            role: 'user',
            content: trimmed,
            citations: [],
            feedback: null,
          },
          {
            id: assistantId,
            role: 'assistant',
            content: '',
            citations: [],
            feedback: null,
            isStreaming: true,
          }
        )
        state.status = 'streaming'
        state.error = null
        state.activeTool = null
      })

      const controller = new AbortController()
      activeController = controller

      const updateAssistant = (update: (message: ChatMessage) => void) => {
        set((state) => {
          const message = state.messages.find((candidate) => candidate.id === assistantId)
          if (message) update(message)
        })
      }

      const finish = () => {
        updateAssistant((message) => {
          message.isStreaming = false
        })
        set((state) => {
          state.status = 'idle'
          state.activeTool = null
        })
      }

      try {
        await streamChatMessage(trimmed, currentLocale(), {
          signal: controller.signal,
          onToken: (delta) =>
            updateAssistant((message) => {
              message.content += delta
            }),
          onTool: (name, status) =>
            set((state) => {
              state.activeTool = status === 'running' ? name : null
            }),
          onCitations: (items) =>
            updateAssistant((message) => {
              message.citations = items
            }),
          onDone: (data) => {
            updateAssistant((message) => {
              if (data?.message_id) message.serverId = data.message_id
            })
            finish()
          },
          onError: (message) => {
            set((state) => {
              state.error = message
            })
            updateAssistant((draft) => {
              if (draft.content.trim() === '') {
                draft.content = message
                draft.isError = true
              }
            })
            finish()
          },
        })
      } catch (error) {
        if ((error as Error)?.name === 'AbortError') {
          finish()
          return
        }

        const message = genericErrorMessage()
        set((state) => {
          state.error = message
        })
        updateAssistant((draft) => {
          if (draft.content.trim() === '') {
            draft.content = message
            draft.isError = true
          }
        })
        finish()
      } finally {
        activeController = null
      }
    },

    stop: () => {
      activeController?.abort()
      activeController = null

      set((state) => {
        const streaming = state.messages.find((message) => message.isStreaming)
        if (streaming) streaming.isStreaming = false
        state.status = 'idle'
        state.activeTool = null
      })
    },

    rate: async (messageId, feedback) => {
      const message = get().messages.find((candidate) => candidate.id === messageId)
      if (!message?.serverId) return

      const previous = message.feedback

      set((state) => {
        const draft = state.messages.find((candidate) => candidate.id === messageId)
        if (draft) draft.feedback = feedback
      })

      try {
        await chatApi.feedback(message.serverId, feedback)
      } catch {
        // Roll the optimistic update back so the visitor can retry.
        set((state) => {
          const draft = state.messages.find((candidate) => candidate.id === messageId)
          if (draft) draft.feedback = previous
        })
      }
    },

    startNewConversation: async () => {
      stopActiveRequest()

      try {
        await chatApi.reset()
      } catch {
        // Starting fresh locally is still correct even if the call fails.
      }

      set((state) => {
        state.messages = []
        state.error = null
        state.activeTool = null
        state.status = 'idle'
      })
    },

    reset: () => {
      stopActiveRequest()
      set((state) => {
        state.isOpen = false
        state.configLoaded = false
        state.config = null
        state.messages = []
        state.status = 'idle'
        state.error = null
        state.activeTool = null
      })
    },
  }))
)

/** Abort any in-flight reply, e.g. when starting a new conversation. */
function stopActiveRequest(): void {
  activeController?.abort()
  activeController = null
}
