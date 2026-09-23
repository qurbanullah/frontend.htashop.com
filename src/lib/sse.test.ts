import { describe, expect, it } from 'vitest'
import { extractFrames, parseSseFrame, readSseStream } from '@/lib/sse'

describe('parseSseFrame', () => {
  it('reads the event name and JSON payload', () => {
    expect(parseSseFrame('event: token\ndata: {"delta":"Hi"}')).toEqual({
      event: 'token',
      data: { delta: 'Hi' },
    })
  })

  it('defaults the event name to "message"', () => {
    expect(parseSseFrame('data: {"a":1}')).toEqual({ event: 'message', data: { a: 1 } })
  })

  it('ignores comment/heartbeat frames', () => {
    expect(parseSseFrame(': ping')).toBeNull()
  })

  it('keeps non-JSON payloads as strings', () => {
    expect(parseSseFrame('event: note\ndata: plain text')).toEqual({
      event: 'note',
      data: 'plain text',
    })
  })

  it('joins multi-line data with a newline', () => {
    expect(parseSseFrame('data: line one\ndata: line two')).toEqual({
      event: 'message',
      data: 'line one\nline two',
    })
  })
})

describe('extractFrames', () => {
  it('returns complete frames and leaves the partial one', () => {
    const { frames, rest } = extractFrames(
      'event: token\ndata: {"delta":"a"}\n\nevent: token\ndata: {"del'
    )

    expect(frames).toEqual([{ event: 'token', data: { delta: 'a' } }])
    expect(rest).toBe('event: token\ndata: {"del')
  })

  it('handles CRLF framing', () => {
    const { frames } = extractFrames('event: token\r\ndata: {"delta":"a"}\r\n\r\n')

    expect(frames).toEqual([{ event: 'token', data: { delta: 'a' } }])
  })
})

describe('readSseStream', () => {
  it('yields frames that are split across chunks', async () => {
    const encoder = new TextEncoder()
    const chunks = [
      'event: token\nda',
      'ta: {"delta":"Hi"}\n\n',
      ': ping\n\n',
      'event: done\ndata: {"message_id":"srv-1"}\n\n',
    ]

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
        controller.close()
      },
    })

    const frames: unknown[] = []
    for await (const frame of readSseStream(stream)) frames.push(frame)

    expect(frames).toEqual([
      { event: 'token', data: { delta: 'Hi' } },
      { event: 'done', data: { message_id: 'srv-1' } },
    ])
  })
})
