/**
 * Centralized auth token access — reads from Zustand store
 * with localStorage fallback for hydration edge cases.
 */
import { useAuthStore } from "@/stores/auth";

export function getAuthToken(): string | null {
  const store = useAuthStore.getState();
  if (store.token) return store.token;

  // Fallback during Zustand persist hydration
  try {
    const raw = localStorage.getItem("auth-storage");
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.state?.token || null;
    }
  } catch { /* ignore */ }

  return null;
}

export function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
