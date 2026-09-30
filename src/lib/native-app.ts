import { App as CapApp } from '@capacitor/app'
import { PushNotifications, type Token } from '@capacitor/push-notifications'
import { SplashScreen } from '@capacitor/splash-screen'
import { devicesApi } from '@/api/devices'
import { loadChatToken } from '@/lib/chat-token'
import { deepLinkToPath, pushPayloadToPath } from '@/lib/deep-link'
import { isIOS, isNativePlatform } from '@/lib/native'
import { getNativeDeviceId, loadNativeCredentials } from '@/lib/native-auth'
import { configureStatusBarLayout, syncStatusBarForTheme } from '@/lib/native-ui'
import { useAuthStore } from '@/stores/auth'
import { useDeepLinkStore } from '@/stores/deep-link'

/**
 * Native shell bootstrap.
 *
 * Everything is gated behind `isNativePlatform()` so the browser build is
 * unaffected, and every native call is fail-soft: native chrome must never be
 * able to break the storefront.
 */

/**
 * Reads the credentials the device holds before React mounts.
 *
 * The session tokens have to be in place before the auth store's first request
 * (that store re-validates the session on boot), and the chat visitor token
 * before the assistant is opened. A launch deep link is turned into the initial
 * location so the first render already lands on the linked route instead of
 * flashing the home page.
 */
export async function prepareNativeShell(): Promise<void> {
  await Promise.all([loadNativeCredentials(), loadChatToken()])

  if (!isNativePlatform()) return

  try {
    const launch = await CapApp.getLaunchUrl()
    const path = launch?.url ? deepLinkToPath(launch.url) : null
    if (path) window.history.replaceState(null, '', path)
  } catch {
    // No launch URL (most launches) — nothing to do.
  }
}

/** Initializes native-only features once the app boots. */
export async function initNativeApp(): Promise<void> {
  if (!isNativePlatform()) return

  // Match the already-resolved theme, then keep the WebView below the bar.
  const isDark = document.documentElement.classList.contains('dark')
  await syncStatusBarForTheme(isDark)
  await configureStatusBarLayout()

  watchAuthStateForPush()
  await Promise.all([registerPushNotifications(), registerDeepLinkListener()])

  // Hide the native splash once the React tree has mounted.
  await SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => {})
}

// ── Push notifications ──

/** The token the OS issued for this install, once it has been received. */
let pushToken: string | null = null

async function registerPushNotifications(): Promise<void> {
  try {
    const permission = await PushNotifications.checkPermissions()
    const receive =
      permission.receive === 'prompt'
        ? (await PushNotifications.requestPermissions()).receive
        : permission.receive

    if (receive !== 'granted') {
      console.info('[native] Push notifications not granted — skipping registration.')
      return
    }

    // Listen before registering: `registration` is emitted as soon as the
    // provider responds and would otherwise be missed on a fast device.
    await PushNotifications.addListener('registration', (token: Token) => {
      pushToken = token.value
      void syncDeviceToken()
    })

    await PushNotifications.addListener('registrationError', (error) => {
      console.warn('[native] Push registration error:', error)
    })

    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.info('[native] Push received:', notification)
    })

    // Tapping a notification should land on the screen it is about. The sender
    // puts the destination in `data.link`; without one we simply open the app.
    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const path = pushPayloadToPath(action.notification?.data)

      if (!path) {
        console.info('[native] Push opened without an in-app destination.')
        return
      }

      useDeepLinkStore.getState().queue(path)
    })

    await PushNotifications.register()
  } catch (error) {
    // Push requires Firebase (Android) / APNs (iOS) to be configured in the
    // native projects. Fail silently until then.
    console.warn('[native] Push notifications unavailable:', error)
  }
}

/** Attaches this device to the signed-in account, if we have everything. */
async function syncDeviceToken(): Promise<void> {
  if (!pushToken || !useAuthStore.getState().isAuthenticated) return

  try {
    await devicesApi.register({
      token: pushToken,
      platform: isIOS() ? 'ios' : 'android',
      device_id: getNativeDeviceId(),
      app_version: await getAppVersion(),
    })
  } catch (error) {
    console.warn('[native] Could not register this device for push:', error)
  }
}

async function detachDeviceToken(): Promise<void> {
  if (!pushToken) return

  try {
    await devicesApi.unregister(pushToken)
  } catch (error) {
    console.warn('[native] Could not detach this device from push:', error)
  }
}

/**
 * Registers on sign-in and detaches on sign-out, so a shared device never keeps
 * receiving the previous account's order updates.
 */
function watchAuthStateForPush(): void {
  useAuthStore.subscribe((state, previous) => {
    if (state.isAuthenticated === previous.isAuthenticated) return

    if (state.isAuthenticated) void syncDeviceToken()
    else void detachDeviceToken()
  })
}

// ── Device identity ──

let cachedAppVersion: string | null = null
let appVersionLoaded = false

async function getAppVersion(): Promise<string | null> {
  if (appVersionLoaded) return cachedAppVersion
  appVersionLoaded = true

  try {
    cachedAppVersion = (await CapApp.getInfo()).version ?? null
  } catch {
    cachedAppVersion = null
  }

  return cachedAppVersion
}

// ── Deep links ──

async function registerDeepLinkListener(): Promise<void> {
  try {
    await CapApp.addListener('appUrlOpen', (data) => {
      const path = data.url ? deepLinkToPath(data.url) : null

      if (!path) {
        console.info('[native] Ignoring deep link outside the app:', data.url)
        return
      }

      // Consumed by DeepLinkHandler inside the router.
      useDeepLinkStore.getState().queue(path)
    })
  } catch (error) {
    console.warn('[native] Deep link listener unavailable:', error)
  }
}
