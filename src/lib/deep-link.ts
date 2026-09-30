/**
 * Maps inbound deep links to in-app routes.
 *
 * Two link shapes are accepted:
 *
 * - A custom scheme declared by the native projects, e.g.
 *   `htashop://products/some-slug` (here the first segment is parsed as the
 *   URL *host*, so it is re-joined onto the path).
 * - An App Link / Universal Link on a host we own, e.g.
 *   `https://htashop.com/products/some-slug`.
 *
 * Anything else returns `null`, so a link we do not control can never steer the
 * app to an arbitrary destination. The result is always a same-origin router
 * path, never an absolute URL.
 */

/** Must match the scheme registered in AndroidManifest.xml / Info.plist. */
export const DEEP_LINK_SCHEME = 'htashop'

const WEB_HOSTS = ['htashop.com', 'www.htashop.com']

/**
 * Only ever returns a same-origin router path.
 *
 * A leading `//` is rejected rather than rewritten: to a browser that is a
 * protocol-relative *host*, and it is never a legitimate in-app route.
 */
function normalisePath(path: string): string | null {
  if (!path.startsWith('/') || path.startsWith('//')) return null

  return path
}

export function deepLinkToPath(url: string): string | null {
  let parsed: URL

  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  const protocol = parsed.protocol.toLowerCase()

  if (protocol === `${DEEP_LINK_SCHEME}:`) {
    // `htashop://products/slug` → host "products", pathname "/slug"; the
    // host-less form `htashop:///products/slug` has an empty host.
    const host = parsed.host === '' ? '' : `/${parsed.host}`
    const path = `${host}${parsed.pathname}${parsed.search}`

    return normalisePath(path === '' ? '/' : path)
  }

  if (protocol !== 'https:' && protocol !== 'http:') return null

  if (!WEB_HOSTS.includes(parsed.hostname.toLowerCase())) return null

  return normalisePath(`${parsed.pathname}${parsed.search}`)
}

/**
 * Extracts the in-app route a push notification should open.
 *
 * Accepts either an in-app path (`/account/orders/…`) or any link
 * `deepLinkToPath` understands, so the sender can include whichever is
 * convenient under `data`. Returns null when the payload carries no usable
 * destination, so a notification never navigates somewhere unexpected.
 */
export function pushPayloadToPath(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null

  const record = data as Record<string, unknown>
  const candidate = [record.link, record.url, record.path].find(
    (value): value is string => typeof value === 'string' && value.trim() !== ''
  )

  if (!candidate) return null

  const trimmed = candidate.trim()

  // Already an in-app path.
  if (trimmed.startsWith('/')) return normalisePath(trimmed)

  return deepLinkToPath(trimmed)
}
