import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The keystore layer that holds device credentials.
 *
 * Three properties matter, and all three are invisible in a browser run:
 *
 * 1. On the web nothing may touch the keystore — the plugin's web implementation
 *    falls back to `localStorage`, which is the one place a bearer token must never
 *    be written.
 * 2. A credential an older build left in the plaintext preferences store is adopted
 *    into the keystore and deleted, so the upgrade does not sign anyone out and
 *    leaves no plaintext residue.
 * 3. An unusable keystore degrades to the plaintext store rather than failing, so a
 *    device that cannot encrypt is not locked out of its own session.
 */

const state = vi.hoisted(() => ({
  isNative: true,
  /** Encrypted vault, as the plugin would hold it. */
  vault: new Map<string, string>(),
  /** Plaintext Capacitor preferences store. */
  prefs: new Map<string, string>(),
  /** Simulates a keystore that cannot be opened or decrypt. */
  broken: false,
  calls: {
    reads: [] as string[],
    writes: [] as string[],
    removals: [] as string[],
    setKeyPrefix: 0,
  },
}))

vi.mock('@/lib/native', () => ({ isNativePlatform: () => state.isNative }))

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: async ({ key }: { key: string }) => ({ value: state.prefs.get(key) ?? null }),
    set: async ({ key, value }: { key: string; value: string }) => {
      state.prefs.set(key, value)
    },
    remove: async ({ key }: { key: string }) => {
      state.prefs.delete(key)
    },
  },
}))

vi.mock('@aparajita/capacitor-secure-storage', () => ({
  SecureStorage: {
    getItem: async (key: string) => {
      state.calls.reads.push(key)
      if (state.broken) throw new Error('keystore unavailable')
      return state.vault.get(key) ?? null
    },
    setItem: async (key: string, value: string) => {
      state.calls.writes.push(key)
      if (state.broken) throw new Error('keystore unavailable')
      state.vault.set(key, value)
    },
    remove: async (key: string) => {
      state.calls.removals.push(key)
      if (state.broken) throw new Error('keystore unavailable')
      return state.vault.delete(key)
    },
    setKeyPrefix: async () => {
      state.calls.setKeyPrefix++
    },
  },
}))

/** The module memoises the resolved backend, so every test needs a fresh copy. */
async function loadModule() {
  vi.resetModules()
  return import('@/lib/native-secure-store')
}

describe('native secret storage', () => {
  beforeEach(() => {
    state.vault.clear()
    state.prefs.clear()
    state.broken = false
    state.calls = { reads: [], writes: [], removals: [], setKeyPrefix: 0 }
    state.isNative = true
  })

  describe('on the web', () => {
    beforeEach(() => {
      state.isNative = false
    })

    it('never reaches for the keystore', async () => {
      const secrets = await loadModule()

      await secrets.writeSecret('hta_access_token', 'access-1')

      expect(await secrets.readSecret('hta_access_token')).toBeNull()

      await secrets.removeSecret('hta_access_token')

      // The plugin's web implementation writes to localStorage, so not even a probe
      // may run here.
      expect(state.calls.reads).toEqual([])
      expect(state.calls.writes).toEqual([])
      expect(state.calls.setKeyPrefix).toBe(0)
      expect(state.vault.size).toBe(0)
      expect(state.prefs.size).toBe(0)
    })
  })

  describe('on a native device', () => {
    it('stores and reads a secret from the keystore, never in plaintext', async () => {
      const secrets = await loadModule()

      await secrets.writeSecret('hta_access_token', 'access-1')

      expect(state.vault.get('hta_access_token')).toBe('access-1')
      expect(state.prefs.has('hta_access_token')).toBe(false)

      expect(await secrets.readSecret('hta_access_token')).toBe('access-1')
    })

    it('migrates a credential an older build left in plaintext', async () => {
      state.prefs.set('hta_refresh_token', 'legacy-refresh')
      const secrets = await loadModule()

      expect(await secrets.readSecret('hta_refresh_token')).toBe('legacy-refresh')

      // Adopted into the keystore, and the plaintext copy is gone.
      expect(state.vault.get('hta_refresh_token')).toBe('legacy-refresh')
      expect(state.prefs.has('hta_refresh_token')).toBe(false)
    })

    it('forgets a secret from both stores', async () => {
      state.vault.set('hta_refresh_token', 'encrypted')
      state.prefs.set('hta_refresh_token', 'plaintext')
      const secrets = await loadModule()

      await secrets.removeSecret('hta_refresh_token')

      expect(state.vault.has('hta_refresh_token')).toBe(false)
      expect(state.prefs.has('hta_refresh_token')).toBe(false)
    })

    it('moves a value that was written before the keystore was reachable', async () => {
      const secrets = await loadModule()

      // First run: the keystore cannot be opened, so the value is held in plaintext.
      state.broken = true
      await secrets.writeSecret('hta_access_token', 'access-1')
      expect(state.prefs.get('hta_access_token')).toBe('access-1')

      // The value is still readable while the keystore is down.
      expect(await secrets.readSecret('hta_access_token')).toBe('access-1')

      // Once the keystore recovers, the plaintext copy is adopted and removed.
      state.broken = false
      expect(await secrets.readSecret('hta_access_token')).toBe('access-1')
      expect(state.vault.get('hta_access_token')).toBe('access-1')
      expect(state.prefs.has('hta_access_token')).toBe(false)
    })

    it('falls back to plaintext when the keystore is unusable', async () => {
      state.broken = true
      const secrets = await loadModule()

      await secrets.writeSecret('hta_access_token', 'access-1')

      expect(state.prefs.get('hta_access_token')).toBe('access-1')
      expect(await secrets.readSecret('hta_access_token')).toBe('access-1')

      // And the fallback is still cleared on sign-out.
      await secrets.removeSecret('hta_access_token')
      expect(state.prefs.has('hta_access_token')).toBe(false)
    })

    it('opens the keystore once while it works, not per call', async () => {
      const secrets = await loadModule()

      await secrets.writeSecret('hta_access_token', 'access-1')
      await secrets.readSecret('hta_refresh_token')
      await secrets.removeSecret('hta_chat_token')
      await secrets.readSecret('hta_access_token')

      // Every read for a key the app never asked about is the one-off probe that
      // decides whether the keystore is usable.
      const credentialKeys = new Set(['hta_access_token', 'hta_refresh_token', 'hta_chat_token'])
      const probeReads = state.calls.reads.filter((key) => !credentialKeys.has(key))

      expect(probeReads).toHaveLength(1)

      // And each operation reached the keystore for its own key.
      expect(state.calls.reads).toContain('hta_refresh_token')
      expect(state.calls.reads).toContain('hta_access_token')
      expect(state.calls.writes).toContain('hta_access_token')
      expect(state.calls.removals).toContain('hta_chat_token')
    })

    it('never changes the key prefix', async () => {
      const secrets = await loadModule()

      await secrets.writeSecret('hta_access_token', 'access-1')
      await secrets.readSecret('hta_access_token')

      // The plugin keeps its prefix in memory only (dist/esm/base.js). A custom one
      // would be lost on the next launch, orphaning every stored credential —
      // silently signing out every device on upgrade.
      expect(state.calls.setKeyPrefix).toBe(0)
    })
  })
})
