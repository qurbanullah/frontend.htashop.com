import DOMPurify from 'dompurify'
import { useMemo } from 'react'

interface Props {
  html: string
  className?: string
}

/**
 * Renders editor-produced HTML on the storefront.
 *
 * Sanitised again here even though the API sanitises on write: stored content
 * may predate the current allowlist, and a defence in depth costs one pass.
 */
export function RichTextContent({ html, className }: Props) {
  const hasMarkup = /<\/?[a-z][^>]*>/i.test(html)
  const clean = useMemo(
    () => (hasMarkup ? DOMPurify.sanitize(html, { USE_PROFILES: { html: true } }) : ''),
    [html, hasMarkup]
  )

  if (!hasMarkup) {
    // Legacy plain-text descriptions keep their line breaks.
    return <p className={['whitespace-pre-line', className ?? ''].join(' ')}>{html}</p>
  }

  return (
    <div
      className={[
        'space-y-3 text-gray-600 dark:text-gray-300',
        '[&_a]:text-blue-600 [&_a]:underline dark:[&_a]:text-blue-400',
        '[&_blockquote]:border-gray-300 [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_blockquote]:italic dark:[&_blockquote]:border-gray-700',
        '[&_h2]:mt-4 [&_h2]:font-bold [&_h2]:text-lg',
        '[&_h3]:mt-3 [&_h3]:font-semibold [&_h3]:text-base',
        '[&_h4]:mt-3 [&_h4]:font-semibold',
        '[&_hr]:my-4',
        '[&_img]:my-3 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-xl',
        '[&_li]:ml-5',
        '[&_ol]:list-decimal',
        '[&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-gray-100 [&_pre]:p-3 [&_pre]:text-sm dark:[&_pre]:bg-gray-800',
        '[&_strong]:font-semibold',
        '[&_ul]:list-disc',
        className ?? '',
      ].join(' ')}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitised with DOMPurify above
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}
