/**
 * Client-side cache for S3 pre-signed URLs
 * Stores URLs with their expiration times to avoid fetching the same URL multiple times
 */

interface CachedUrl {
  url: string
  expiresAt: number // timestamp in ms
}

const CACHE_KEY_PREFIX = 's3_url_cache_'
const CACHE_BUFFER = 5 * 60 * 1000 // 5 minutes buffer before expiration

export const S3UrlCache = {
  /**
   * Get a cached URL if it exists and hasn't expired
   */
  get(key: string): string | null {
    if (typeof window === 'undefined') return null

    try {
      const cacheKey = `${CACHE_KEY_PREFIX}${key}`
      const cached = localStorage.getItem(cacheKey)

      if (!cached) return null

      const data: CachedUrl = JSON.parse(cached)
      const now = Date.now()

      // Check if URL has expired (with buffer)
      if (data.expiresAt - CACHE_BUFFER <= now) {
        localStorage.removeItem(cacheKey)
        return null
      }

      return data.url
    } catch (error) {
      console.error('Failed to get cached S3 URL:', error)
      return null
    }
  },

  /**
   * Store a URL in cache with expiration time
   * @param key - The S3 key/path
   * @param url - The pre-signed URL
   * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
   */
  set(key: string, url: string, expiresIn: number = 3600): void {
    if (typeof window === 'undefined') return

    try {
      const cacheKey = `${CACHE_KEY_PREFIX}${key}`
      const data: CachedUrl = {
        url,
        expiresAt: Date.now() + expiresIn * 1000,
      }

      localStorage.setItem(cacheKey, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to cache S3 URL:', error)
    }
  },

  /**
   * Clear a specific cached URL
   */
  clear(key: string): void {
    if (typeof window === 'undefined') return

    try {
      const cacheKey = `${CACHE_KEY_PREFIX}${key}`
      localStorage.removeItem(cacheKey)
    } catch (error) {
      console.error('Failed to clear cached S3 URL:', error)
    }
  },

  /**
   * Clear all expired URLs from cache
   */
  clearExpired(): void {
    if (typeof window === 'undefined') return

    try {
      const now = Date.now()
      const keys = Object.keys(localStorage).filter((key) => key.startsWith(CACHE_KEY_PREFIX))

      keys.forEach((cacheKey) => {
        try {
          const cached = localStorage.getItem(cacheKey)
          if (!cached) return

          const data: CachedUrl = JSON.parse(cached)
          if (data.expiresAt <= now) {
            localStorage.removeItem(cacheKey)
          }
        } catch (_error) {
          // Remove invalid entries
          localStorage.removeItem(cacheKey)
        }
      })
    } catch (error) {
      console.error('Failed to clear expired S3 URLs:', error)
    }
  },

  /**
   * Clear all cached URLs
   */
  clearAll(): void {
    if (typeof window === 'undefined') return

    try {
      const keys = Object.keys(localStorage).filter((key) => key.startsWith(CACHE_KEY_PREFIX))
      keys.forEach((key) => {
        localStorage.removeItem(key)
      })
    } catch (error) {
      console.error('Failed to clear all cached S3 URLs:', error)
    }
  },
}
