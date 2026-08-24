import api from '@/api/client'
import { type ApiResponse, parseApiResponse } from '@/lib/api-response'
import { authHeaders } from '@/lib/auth-header'
import type { User } from '@/stores/auth'

// ── Request types ──

export interface LoginRequest {
  email: string
  password: string
  turnstile_token?: string | null
}

export interface RegisterRequest {
  first_name: string
  last_name: string
  middle_name?: string
  email: string
  password: string
  password_confirmation: string
  turnstile_token?: string | null
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
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string | null
}

export interface NormalizedAuthResponse {
  success: boolean
  message: string
  user: AuthData['user']
  token: string
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
  async checkAccount(email: string): Promise<AccountCheckResponse> {
    return api.post('check-account', { json: { email } }).json()
  },

  async login(credentials: LoginRequest): Promise<NormalizedAuthResponse> {
    const res = await api.post('login', { json: credentials, throwHttpErrors: false })
    const body = await parseApiResponse<AuthData>(res)
    return {
      success: body.success,
      message: body.message,
      user: body.data.user,
      token: body.data.access_token,
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
      token: body.data.access_token,
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

  async resendVerificationEmail(email: string): Promise<MessageResponse> {
    const res = await api.post('resend-verification-email', {
      json: { email },
      throwHttpErrors: false,
    })
    return parseApiResponse(res)
  },

  async forgotPassword(
    email: string,
    frontend: 'main' | 'manage' | 'admin' = 'manage'
  ): Promise<MessageResponse> {
    const res = await api.post('forgot-password', {
      json: { email, frontend },
      throwHttpErrors: false,
    })
    return parseApiResponse(res)
  },

  async resetPassword(data: {
    token: string
    email: string
    password: string
    password_confirmation: string
  }): Promise<MessageResponse> {
    const res = await api.post('reset-password', { json: data, throwHttpErrors: false })
    return parseApiResponse(res)
  },
}
