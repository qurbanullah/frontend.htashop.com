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

The generated `android/` and `ios/` folders are **committed** to source control, so
native config (icons, splash, permissions, signing) lives with the app. Credential
files stay out of git, and are already listed in `.gitignore`:
`google-services.json`, `GoogleService-Info.plist`, `*.jks`, `*.keystore`, `*.p12`,
`*.p8`.

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

## Authentication on native

The web storefront authenticates with an httpOnly, `SameSite=Lax` cookie. That
works because `htashop.com` and `api.htashop.com` share a *site*.

A native WebView is a different site (`https://localhost` on Android,
`capacitor://localhost` on iOS), so that cookie is never stored or sent — and
relaxing it to `SameSite=None` would make it cross-site for *every* client,
exposing each state-changing API route to CSRF.

Native shells therefore use a **bearer token pair**:

- `src/lib/native-auth.ts` — the access and refresh tokens, held in the OS keystore
  (see *Credential storage*).
- `src/lib/native-secure-store.ts` — the keystore layer, with migration from the
  plaintext store and a fallback when the keystore is unusable.
- `src/api/auth/index.ts` — sends `X-Client: native` on login, so the API includes
  `access_token`/`refresh_token` in the body instead of withholding them, and sends
  `X-Refresh-Token` on refresh.
- `src/api/client.ts` — attaches `Authorization: Bearer …` to every request,
  refreshes once on a 401, replays the request, and ends the session when the
  refresh is rejected.

The full contract — lifetimes, cookie paths, header names, rotation and reuse
detection — is in [`AUTH-TOKENS.md`](./AUTH-TOKENS.md).

The API side needs the native origins in `api/config/cors.php` (`https://localhost`,
`capacitor://localhost`), which is already configured.

**Trade-off:** a token in a WebView is reachable by injected script, unlike an
httpOnly cookie. That surface is much smaller here because the app loads only its
bundled assets from the app sandbox, and the alternative (a cross-site cookie)
would weaken every client. Revoking a device is also possible per token.

## Support assistant on native

The assistant identifies guests by an opaque visitor token. Browsers get it in
the httpOnly `chat_visitor` cookie; native shells hold it in
`src/lib/chat-token.ts` and send `X-Chat-Token`, which
`app/Http/Middleware/EnsureChatVisitor.php` prefers over the cookie.

Without this, every native device hashed an *empty* token onto the same visitor
key and shared one transcript and token budget.

## Push notifications

**Firebase is needed for Android only.** The two platforms use different transports,
which matters when provisioning credentials:

| Platform | Transport | What you provide |
|---|---|---|
| Android | FCM (Firebase Cloud Messaging) | A Firebase project → `google-services.json`. The plugin depends on `com.google.firebase:firebase-messaging`, and FCM is the only transport with broad reach on Google Play devices. |
| iOS | APNs, directly | An APNs auth key (`.p8` + Key ID) and your Team ID. The plugin's podspec depends only on `Capacitor` — **no Firebase on iOS, and no `GoogleService-Info.plist`** (that file is Firebase's iOS config, only needed if you deliberately route iOS through FCM). |

Nothing else in the stack uses Firebase: auth is the Laravel token flow, analytics
are GA4 / Meta / Sentry (consent-gated), search is Typesense.

If you would rather run one sender than two, point iOS at FCM as well — upload the
APNs key to Firebase and send everything through FCM. That trades a Firebase
dependency on iOS for a single API, at the cost of routing Apple's push traffic
through Google.

**The app builds and runs without either.** `app/build.gradle` applies the Google
Services plugin only when `google-services.json` exists, and registration is wrapped
in a try/catch — missing credentials mean push is quietly unavailable, not a broken
build or a crash.

The app registers its FCM/APNs token against the signed-in account
(`POST /api/v1/devices`) and detaches it on sign-out, so a shared device never
keeps receiving the previous account's updates. Sign-out revokes **only that
device's** token, so signing out on a phone leaves other devices signed in.

The backend send path is not built yet (see *Remaining native setup*).

To make a notification open a specific screen, include a destination in the
payload's `data`:

```json
{ "data": { "link": "/account/orders/9f2c…" } }
```

`data.link` may be an in-app path or any deep link (`htashop://products/slug`,
`https://htashop.com/blogs/hello`); `data.url` and `data.path` are also accepted.
Anything the app does not own is ignored and the app simply opens.

## What's wired up already

- `src/lib/native.ts` — `isNativePlatform()`, `isAndroid()`, `isIOS()`
- `src/lib/native-app.ts` — boot sequence: device credentials, status bar,
  splash hide, push registration and deep-link listeners (all native-only)
- `src/lib/native-auth.ts` / `src/lib/native-secure-store.ts` / `src/lib/chat-token.ts`
  / `src/lib/native-store.ts` — device-held bearer, session and visitor tokens, and
  the install id
