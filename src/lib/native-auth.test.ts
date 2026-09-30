import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The native credential stores only do anything when Capacitor reports a native
 * platform, which a browser test run never does. Forcing that flag is the only
 * way to cover the session-token path outside a real device.
 */
const native = vi.hoisted(() => ({ isNative: true }))

const deviceStore = vi.hoisted(() => new Map<string, string>())

/** Credentials live in the keystore; only the install id uses plaintext preferences. */
const secretStore = vi.hoisted(() => new Map<string, string>())

vi.mock('@/lib/native', () => ({
  isNativePlatform: () => native.isNative,
  isAndroid: () => native.isNative,
  isIOS: () => false,
}))

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: async ({ key }: { key: string }) => ({ value: deviceStore.get(key) ?? null }),
    set: async ({ key, value }: { key: string; value: string }) => {
      deviceStore.set(key, value)
    },
    remove: async ({ key }: { key: string }) => {
      deviceStore.delete(key)
    },
  },
}))

vi.mock('@aparajita/capacitor-secure-storage', () => ({
  SecureStorage: {
    getItem: async (key: string) => secretStore.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      secretStore.set(key, value)
    },
    remove: async (key: string) => secretStore.delete(key),
  },
}))

/** Modules memoise the tokens, so each test needs a fresh copy. */
async function loadModule() {
  vi.resetModules()
  return import('@/lib/native-auth')
}

describe('native credential stores', () => {
  beforeEach(() => {
    deviceStore.clear()
    secretStore.clear()
    native.isNative = true
  })

  describe('on a native device', () => {
    it('persists and restores both tokens', async () => {
      const first = await loadModule()

      await first.saveNativeCredentials({ accessToken: 'access-1', refreshToken: 'refresh-1' })

      expect(first.getNativeToken()).toBe('access-1')
      expect(first.getNativeRefreshToken()).toBe('refresh-1')
      expect(secretStore.get('hta_access_token')).toBe('access-1')
      expect(secretStore.get('hta_refresh_token')).toBe('refresh-1')
      // Credentials must never be left in the plaintext preferences file.
      expect(deviceStore.has('hta_access_token')).toBe(false)
      expect(deviceStore.has('hta_refresh_token')).toBe(false)

      // A fresh module instance must read them back off the device.
      const second = await loadModule()
      await second.loadNativeCredentials()

      expect(second.getNativeToken()).toBe('access-1')
      expect(second.getNativeRefreshToken()).toBe('refresh-1')
    })

    it('replaces both tokens on a refresh', async () => {
      const auth = await loadModule()

      await auth.saveNativeCredentials({ accessToken: 'access-1', refreshToken: 'refresh-1' })
      await auth.saveNativeCredentials({ accessToken: 'access-2', refreshToken: 'refresh-2' })

      expect(auth.getNativeToken()).toBe('access-2')
      expect(auth.getNativeRefreshToken()).toBe('refresh-2')
      expect(secretStore.get('hta_refresh_token')).toBe('refresh-2')
    })

    it('leaves an omitted token alone', async () => {
      const auth = await loadModule()

      await auth.saveNativeCredentials({ accessToken: 'access-1', refreshToken: 'refresh-1' })
      // Rotation responses always carry both, but an omitted value must never be
      // mistaken for "clear this one".
      await auth.saveNativeCredentials({ accessToken: 'access-2' })

      expect(auth.getNativeToken()).toBe('access-2')
      expect(auth.getNativeRefreshToken()).toBe('refresh-1')
    })

    it('clears both tokens from memory and the device', async () => {
      const auth = await loadModule()

      await auth.saveNativeCredentials({ accessToken: 'access-1', refreshToken: 'refresh-1' })
      await auth.clearNativeCredentials()

      expect(auth.getNativeToken()).toBeNull()
      expect(auth.getNativeRefreshToken()).toBeNull()
      expect(secretStore.has('hta_access_token')).toBe(false)
      expect(secretStore.has('hta_refresh_token')).toBe(false)
      expect(deviceStore.has('hta_access_token')).toBe(false)
      expect(deviceStore.has('hta_refresh_token')).toBe(false)
    })

    it('issues a stable install id', async () => {
      const first = await loadModule()
      await first.loadNativeCredentials()

      const deviceId = first.getNativeDeviceId()

      expect(deviceId).toBeTruthy()
      expect(deviceStore.get('hta_device_id')).toBe(deviceId)

      // The id must survive a restart, otherwise the API cannot group a device's
      // sessions.
      const second = await loadModule()
      await second.loadNativeCredentials()

      expect(second.getNativeDeviceId()).toBe(deviceId)
    })

    it('generates a distinct install id for a reinstall', async () => {
      const auth = await loadModule()
      await auth.loadNativeCredentials()
      const deviceId = auth.getNativeDeviceId()

      deviceStore.clear()

      const reinstalled = await loadModule()
      await reinstalled.loadNativeCredentials()

      expect(reinstalled.getNativeDeviceId()).not.toBe(deviceId)
    })
  })

  describe('on the web', () => {
    beforeEach(() => {
      native.isNative = false
    })

    it('never stores or returns session tokens', async () => {
      const auth = await loadModule()

      await auth.saveNativeCredentials({ accessToken: 'access-1', refreshToken: 'refresh-1' })

      expect(auth.getNativeToken()).toBeNull()
      expect(auth.getNativeRefreshToken()).toBeNull()
      expect(deviceStore.size).toBe(0)
      expect(secretStore.size).toBe(0)
    })

    it('reports no device id, leaving the request header off', async () => {
      const auth = await loadModule()
      await auth.loadNativeCredentials()

      expect(auth.getNativeDeviceId()).toBeNull()
      expect(deviceStore.size).toBe(0)
      expect(secretStore.size).toBe(0)
    })
  })
})
