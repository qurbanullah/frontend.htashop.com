import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ChatStreamHandlers } from '@/api/chat'
import { useChatStore } from '@/stores/chat'

const mocks = vi.hoisted(() => ({
  config: vi.fn(),
  history: vi.fn(),
  reset: vi.fn(),
  feedback: vi.fn(),
  streamChatMessage: vi.fn(),
}))

vi.mock('@/i18n/config', () => ({
  default: { language: 'en' },
  isRTL: (lng: string) => lng === 'ur',
}))

vi.mock('@/api/chat', () => ({
  chatApi: {
    config: mocks.config,
    history: mocks.history,
    reset: mocks.reset,
    feedback: mocks.feedback,
  },
  streamChatMessage: mocks.streamChatMessage,
}))

describe('chat store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useChatStore.setState({
      isOpen: false,
      configLoaded: false,
      config: null,
      messages: [],
      status: 'idle',
      error: null,
      activeTool: null,
    })
  })

  it('appends the visitor message and streams the reply', async () => {
    mocks.streamChatMessage.mockImplementation(
      async (_message: string, _locale: string, handlers: ChatStreamHandlers) => {
        handlers.onMeta?.({ conversation_id: 'conv-1' })
        handlers.onToken?.('Hel')
        handlers.onToken?.('lo')
        handlers.onCitations?.([
          { entry_id: 1, uuid: 'entry-1', title: 'Shipping policy', url: '/x', score: 1 },
        ])
        handlers.onDone?.({ message_id: 'srv-1' })
      }
    )

    await useChatStore.getState().send('Do you ship abroad?')

    const state = useChatStore.getState()

    expect(state.status).toBe('idle')
    expect(state.messages).toHaveLength(2)
    expect(state.messages[0]).toMatchObject({ role: 'user', content: 'Do you ship abroad?' })
    expect(state.messages[1]).toMatchObject({
      role: 'assistant',
      content: 'Hello',
      serverId: 'srv-1',
      isStreaming: false,
    })
    expect(state.messages[1]?.citations).toHaveLength(1)
  })

  it('ignores an empty message', async () => {
    await useChatStore.getState().send('   ')

    expect(useChatStore.getState().messages).toHaveLength(0)
    expect(mocks.streamChatMessage).not.toHaveBeenCalled()
  })

  it('surfaces the failure in the reply bubble when nothing streamed', async () => {
    mocks.streamChatMessage.mockImplementation(
      async (_message: string, _locale: string, handlers: ChatStreamHandlers) => {
        handlers.onError?.('The assistant is unavailable.')
      }
    )

    await useChatStore.getState().send('hello')

    const state = useChatStore.getState()

    expect(state.status).toBe('idle')
    expect(state.error).toBe('The assistant is unavailable.')
    expect(state.messages[1]).toMatchObject({
      content: 'The assistant is unavailable.',
      isError: true,
      isStreaming: false,
    })
  })

  it('stops an in-flight reply', async () => {
    mocks.streamChatMessage.mockImplementation(
      (_message: string, _locale: string, handlers: ChatStreamHandlers) =>
        new Promise<void>((_resolve, reject) => {
          handlers.signal?.addEventListener('abort', () => {
            const error = new Error('aborted')
            error.name = 'AbortError'
            reject(error)
          })
        })
    )

    const pending = useChatStore.getState().send('hello')
    expect(useChatStore.getState().status).toBe('streaming')

    useChatStore.getState().stop()
    await pending

    expect(useChatStore.getState().status).toBe('idle')
    expect(useChatStore.getState().messages.at(-1)?.isStreaming).toBe(false)
  })

  it('rates a reply optimistically', async () => {
    mocks.streamChatMessage.mockImplementation(
      async (_message: string, _locale: string, handlers: ChatStreamHandlers) => {
        handlers.onDone?.({ message_id: 'srv-9' })
      }
    )
    mocks.feedback.mockResolvedValue(undefined)

    await useChatStore.getState().send('hello')

    const assistant = useChatStore.getState().messages[1]
    if (!assistant) throw new Error('assistant message missing')

    await useChatStore.getState().rate(assistant.id, 'helpful')

    expect(mocks.feedback).toHaveBeenCalledWith('srv-9', 'helpful')
    expect(useChatStore.getState().messages[1]?.feedback).toBe('helpful')
  })

  it('rolls the rating back when the call fails', async () => {
    mocks.streamChatMessage.mockImplementation(
      async (_message: string, _locale: string, handlers: ChatStreamHandlers) => {
        handlers.onDone?.({ message_id: 'srv-9' })
      }
    )
    mocks.feedback.mockRejectedValue(new Error('nope'))

    await useChatStore.getState().send('hello')

    const assistant = useChatStore.getState().messages[1]
    if (!assistant) throw new Error('assistant message missing')

    await useChatStore.getState().rate(assistant.id, 'helpful')

    expect(useChatStore.getState().messages[1]?.feedback).toBeNull()
  })

  it('starts a new conversation', async () => {
    mocks.reset.mockResolvedValue(undefined)
    mocks.streamChatMessage.mockImplementation(
      async (_message: string, _locale: string, handlers: ChatStreamHandlers) => {
        handlers.onDone?.({ message_id: 'srv-1' })
      }
    )

    await useChatStore.getState().send('hello')
    await useChatStore.getState().startNewConversation()

    expect(mocks.reset).toHaveBeenCalledTimes(1)
    expect(useChatStore.getState().messages).toHaveLength(0)
    expect(useChatStore.getState().error).toBeNull()
  })

  it('loads the widget configuration only once', async () => {
    mocks.config.mockResolvedValue({ enabled: true })

    await useChatStore.getState().loadConfig()
    await useChatStore.getState().loadConfig()

    expect(mocks.config).toHaveBeenCalledTimes(1)
    expect(useChatStore.getState().configLoaded).toBe(true)
  })
})
