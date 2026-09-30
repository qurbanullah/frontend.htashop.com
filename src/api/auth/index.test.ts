import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The refresh call's wire contract.
 *
 * The browser presents its refresh token in a path-scoped httpOnly cookie, but a
 * native shell has no usable cookie — it must send `X-Refresh-Token`. Getting that
 * wrong is silent: the API answers 401 "missing" and every native install is
 * signed out the moment its access token expires, so it is pinned here.
 */

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
  platform: { native: true },
  refreshToken: { current: 'refresh-abc' as string | null },
  saveNativeCredentials: vi.fn(),
  clearNativeCredentials: vi.fn(),
  getNativeDeviceId: vi.fn(() => 'device-1'),
}))

vi.mock('@/api/client', () => ({ default: { post: mocks.post, get: mocks.get } }))

vi.mock('@/lib/native-auth', () => ({
  getNativeRefreshToken: () => mocks.refreshToken.current,
  getNativeDeviceId: mocks.getNativeDeviceId,
  saveNativeCredentials: mocks.saveNativeCredentials,
  clearNativeCredentials: mocks.clearNativeCredentials,
}))

vi.mock('@/lib/native', () => ({ isNativePlatform: () => mocks.platform.native }))

function refreshedResponse(): Response {
  return new Response(
    JSON.stringify({
      success: true,
      message: 'Token refreshed',
      data: {
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.test',
          email_verified_at: null,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
          roles: ['customer'],
        },
        access_token: 'new-access',
        refresh_token: 'new-refresh',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_expires_in: 2592000,
      },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}

async function authApi() {
  return (await import('@/api/auth')).authApi
}

describe('authApi.refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.platform.native = true
    mocks.refreshToken.current = 'refresh-abc'
    mocks.post.mockResolvedValue(refreshedResponse())
  })

  it('sends the stored refresh token and rotates it on a native device', async () => {
    const data = await (await authApi()).refresh()

    expect(data.access_token).toBe('new-access')
    expect(mocks.post).toHaveBeenCalledWith(
      'refresh',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Client': 'native',
          'X-Device-Id': 'device-1',
          'X-Refresh-Token': 'refresh-abc',
        }),
        throwHttpErrors: false,
      })
    )
    expect(mocks.saveNativeCredentials).toHaveBeenCalledWith({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    })
  })

  it('omits the header on the web, where the cookie carries the session', async () => {
    mocks.platform.native = false
    mocks.refreshToken.current = null

    await (await authApi()).refresh()

    const headers = mocks.post.mock.calls[0]?.[1]?.headers ?? {}

    expect(headers).toMatchObject({ 'X-Client': 'storefront' })
    expect(headers).not.toHaveProperty('X-Refresh-Token')
  })

  it('throws when the API rejects the refresh, so the client ends the session', async () => {
    mocks.post.mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          message: 'Your session has expired. Please sign in again.',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    )

    await expect((await authApi()).refresh()).rejects.toThrow(/session has expired/i)
    expect(mocks.saveNativeCredentials).not.toHaveBeenCalled()
  })
})