- `src/lib/native-ui.ts` — status bar style/background kept in step with the theme
- `src/lib/deep-link.ts` — URI → router-path mapping (unit-tested), plus
  `stores/deep-link.ts` + `components/shared/DeepLinkHandler.tsx` to route links
- `src/api/devices` — registers this device's push token against the signed-in
  account and detaches it on sign-out
- `capacitor.config.json` — app id/name, `webDir`, `androidScheme`, splash + push config
- `assets/` + `scripts/render-brand-assets.mjs` — launcher icon and splash sources;
  `npm run assets:generate` regenerates every density (see *Launcher icons and splash*)
- `android/app/src/main/AndroidManifest.xml` — `htashop://` scheme filter, the
  Android 13+ `POST_NOTIFICATIONS` permission, and backup rules that keep the
  credential store out of cloud backups
- `ios/App/App/Info.plist` — the `htashop` URL scheme
- `api/config/mobile_links.php` + `WellKnownController` — the App Links /
  Universal Links association files, generated from environment variables

## Credential storage

Bearer credentials are held in the **OS keystore**, never as plaintext:

| Value | Store |
|---|---|
| `hta_access_token`, `hta_refresh_token` | Keychain on iOS; AES-encrypted, Android Keystore-backed on Android |
| `hta_chat_token` | the same — it is a bearer token for that visitor's transcript |
| `hta_device_id` | Capacitor Preferences (SharedPreferences / NSUserDefaults) — an install id, not a secret |

`src/lib/native-secure-store.ts` sits between the app and
`@aparajita/capacitor-secure-storage`:

- **Android** — each value is encrypted with AES/GCM under a per-key AES key held in
  the `AndroidKeyStore` (hardware-backed where the device supports it) and not
  exportable. Only the ciphertext and its IV are written to the app's
  `SharedPreferences` file, so a copy of that file is useless off-device.
- **iOS** — the value is a Keychain item.

The module is fail-soft by design, because being unable to encrypt must never lock a
signed-in user out:

- **Migration.** An install that still holds a credential in the plaintext
  preferences store from an earlier build adopts it into the keystore and deletes the
  plaintext copy, so upgrading does not sign anyone out and leaves no residue. Writes
  and deletes clear the plaintext copy too.
- **Fallback.** If the keystore cannot be opened — an OS update reset it, an entry
  will not decrypt, the plugin is missing from the native project — values fall back
  to the preferences store, which is the behaviour shipped before the keystore. A
  failure is deliberately *not* remembered: the next operation retries the keystore,
  which is what lets a credential written during a temporary outage move into it
  afterwards.
- **No custom key prefix.** The plugin keeps its key prefix in memory only, so
  calling `setKeyPrefix()` would orphan every stored credential on the next launch and
  silently sign every device out. `src/lib/native-secure-store.test.ts` pins this.

The Android vhost also excludes the preferences file from cloud backups and
device-to-device transfer (`android/app/src/main/res/xml/backup_rules.xml` and
`data_extraction_rules.xml`). It now only holds the install id, but excluding it
remains correct — a restored device simply asks the user to sign in again.

> **Wiring matters.** A plugin only exists on-device once it is registered in the
> native projects. `android/capacitor.settings.gradle`,
> `android/app/capacitor.build.gradle` and `ios/App/Podfile` are generated from
> `package.json`, so run `npm run cap:sync` after changing dependencies. A plugin that
> is installed but not registered fails at runtime — and this module's fallback turns
> that failure into *plaintext* storage rather than a visible error.

## App Links / Universal Links

The in-app routing is implemented (`src/lib/deep-link.ts`), and the two
association files are generated by the API from environment variables — so
completing the setup needs no hand-written JSON:

| Variable | Meaning |
|---|---|
| `MOBILE_ANDROID_PACKAGE` | App id (defaults to `com.htasol.htashop`) |
| `MOBILE_ANDROID_SHA256` | Signing certificate SHA-256 fingerprints, comma-separated (release, and Play App Signing if used) |
| `MOBILE_IOS_TEAM_ID` | Apple Developer Team ID |
| `MOBILE_IOS_BUNDLE_ID` | Bundle id (defaults to `com.htasol.htashop`) |

They are served from the site root (proxied by the storefront nginx) at
`/.well-known/assetlinks.json` and `/.well-known/apple-app-site-association`.
Until the variables are set both endpoints answer **404** — an absent file fails
verification cleanly, whereas a partial one can be cached and is hard to
diagnose.

Get the fingerprints with:

```bash
keytool -list -v -keystore <your-keystore> -alias <your-alias> | grep SHA256
```

### Enabling it

Both sides are prepared; enabling is one setting each:

