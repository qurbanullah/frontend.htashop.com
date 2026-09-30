import { isNativePlatform } from '@/lib/native'
import { readSecret, removeSecret, writeSecret } from '@/lib/native-secure-store'
import { readStored, writeStored } from '@/lib/native-store'

/**
 * Device-held session credentials for the native shells.
 *
 * The web storefront keeps both tokens in httpOnly cookies. That works because
 * `htashop.com` and `api.htashop.com` share a *site*, so the cookies are attached
 * even though requests are cross-origin.
 *
 * A native WebView is a different site entirely — `https://localhost` on Android,
 * `capacitor://localhost` on iOS — so a Lax cookie is never stored and never
 * sent. Relaxing it to SameSite=None would make the cookies cross-site for
 * *every* client, exposing each state-changing API route to CSRF. Native shells
 * therefore hold the tokens here and send them as headers.
 *
 * - the access token travels as `Authorization: Bearer …` on every request
 *   (attached centrally by the API client, so no call site can forget it);
 * - the refresh token is sent as `X-Refresh-Token` to the refresh endpoint only,
 *   mirroring the path-scoped cookie the browser uses.
 *
 * Both are bearer credentials, so they are held in the OS keystore rather than in
 * the plaintext preferences store — see lib/native-secure-store.ts. The install id
 * is not a secret and stays in preferences.
 */

const ACCESS_TOKEN_KEY = 'hta_access_token'
const REFRESH_TOKEN_KEY = 'hta_refresh_token'
const DEVICE_ID_KEY = 'hta_device_id'

/** Synchronous mirrors so the API client's hooks never have to await. */
let cachedAccessToken: string | null = null
let cachedRefreshToken: string | null = null
let loaded = false

export function getNativeToken(): string | null {
  return cachedAccessToken
}

export function getNativeRefreshToken(): string | null {
  return cachedRefreshToken
}

/**
 * Reads the persisted credentials. Memoised, and an immediate no-op on the web.
 */
export async function loadNativeCredentials(): Promise<void> {
  if (loaded) return
  loaded = true

  if (!isNativePlatform()) return

  const [access, refresh] = await Promise.all([
    readSecret(ACCESS_TOKEN_KEY),
    readSecret(REFRESH_TOKEN_KEY),
    loadDeviceId(),
  ])

  cachedAccessToken = access
  cachedRefreshToken = refresh
}

/**
 * Persists whichever tokens the API returned.
 *
 * The storefront receives neither in a response body (they arrive as cookies),
 * so an omitted token means "leave the stored one alone" rather than "clear it".
 */
export async function saveNativeCredentials(credentials: {
  accessToken?: string | null
  refreshToken?: string | null
}): Promise<void> {
  // Hard no-op off-device: the web session is the cookies, and a bearer token
  // must never be attached there (the API would then prefer it over the cookie,
  // and a logout would leave the cookie's session behind it).
  if (!isNativePlatform()) return

  loaded = true

  if (credentials.accessToken) {
    cachedAccessToken = credentials.accessToken
    await writeSecret(ACCESS_TOKEN_KEY, credentials.accessToken)
  }

  if (credentials.refreshToken) {
    cachedRefreshToken = credentials.refreshToken
    await writeSecret(REFRESH_TOKEN_KEY, credentials.refreshToken)
  }
}

export async function clearNativeCredentials(): Promise<void> {
  if (!isNativePlatform()) return

  cachedAccessToken = null
  cachedRefreshToken = null
  loaded = true

  await Promise.all([removeSecret(ACCESS_TOKEN_KEY), removeSecret(REFRESH_TOKEN_KEY)])
}

/**
 * A stable id for this install.
 *
 * Sent as `X-Device-Id` so the API can group and audit a device's sessions
 * (e.g. "end every other session" after a password change). Install-scoped: it
 * is regenerated if the app is reinstalled, which is all the API needs.
 */
let cachedDeviceId: string | null = null

/** The install id, once {@link loadNativeCredentials} has run. Null on the web. */
export function getNativeDeviceId(): string | null {
  return cachedDeviceId
}

async function loadDeviceId(): Promise<void> {
  const stored = await readStored(DEVICE_ID_KEY)

  if (stored) {
    cachedDeviceId = stored
    return
  }

  const generated =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

  cachedDeviceId = generated
  await writeStored(DEVICE_ID_KEY, generated)
}
