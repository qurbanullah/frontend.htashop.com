import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

const STORAGE_PREFIX = 'scroll:pos:'

function scrollKey(historyKey: string): string {
  return `${STORAGE_PREFIX}${historyKey}`
}

/**
 * Scroll restoration for the SPA.
 *
 * - New navigations (links, redirects) start at the top of the page.
 * - Browser Back/Forward restores the exact scroll position the user left,
 *   keyed by the React Router history entry.
 * - Query-string-only updates (e.g. search filters) keep the current scroll.
 */
export function ScrollRestoration() {
  const location = useLocation()
  const locationKey = location.key
  const backForward = useRef(false)

  // Let us fully control scrolling — otherwise the browser's built-in
  // restoration fights with the logic below.
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    const onPopState = () => {
      backForward.current = true
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // Persist the user's scroll position while they're on this history entry.
  useEffect(() => {
    let frame = 0

    const saveScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        try {
          window.sessionStorage.setItem(scrollKey(locationKey), String(window.scrollY))
        } catch {
          // Storage unavailable (private mode, blocked cookies) — ignore.
        }
      })
    }

    window.addEventListener('scroll', saveScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', saveScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [locationKey])

  // On every navigation: restore for Back/Forward, jump to top otherwise.
  useEffect(() => {
    let saved = 0
    try {
      saved = Number(window.sessionStorage.getItem(scrollKey(locationKey)) || 0)
    } catch {
      saved = 0
    }

    if (backForward.current) {
      backForward.current = false
      window.scrollTo(0, saved)
    } else {
      window.scrollTo(0, 0)
    }
  }, [locationKey])

  return null
}
