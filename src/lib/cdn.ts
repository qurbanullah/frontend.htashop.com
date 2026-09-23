import { ENV_CONFIG } from '@/lib/env'

const ABSOLUTE_URL = /^(https?:|data:|blob:)/

/**
 * Absolute URL for a stored media key (avatar, banner, product image …).
 *
 * Accepts either a bare CDN key or an already-absolute URL, so callers can pass
 * whatever the API returned without checking first. Returns an empty string for
 * missing input so it can be used directly in `src` attributes.
 */
export function cdnUrl(key?: string | null): string {
  if (!key) return ''
  if (ABSOLUTE_URL.test(key)) return key
  return `${ENV_CONFIG.CDN_URL}/${key.replace(/^\//, '')}`
}
