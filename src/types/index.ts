// Re-export all API-related types from a single entry point
export type {
  ApiResponse,
  ErrorResponse,
  PaginatedResponse,
} from '@/lib/api-response'
export { ApiError, isApiError, parseApiResponse } from '@/lib/api-response'
