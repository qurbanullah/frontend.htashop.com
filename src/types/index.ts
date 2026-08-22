// Re-export all API-related types from a single entry point
export type {
  ApiResponse,
  PaginatedResponse,
  ErrorResponse,
} from "@/lib/api-response";
export { parseApiResponse, ApiError, isApiError } from "@/lib/api-response";
