/**
 * Recovery from stale SPA chunk references after a deployment.
 *
 * A browser (or an intermediary) can keep the previous `index.html` while the
 * server has already replaced every hashed chunk. The old HTML then requests a
 * chunk that no longer exists and the lazy route fails. A single reload fetches
 * the new shell and the matching chunks.
 *
 * The `sessionStorage` timestamp stops a reload loop when the deployment itself
 * is incomplete (for example, the new `index.html` is live but its assets are
 * still being rolled out). After the window expires a later deploy can recover
 * the same way.
 */
const RELOAD_KEY = 'htashop-chunk-reload-at'
const RELOAD_WINDOW_MS = 10_000

const CHUNK_ERROR_PATTERNS = [
  /failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /importing a module script failed/i,
  /failed to load module script/i,
  /loading chunk [\w-]+ failed/i,
  /unable to preload css/i,
]

/** True for the chunk-load failures produced by Vite, Safari and webpack. */
export function isChunkLoadError(error: unknown): boolean {
  if (!error) return false

  const name =
    typeof error === 'object' && 'name' in error ? String((error as { name?: unknown }).name) : ''
  if (name === 'ChunkLoadError') return true

  let message = ''
  if (typeof error === 'string') {
    message = error
  } else if (error instanceof Error) {
    message = error.message
  } else if (typeof error === 'object' && 'message' in error) {
    message = String((error as { message?: unknown }).message)
  }

  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message))
}

/**
 * Reload once for a chunk failure and return whether a reload was triggered.
 * The `reload`/`now` parameters exist so tests can observe the decision.
 */
export function reloadOnceForChunkError(
  reload: () => void = () => window.location.reload(),
  now: number = Date.now()
): boolean {
  let last = 0
  try {
    last = Number(window.sessionStorage.getItem(RELOAD_KEY)) || 0
  } catch {
    // Without a persistent guard we cannot rule out a reload loop, so show the
    // error UI instead.
    return false
  }

  if (last > 0 && now - last < RELOAD_WINDOW_MS) return false

  try {
    window.sessionStorage.setItem(RELOAD_KEY, String(now))
  } catch {
    return false
  }

  reload()
  return true
}

/**
 * Vite emits `vite:preloadError` when a modulepreload or dynamic import fails,
 * including prefetches that never reach React's render phase.
 */
export function installChunkReloadHandler(): () => void {
  const onPreloadError = () => {
    reloadOnceForChunkError()
  }

  window.addEventListener('vite:preloadError', onPreloadError)
  return () => window.removeEventListener('vite:preloadError', onPreloadError)
}
