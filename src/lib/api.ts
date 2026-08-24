// Re-export shim — use @/api/client and @/api/auth for new code

export type {
  AccountCheckResponse,
  LoginRequest,
  MessageResponse,
  NormalizedAuthResponse,
  RegisterRequest,
} from '@/api/auth'
export { authApi } from '@/api/auth'
export { api, default, getApiUrl } from '@/api/client'
export type {
  ApiResponse,
  ErrorResponse,
  PaginatedResponse,
} from '@/lib/api-response'
export { ApiError, isApiError, parseApiResponse } from '@/lib/api-response'
