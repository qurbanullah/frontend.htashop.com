/**
 * A minimal server-sent-events reader.
 *
 * The support assistant streams over `POST` (the visitor's message travels in
 * the body), so the browser's `EventSource` cannot be used — it only supports
 * GET and cannot send a payload. This reads the raw response stream instead.
 */

export interface SseFrame {
  event: string
  data: unknown
}

/** Find the end of the next frame, tolerating both LF and CRLF framing. */
function findSeparator(buffer: string): { index: number; length: number } | null {
  const lf = buffer.indexOf('\n\n')
  const crlf = buffer.indexOf('\r\n\r\n')

  if (lf === -1 && crlf === -1) return null
  if (crlf !== -1 && (lf === -1 || crlf <= lf)) return { index: crlf, length: 4 }

  return { index: lf, length: 2 }
}

/**
 * Parse one raw frame into an event. Returns null for frames that carry no
 * data (comments/heartbeats).
 */
export function parseSseFrame(raw: string): SseFrame | null {
  let event = 'message'
  const dataLines: string[] = []

  for (const line of raw.split(/\r?\n/)) {
    if (line === '' || line.startsWith(':')) continue

    if (line.startsWith('event:')) {
      event = line.slice(6).trim()
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).replace(/^ /, ''))
    }
  }

  if (dataLines.length === 0) return null

  const text = dataLines.join('\n')

  if (text === '') return { event, data: null }

  try {
    return { event, data: JSON.parse(text) }
  } catch {
    // A non-JSON payload is still forwarded as a string.
    return { event, data: text }
  }
}

/**
 * Pull every complete frame out of a buffer, returning the unparsed remainder.
 */
export function extractFrames(buffer: string): { frames: SseFrame[]; rest: string } {
  const frames: SseFrame[] = []
  let rest = buffer
  let separator = findSeparator(rest)

  while (separator) {
    const raw = rest.slice(0, separator.index)
    rest = rest.slice(separator.index + separator.length)

    const frame = parseSseFrame(raw)
    if (frame) frames.push(frame)

    separator = findSeparator(rest)
  }

  return { frames, rest }
}

/**
 * Consume an SSE response body, yielding frames as they arrive.
 */
export async function* readSseStream(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<SseFrame, void, void> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      const { frames, rest } = extractFrames(buffer)
      buffer = rest

      for (const frame of frames) yield frame
    }

    buffer += decoder.decode()

    for (const frame of extractFrames(buffer).frames) yield frame
  } finally {
    reader.releaseLock()
  }
}
