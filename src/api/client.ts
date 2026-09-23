import ky from 'ky'

const API_URL = import.meta.env.VITE_API_URL || 'https://api.htashop.com/api/v1'

export const getApiUrl = () => API_URL

const api = ky.create({
  prefix: API_URL,
  timeout: 15000,
  credentials: 'include',
  headers: { Accept: 'application/json' },
  retry: { limit: 0 },
  hooks: {
    afterResponse: [
      async ({ response }) => {
        // Clear the session when an authenticated request is rejected (401) —
        // the httpOnly access-token cookie has expired or been revoked.
        // Public auth flows (login/register/forgot-password) run while the
        // user is not authenticated, so their 401s are left to their own handling.
        if (response.status === 401) {
          const [{ useAuthStore }, { queryClient }] = await Promise.all([
            import('@/stores/auth'),
            import('@/lib/query-client'),
          ])

          if (useAuthStore.getState().isAuthenticated) {
            useAuthStore.getState().logout()
            // Drop cached account data (orders, addresses, profile) so the next
            // visitor on this browser cannot read the expired session's data.
            queryClient.clear()
          }
        }
        return response
      },
    ],
  },
})

export { api }
export default api
