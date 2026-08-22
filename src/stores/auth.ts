import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const AUTH_STORAGE_KEY = "auth-storage";

export interface User {
    id: number;
    uuid?: string;
    name: string;
    first_name?: string | null;
    last_name?: string | null;
    email: string;
    email_verified_at: string | null;
    avatar_url?: string | null;
    avatar_thumb?: string | null;
    avatar_small?: string | null;
    avatar_medium?: string | null;
    avatar_urls?: {
        original?: string | null;
        thumb?: string | null;
        small?: string | null;
        medium?: string | null;
        large?: string | null;
    };
    onboarding_completed?: boolean;
    created_at: string;
    updated_at: string;
    roles: string[] | Array<{ id: number; name: string; guard: string }> | null;
    can_access_admin?: boolean;
    can_access_manage?: boolean;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isInitializing: boolean;
    isLoading: boolean;
    error: string | null;
}

interface AuthActions {
    login: (user: User, token: string) => void;
    logout: () => void;
    setUser: (user: User) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    updateUser: (user: Partial<User>) => void;
    clearError: () => void;
    initialize: () => void;
}

type AuthStore = AuthState & AuthActions;

const persistedStore = persist(
    immer<AuthStore>((set) => ({
        user: null,
        token: null,
        isAuthenticated: false,
        isInitializing: true,
        isLoading: false,
        error: null,

        login: (user: User, token: string) =>
            set((state) => {
                state.user = user;
                state.token = token;
                state.isAuthenticated = true;
                state.isInitializing = false;
                state.isLoading = false;
                state.error = null;
            }),

        logout: () =>
            set((state) => {
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                state.isInitializing = false;
                state.isLoading = false;
                state.error = null;
            }),

        setUser: (user: User) =>
            set((state) => {
                state.user = user;
            }),

        setLoading: (loading: boolean) =>
            set((state) => {
                state.isLoading = loading;
            }),

        setError: (error: string | null) =>
            set((state) => {
                state.error = error;
                state.isLoading = false;
            }),

        clearError: () =>
            set((state) => {
                state.error = null;
            }),

        updateUser: (userData: Partial<User>) =>
            set((state) => {
                if (state.user) {
                    Object.assign(state.user, userData);
                }
            }),

        initialize: () => {
            set((draft) => {
                draft.isInitializing = false;
            });
        },
    })),
    {
        name: AUTH_STORAGE_KEY,
        partialize: (state) => ({
            user: state.user,
            token: state.token,
            isAuthenticated: state.isAuthenticated,
        }),
        onRehydrateStorage: () => (state) => {
            state?.initialize();
        },
    },
);

export const useAuthStore = create<AuthStore>()(
    (import.meta.env.DEV
        ? devtools(persistedStore, { name: "auth-store" })
        : persistedStore) as any,
);
