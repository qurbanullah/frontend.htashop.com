import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The API client's session recovery.
 *
 * The property that matters most is single-flight: if two concurrent 401s each
 * rotated the refresh token, the second rotation would present an already-used
 * token, which the API must read as theft and answer by revoking the whole
 * session. A refresh storm therefore logs the user out — so it is tested here
 * rather than left to chance.
 */

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  clearNativeCredentials: vi.fn(),
  /** Mutable so a refresh can "rotate" the token the client holds. */
  token: { current: null as string | null },
}))

vi.mock('@/api/auth', () => ({ authApi: { refresh: mocks.refresh } }))

vi.mock('@/lib/native-auth', () => ({
  getNativeToken: () => mocks.token.current,
  getNativeRefreshToken: () => (mocks.token.current ? 'refresh-token' : null),
  getNativeDeviceId: () => 'device-1',
  loadNativeCredentials: vi.fn(),
  saveNativeCredentials: vi.fn(),
  clearNativeCredentials: mocks.clearNativeCredentials,
}))

/** What the fake server saw, in order: method, path, bearer, and raw body. */
let calls: Array<{ method: string; path: string; token: string | null; body: string | null }> = []

function installFakeFetch(): void {
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    // ky always hands fetch a Request, but normalise either shape so the
    // assertions below read from one place.
    const request = input instanceof Request ? input : new Request(String(input), init)
    const path = new URL(request.url).pathname
    const authorization = request.headers.get('Authorization')
    const token = authorization?.replace('Bearer ', '') ?? null
    // Clone first: reading the body consumes it, and a replay must arrive whole.
    const body =
      request.method === 'GET' || request.method === 'HEAD'
        ? null
        : await request
            .clone()
            .text()
            .catch(() => null)

    calls.push({ method: request.method, path, token, body: body || null })

    // Only a fresh access token is accepted; everything else is an expired
    // session, which is what the client has to recover from.
    const ok = token === 'fresh-token'

    return new Response(JSON.stringify(ok ? { success: true } : { success: false }), {
      status: ok ? 200 : 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }) as unknown as typeof fetch
}

/** Fresh module graph per test: the client memoises the in-flight refresh. */
async function setup(token: string | null): Promise<typeof import('@/api/client').api> {
  vi.resetModules()
  mocks.token.current = token
  calls = []
  installFakeFetch()

  const { useAuthStore } = await import('@/stores/auth')
  useAuthStore.setState({ isAuthenticated: true, isInitializing: false })

  return (await import('@/api/client')).api
}

describe('api client session recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('refreshes once for concurrent 401s and replays every request', async () => {
    const api = await setup('stale-token')

    mocks.refresh.mockImplementation(async () => {
      // The API rotated; the client now holds the new access token.
      mocks.token.current = 'fresh-token'
      return {}
    })

    const responses = await Promise.all([
      api.get('user', { throwHttpErrors: false }),
      api.get('account/orders', { throwHttpErrors: false }),
      api.get('users/me/addresses', { throwHttpErrors: false }),
    ])

    expect(mocks.refresh).toHaveBeenCalledTimes(1)
    expect(responses.map((response) => response.status)).toEqual([200, 200, 200])

    // Each request was rejected once, then succeeded with the new token.
    expect(calls.filter((call) => call.token === 'stale-token')).toHaveLength(3)
    expect(calls.filter((call) => call.token === 'fresh-token')).toHaveLength(3)
  })

  it('does not refresh while anonymous', async () => {
    const api = await setup(null)

    const { useAuthStore } = await import('@/stores/auth')
    useAuthStore.setState({ isAuthenticated: false, isInitializing: false })

    const response = await api.get('user', { throwHttpErrors: false })

    expect(response.status).toBe(401)
    expect(mocks.refresh).not.toHaveBeenCalled()
  })

  it('never refreshes on the auth endpoints themselves', async () => {
    const api = await setup('stale-token')

    // A 401 here means "wrong password", not "expired session".
    await api.post('login', {
      json: { email: 'a@b.test', password: 'nope' },
      throwHttpErrors: false,
    })
    await api.post('refresh', { throwHttpErrors: false })
    await api.post('logout', { throwHttpErrors: false })
    await api.post('forgot-password', {
      json: { email: 'a@b.test' },
      throwHttpErrors: false,
    })

    expect(mocks.refresh).not.toHaveBeenCalled()
  })

  it('ends the session when the refresh is rejected, without looping', async () => {
    const api = await setup('stale-token')

    mocks.refresh.mockRejectedValue(new Error('refresh_token_revoked'))

    const response = await api.get('user', { throwHttpErrors: false })

    expect(response.status).toBe(401)
    expect(mocks.refresh).toHaveBeenCalledTimes(1)
    expect(mocks.clearNativeCredentials).toHaveBeenCalled()

    // One refresh attempt, one rejection, then a single re-request at most.
    expect(calls.length).toBeLessThanOrEqual(2)
  })

  it('replays a write request with the refreshed bearer and its body intact', async () => {
    const api = await setup('stale-token')

    mocks.refresh.mockImplementation(async () => {
      mocks.token.current = 'fresh-token'
      return {}
    })

    const response = await api.post('cart/items', {
      json: { product_id: 7, quantity: 2 },
      throwHttpErrors: false,
    })

    expect(response.status).toBe(200)
    expect(calls).toEqual([
      {
        method: 'POST',
        path: '/api/v1/cart/items',
        token: 'stale-token',
        body: '{"product_id":7,"quantity":2}',
      },
      {
        method: 'POST',
        path: '/api/v1/cart/items',
        token: 'fresh-token',
        body: '{"product_id":7,"quantity":2}',
      },
    ])
  })

  it('does not loop when the refreshed token is rejected too', async () => {
    const api = await setup('stale-token')

    // Refresh "succeeds" but the API still refuses the new access token.
    mocks.refresh.mockImplementation(async () => {
      mocks.token.current = 'still-stale'
      return {}
    })

    const response = await api.get('user', { throwHttpErrors: false })

    expect(response.status).toBe(401)
    expect(mocks.refresh).toHaveBeenCalledTimes(1)
    // Original attempt plus exactly one replay — never a third.
    expect(calls).toHaveLength(2)
  })

  it('leaves a successful request alone', async () => {
    const api = await setup('fresh-token')

    const response = await api.get('user', { throwHttpErrors: false })

    expect(response.status).toBe(200)
    expect(mocks.refresh).not.toHaveBeenCalled()
    expect(calls).toHaveLength(1)
  })
})
