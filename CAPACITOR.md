# Capacitor (Android + iOS) — HTAShop Storefront

This project wraps the existing React/Vite storefront (`webDir: dist`) into
native Android and iOS shells using Capacitor. One codebase → web + both stores.

## Prerequisites

- Node 22+ (already required by the frontend)
- Android: Android Studio + Android SDK (API 34+) and an emulator or device
- iOS: a Mac with Xcode 15+ (required to build/sign iOS)

## One-time setup

```bash
npm install

# Generate the native projects (already done for this repo):
npm run cap:add:android
npm run cap:add:ios      # on a Mac

# Copy the built web assets + sync plugin config:
npm run cap:sync
```

The generated `android/` and `ios/` folders are **committed** to source control
so native config (icons, splash, permissions, Firebase) lives with the app.
Keep `google-services.json` / `GoogleService-Info.plist` and any keystores out
of git (add them to `.gitignore`).

## Local development (live reload)

Run the web dev server, then temporarily point Capacitor at it instead of the
bundled `dist/`. Edit `capacitor.config.json`:

```jsonc
"server": {
  "androidScheme": "https",
  "url": "http://10.0.2.2:23050",   // Android emulator → host localhost
  "cleartext": true
}
```

Then:

```bash
npm run dev                      # the Vite server on :23050
npm run cap:run:android          # or open android/ in Android Studio → Run
```

For a physical Android device, use your LAN IP instead (`http://192.168.1.10:23050`).
For iOS: `npm run cap:open:ios` → Xcode → run on simulator.

> Revert `server.url`/`cleartext` before committing — production ships the
> bundled `dist/` only.

## Production build (bundled assets)

The app ships the built `dist/` files (not a remote URL), so it loads instantly
and passes Apple's Guideline 4.2 more easily.

```bash
# 1. Build the web app for production (uses .env.production)
npm run build

# 2. Copy the build + sync plugin config into android/ and ios/
npm run cap:sync

# 3. Build/sign in Android Studio / Xcode
npm run cap:open:android
npm run cap:open:ios
```

> The API base URL (`VITE_API_URL`) is baked in at build time from
> `.env.production`, so the bundled app talks to `https://api.htashop.com`.

## Reuse for another project (dhapage.com, …)

Edit `capacitor.config.json` and swap:

- `appId` (e.g. `com.avouchsolutions.dhapage`)
- `appName` (e.g. `Dhapage`)

then run `npm run cap:sync`. Also swap the launcher icon / splash image in the
native projects (`android/app/src/main/res/…` and `ios/App/App/Assets.xcassets/…`).

## What's wired up already

- `src/lib/native.ts` — `isNativePlatform()`, `isAndroid()`, `isIOS()`
- `src/lib/native-app.ts` — status bar, splash hide, push-notification and
  deep-link listeners (guarded to run only on native)
- `capacitor.config.json` — app id/name, `webDir`, `androidScheme`, splash + push config
- `src/main.tsx` — calls `initNativeApp()` and hides the native splash after mount

## TODO (native value for store approval + engagement)

1. **Push notifications** — add `google-services.json` (Android) and configure
   APNs (iOS) + Firebase; then send the `registration` token to the Laravel
   backend and fire events via FCM.
2. **Deep links** — add App Links (`android/app/src/main/AndroidManifest.xml`
   intent-filter + `.well-known/assetlinks.json`) and Universal Links
   (`associated-domains` entitlement + `apple-app-site-association`), then route
   `appUrlOpen` to the matching React Router path.
3. **Splash / launcher icons** — replace the default Capacitor assets with
   branded HTAShop/Dhapage icons.
4. **Status bar ↔ theme** — sync `StatusBar.setStyle` with `ThemeContext`.
