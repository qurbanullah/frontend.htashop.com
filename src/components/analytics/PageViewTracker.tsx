import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageView } from '@/lib/analytics'
import { track } from '@/lib/analytics/collector'

/**
 * Emits one `page_view` per storefront navigation to both the first-party
 * collector and GA4.
 *
 * Account/auth/admin pages are excluded: their analytics value is low and the
 * URLs can contain identifiers we do not need in a page dimension.
 */
const SKIP_PREFIXES = ['/account', '/login', '/register', '/forgot-password', '/reset-password']

export function PageViewTracker() {
  const location = useLocation()
  const skip = SKIP_PREFIXES.some((prefix) => location.pathname.startsWith(prefix))

  useEffect(() => {
    if (skip) return

    track('page_view', {
      page: { path: location.pathname },
    })
  }, [skip, location.pathname])

  useEffect(() => {
    if (skip) return

    // GA4 keeps the query string so campaign (utm_*/gclid) attribution works.
    trackPageView(location.pathname + location.search)
  }, [skip, location.pathname, location.search])

  return null
}
