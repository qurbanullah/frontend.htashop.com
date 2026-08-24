import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Banner } from '@/api/banners'
import { useBanners } from '@/hooks/useBanners'
import { paths } from '@/routes/paths'

interface BannerZoneProps {
  placement: string
  categoryId?: number
  q?: string
  /** Stretch banners to the full width of the parent column (no max-w). */
  fullWidth?: boolean
  /** Only render banners with one of these types (hero / promo / sponsored / …). */
  types?: string[]
}

/**
 * Renders all active banners for a placement + context.
 * Banners are plain landscape images (h-72), centered at max-w-7xl by default,
 * with the whole image linked. Returns null when no banners exist.
 */
export function BannerZone({
  placement,
  categoryId,
  q,
  fullWidth = false,
  types,
}: BannerZoneProps) {
  const { data: banners = [] } = useBanners(placement, { categoryId, q })

  if (banners.length === 0) return null

  const scoped = types ? banners.filter((b) => types.includes(b.type)) : banners
  if (scoped.length === 0) return null

  const hero = scoped.filter((b) => b.type === 'hero').sort((a, b) => a.sort_order - b.sort_order)
  const blocks = scoped.filter((b) => b.type !== 'hero').sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="space-y-6">
      {hero.length > 0 && <HeroCarousel banners={hero} fullWidth={fullWidth} />}
      {blocks.map((banner) => (
        <ImageBanner key={banner.uuid} banner={banner} fullWidth={fullWidth} />
      ))}
    </div>
  )
}

/** Maps a banner link definition to a storefront route (or null for no link). */
function resolveLink(banner: Banner): string | null {
  switch (banner.link_type) {
    case 'product':
      return banner.link_value ? `${paths.products}/${banner.link_value}` : null
    case 'category':
      return banner.link_value
        ? `${paths.products}?category=${encodeURIComponent(banner.link_value)}`
        : null
    case 'brand':
      return banner.link_value
        ? `${paths.products}?brand=${encodeURIComponent(banner.link_value)}`
        : null
    case 'search':
      return banner.link_value
        ? `${paths.products}?q=${encodeURIComponent(banner.link_value)}`
        : null
    case 'external':
      return banner.link_value || null
    default:
      return null
  }
}

/** Landscape linked image, no text. Falls back to a gradient placeholder. */
function BannerImage({ banner }: { banner: Banner }) {
  const href = resolveLink(banner)

  const image = (
    <>
      {banner.image_url && (
        <img
          src={banner.image_url}
          alt={banner.title ?? 'banner'}
          loading="lazy"
          className="hidden h-full w-full object-cover sm:block"
        />
      )}
      {banner.mobile_image_url && (
        <img
          src={banner.mobile_image_url}
          alt={banner.title ?? 'banner'}
          loading="lazy"
          className="h-full w-full object-cover sm:hidden"
        />
      )}
      {!banner.image_url && !banner.mobile_image_url && (
        <div className="h-full w-full bg-gradient-to-br from-blue-600 to-cyan-500" />
      )}
    </>
  )

  return href ? (
    <Link to={href} className="block h-full w-full">
      {image}
    </Link>
  ) : (
    image
  )
}

function ImageBanner({ banner, fullWidth }: { banner: Banner; fullWidth: boolean }) {
  return (
    <div
      className={`${fullWidth ? 'w-full' : 'mx-auto max-w-7xl'} h-72 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900`}
    >
      <BannerImage banner={banner} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Hero carousel                                                       */
/* ------------------------------------------------------------------ */

function HeroCarousel({ banners, fullWidth }: { banners: Banner[]; fullWidth: boolean }) {
  const [index, setIndex] = useState(0)
  const count = banners.length

  useEffect(() => {
    if (count <= 1) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), 5000)
    return () => clearInterval(timer)
  }, [count])

  if (count === 0) return null

  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + count) % count)

  return (
    <div
      className={`relative ${fullWidth ? 'w-full' : 'mx-auto max-w-7xl'} h-72 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-900`}
    >
      {banners.map((b, i) => (
        <div
          key={b.uuid}
          className={`absolute inset-0 transition-opacity duration-500 ${i === index ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
          aria-hidden={i !== index}
        >
          <BannerImage banner={b} />
        </div>
      ))}

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            className="absolute top-1/2 left-3 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow transition-colors hover:bg-white"
            aria-label="Previous banner"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="absolute top-1/2 right-3 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow transition-colors hover:bg-white"
            aria-label="Next banner"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
            {banners.map((b, i) => (
              <button
                key={b.uuid}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'}`}
                aria-label={`Go to banner ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
