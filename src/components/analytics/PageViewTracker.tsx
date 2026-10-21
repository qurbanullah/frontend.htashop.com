import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { track } from '@/lib/analytics/collector'

/**
 * Emits one `page_view` per storefront navigation.
 *
 * Account/auth/admin pages are excluded: their analytics value is low and the
 * URLs can contain identifiers we do not need in a page dimension.
 */
const SKIP_PREFIXES = ['/account', '/login', '/register', '/forgot-password', '/reset-password']

export function PageViewTracker() {
  const location = useLocation()

  useEffect(() => {
    if (SKIP_PREFIXES.some((prefix) => location.pathname.startsWith(prefix))) return

    track('page_view', {
      page: { path: location.pathname },
    })
  }, [location.pathname])

  return null
}
