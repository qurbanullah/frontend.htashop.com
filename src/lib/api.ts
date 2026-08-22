// Re-export shim — use @/api/client and @/api/auth for new code
export { default, getApiUrl, api } from "@/api/client";
export { authApi } from "@/api/auth";
export { parseApiResponse, ApiError, isApiError } from "@/lib/api-response";
export type {
  ApiResponse,
  PaginatedResponse,
  ErrorResponse,
} from "@/lib/api-response";
export type {
  LoginRequest,
  RegisterRequest,
  NormalizedAuthResponse,
  AccountCheckResponse,
  MessageResponse,
} from "@/api/auth";
