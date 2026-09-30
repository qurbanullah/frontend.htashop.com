/**
 * The web storefront authenticates via an httpOnly access-token cookie (set by
 * the API on login) rather than a Bearer token in localStorage or memory. There
 * is no Authorization header to attach, so this always returns an empty object.
 * The cookie is sent automatically because the API client uses
 * `credentials: 'include'`.
 *
 * Native shells do use a bearer token, but it is attached centrally by the API
 * client's request hook (see src/api/client.ts) so it cannot be forgotten at a
 * call site.
 */
export function authHeaders(): Record<string, string> {
  return {}
}
