import api from '@/api/client'
import i18n from '@/i18n/config'
import { type ApiResponse, parseApiResponse } from '@/lib/api-response'
import { authHeaders } from '@/lib/auth-header'
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
   * Absent for the storefront: it authenticates with the httpOnly cookie and the
   * API withholds the bearer token from the body (X-Client: storefront).
   */
  access_token?: string
  token_type: string
  expires_in: number
  refresh_token?: string | null
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
        message: body?.message ?? i18n.t('check_account.error_generic'),
      }
    }
    return body
  },

  async login(credentials: LoginRequest): Promise<NormalizedAuthResponse> {
    const res = await api.post('login', {
      json: credentials,
      // Signals the API to withhold the bearer token from the response body —
      // the storefront uses the httpOnly session cookie instead.
      headers: { 'X-Client': 'storefront' },
      throwHttpErrors: false,
    })
    const body = await parseApiResponse<AuthData>(res)
    return {
      success: body.success,
      message: body.message,
      user: body.data.user,
      token_type: body.data.token_type,
      expires_in: body.data.expires_in,
    }
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
    return api.post('logout', { headers: authHeaders() }).json()
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
