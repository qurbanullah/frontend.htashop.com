import ky from 'ky'
import { getNativeRefreshToken, getNativeToken } from '@/lib/native-auth'

const API_URL = import.meta.env.VITE_API_URL || 'https://api.htashop.com/api/v1'

export const getApiUrl = () => API_URL

/**
 * Endpoints that answer 401 as a normal outcome rather than an expired session.
 * Refreshing on one of these would loop (or mask a bad password), so they are
 * left to their callers.
 */
const NO_REFRESH_ENDPOINTS = new Set([
  'login',
  'logout',
  'refresh',
  'register',
  'check-account',
  'forgot-password',
  'reset-password',
  'verify-email',
  'resend-verification-email',
])

function isAuthEndpoint(url: string): boolean {
  try {
    const segments = new URL(url).pathname.split('/').filter(Boolean)

    return NO_REFRESH_ENDPOINTS.has(segments.at(-1) ?? '')
  } catch {
    return false
  }
}

/**
 * Single-flight refresh.
 *
 * Concurrent 401s must share one refresh call. Two rotations racing would present
 * the same token twice, which the API correctly reads as a stolen token and
 * answers by revoking the whole session.
 */
let refreshInFlight: Promise<boolean> | null = null

function refreshSession(): Promise<boolean> {
  refreshInFlight ??= performRefresh().finally(() => {
    refreshInFlight = null
  })

  return refreshInFlight
}

async function performRefresh(): Promise<boolean> {
  try {
    const { authApi } = await import('@/api/auth')
    await authApi.refresh()

    return true
  } catch {
    return false
  }
}

/** Drops every trace of the session, locally and on the device. */
async function endSession(): Promise<void> {
  const [{ useAuthStore }, { queryClient }, { clearNativeCredentials }] = await Promise.all([
    import('@/stores/auth'),
    import('@/lib/query-client'),
    import('@/lib/native-auth'),
  ])

  await clearNativeCredentials()
  useAuthStore.getState().logout()
  // Drop cached account data (orders, addresses, profile) so the next visitor on
  // this device cannot read the expired session's data.
  queryClient.clear()
}

/** True when the client believes it holds a session worth refreshing. */
async function hasRecoverableSession(): Promise<boolean> {
  const { useAuthStore } = await import('@/stores/auth')

  return useAuthStore.getState().isAuthenticated || Boolean(getNativeRefreshToken())
}

const api = ky.create({
  prefix: API_URL,
  timeout: 15000,
  credentials: 'include',
  headers: { Accept: 'application/json' },
  retry: {
    // A single retry, used ONLY by the explicit `ky.retry()` below after a
    // session is refreshed — ky skips these checks for forced retries and honours
    // just the limit. Automatic retries stay off: `shouldRetry` declines
    // everything (network errors, timeouts) and no status code is retriable, so
    // nothing is replayed behind the caller's back.
    limit: 1,
    statusCodes: [],
    shouldRetry: () => false,
  },
  hooks: {
    beforeRequest: [
      ({ request }) => {
        // Native shells hold a bearer token (see lib/native-auth.ts); the web
        // storefront has none and relies on the httpOnly cookie instead.
        const token = getNativeToken()
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`)
        }
      },
    ],
    afterResponse: [
      async ({ request, response, retryCount }) => {
        if (response.status !== 401 || isAuthEndpoint(request.url)) {
          return response
        }

        // One replay per request, never more. A second 401 means the freshly
        // minted access token was rejected as well, so re-refreshing would only
        // loop; the caller gets the 401 and decides.
        if (retryCount > 0) {
          return response
        }

        if (!(await hasRecoverableSession())) {
          return response
        }

        // Access tokens are short-lived, so a 401 usually just means "refresh
        // and try again" — transparently, once.
        if (await refreshSession()) {
          // A replacement Request handed to ky.retry() is authoritative: ky sends
          // it verbatim and does NOT run the request hooks again, so the refreshed
          // bearer has to be applied here — the original request-header hook will
          // not get a second chance.
          const headers = new Headers(request.headers)
          const token = getNativeToken()

          if (token) {
            headers.set('Authorization', `Bearer ${token}`)
          }

          // ky hands this hook a pristine clone of the request, so the body is
          // still readable and is carried over into the replacement.
          return ky.retry({ request: new Request(request, { headers }) })
        }

        // The refresh token is gone or was rejected: the session is over.
        await endSession()

        return response
      },
    ],
  },
})

export { api }
export default api
