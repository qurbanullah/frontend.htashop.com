import { type ReactNode, useMemo } from 'react'
import { Link } from 'react-router-dom'

/**
 * A deliberately small Markdown renderer for assistant replies.
 *
 * Model output is untrusted input. Rather than sanitising HTML, this only ever
 * produces React elements — there is no `dangerouslySetInnerHTML` anywhere — so
 * injected markup cannot execute. The supported subset is what support answers
 * actually use: paragraphs, bullet lists, `**bold**`, `code`, links and
 * site-relative paths.
 */

type InlineToken =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'code'; value: string }
  | { type: 'link'; label: string; href: string }

const INLINE_PATTERN =
  /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\)|(?<![A-Za-z0-9])\/[A-Za-z0-9][A-Za-z0-9\-._/]*)/g

const BULLET_PATTERN = /^\s*[-*]\s+/

const LINK_PATTERN = /^\[([^\]]+)\]\(([^)\s]+)\)$/

/**
 * Allow only site-relative paths and http(s)/mailto links. Anything else
 * (notably `javascript:`) is dropped back to plain text.
 */
function safeHref(href: string): string | null {
  const trimmed = href.trim()

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/^mailto:/i.test(trimmed)) return trimmed

  return null
}

function classifyToken(value: string): InlineToken {
  if (value.startsWith('**')) return { type: 'bold', value: value.slice(2, -2) }
  if (value.startsWith('`')) return { type: 'code', value: value.slice(1, -1) }

  if (value.startsWith('[')) {
    const link = LINK_PATTERN.exec(value)

    return link
      ? { type: 'link', label: link[1] ?? '', href: link[2] ?? '' }
      : { type: 'text', value }
  }

  return { type: 'link', label: value, href: value }
}

export function tokenizeInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = []
  let lastIndex = 0

  for (const match of text.matchAll(INLINE_PATTERN)) {
    const value = match[0]
    const index = match.index ?? 0

    if (index > lastIndex) {
      tokens.push({ type: 'text', value: text.slice(lastIndex, index) })
    }

    tokens.push(classifyToken(value))
    lastIndex = index + value.length
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'text', value: text.slice(lastIndex) })
  }

  return tokens
}

function InlineLink({ label, href }: { label: string; href: string }) {
  const safe = safeHref(href)

  if (!safe) return <span>{label}</span>

  if (safe.startsWith('/')) {
    return (
      <Link to={safe} className="text-blue-600 underline hover:text-blue-700">
        {label}
      </Link>
    )
  }

  return (
    <a
      href={safe}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 underline hover:text-blue-700"
    >
      {label}
    </a>
  )
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return tokenizeInline(text).map((token, index) => {
    const key = `${keyPrefix}-${index}`

    if (token.type === 'bold') {
      return (
        <strong key={key} className="font-semibold">
          {renderInline(token.value, key)}
        </strong>
      )
    }

    if (token.type === 'code') {
      return (
        <code
          key={key}
          className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[0.85em] dark:bg-gray-800"
        >
          {token.value}
        </code>
      )
    }

    if (token.type === 'link') {
      return <InlineLink key={key} label={token.label} href={token.href} />
    }

    // Plain text needs no wrapper (and no key).
    return token.value
  })
}

interface ListItem {
  id: number
  text: string
}

type MarkdownBlock =
  | { id: number; type: 'paragraph'; text: string }
  | { id: number; type: 'list'; items: ListItem[] }

export function parseBlocks(content: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = []
  let idCounter = 0
  let paragraph: string[] = []
  let bullets: ListItem[] = []

  const takeId = () => {
    idCounter += 1
    return idCounter
  }

  const flushParagraph = () => {
    if (paragraph.length === 0) return

    blocks.push({ id: takeId(), type: 'paragraph', text: paragraph.join(' ') })
    paragraph = []
  }

  const flushBullets = () => {
    if (bullets.length === 0) return

    blocks.push({ id: takeId(), type: 'list', items: bullets })
    bullets = []
  }

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()

    if (line === '') {
      flushBullets()
      flushParagraph()
      continue
    }

    if (BULLET_PATTERN.test(line)) {
      flushParagraph()
      bullets.push({ id: takeId(), text: line.replace(BULLET_PATTERN, '') })
      continue
    }

    flushBullets()
    paragraph.push(line)
  }

  flushBullets()
  flushParagraph()

  return blocks
}

export function ChatMarkdown({ content }: { content: string }) {
  const blocks = useMemo(() => parseBlocks(content), [content])

  return (
    <div className="space-y-2">
      {blocks.map((block) =>
        block.type === 'list' ? (
          <ul key={block.id} className="list-disc space-y-1 pl-5">
            {block.items.map((item) => (
              <li key={item.id}>{renderInline(item.text, `li-${item.id}`)}</li>
            ))}
          </ul>
        ) : (
          <p key={block.id}>{renderInline(block.text, `p-${block.id}`)}</p>
        )
      )}
    </div>
  )
}
