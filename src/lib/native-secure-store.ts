import { isNativePlatform } from '@/lib/native'
import { readStored, removeStored, writeStored } from '@/lib/native-store'

/**
 * Secret device storage.
 *
 * Bearer credentials — the session pair and the assistant's visitor token — are
 * kept in the OS keystore (Keychain on iOS, a Keystore-backed cipher on Android)
 * rather than in the plaintext preferences store, so a device backup, a filesystem
 * dump or a rooted device does not hand over a ready-to-use session.
 *
 * Every operation is fail-soft, because being unable to encrypt must never lock a
 * signed-in user out:
 *
 * - **Web** — a no-op. The storefront's session lives in httpOnly cookies, and this
 *   plugin's web implementation would otherwise write to `localStorage`, which is
 *   the one place a bearer token must never go.
 * - **Native, keystore usable** — values are read and written encrypted.
 * - **Native, keystore unusable** — values fall back to the preferences store, i.e.
 *   the behaviour shipped before the keystore existed (and those keys are already
 *   excluded from Android cloud backups by the vhost rules).
 *
 * Reads also migrate: a value an older build left in the plaintext store is adopted
 * into the keystore and deleted there. Writes and deletes always clear the
 * plaintext copy too, so no residue is left behind.
 */

/** String-shaped view of the keystore, matching the preferences store's shape. */
interface SecretBackend {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  remove(key: string): Promise<void>
}

/** Never written and never read for its value — only to prove the keystore answers. */
const PROBE_KEY = 'hta_keystore_probe'

/** Resolved once per app run; `null` means "no keystore, use the fallback". */
let backendPromise: Promise<SecretBackend | null> | null = null

/**
 * The open keystore, or `null` when there is none.
 *
 * A *failure* is deliberately not remembered. A keystore that is briefly
 * unavailable — still initialising at cold boot, or a transient OS error — must be
 * retried on the next call, or the whole run would sit on the plaintext store and
 * a token written during that window would never be migrated.
 */
async function backend(): Promise<SecretBackend | null> {
  backendPromise ??= openBackend()

  const store = await backendPromise

  if (store === null) {
    backendPromise = null
  }

  return store
}

async function openBackend(): Promise<SecretBackend | null> {
  if (!isNativePlatform()) return null

  try {
    // Imported lazily: the plugin has no business in the web bundle, and its web
    // implementation quietly writes to localStorage.
    const { SecureStorage } = await import('@aparajita/capacitor-secure-storage')

    // Read-only probe. A keystore can be unusable for reasons that only surface on
    // use: the plugin was never synced into the native project, an OS update reset
    // the Keystore, an entry will not decrypt. Failing here, once, sends every later
    // call to the fallback instead of silently dropping a credential.
    await SecureStorage.getItem(PROBE_KEY)

    return {
      get: (key) => SecureStorage.getItem(key),
      set: (key, value) => SecureStorage.setItem(key, value),
      remove: async (key) => {
        await SecureStorage.remove(key)
      },
    }
  } catch {
    return null
  }
}

/** Reads a secret, adopting a value an older build left in the plaintext store. */
export async function readSecret(key: string): Promise<string | null> {
  if (!isNativePlatform()) return null

  const store = await backend()

  if (store) {
    try {
      const value = await store.get(key)

      if (value) {
        // A value that has moved must not also survive as plaintext.
        await removeStored(key)
        return value
      }
    } catch {
      // Unreadable entry — fall through and try the plaintext store.
    }
  }

  const plaintext = await readStored(key)

  if (plaintext && store) {
    try {
      await store.set(key, plaintext)
      await removeStored(key)
    } catch {
      // Return what we found: failing to migrate must not sign the user out.
    }
  }

  return plaintext
}

/** Stores a secret, preferring the keystore. */
export async function writeSecret(key: string, value: string): Promise<void> {
  if (!isNativePlatform()) return

  const store = await backend()

  if (store) {
    try {
      await store.set(key, value)
      await removeStored(key)
      return
    } catch {
      // Fall through. A credential that cannot be encrypted is still better kept
      // than lost, and the caller holds its own in-memory copy either way.
    }
  }

  await writeStored(key, value)
}

/** Forgets a secret, in both stores. */
export async function removeSecret(key: string): Promise<void> {
  if (!isNativePlatform()) return

  const store = await backend()

  if (store) {
    try {
      await store.remove(key)
    } catch {
      // Nothing stored, or the keystore is unreadable — the plaintext sweep below
      // still has to run.
    }
  }

  await removeStored(key)
}
