# Integration API

For an external client — a desktop companion, a widget, a script — that works
with an Almanac user's habits. There is no separate server: it is the same
Supabase project the app uses, under the same Row-Level Security. A client sees
and changes only the signed-in user's rows.

There are two ways in:

- **Sign in with Almanac** (OAuth 2.1) — for apps, Almanac's own and anyone
  else's. The user approves the app and what it may do in Almanac itself; the
  app never sees the password, gets only the permissions it was granted, and
  the user can disconnect it at any time. **Use this for anything new.**
- Signing in as the user directly (email + password / code) — the older path,
  kept for existing scripts. Its tokens can do everything the user can.

## Connection

| What     | Where                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| Base URL | `VITE_SUPABASE_URL` of the deployment (`https://<project-ref>.supabase.co`)           |
| API key  | `VITE_SUPABASE_ANON_KEY` — the publishable (`sb_publishable_…`) key, public by design |

Both values ship in the web bundle, so they are not secrets, but this repo keeps
them out of git anyway: a client should take them from its own build-time
config, not hard-code them. Never use a `service_role` / secret key in a client.

Every request carries `apikey: <anon key>`; authenticated ones also
`Authorization: Bearer <access_token>`.

## Sign in with Almanac

OAuth 2.1 authorization code flow with PKCE (`S256` only), as in RFC 6749 /
RFC 7636 / RFC 8252. Refresh tokens rotate; RFC 7009 revocation.

### Endpoints

| Environment | Base (`<oauth>`)                                              |
| ----------- | ------------------------------------------------------------- |
| Production  | `https://fddabnnsgfjmlgeoeksz.supabase.co/functions/v1/oauth` |
| Staging     | `https://lahcyvybqqwkocrbtpyv.supabase.co/functions/v1/oauth` |

