# Session tokens — HTAShop storefront

How the storefront stays signed in, on the web and in the native shells. This is
the contract between `frontend/` and the auth endpoints in `api/`; the backend
implementation lives in `api/app/Services/Auth/RefreshTokenService.php`.

Related: [`CAPACITOR.md`](./CAPACITOR.md) for the native build, and
`api/AGENTS.md` for API layering conventions.

## One session, two transports

The API issues the same credential pair to every client, but delivers it two ways:

| Client | Delivered as | Why |
|---|---|---|
| Web storefront | httpOnly cookies | `htashop.com` and `api.htashop.com` share a *site*, so a `SameSite=Lax` cookie is both stored and sent. No script can read it. |
| Native shells | `access_token` / `refresh_token` in the response body, held on the device | A WebView is its own site (`https://localhost` on Android, `capacitor://localhost` on iOS), so the cookie is never stored. Relaxing it to `SameSite=None` would make every state-changing route cross-site for *all* clients and expose them to CSRF. |

The client declares itself on every auth request with `X-Client`:

- `X-Client: storefront` → the API **withholds** both tokens from the body and sets the cookies.
- `X-Client: native` → the API returns both tokens in the body and sets no cookies.

## Lifetimes

Values come from `api/config/auth_tokens.php`, overridable by environment.

| Credential | Lifetime | Env var | Notes |
|---|---|---|---|
| Access token | 1 hour | `AUTH_ACCESS_TTL` | Sent on every request, so a leak should expire quickly. |
| Refresh token | 30 days absolute | `AUTH_REFRESH_TTL` | The session's real credential. |
| Refresh token, idle | 14 days | `AUTH_REFRESH_IDLE_TTL` | A device that stops refreshing is signed out before its absolute expiry. |
| Revoked/expired rows | 30 days retention | `AUTH_REFRESH_PRUNE_AFTER` | Kept for audit, then pruned. |

**Rotation:** refresh tokens are single-use. Every successful refresh returns a
new pair and marks the presented token `rotated`, linked to its successor
(`replaced_by_id`) within the same `family_id`.

## Cookies (web)

| Cookie | Path | Lifetime | Flags |
|---|---|---|---|
| `hta_access_token` | `/` | 1 hour | httpOnly, `Secure` outside local/testing, `SameSite=Lax`, host-only |
| `hta_refresh_token` | `/api/v1/refresh` | Until absolute expiry | httpOnly, `Secure` outside local/testing, `SameSite=Lax`, host-only |

The refresh cookie is **path-scoped to the refresh endpoint** so the long-lived
credential is never attached to any other request. A consequence worth knowing
when debugging: reading cookies filtered by URL will not show it — query the jar
without a path filter.

Both cookies are cleared on logout, and on any refresh failure.

## Headers (native)

| Header | Sent on | Purpose |
|---|---|---|
| `Authorization: Bearer <access>` | every request | Replaces the access cookie. Applied centrally in `src/api/client.ts` so no call site can forget it. |
| `X-Client: native` | login, refresh, logout | Asks for the tokens in the body. |
| `X-Device-Id` | login, refresh, logout | Install-scoped id; lets the API group and audit a device's sessions. |
| `X-Refresh-Token` | refresh only | Replaces the path-scoped refresh cookie. |

## Endpoint contract

### `POST /api/v1/login`

```jsonc
// request
{ "email": "…", "password": "…", "turnstileToken": "…" }   // + X-Client header

// 200 — native
{ "success": true, "message": "…", "data": {
    "user": { … },
    "access_token": "…", "refresh_token": "…",
    "token_type": "Bearer",
    "expires_in": 3600,             // seconds, access token
    "refresh_expires_in": 2592000   // seconds, refresh token
} }

// 200 — storefront: the same envelope with access_token/refresh_token removed,
// plus the two Set-Cookie headers.
```

Login and register are guarded by Cloudflare Turnstile (`turnstileToken`), not by
a route throttle.

### `POST /api/v1/refresh` — `throttle:60,1`

Unauthenticated by necessity: the refresh token *is* the credential. The token is
read from, in order:

1. `X-Refresh-Token` header (native)
2. `refresh_token` body field
3. `hta_refresh_token` cookie (web)

```jsonc
// 200 — same shape as login, and the rotation result:
{ "success": true, "message": "Token refreshed", "data": {
    "access_token": "…",            // new
    "refresh_token": "…",           // new — the presented one is now dead
    "expires_in": 3600,
    "refresh_expires_in": 2592000,
    "token_type": "Bearer"
} }
```

A storefront caller gets the tokens as cookies only. Every refresh failure
answers **401** with the same envelope plus a `code`, clears both cookies, and
logs `Refresh token rejected` with the reason and IP:

| `code` | Meaning |
|---|---|
| `refresh_token_missing` | No token in any of the three places. |
| `refresh_token_invalid` | Unknown token. |
| `refresh_token_expired` | Past absolute expiry. |
| `refresh_token_idle_expired` | Past the idle window. |
| `refresh_token_revoked` | Logged out, password changed, account deactivated, or revoked by an admin. |
| `refresh_token_reused` | A superseded token was presented — see below. |

### `POST /api/v1/logout` — requires auth

401s when the caller is not authenticated; otherwise revokes the access token and
the refresh lineage it belongs to, then clears both cookies. A rejected logout is
not an error the UI reports — `authApi.logout()` still drops the device's tokens.

