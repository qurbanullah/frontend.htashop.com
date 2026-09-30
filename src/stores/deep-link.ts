import { create } from 'zustand'

/**
 * Holds a deep link that arrived before the router was ready to act on it.
 *
 * `appUrlOpen` fires from the native shell, outside React, and a cold start can
 * deliver its launch URL before the first route renders. Queuing the path here
 * lets the handler inside the router consume it once it is mounted.
 */
interface DeepLinkState {
  pendingPath: string | null
  queue: (path: string) => void
  clear: () => void
}

export const useDeepLinkStore = create<DeepLinkState>()((set) => ({
  pendingPath: null,
  queue: (path) => set({ pendingPath: path }),
  clear: () => set({ pendingPath: null }),
}))
