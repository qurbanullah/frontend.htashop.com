import api from '@/api/client'
import i18n from '@/i18n/config'
import { type ApiResponse, parseApiResponse } from '@/lib/api-response'
import { authHeaders } from '@/lib/auth-header'
import { isNativePlatform } from '@/lib/native'
import {
  clearNativeCredentials,
  getNativeDeviceId,
  getNativeRefreshToken,
  saveNativeCredentials,
} from '@/lib/native-auth'
import type { User } from '@/stores/auth'

// ── Request types ──

export interface LoginRequest {
  email: string
  password: string
  turnstileToken?: string | null
}

export interface RegisterRequest {
  first_name: string
  last_name: string
  middle_name?: string
  email: string
  password: string
  password_confirmation: string
  turnstileToken?: string | null
}

// ── Response types ──

export interface AuthData {
  user: {
    id: number
    name: string
    email: string
    email_verified_at: string | null
    created_at: string
    updated_at: string
    roles: string[]
  }
  /**
   * Absent for the storefront: it authenticates with the httpOnly cookies and the
   * API withholds the tokens from the body (X-Client: storefront). Native shells
   * identify as X-Client: native and do receive them.
   */
  access_token?: string
  /** Single-use, rotated on every refresh. Absent for the storefront. */
  refresh_token?: string | null
  token_type: string
  expires_in: number
  /** Seconds until the refresh token expires, so the client can prompt early. */
  refresh_expires_in?: number
  refresh_token_expires_at?: string
}

export interface NormalizedAuthResponse {
  success: boolean
  message: string
  user: AuthData['user']
  token_type: string
  expires_in: number
}

export interface AccountCheckResponse {
  success: boolean
  exists: boolean
  message: string
}

export interface MessageResponse {
  success: boolean
  message: string
  errors?: Record<string, string[]>
}

// ── Auth API ──

/**
 * Identifies this client to the API.
 *
 * The web storefront keeps its session in httpOnly cookies, so it asks the API
 * to withhold the tokens from the login body. Native shells cannot use those
 * cookies (see lib/native-auth.ts), so they identify as `native`, receive the
 * tokens in the body, and report their install id so the API can group a
 * device's sessions.
 */
function clientHeaders(): Record<string, string> {
  if (!isNativePlatform()) {
    return { 'X-Client': 'storefront' }
  }

  const deviceId = getNativeDeviceId()

  return {
    'X-Client': 'native',
    ...(deviceId ? { 'X-Device-Id': deviceId } : {}),
  }
}

export const authApi = {
  /**
   * Pre-registration duplicate check. Requires a Turnstile token in production
   * (the API rejects an empty token with 422), so callers must pass the one
   * collected by the form. Failures are returned rather than thrown so the
   * caller can surface the backend message instead of "network error".
   */
  async checkAccount(email: string, turnstileToken?: string | null): Promise<AccountCheckResponse> {
    const res = await api.post('check-account', {
      json: { email, turnstileToken: turnstileToken || null },
      throwHttpErrors: false,
    })
    const body = (await res.json().catch(() => null)) as AccountCheckResponse | null
    if (!res.ok || !body) {
      return {
        success: false,
        exists: false,
        message: body?.message ?? i18n.t('check_account.error_generic', { ns: 'auth' }),
      }
    }
    return body
  },

  async login(credentials: LoginRequest): Promise<NormalizedAuthResponse> {
    const res = await api.post('login', {
      json: credentials,
      headers: clientHeaders(),
      throwHttpErrors: false,
    })
    const body = await parseApiResponse<AuthData>(res)

    // Native shells receive both tokens in the body and persist them so the API
    // client can attach them on later requests. On the web the API withholds
    // them and the httpOnly cookies carry the session instead.
    await saveNativeCredentials({
      accessToken: body.data.access_token,
      refreshToken: body.data.refresh_token,
    })

    return {
      success: body.success,
      message: body.message,
      user: body.data.user,
      token_type: body.data.token_type,
      expires_in: body.data.expires_in,
    }
  },

  /**
   * Exchange the refresh token for a new pair. Called by the API client when an
   * access token is rejected, so it is not usually invoked directly.
   */
  async refresh(): Promise<AuthData> {
    // The browser presents its token as the path-scoped refresh cookie; a native
    // shell has no usable cookie, so it sends the token in a header instead.
    const refreshToken = getNativeRefreshToken()

    const res = await api.post('refresh', {
      headers: {
        ...authHeaders(),
        ...clientHeaders(),
        ...(refreshToken ? { 'X-Refresh-Token': refreshToken } : {}),
      },
      throwHttpErrors: false,
    })

    // Throws for any rejection — expired, revoked, or a detected replay — which
    // the API client treats as "the session is over".
    const body = await parseApiResponse<AuthData>(res)

    await saveNativeCredentials({
      accessToken: body.data.access_token,
      refreshToken: body.data.refresh_token,
    })

    return body.data
  },

  async register(userData: RegisterRequest): Promise<NormalizedAuthResponse> {
    const res = await api.post('register', { json: userData, throwHttpErrors: false })
    const body = await parseApiResponse<AuthData>(res)
    return {
      success: body.success,
      message: body.message,
      user: body.data.user,
      token_type: body.data.token_type,
      expires_in: body.data.expires_in,
    }
  },

  async logout(): Promise<MessageResponse> {
    try {
      // An expired/again-revoked session answers 401; that is not an error from
      // the caller's point of view, so it must not throw.
      const res = await api.post('logout', {
        headers: authHeaders(),
        throwHttpErrors: false,
      })
      return (await res.json()) as MessageResponse
    } finally {
      // Drop the device-held tokens even when the API call fails, so a device
      // cannot keep replaying a session the user asked to end.
      await clearNativeCredentials()
    }
  },

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return api.get('user', { headers: authHeaders() }).json<ApiResponse<User>>()
  },

  async verifyEmail(token: string, email: string): Promise<MessageResponse> {
    const res = await api.post('verify-email', { json: { token, email }, throwHttpErrors: false })
    return parseApiResponse(res)
  },

  async resendVerificationEmail(
    email: string,
    turnstileToken?: string | null
  ): Promise<MessageResponse> {
    const res = await api.post('resend-verification-email', {
      json: { email, turnstileToken: turnstileToken || null },
      throwHttpErrors: false,
    })
    return parseApiResponse(res)
  },

  async forgotPassword(
    email: string,
    frontend: 'main' | 'manage' | 'admin' = 'main',
    turnstileToken?: string | null
  ): Promise<MessageResponse> {
    const res = await api.post('forgot-password', {
      json: { email, frontend, turnstileToken: turnstileToken || null },
      throwHttpErrors: false,
    })
    return parseApiResponse(res)
  },

  async resetPassword(data: {
    token: string
    email: string
    password: string
    password_confirmation: string
    turnstileToken?: string | null
  }): Promise<MessageResponse> {
    const res = await api.post('reset-password', { json: data, throwHttpErrors: false })
    return parseApiResponse(res)
  },
}