### Authenticated requests

`auth.api` answers 401 with `code: "unauthenticated"` (no credentials) or
`code: "invalid_token"` (a token that failed to authenticate).

## Theft detection

Because tokens rotate, a replayed token is a signal, not just an error. When a
`rotated` token is presented again, the service distinguishes two cases:

- **Lost response** — the successor exists and was **never used**. The original
  refresh succeeded but its response never reached the device. The orphaned
  successor is revoked and the session continues in the same family.
- **Reuse detected** — the successor **was used**. Someone else holds the chain,
  so the *whole family* and all its access tokens are revoked, and the caller gets
  `refresh_token_reused`.

This is why concurrent refreshes are dangerous. Two racing rotations present the
same token twice, which looks exactly like theft — so the client must coordinate
(see below).

## Client behaviour (`src/api/client.ts`)

On a 401 from any endpoint other than the auth endpoints themselves:

1. **Single-flight refresh.** One in-flight `refreshSession()` promise is shared
   by every concurrent 401, so a burst of failures produces exactly one rotation.
2. **Replay once.** The failed request is replayed with the new credentials
   passed explicitly in a rebuilt `Request` — ky sends a replacement request
   verbatim and does not re-run `beforeRequest`, so the header must be set there.
   The body is preserved (ky hands the hook a pristine clone).
3. **One retry, never more.** A second 401 after a successful refresh returns to
   the caller; re-refreshing would loop.
4. **End the session** when the refresh itself fails: drop the device tokens, call
   `useAuthStore.logout()`, and clear the React Query cache so the next visitor on
   that device cannot read the signed-out session's data.

Endpoints that answer 401 as a *normal* outcome are never auto-refreshed
(`login`, `logout`, `refresh`, `register`, `check-account`, `forgot-password`,
`reset-password`, `verify-email`, `resend-verification-email`) — refreshing on
them would mask a bad password or loop.

A 401 is only retried when the client believes it has a session worth refreshing
(`isAuthenticated` from the persisted store, or a device-held refresh token). A
first-time visitor therefore never triggers a refresh.

## Where the credentials live on a device

| Value | Store | Rationale |
|---|---|---|
| `hta_access_token`, `hta_refresh_token` | OS keystore — Keychain on iOS, AES/GCM ciphertext under an `AndroidKeyStore` key on Android | These are bearer credentials; plaintext on disk would make a backup, a rooted device, or a filesystem dump a full account takeover. |
| `hta_chat_token` | OS keystore | Bearer credential for the support assistant; possession grants access to that visitor's transcript. |
| `hta_device_id` | Capacitor Preferences (`SharedPreferences` / `NSUserDefaults`) | Not a secret — it is sent as a header and identifies an install, not a session. |

`src/lib/native-secure-store.ts` prefers the keystore and falls back to
Preferences if it is unavailable, so an unreadable keystore degrades to the
previous behaviour instead of locking the user out. Reads migrate a value left in
Preferences by an older build, and writes and deletes always clear the plaintext
copy so no residue is left behind. See `CAPACITOR.md` → *Credential storage*.

## Abuse controls

| Control | Where |
|---|---|
| `throttle:60,1` on `/refresh` | Per IP. Generous on purpose: a shared NAT is one IP, and a client refreshes roughly hourly. A client-side bug that loops would hit this instead of the database. |
| Cloudflare Turnstile | Login, register, and account-existence checks. |
| Rotation + family revocation | Bounds a stolen token to a single use before the whole family dies. |
| `auth:prune-refresh-tokens` | Daily 03:45 (`api/routes/console.php`) — drops rows past retention so reuse-detection lookups stay small. |

## Code map

| Concern | File |
|---|---|
| Token lifetimes, cookie names/paths | `api/config/auth_tokens.php` |
| Rotation, reuse detection, revocation | `api/app/Services/Auth/RefreshTokenService.php` |
| Single-op actions | `api/app/Actions/Auth/` |
| Endpoints, cookies, `X-Refresh-Token` parsing | `api/app/Http/Controllers/V1/Auth/AuthController.php` |
| 401 bodies (`invalid_token` / `unauthenticated`) | `api/app/Http/Middleware/ApiAuthenticate.php` |
| Client refresh + replay | `frontend/src/api/client.ts` |
| Login/refresh/logout calls, `X-Client` | `frontend/src/api/auth/index.ts` |
| Device credential storage | `frontend/src/lib/native-auth.ts`, `frontend/src/lib/native-secure-store.ts` |
| Visitor token for the assistant | `frontend/src/lib/chat-token.ts` |
| Backend test coverage | `api/tests/Feature/Auth/RefreshTokenFlowTest.php` |
| Client coverage | `frontend/src/api/client.test.ts`, `frontend/src/api/auth/index.test.ts` |

## Debugging a "signed out unexpectedly" report

1. Look for `Refresh token rejected` in `api/storage/logs/laravel.log`. The
   `failure` field names the cause, and `ip` narrows it to a client or network.
2. `refresh_token_missing` from a native build usually means the shell is running
   an old bundle — confirm `X-Refresh-Token` is being sent.
3. `refresh_token_reused` after a force-quit or a flaky connection points at
   concurrent refreshes. Check that the app version includes the single-flight
   guard.
4. `refresh_token_idle_expired` is expected for a device that was unused for more
   than 14 days.
