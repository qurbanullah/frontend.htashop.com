import { isNativePlatform } from '@/lib/native'
import { readSecret, writeSecret } from '@/lib/native-secure-store'

/**
 * The visitor identity the support assistant threads a conversation onto.
 *
 * The API issues an httpOnly, SameSite=Lax `chat_visitor` cookie on first
 * contact and only ever persists a hash of it. That cookie is same-site for the
 * web storefront, so this module stays out of the way there and returns null.
 *
 * A native WebView is cross-site, so the cookie is never stored — without a
 * fallback every device would hash an empty token onto the *same* visitor key,
 * which would leak one visitor's transcript and token budget to all the others.
 * Native shells therefore hold the token here and send it as `X-Chat-Token`.
 *
 * The token is a bearer credential for that visitor's transcript, so it is held in
 * the OS keystore (lib/native-secure-store.ts) alongside the session tokens.
 */

const TOKEN_KEY = 'hta_chat_token'

/** Must match the shape the API accepts for a visitor token. */
const TOKEN_PATTERN = /^[a-f0-9]{64}$/

let cached: string | null = null
let loaded = false

function randomToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/** Header value for assistant requests; null on the web (the cookie carries it). */
export function getChatToken(): string | null {
  if (!isNativePlatform()) return null
  return cached
}

/** Restores — or mints — the native visitor token. No-op on the web. */
export async function loadChatToken(): Promise<string | null> {
  if (loaded) return cached
  loaded = true

  if (!isNativePlatform()) return null

  const stored = await readSecret(TOKEN_KEY)
  cached = stored && TOKEN_PATTERN.test(stored) ? stored : randomToken()

  if (cached !== stored) await writeSecret(TOKEN_KEY, cached)

  return cached
}
