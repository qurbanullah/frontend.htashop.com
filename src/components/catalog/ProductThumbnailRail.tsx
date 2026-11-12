import { ChevronDown, ChevronUp } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { type ImageUrls, preferUrl } from '@/lib/image-srcset'

/** Thumbnail side and gap in px — keep in sync with the `h-20` / `gap-2` classes. */
const THUMB = 80
const GAP = 8
const DEFAULT_VISIBLE = 4

interface ProductThumbnailRailProps {
  images: string[]
  ladders?: ImageUrls[] | null
  index: number
  onSelect: (index: number) => void
  alt?: string
  className?: string
}

interface RailArrowProps {
  direction: 'up' | 'down'
  visible: boolean
  onClick: () => void
}

function RailArrow({ direction, visible, onClick }: RailArrowProps) {
  const Icon = direction === 'up' ? ChevronUp : ChevronDown

  return (
    <button
      type="button"
      onClick={onClick}
      tabIndex={visible ? 0 : -1}
      aria-label={direction === 'up' ? 'Previous thumbnails' : 'Next thumbnails'}
      aria-hidden={!visible}
      className={`flex h-6 w-20 shrink-0 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 ${
        visible ? '' : 'invisible'
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}

/**
 * Thumbnail rail for the desktop product gallery.
 *
 * The rail takes its height from the main image (`self-stretch` over a
 * position-relative shell, so its own thumbnails cannot make the row taller).
 * Thumbnails that do not fit are paged with arrows instead of a scrollbar, and
 * the window follows the selected image — including when it changes from the
 * main slider.
 */
export function ProductThumbnailRail({
  images,
  ladders,
  index,
  onSelect,
  alt = '',
  className = '',
}: ProductThumbnailRailProps) {
  const windowRef = useRef<HTMLDivElement>(null)
  const [fitCount, setFitCount] = useState(DEFAULT_VISIBLE)
  const [offset, setOffset] = useState(0)

  const total = images.length
  const visible = Math.max(1, Math.min(fitCount, total))
  const maxOffset = Math.max(0, total - visible)
  const start = Math.min(offset, maxOffset)

  // Show as many thumbnails as the rail's height allows.
  useEffect(() => {
    const element = windowRef.current

    if (!element || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect.height ?? 0

      if (height > 0) {
        setFitCount(Math.max(1, Math.floor((height + GAP) / (THUMB + GAP))))
      }
    })

    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  // Keep the selected thumbnail inside the visible window.
  useEffect(() => {
    setOffset((current) => {
      const clamped = Math.min(current, Math.max(0, total - visible))

      if (index < clamped) return index
      if (index >= clamped + visible)
        return Math.min(index - visible + 1, Math.max(0, total - visible))

      return clamped
    })
  }, [index, visible, total])

  if (total <= 1) {
    return null
  }

  const canPrev = start > 0
  const canNext = start < maxOffset
  const step = (delta: number) => setOffset(Math.max(0, Math.min(start + delta, maxOffset)))

  return (
    <div className={`relative w-20 shrink-0 self-stretch ${className}`}>
      <div className="absolute inset-0 flex flex-col items-center gap-1">
        <RailArrow direction="up" visible={canPrev} onClick={() => step(-1)} />

        <div ref={windowRef} className="min-h-0 w-full flex-1 overflow-hidden">
          <div
            data-testid="thumbnail-track"
            className="flex flex-col gap-2 transition-transform duration-300"
            style={{ transform: `translateY(-${start * (THUMB + GAP)}px)` }}
          >
            {images.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => onSelect(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={index === i ? 'true' : undefined}
                className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg border ${
                  index === i
                    ? 'border-blue-600 ring-2 ring-blue-600/20'
                    : 'border-gray-200 dark:border-gray-800'
                }`}
              >
                <img
                  src={preferUrl(ladders?.[i], ['small', 'thumb', 'medium']) ?? url}
                  alt={index === i ? alt : ''}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </button>
            ))}
          </div>
        </div>

        <RailArrow direction="down" visible={canNext} onClick={() => step(1)} />
      </div>
    </div>
  )
}
