import { App as CapApp } from '@capacitor/app'
import { PushNotifications, type Token } from '@capacitor/push-notifications'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'
import { isNativePlatform } from '@/lib/native'

/**
 * Initializes native-only features once the app boots.
 *
 * Safe to call on web — everything is gated behind isNativePlatform() so the
 * browser build is unaffected.
 */
export async function initNativeApp(): Promise<void> {
  if (!isNativePlatform()) return

  // Status bar: match the default (light) theme. TODO: sync with ThemeContext.
  await StatusBar.setStyle({ style: Style.Dark }).catch(() => {})
  await StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {})

  await registerPushNotifications()
  registerDeepLinkListener()

  // Hide the native splash once the React tree has mounted.
  await SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => {})
}

async function registerPushNotifications(): Promise<void> {
  try {
    const permission = await PushNotifications.checkPermissions()
    if (permission.receive === 'prompt') {
      await PushNotifications.requestPermissions()
    }
    await PushNotifications.register()
  } catch (error) {
    // Push requires Firebase (Android) / APNs (iOS) to be configured in the
    // native projects. Fail silently until then.
    console.warn('[native] Push notifications unavailable:', error)
  }

  PushNotifications.addListener('registration', (token: Token) => {
    // TODO: send token.value to the backend to associate this device with the
    // signed-in account (order updates, flash-sale alerts, etc.).
    console.info('[native] Push token:', token.value)
  })

  PushNotifications.addListener('registrationError', (error) => {
    console.error('[native] Push registration error:', error)
  })

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.info('[native] Push received:', notification)
  })
}

function registerDeepLinkListener(): void {
  void CapApp.addListener('appUrlOpen', (data) => {
    // TODO: route to the path in data.url (e.g. /products/<slug>). Requires
    // App Links (Android) / Universal Links (iOS) to be configured.
    console.info('[native] Deep link opened:', data.url)
  })
}
