import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ChatMarkdown, parseBlocks, tokenizeInline } from '@/lib/chat-markdown'

function renderMarkdown(content: string) {
  return render(
    <MemoryRouter>
      <ChatMarkdown content={content} />
    </MemoryRouter>
  )
}

describe('parseBlocks', () => {
  it('groups bullet lines into a list', () => {
    const blocks = parseBlocks('- one\n- two')

    expect(blocks).toHaveLength(1)
    expect(blocks[0]).toMatchObject({ type: 'list' })
  })

  it('separates paragraphs on blank lines', () => {
    const blocks = parseBlocks('first paragraph\n\nsecond paragraph')

    expect(blocks).toHaveLength(2)
    expect(blocks[0]).toMatchObject({ type: 'paragraph', text: 'first paragraph' })
    expect(blocks[1]).toMatchObject({ type: 'paragraph', text: 'second paragraph' })
  })

  it('assigns distinct ids so rendered keys stay stable', () => {
    const blocks = parseBlocks('- one\n- two\n\nparagraph')

    const list = blocks.find((block) => block.type === 'list')
    expect(list?.type === 'list' && list.items[0]?.id).not.toBe(
      list?.type === 'list' ? list.items[1]?.id : undefined
    )
  })
})

describe('tokenizeInline', () => {
  it('tokenizes bold, code and links', () => {
    expect(tokenizeInline('**bold** and `code` and [label](/contact)')).toEqual([
      { type: 'bold', value: 'bold' },
      { type: 'text', value: ' and ' },
      { type: 'code', value: 'code' },
      { type: 'text', value: ' and ' },
      { type: 'link', label: 'label', href: '/contact' },
    ])
  })

  it('linkifies bare site paths', () => {
    expect(tokenizeInline('see /policies/refund-policy')).toEqual([
      { type: 'text', value: 'see ' },
      { type: 'link', label: '/policies/refund-policy', href: '/policies/refund-policy' },
    ])
  })
})

describe('ChatMarkdown', () => {
  it('renders bold text', () => {
    renderMarkdown('This is **important**')

    expect(screen.getByText('important').tagName).toBe('STRONG')
  })

  it('renders internal links through the router', () => {
    renderMarkdown('[Refund policy](/policies/refund-policy)')

    expect(screen.getByRole('link', { name: 'Refund policy' })).toHaveAttribute(
      'href',
      '/policies/refund-policy'
    )
  })

  it('drops unsafe link schemes', () => {
    renderMarkdown('[click me](javascript:alert(1))')

    expect(screen.queryByRole('link', { name: 'click me' })).toBeNull()
    expect(screen.getByText('click me')).toBeInTheDocument()
  })

  it('never injects raw HTML from the model', () => {
    const { container } = renderMarkdown('<img src=x onerror="alert(1)">')

    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toContain('<img src=x')
  })
})
