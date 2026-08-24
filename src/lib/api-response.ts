/**
 * Standardized API response types and helpers.
 *
 * The Laravel backend returns a consistent JSON envelope:
 *   { success: boolean, message: string, data: T }
 *
 * This module provides types and a parser that every API call should use.
 */

// ── Response envelope (matches Laravel ApiResponse helper) ──

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data: T
}

export interface PaginatedResponse<T = unknown> {
  success: boolean
  message: string
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
  }
}

export interface ErrorResponse {
  success: false
  message: string
  errors?: Record<string, string[]>
  email_exists?: boolean
  requires_email_verification?: boolean
  email?: string
}

// ── API error class ──

export class ApiError extends Error {
  public readonly isApiError = true
  public readonly status: number
  public readonly errors?: Record<string, string[]>
  public readonly emailExists?: boolean
  public readonly requiresEmailVerification?: boolean
  public readonly email?: string
  public readonly body: unknown

  constructor(
    message: string,
    status: number,
    extra?: {
      errors?: Record<string, string[]>
      email_exists?: boolean
      requires_email_verification?: boolean
      email?: string
      body?: unknown
    }
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = extra?.errors
    this.emailExists = extra?.email_exists
    this.requiresEmailVerification = extra?.requires_email_verification
    this.email = extra?.email
    this.body = extra?.body
  }
}

// ── Response parser ──

/**
 * Parse a Fetch/ky Response into the standard API envelope.
 * Throws ApiError when !response.ok or success === false.
 */
export async function parseApiResponse<T = unknown>(response: Response): Promise<ApiResponse<T>> {
  const body = (await response.json()) as ApiResponse<T> & ErrorResponse

  if (!response.ok || body.success === false) {
    throw new ApiError(
      body.message || `Request failed with status ${response.status}`,
      response.status,
      {
        errors: body.errors,
        email_exists: (body as ErrorResponse).email_exists,
        requires_email_verification: (body as ErrorResponse).requires_email_verification,
        email: (body as ErrorResponse).email,
        body,
      }
    )
  }

  return body
}

/**
 * Type guard: checks if an unknown error is an ApiError.
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isApiError' in error &&
    (error as Record<string, unknown>).isApiError === true
  )
}
