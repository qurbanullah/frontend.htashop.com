import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { api } from '@/api/client'
import type { ApiResponse } from '@/lib/api-response'

export const AUTH_STORAGE_KEY = 'auth-storage'

export interface User {
  id: number
  uuid?: string
  name: string
  first_name?: string | null
  last_name?: string | null
  email: string
  email_verified_at: string | null
  avatar_url?: string | null
  avatar_thumb?: string | null
  avatar_small?: string | null
  avatar_medium?: string | null
  avatar_urls?: {
    original?: string | null
    thumb?: string | null
    small?: string | null
    medium?: string | null
    large?: string | null
  }
  onboarding_completed?: boolean
  created_at: string
  updated_at: string
  roles: string[] | Array<{ id: number; name: string; guard: string }> | null
  can_access_admin?: boolean
  can_access_manage?: boolean
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isInitializing: boolean
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  login: (user: User) => void
  logout: () => void
  setUser: (user: User) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  updateUser: (user: Partial<User>) => void
  clearError: () => void
  initialize: () => Promise<void>
}

type AuthStore = AuthState & AuthActions

const persistedStore = persist(
  immer<AuthStore>((set) => ({
    user: null,
    isAuthenticated: false,
    isInitializing: true,
    isLoading: false,
    error: null,

    login: (user: User) =>
      set((state) => {
        state.user = user
        state.isAuthenticated = true
        state.isInitializing = false
        state.isLoading = false
        state.error = null
      }),

    logout: () =>
      set((state) => {
        state.user = null
        state.isAuthenticated = false
        state.isInitializing = false
        state.isLoading = false
        state.error = null
      }),

    setUser: (user: User) =>
      set((state) => {
        state.user = user
      }),

    setLoading: (loading: boolean) =>
      set((state) => {
        state.isLoading = loading
      }),

    setError: (error: string | null) =>
      set((state) => {
        state.error = error
        state.isLoading = false
      }),

    clearError: () =>
      set((state) => {
        state.error = null
      }),

    updateUser: (userData: Partial<User>) =>
      set((state) => {
        if (state.user) {
          Object.assign(state.user, userData)
        }
      }),

    initialize: async () => {
      set((draft) => {
        draft.isInitializing = true
      })

      // The access token is now stored in an httpOnly cookie (set by the API
      // on login), so no Authorization header is needed here. The cookie is
      // sent automatically because the API client uses `credentials: 'include'`.
      try {
        const body = await api.get('user').json<ApiResponse<User>>()

        if (body.success && body.data) {
          set((draft) => {
            draft.user = body.data
            draft.isAuthenticated = true
            draft.isInitializing = false
          })
          return
        }

        // Explicit invalid-session response.
        set((draft) => {
          draft.user = null
          draft.isAuthenticated = false
          draft.isInitializing = false
        })
      } catch (error) {
        const status = (error as { response?: { status?: number } } | null)?.response?.status
        if (status === 401 || status === 403) {
          set((draft) => {
            draft.user = null
            draft.isAuthenticated = false
            draft.isInitializing = false
          })
        } else {
          // Network/timeout — keep the persisted session; a later request can retry.
          set((draft) => {
            draft.isInitializing = false
          })
        }
      }
    },
  })),
  {
    name: AUTH_STORAGE_KEY,
    partialize: (state) => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
    }),
  }
)

export const useAuthStore = create<AuthStore>()(
  (import.meta.env.DEV
    ? devtools(persistedStore, { name: 'auth-store' })
    : persistedStore) as unknown as typeof persistedStore
)
