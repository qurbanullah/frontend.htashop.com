import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDeepLinkStore } from '@/stores/deep-link'

/**
 * Navigates to any deep link queued by the native shell.
 *
 * Rendered inside the router and renders nothing — it only bridges the native
 * `appUrlOpen` event into React Router.
 */
export function DeepLinkHandler() {
  const navigate = useNavigate()
  const pendingPath = useDeepLinkStore((s) => s.pendingPath)
  const clear = useDeepLinkStore((s) => s.clear)

  useEffect(() => {
    if (!pendingPath) return

    // `replace` keeps the link out of history: Back should leave the app's own
    // navigation intact rather than bouncing through the deep-link entry.
    navigate(pendingPath, { replace: true })
    clear()
  }, [pendingPath, navigate, clear])

  return null
}
