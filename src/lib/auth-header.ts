/**
 * The storefront authenticates via an httpOnly access-token cookie (set by the
 * API on login) rather than a Bearer token in localStorage or memory. There is
 * no Authorization header to attach, so this always returns an empty object.
 * The cookie is sent automatically because the API client uses
 * `credentials: 'include'`.
 */
export function authHeaders(): Record<string, string> {
  return {}
}
