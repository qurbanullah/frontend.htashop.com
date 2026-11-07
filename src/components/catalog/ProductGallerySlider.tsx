import { ChevronLeft, ChevronRight, Package, ZoomIn } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { buildSrcset, type ImageUrls, PRODUCT_IMAGE_LADDER, preferUrl } from '@/lib/image-srcset'

interface Props {
  images: string[]
  ladders?: ImageUrls[] | null
  alt: string
  index: number
  onIndexChange: (index: number) => void
  onOpen: (index: number) => void
  openLabel: string
  /** Prev/next buttons for pointer devices, where swipe is not available. */
  showArrows?: boolean
  /** Dot indicators — used where there is no thumbnail rail. */
  showDots?: boolean
  className?: string
}

/**
 * Snap-scrolling product image slider.
 *
 * Phones swipe through the slides with dots beneath; desktops get the same
 * track plus prev/next buttons beside the thumbnail rail. Selecting a thumbnail
 * scrolls the track to that slide.
 */
export function ProductGallerySlider({
  images,
  ladders,
  alt,
  index,
  onIndexChange,
  onOpen,
  openLabel,
  showArrows = false,
  showDots = false,
  className = '',
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null)

  // Keep the track in sync when the index is changed from outside (thumbnails).
  useEffect(() => {
    const track = trackRef.current
    if (!track || track.clientWidth === 0 || typeof track.scrollTo !== 'function') return

    const target = index * track.clientWidth
    if (Math.abs(track.scrollLeft - target) > 4) {
      track.scrollTo({ left: target, behavior: 'smooth' })
    }
  }, [index])

  const handleScroll = () => {
    const track = trackRef.current
    if (!track || track.clientWidth === 0) return

    const next = Math.round(track.scrollLeft / track.clientWidth)
    const clamped = Math.max(0, Math.min(images.length - 1, next))

    if (clamped !== index) onIndexChange(clamped)
  }

  const step = (delta: number) => {
    if (images.length === 0) return
    onIndexChange((index + delta + images.length) % images.length)
  }

  if (images.length === 0) {
    return (
      <div
        className={`flex aspect-square w-full items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900 ${className}`}
      >
        <Package className="h-24 w-24 text-gray-300 dark:text-gray-600" />
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="relative">
        <div
          ref={trackRef}
          onScroll={handleScroll}
          className="flex snap-x snap-mandatory overflow-x-auto rounded-2xl border border-gray-200 bg-gray-50 [-ms-overflow-style:none] [scrollbar-width:none] dark:border-gray-800 dark:bg-gray-900 [&::-webkit-scrollbar]:hidden"
        >
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => onOpen(i)}
              className="relative w-full shrink-0 snap-center"
              aria-label={`${openLabel} ${i + 1}`}
            >
              <img
                src={preferUrl(ladders?.[i], ['large', 'medium', 'original']) ?? url}
                srcSet={buildSrcset(ladders?.[i], PRODUCT_IMAGE_LADDER)}
                sizes="(max-width: 1024px) 92vw, 560px"
                alt={i === index ? alt : ''}
                className="aspect-square w-full object-cover"
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
              />
              <span className="pointer-events-none absolute right-3 bottom-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white">
                <ZoomIn className="h-5 w-5" />
              </span>
            </button>
          ))}
        </div>

        {showArrows && images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous image"
              className="absolute top-1/2 left-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md transition-colors hover:bg-white dark:bg-gray-800/90 dark:text-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next image"
              className="absolute top-1/2 right-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md transition-colors hover:bg-white dark:bg-gray-800/90 dark:text-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {showDots && images.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5" aria-hidden="true">
          {images.map((url, i) => (
            <span
              key={url}
              className={
                i === index
                  ? 'h-1.5 w-4 rounded-full bg-blue-600 dark:bg-blue-400'
                  : 'h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600'
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
