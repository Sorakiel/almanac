# Integration API

For an external client — a desktop companion, a widget, a script — that signs in
as an Almanac user and works with that user's habits. There is no separate
server: it is the same Supabase project the app uses, under the same Row-Level
Security. A client sees and changes only the signed-in user's rows.

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

## Sign-in

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

Called as `POST /rest/v1/rpc/<name>` with a JSON body of the arguments. Only the
`authenticated` role may call them.

### `today_habits(p_date date) → jsonb`

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

One tap, as in the app: a habit already done on `p_date` is cleared (its log for
that day is deleted); otherwise its count goes up by one. Returns the same object
as `today_habits(p_date)`, so the client can redraw without a second request.

## Errors

| Case                                                         | Result                                 |
| ------------------------------------------------------------ | -------------------------------------- |
| `toggle_habit` on a habit that isn't yours, archived or gone | PostgREST error with `"code": "P0002"` |
| Missing or expired access token                              | `401`; refresh and retry once          |
| Called without signing in (anon key only)                    | permission denied (`42501`)            |

## Compatibility

Fields of the returned objects are only ever added, never removed or renamed. A
breaking change ships as a new function name; the old one keeps working until
its clients have moved. Clients should ignore fields they don't know.

## Not covered

Writes through the API don't emit the friends-feed streak-milestone event the
app sends after a closing tap.
