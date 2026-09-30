import { Preferences } from '@capacitor/preferences'
import { isNativePlatform } from '@/lib/native'

/**
 * Thin, fail-soft wrapper over the Capacitor preferences store.
 *
 * Everything is a no-op on the web, so callers can stay platform-agnostic.
 * Storage failures must never break the app: a device with an unreadable store
 * simply behaves like a signed-out visitor.
 */

export async function readStored(key: string): Promise<string | null> {
  if (!isNativePlatform()) return null

  try {
    const { value } = await Preferences.get({ key })
    return value || null
  } catch {
    return null
  }
}

export async function writeStored(key: string, value: string): Promise<void> {
  if (!isNativePlatform()) return

  try {
    await Preferences.set({ key, value })
  } catch {
    // The caller keeps its in-memory copy; the value just won't survive a restart.
  }
}

export async function removeStored(key: string): Promise<void> {
  if (!isNativePlatform()) return

  try {
    await Preferences.remove({ key })
  } catch {
    // Nothing to clear.
  }
}