| Step | Where | What |
|---|---|---|
| 1. Android claims the host | `android/gradle.properties` | `appLinkHost=htashop.com` (empty = off) |
| 2. iOS capability | Xcode → Signing & Capabilities | Add **Associated Domains**: `applinks:htashop.com` and `applinks:www.htashop.com` |

While `appLinkHost` is unset, the App Links `intent-filter` points at a reserved,
non-resolving host, so it matches nothing: Android neither opens links nor shows a
disambiguation chooser. That is deliberate — claiming a host Android cannot verify
is worse than not claiming it, which is why the filter is gated rather than merely
commented out. `www.<appLinkHost>` is claimed automatically.

The host list has to agree in three places:

- `android/gradle.properties` → `appLinkHost`
- the iOS Associated Domains capability
- `WEB_HOSTS` in `src/lib/deep-link.ts` (in-app routing)

`/.well-known/` is exempt from the `www` → apex collapse in
`deploy/config/haproxy.cfg`: the Android verifier does not follow a redirect, so a
`www` host that 301s can never verify. Everything else on `www` still collapses.

Check it once enabled:

```bash
curl -s  https://htashop.com/.well-known/assetlinks.json | jq
curl -s  https://htashop.com/.well-known/apple-app-site-association | jq
curl -sI https://www.htashop.com/.well-known/assetlinks.json   # 200, not a 301
```

**Known limitation.** Both files are served through Laravel's `web` middleware group,
so they carry a session cookie and an `XSRF-TOKEN` cookie. That does not affect
verification, but every verifier or crawler hit creates a session file. Serving them
statelessly means letting `app/Http/Middleware/SetLocale.php` run without a session —
it is global middleware and currently calls `Session::put()` unconditionally — which
is a wider change than it is worth on its own.

## Launcher icons and splash

The native projects ship branded assets generated from the brand mark
(`public/logo-green.svg`):

```bash
npm run assets:generate     # render sources → generate for iOS + Android
```

Three steps, all in `scripts/` and committed so the icons are reproducible rather
than hand-edited binaries:

1. **`render-brand-assets.mjs`** — renders `assets/icon-only.png`,
   `icon-foreground.png`, `icon-background.png` and `splash.png` with `sharp`. The
   mark is inset on purpose: it fills its own canvas almost edge-to-edge, which the
   iOS corner mask and the Android adaptive mask would crop.
2. **`capacitor-assets generate --ios --android`** — writes every density. Naming
   both platforms keeps the tool away from `public/manifest.json`, which is
   hand-written.
3. **`normalize-adaptive-icon.mjs`** — the generator insets *both* adaptive-icon
   layers by 16.7%. That is only correct if the launcher's mask crops to the safe
   zone, so the background is made full-bleed (correct either way) and only the
   foreground keeps the inset.

Worth knowing:

- **Palette.** The tile and splash background is `#111827`, matching
  `capacitor.config.json` → `SplashScreen.backgroundColor` and the PWA
  `theme_color`. Change `BRAND_BACKGROUND` in `render-brand-assets.mjs` to rebrand.
- **No alpha in opaque layers.** App Store Connect rejects an app icon that
  "contains an alpha channel", so the icon, background and splash layers are
  written as 3-channel PNGs; only the adaptive foreground keeps transparency.
- **Generated scaffolding is not cleaned up by the tool.** The default
  `drawable/ic_launcher_background.xml`, `drawable-v24/ic_launcher_foreground.xml`
  and the `#FFFFFF` `values/ic_launcher_background.xml` were removed once the
  generator stopped referencing them.
- **Check on a device after changing these.** Launcher masks differ, and the
  adaptive icon is composited by the OS rather than by anything we can test here.
- iOS uses the modern single-size `AppIcon.appiconset` entry (Xcode 14+ derives the
  rest), and `Splash.imageset` keeps Capacitor's three `Default@*x` files.

## Remaining native setup (needs credentials only you have)

1. **Push delivery** — Android needs a Firebase project (`google-services.json`);
   iOS needs an APNs auth key (`.p8` + Key ID, same Team ID as App Links) and **no
   Firebase at all**. The app already registers its token with `POST /api/v1/devices`
   and routes a tap via `data.link`; the backend send path is the next step.
2. **App Links / Universal Links** — set the environment variables above and follow
   *Enabling it*: one Gradle property on Android, the Associated Domains capability
   on iOS. The endpoints, the nginx/HAProxy routing and the in-app routing are done.

## Reuse for another project (dhapage.com, …)

Edit `capacitor.config.json` and swap:

- `appId` (e.g. `com.htasol.dhapage`)
- `appName` (e.g. `Dhapage`)

then run `npm run cap:sync`. Also swap the launcher icon / splash image in the
native projects (`android/app/src/main/res/…` and `ios/App/App/Assets.xcassets/…`),
and the URL scheme in both native manifests plus `DEEP_LINK_SCHEME` in
`src/lib/deep-link.ts`.
