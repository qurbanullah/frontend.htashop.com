import { QueryClient } from '@tanstack/react-query'
import { isApiError } from '@/lib/api-response'

/**
 * Shared React Query client.
 *
 * Kept in its own module (rather than inline in `main.tsx`) so `api/client.ts`
 * can clear the cache when a session expires — otherwise the previous user's
 * orders/addresses/profile stay in memory for the next visitor on that browser.
 *
 * Retries are limited to transient failures only: an `ApiError` is a definitive
 * answer from our own API, so retrying a 401/422 previously multiplied requests
 * and `logout()` calls.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => failureCount < 2 && !isApiError(error),
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 15 * 60 * 1000, // 15 minutes garbage collection
    },
    mutations: {
      retry: 0, // never retry mutations — avoid duplicate submissions
    },
  },
})
