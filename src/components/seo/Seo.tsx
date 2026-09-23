import { useEffect, useRef } from 'react'
import { cdnUrl } from '@/lib/cdn'
import { ENV_CONFIG } from '@/lib/env'

export const SITE_NAME = ENV_CONFIG.SITE_NAME
/** Canonical site origin — mirrors the API's FRONTEND_URL via VITE_SITE_URL. */
export const SITE_URL = ENV_CONFIG.SITE_URL

/** Marker used to identify tags managed by this component so they can be cleaned up. */
const MARKER = 'data-seo'

export interface SeoJsonLd {
  '@context'?: string
  '@type'?: string
  [key: string]: unknown
}

interface SeoProps {
  /** Page title — rendered as "{title} | HTAShop" unless fullTitle is set. */
  title: string
  /** Overrides the default "{title} | HTAShop" suffix. */
  fullTitle?: string
  description?: string
  keywords?: string[]
  /** Canonical path (e.g. "/products/abc") — prefixed with the site origin. */
  canonical?: string
  /** og:image / twitter:image — CDN key or full URL. */
  image?: string
  /** Open Graph type: website, product, article, etc. */
  type?: string
  /** Robots directive override (defaults to "index, follow"). */
  robots?: string
  /** Adds "noindex, nofollow" (overrides robots). */
  noindex?: boolean
  /** JSON-LD structured data — single object or array. */
  jsonLd?: SeoJsonLd | SeoJsonLd[]
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    el.setAttribute(MARKER, '1')
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    el.setAttribute(MARKER, '1')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/**
 * Returns the CSP nonce injected by nginx (via a <meta name="csp-nonce"> tag),
 * or null when there is no CSP/nonce (e.g. local development).
 */
function getCspNonce(): string | null {
  const meta = document.head.querySelector<HTMLMetaElement>('meta[name="csp-nonce"]')
  return meta?.content || null
}

function setJsonLd(data: SeoJsonLd | SeoJsonLd[]) {
  document.querySelectorAll(`script[${MARKER}="jsonld"]`).forEach((el) => {
    el.remove()
  })
  const nonce = getCspNonce()
  const blocks = Array.isArray(data) ? data : [data]
  for (const block of blocks) {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.setAttribute(MARKER, 'jsonld')
    if (nonce) script.setAttribute('nonce', nonce)
    script.textContent = JSON.stringify(block)
    document.head.appendChild(script)
  }
}

interface ResolvedSeo {
  resolvedTitle: string
  resolvedCanonical: string
  resolvedImage?: string
}

function resolveSeoValues(props: Omit<SeoProps, 'title'> & { title: string }): ResolvedSeo {
  const resolvedTitle = props.fullTitle ?? `${props.title} | ${SITE_NAME}`
  // Canonical URLs always use the configured origin, never the host that
  // happened to serve the request (mirrors, www/apex, the prerender service).
  const currentPath =
    typeof window === 'undefined' ? '' : window.location.pathname + window.location.search
  const resolvedCanonical = props.canonical
    ? `${SITE_URL}${props.canonical.startsWith('/') ? props.canonical : `/${props.canonical}`}`
    : `${SITE_URL}${currentPath}`
  const imageKey = props.image ?? ENV_CONFIG.DEFAULT_OG_IMAGE
  const resolvedImage = cdnUrl(imageKey) || undefined

  return { resolvedTitle, resolvedCanonical, resolvedImage }
}

function collectMetaTags(
  props: Omit<SeoProps, 'title' | 'fullTitle' | 'canonical' | 'image'> & {
    type: string
    noindex: boolean
    robots?: string
  },
  values: ResolvedSeo
): Array<[string, string, string]> {
  const metaTags: Array<[string, string, string]> = []
  if (props.description) {
    metaTags.push(['name', 'description', props.description])
    metaTags.push(['property', 'og:description', props.description])
    metaTags.push(['name', 'twitter:description', props.description])
  }
  if (props.keywords?.length) metaTags.push(['name', 'keywords', props.keywords.join(', ')])
  metaTags.push([
    'name',
    'robots',
    props.noindex ? 'noindex, nofollow' : (props.robots ?? 'index, follow'),
  ])
  metaTags.push(['property', 'og:title', values.resolvedTitle])
  metaTags.push(['property', 'og:type', props.type])
  metaTags.push(['property', 'og:url', values.resolvedCanonical])
  metaTags.push(['property', 'og:site_name', SITE_NAME])
  metaTags.push(['property', 'og:locale', 'en_US'])
  if (values.resolvedImage) metaTags.push(['property', 'og:image', values.resolvedImage])
  metaTags.push(['name', 'twitter:card', values.resolvedImage ? 'summary_large_image' : 'summary'])
  metaTags.push(['name', 'twitter:title', values.resolvedTitle])
  if (values.resolvedImage) metaTags.push(['name', 'twitter:image', values.resolvedImage])
  return metaTags
}

/**
 * Enterprise SEO head manager.
 *
 * Sets the document title, meta description/keywords/robots, canonical link,
 * Open Graph tags, Twitter Card tags, and JSON-LD structured data. All values
 * are dynamic per page. Every tag it creates is marked and removed on unmount
 * so metadata never leaks between routes.
 */
export function Seo({
  title,
  fullTitle,
  description,
  keywords,
  canonical,
  image,
  type = 'website',
  robots,
  noindex = false,
  jsonLd,
}: SeoProps) {
  const prevTitle = useRef<string | null>(null)

  useEffect(() => {
    const resolvedTitle = fullTitle ?? `${title} | ${SITE_NAME}`
    prevTitle.current = document.title
    document.title = resolvedTitle

    const values = resolveSeoValues({ title, fullTitle, canonical, image })
    const metaTags = collectMetaTags({ description, keywords, type, robots, noindex }, values)

    for (const [attr, key, content] of metaTags) {
      upsertMeta(attr as 'name' | 'property', key, content)
    }
    upsertLink('canonical', values.resolvedCanonical)
    if (jsonLd) setJsonLd(jsonLd)

    return () => {
      if (prevTitle.current != null) document.title = prevTitle.current
      document.querySelectorAll(`[${MARKER}]`).forEach((el) => {
        el.remove()
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    title,
    fullTitle,
    description,
    canonical,
    image,
    type,
    robots,
    noindex,
    jsonLd,
    keywords?.length,
    keywords?.join,
    keywords,
  ])

  return null
}

/** Builds an absolute site URL from a path (for JSON-LD / canonical values). */
export function siteUrl(path = ''): string {
  if (!path) return SITE_URL
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