| What          | Where                                                         |
| ------------- | ------------------------------------------------------------- |
| Authorization | `GET <oauth>/authorize`                                       |
| Token         | `POST <oauth>/token`                                          |
| Revocation    | `POST <oauth>/revoke`                                         |
| Metadata      | `GET <oauth>/.well-known/oauth-authorization-server`          |
| Data API      | `<base>/rest/v1/rpc/<function>` (see [Functions](#functions)) |

### Permissions

A permission (scope) is `<module>:<action>`. Ask only for what the app uses;
the consent screen lists each one in plain words.

| Scope          | Allows                                       | Functions      |
| -------------- | -------------------------------------------- | -------------- |
| `habits:read`  | See the user's habits for today              | `today_habits` |
| `habits:write` | Mark a habit done / undone (returns the day) | `toggle_habit` |

An app token can call **only** these functions — no tables, no other RPCs —
and each checks its scope in the database, not in the client. More modules
(`notes:read`, …) will be added the same way.

### Flow

1. **Start.** Generate a `code_verifier` (43–128 chars of `A-Z a-z 0-9 - . _ ~`,
   e.g. 32 random bytes as base64url) and `code_challenge =
base64url(sha256(code_verifier))`, without padding. Generate a `state`
   (1–512 URL-safe chars: `A-Z a-z 0-9 - . _ ~`).
2. **Listen.** A desktop app opens a one-shot HTTP listener on
   `127.0.0.1`, any free port (RFC 8252 §7.3). Its redirect URI is
   `http://127.0.0.1:<port>/oauth/callback` — the path must match the
   registration exactly; the port is free. Use `127.0.0.1`, not `localhost`.
3. **Send the user to Almanac** in their default browser (never an embedded
   web view):

   ```
   <oauth>/authorize?response_type=code
     &client_id=almanac-notch
     &redirect_uri=http://127.0.0.1:53124/oauth/callback
     &scope=habits:read%20habits:write
     &code_challenge=<challenge>&code_challenge_method=S256
     &state=<state>
   ```

   Almanac signs the user in if needed and shows the consent modal. If the
   user already allowed the same app the same (or wider) permissions, the
   modal is skipped.

4. **Callback.** The browser comes back to the redirect URI with
   `?code=<code>&state=<state>`, or `?error=access_denied&state=<state>` when
   the user tapped Cancel. Check `state` equals yours. Errors in the request
   itself (`invalid_scope`, `invalid_request`, `unsupported_response_type`)
   come back the same way, with `error_description`. An unknown `client_id` or
   unregistered `redirect_uri` is never redirected — the browser shows a 400.
5. **Exchange the code** within **60 seconds**; it works once:

   ```
   POST <oauth>/token
   Content-Type: application/x-www-form-urlencoded

   grant_type=authorization_code&client_id=almanac-notch
   &code=<code>&redirect_uri=<same redirect_uri>&code_verifier=<verifier>
   ```

   ```json
   {
     "access_token": "eyJ…",
     "token_type": "bearer",
     "expires_in": 3600,
     "refresh_token": "…",
     "scope": "habits:read habits:write",
     "account": { "id": "uuid", "email": "user@example.com" }
   }
   ```

   `scope` is what was granted — check it rather than assuming. `account` is
   an Almanac addition, for showing who is signed in.

6. **Call the API** with `apikey: <publishable key>` and `Authorization:
Bearer <access_token>` — the same Data API calls as below.

### Refresh

```
POST <oauth>/token
grant_type=refresh_token&client_id=almanac-notch&refresh_token=<refresh_token>
```

Returns a new `access_token` **and a new `refresh_token`**: store the new one,
the old one is spent. Presenting a spent refresh token again (after a 10-second
grace for a retried request) is treated as theft and disconnects the app.
Refresh tokens live 90 days from the last refresh. On `invalid_grant`, forget
the tokens and sign in again. Keep the refresh token in the OS keychain.

Access tokens live 1 hour. Refresh on a `401` (or a little before
`expires_in`) and retry once.

### Signing out and disconnecting

- **App's "Sign out":** `POST <oauth>/revoke` with `client_id` and
  `token=<refresh_token>` (an access token works too). Always `200`. It ends
  the app's access for that user.
- **User's "Disconnect"** (Almanac → Profile → Connected apps): revokes every
  refresh token of the app and stops its access tokens at once — the next
  call gets `403`, the next refresh `invalid_grant`.

A `403` with an otherwise valid token means the user disconnected the app or
the token lacks the scope: sign in again.

### Errors at the token endpoint

`400` / `401` with `{"error": "...", "error_description": "..."}`:

| `error`                  | Meaning                                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `invalid_grant`          | Code unknown, used, expired, wrong `code_verifier`/`redirect_uri`; refresh token unknown, spent or revoked |
| `invalid_client`         | Unknown client, or a confidential client without its secret                                                |
| `unsupported_grant_type` | Only `authorization_code` and `refresh_token`                                                              |

### Registering an app

Apps are rows in `oauth.clients` — no code change. The owner adds one in SQL:

```sql
insert into oauth.clients (id, name, icon_url, redirect_uris, scopes)
values (
  'my-app',                                   -- client_id: a-z, 0-9, -
  'My App',                                   -- shown on the consent modal
  'https://example.com/icon.png',             -- optional, https only
  array['http://127.0.0.1:*/oauth/callback'], -- exact URIs; `*` = any loopback port
  array['habits:read']                        -- the most it may ask for
);
```

Desktop and mobile apps are public clients (the default: no secret, PKCE
only). A server-side app can be `client_type = 'confidential'` with
`secret_hash` = sha256 hex of its secret; it then authenticates at `/token` and
`/revoke` with HTTP Basic or `client_secret` in the body. Disable an app with
`disabled_at = now()`.

A new permission is a row in `oauth.scopes`, its wording in the web app
(`src/features/connect/lib/scopes.ts` + i18n), and a
`require_app_scope('<scope>')` call in each function it guards, listed in
`oauth.api_functions`.

### Registered apps

| `client_id`     | Name          | Redirect URI                        | Scopes                     |
| --------------- | ------------- | ----------------------------------- | -------------------------- |
| `almanac-notch` | Almanac Notch | `http://127.0.0.1:*/oauth/callback` | `habits:read habits:write` |

### Example: a desktop app with a loopback listener (Node)

```js
import { createHash, randomBytes } from 'node:crypto'
import { createServer } from 'node:http'
import { exec } from 'node:child_process'

const OAUTH = 'https://fddabnnsgfjmlgeoeksz.supabase.co/functions/v1/oauth'
const verifier = randomBytes(32).toString('base64url')
const challenge = createHash('sha256').update(verifier).digest('base64url')
const state = randomBytes(16).toString('base64url')

const server = createServer()
server.listen(0, '127.0.0.1')
await new Promise((r) => server.once('listening', r))
const redirectUri = `http://127.0.0.1:${server.address().port}/oauth/callback`

const code = await new Promise((resolve, reject) => {
  server.on('request', (req, res) => {
    const url = new URL(req.url, redirectUri)
    if (url.pathname !== '/oauth/callback') return res.writeHead(404).end()
    res.end('Signed in. You can close this tab.')
    server.close()
    if (url.searchParams.get('state') !== state) return reject(new Error('state mismatch'))
    const error = url.searchParams.get('error')
    error ? reject(new Error(error)) : resolve(url.searchParams.get('code'))
  })
  const q = new URLSearchParams({
    response_type: 'code',
    client_id: 'almanac-notch',
    redirect_uri: redirectUri,
    scope: 'habits:read habits:write',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  })
  exec(`open "${OAUTH}/authorize?${q}"`) // macOS; xdg-open / start elsewhere
})

const tokens = await fetch(`${OAUTH}/token`, {
  method: 'POST',
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: 'almanac-notch',
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  }),
}).then((r) => r.json())
// tokens.access_token → Authorization: Bearer …; tokens.refresh_token → keychain
```

`supabase/tests/oauth_flow.mjs` runs this flow (and its failure cases) against
staging.

## Signing in as the user (older path)

Standard Supabase Auth (GoTrue) endpoints under `/auth/v1`.

**Email + password**

```
POST /auth/v1/token?grant_type=password
{"email": "...", "password": "..."}
```

An account created by magic link has no password until the user sets one in
Almanac ("Forgot password"); until then this returns `invalid_credentials`.

**Code from email**

```
POST /auth/v1/otp      {"email": "...", "create_user": false}
POST /auth/v1/verify   {"type": "email", "email": "...", "token": "<code>"}
```

The code is only in the email if the project's Magic Link template includes
`{{ .Token }}` (Supabase Dashboard → Authentication → Email Templates); the app's
own sign-in uses the link in the same email, so the link must stay. Don't assume
a code length — it is configurable (6–10 digits).

**Refresh**

```
POST /auth/v1/token?grant_type=refresh_token
{"refresh_token": "..."}
```

Refresh tokens rotate: store the new one from every response; the old one stops
working after a short reuse window. If refresh fails, sign the user out and ask
them to sign in again. Keep the refresh token in the OS keychain, not in a file.

## Functions

Called as `POST /rest/v1/rpc/<name>` with a JSON body of the arguments, by a
signed-in user or an app token with the scope named under each.

### `today_habits(p_date date) → jsonb`

Scope: `habits:read`.

Today's habits as the app's Today screen counts them. `p_date` is the user's
**local** calendar date (`YYYY-MM-DD`) on the calling device.

```json
{
  "date": "2026-10-18",
  "done": 2,
  "total": 5,
  "habits": [
    {
      "id": "uuid",
      "name": "Water",
      "icon": "💧",
      "color": "#3FB8A8",
      "unit": "glasses",
      "slot": "morning",
      "count": 3,
      "goal": 8,
      "done": false
    }
  ]
}
```

- `habits` holds what counts today: habits due on `p_date` or already done on it.
  A habit resting today (an every-N cadence not yet due, a weekdays habit at the
  weekend) and a habit skipped today (frozen and not done) are left out.
- Order is the app's: open habits first, by `slot` `morning → afternoon → evening
→ anytime → week`, then the done ones; the user's own order within each.
- `slot`: the habit's time of day, or `week` for weekly and N-times-a-week habits.
- `goal`: units that complete the day (1 = a plain check-off); `count`: units
  logged on `p_date`; `done` = `count >= goal`.
- `unit`: `glasses | pages | minutes | times` (a key the client may pluralise),
  any other text (show as is), or `null`. `icon`, `color` may be `null`.
- `total`: habits that count today; `done`: how many of them are done.

### `toggle_habit(p_habit uuid, p_date date) → jsonb`

Scope: `habits:write`.

One tap, as in the app: a habit already done on `p_date` is cleared (its log for
that day is deleted); otherwise its count goes up by one. Returns the same object
as `today_habits(p_date)`, so the client can redraw without a second request.

## Errors

| Case                                                          | Result                                 |
| ------------------------------------------------------------- | -------------------------------------- |
| `toggle_habit` on a habit that isn't yours, archived or gone  | PostgREST error with `"code": "P0002"` |
| Missing or expired access token                               | `401`; refresh and retry once          |
| Called without signing in (anon key only)                     | permission denied (`42501`)            |
| App token without the scope, or the user disconnected the app | `403` (`42501`); sign in again         |

## Compatibility

Fields of the returned objects are only ever added, never removed or renamed. A
breaking change ships as a new function name; the old one keeps working until
its clients have moved. Clients should ignore fields they don't know.

## Not covered

Writes through the API don't emit the friends-feed streak-milestone event the
app sends after a closing tap.
