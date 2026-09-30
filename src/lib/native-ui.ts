import { StatusBar, Style } from '@capacitor/status-bar'
import { isNativePlatform } from '@/lib/native'

/**
 * Native chrome that follows the app's light/dark theme.
 *
 * Kept free of any other plugin imports so the theme context can depend on it
 * without pulling the whole native bootstrap into its module graph.
 */

const BACKGROUND = { light: '#f9fafb', dark: '#111827' }

/**
 * Matches the native status bar to the active theme. `Style.Light` means
 * "light content" (for a dark background) and `Style.Dark` "dark content".
 *
 * `setBackgroundColor` is Android-only and rejects on iOS; both calls are
 * swallowed because chrome styling must never break the app.
 */
export async function syncStatusBarForTheme(dark: boolean): Promise<void> {
  if (!isNativePlatform()) return

  await StatusBar.setStyle({ style: dark ? Style.Light : Style.Dark }).catch(() => {})
  await StatusBar.setBackgroundColor({ color: dark ? BACKGROUND.dark : BACKGROUND.light }).catch(
    () => {}
  )
}

/** Lays the WebView out below the status bar rather than underneath it. */
export async function configureStatusBarLayout(): Promise<void> {
  if (!isNativePlatform()) return

  await StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {})
}
