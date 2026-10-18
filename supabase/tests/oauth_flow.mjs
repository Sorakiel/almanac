// End-to-end check of "Sign in with Almanac" (0040_oauth + the `oauth` edge
// function) against STAGING, the way a desktop app does it: PKCE, a loopback
// listener on a random port, code exchange, refresh rotation, revocation —
// plus the ways it must fail.
//
//   node supabase/tests/oauth_flow.mjs
//
// Needs the CLI linked to staging (`supabase link --project-ref
// lahcyvybqqwkocrbtpyv`) and SUPABASE_ANON_KEY set to staging's publishable
// key. The consent click is the one step a script can't make in a browser, so
// it calls oauth_decide in SQL as a throwaway fixture user, created at the start
// and deleted (with everything it owns) at the end.

import { execFileSync } from 'node:child_process'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { createServer } from 'node:http'

const REF = 'lahcyvybqqwkocrbtpyv'
const BASE = `https://${REF}.supabase.co`
const OAUTH = `${BASE}/functions/v1/oauth`
const ANON = process.env.SUPABASE_ANON_KEY
const CLIENT = 'almanac-notch'
const USER = randomUUID()
const HABIT = randomUUID()

if (!ANON) throw new Error('SUPABASE_ANON_KEY is not set')

let failures = 0
function check(name, ok, detail = '') {
  if (!ok) failures += 1
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok || !detail ? '' : ` — ${detail}`}`)
}

function sql(query) {
  const out = execFileSync('supabase', ['db', 'query', '--linked', query], { encoding: 'utf8' })
  return JSON.parse(out.slice(out.indexOf('{'))).rows
}

const b64url = (buf) => buf.toString('base64url')
function pkce() {
  const verifier = b64url(randomBytes(32))
  return { verifier, challenge: b64url(createHash('sha256').update(verifier).digest()) }
}

// The app's loopback listener: records each callback and answers like an app would.
const callbacks = []
const server = createServer((req, res) => {
  callbacks.push(new URL(req.url, 'http://127.0.0.1'))
  res.end('You can close this tab.')
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const PORT = server.address().port
const REDIRECT = `http://127.0.0.1:${PORT}/oauth/callback`

function authorizeUrl(params) {
  const q = new URLSearchParams({
    client_id: CLIENT,
    redirect_uri: REDIRECT,
    response_type: 'code',
    code_challenge_method: 'S256',
    scope: 'habits:read habits:write',
    ...params,
  })
  for (const [k, v] of [...q]) if (v === '') q.delete(k)
  return `${OAUTH}/authorize?${q}`
}

async function authorize(params = {}) {
  const res = await fetch(authorizeUrl(params), { redirect: 'manual' })
  return { status: res.status, location: res.headers.get('location'), body: await res.text() }
}

function decide(requestId, approve) {
  const claims = JSON.stringify({ role: 'authenticated', sub: USER })
  const rows = sql(
    `select set_config('request.jwt.claims', '${claims}', true), public.oauth_decide('${requestId}', ${approve}) as r`,
  )
  return rows[0].r.redirect_url
}

/** authorize → consent (approved or not) → the callback the app receives. */
async function signIn({ scope = 'habits:read habits:write', approve = true } = {}) {
  const { verifier, challenge } = pkce()
  const state = b64url(randomBytes(12))
  const a = await authorize({ code_challenge: challenge, state, scope })
  const requestId = new URL(a.location).searchParams.get('oauth_request')
  const before = callbacks.length
  await fetch(decide(requestId, approve))
  const cb = callbacks[before]
  return { verifier, state, requestId, code: cb.searchParams.get('code'), callback: cb }
}

async function token(params) {
  const res = await fetch(`${OAUTH}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT, ...params }),
  })
  return { status: res.status, body: await res.json() }
}

const exchange = (code, verifier, redirect = REDIRECT) =>
  token({ grant_type: 'authorization_code', code, code_verifier: verifier, redirect_uri: redirect })

async function api(path, accessToken, body) {
  const res = await fetch(`${BASE}/rest/v1/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  return { status: res.status, body: text ? JSON.parse(text) : null }
}

const today = new Date().toISOString().slice(0, 10)

try {
  sql(`
    insert into auth.users (id, instance_id, aud, role, email)
    values ('${USER}', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'oauth-check-${USER.slice(0, 8)}@example.invalid');
    insert into public.habits (id, user_id, name, frequency, target_count, daily_goal, time_of_day, sort_order)
    values ('${HABIT}', '${USER}', 'oauth check', 'daily', 1, 1, 'morning', 0);
  `)

  // ── /authorize ──────────────────────────────────────────────────────────
  const { challenge } = pkce()
  let a = await authorize({ code_challenge: challenge, state: 'abc' })
  check(
    'authorize → consent modal in the web app',
    a.status === 302 && /[?&]oauth_request=[0-9a-f-]{36}$/.test(a.location ?? ''),
    `${a.status} ${a.location}`,
  )

  a = await authorize({ code_challenge: challenge, redirect_uri: 'https://evil.example/cb' })
  check('foreign redirect_uri → 400, no redirect', a.status === 400 && !a.location, `${a.status}`)

  a = await authorize({ code_challenge: challenge, redirect_uri: `http://127.0.0.1:${PORT}/other` })
  check('loopback with another path → 400', a.status === 400 && !a.location, `${a.status}`)

  a = await authorize({
    code_challenge: challenge,
    redirect_uri: `http://localhost:${PORT}/oauth/callback`,
  })
  check('localhost instead of 127.0.0.1 → 400', a.status === 400, `${a.status}`)

  a = await authorize({ code_challenge: challenge, client_id: 'no-such-app' })
  check('unknown client → 400', a.status === 400 && !a.location, `${a.status}`)

  a = await authorize({ code_challenge: challenge, scope: 'notes:read', state: 's1' })
  check(
    'scope the client may not ask for → back with invalid_scope',
    a.status === 302 &&
      a.location?.startsWith(REDIRECT) &&
      a.location.includes('error=invalid_scope') &&
      a.location.includes('state=s1'),
    `${a.status} ${a.location}`,
  )

  a = await authorize({ code_challenge: '', state: 's2' })
  check(
    'no PKCE → back with invalid_request',
    a.location?.includes('error=invalid_request') ?? false,
    `${a.location}`,
  )

  a = await authorize({ code_challenge: challenge, code_challenge_method: 'plain' })
  check(
    'PKCE plain → refused',
    a.location?.includes('error=invalid_request') ?? false,
    `${a.location}`,
  )

  // ── Consent ─────────────────────────────────────────────────────────────
  const denied = await signIn({ approve: false })
  check(
    'deny → app gets error=access_denied with its state',
    denied.callback.searchParams.get('error') === 'access_denied' &&
      denied.callback.searchParams.get('state') === denied.state,
  )

  // ── /token failures ─────────────────────────────────────────────────────
  let s = await signIn()
  check(
    'approve → app gets a code and its state',
    Boolean(s.code) && s.callback.searchParams.get('state') === s.state,
  )
  let t = await exchange(s.code, pkce().verifier)
  check(
    'wrong code_verifier → invalid_grant',
    t.status === 400 && t.body.error === 'invalid_grant',
    JSON.stringify(t.body),
  )
  t = await exchange(s.code, s.verifier)
  check(
    'code is spent after a failed attempt',
    t.status === 400 && t.body.error === 'invalid_grant',
  )

  s = await signIn()
  t = await exchange(s.code, s.verifier, `http://127.0.0.1:${PORT + 1}/oauth/callback`)
  check(
    'redirect_uri differing from /authorize → invalid_grant',
    t.body.error === 'invalid_grant',
    JSON.stringify(t.body),
  )

  s = await signIn()
  sql(
    `update oauth.requests set code_expires_at = now() - interval '1 second' where id = '${s.requestId}'`,
  )
  t = await exchange(s.code, s.verifier)
  check(
    'code older than 60 s → invalid_grant',
    t.body.error === 'invalid_grant',
    JSON.stringify(t.body),
  )

  t = await token({ grant_type: 'password', username: 'x', password: 'y' })
  check('password grant → unsupported_grant_type', t.body.error === 'unsupported_grant_type')

  // ── The full cycle ──────────────────────────────────────────────────────
  s = await signIn()
  t = await exchange(s.code, s.verifier)
  check(
    'code + verifier → access + refresh tokens',
    t.status === 200 &&
      t.body.token_type === 'bearer' &&
      t.body.refresh_token &&
      t.body.scope === 'habits:read habits:write',
    JSON.stringify(t.body),
  )
  let access = t.body.access_token
  let refresh = t.body.refresh_token
  const firstRefresh = refresh
  check('token response names the account', t.body.account?.id === USER)

  let r = await api('rpc/today_habits', access, { p_date: today })
  check(
    'today_habits with the app token',
    r.status === 200 && r.body.habits?.[0]?.id === HABIT,
    `${r.status} ${JSON.stringify(r.body)}`,
  )
  r = await api('rpc/toggle_habit', access, { p_habit: HABIT, p_date: today })
  check(
    'toggle_habit with the app token',
    r.status === 200 && r.body.done === 1,
    `${r.status} ${JSON.stringify(r.body)}`,
  )
  r = await api('habits?select=id', access)
  check(
    'direct table read is refused',
    r.status === 401 || r.status === 403,
    `${r.status} ${JSON.stringify(r.body)}`,
  )
  r = await api('rpc/oauth_connected_apps', access, {})
  check('other RPCs are refused', r.status === 401 || r.status === 403, `${r.status}`)

  const details = sql(
    `select set_config('request.jwt.claims', '${JSON.stringify({ role: 'authenticated', sub: USER })}', true),
            public.oauth_request_details((select id from oauth.requests where client_id = '${CLIENT}' and approved is null order by created_at desc limit 1)) as d`,
  )[0].d
  check(
    'a repeat request for granted scopes is auto-approvable',
    details.auto === true,
    JSON.stringify(details),
  )

  t = await exchange(s.code, s.verifier)
  check('code reuse → invalid_grant', t.body.error === 'invalid_grant')
  r = await api('rpc/today_habits', access, { p_date: today })
  check('…and it revokes what the code gave out', r.status === 403, `${r.status}`)

  // ── Refresh rotation ────────────────────────────────────────────────────
  s = await signIn()
  t = await exchange(s.code, s.verifier)
  refresh = t.body.refresh_token
  const rotated = await token({ grant_type: 'refresh_token', refresh_token: refresh })
  check(
    'refresh → new pair',
    rotated.status === 200 && rotated.body.refresh_token !== refresh,
    JSON.stringify(rotated.body),
  )
  const next = await token({
    grant_type: 'refresh_token',
    refresh_token: rotated.body.refresh_token,
  })
  check('the rotated refresh token works', next.status === 200)
  access = next.body.access_token
  r = await api('rpc/today_habits', access, { p_date: today })
  check('refreshed access token works', r.status === 200, `${r.status}`)
  t = await token({ grant_type: 'refresh_token', refresh_token: firstRefresh })
  check('refresh token of a revoked grant → invalid_grant', t.body.error === 'invalid_grant')

  sql(
    `update oauth.refresh_tokens set used_at = now() - interval '1 minute' where used_at is not null`,
  )
  t = await token({ grant_type: 'refresh_token', refresh_token: refresh })
  check(
    'reusing an old refresh token → invalid_grant',
    t.body.error === 'invalid_grant',
    JSON.stringify(t.body),
  )
  r = await api('rpc/today_habits', access, { p_date: today })
  check('…and it disconnects the app at once', r.status === 403, `${r.status}`)

  // ── Narrower scope ──────────────────────────────────────────────────────
  sql(`delete from oauth.grants where user_id = '${USER}'`)
  s = await signIn({ scope: 'habits:read' })
  t = await exchange(s.code, s.verifier)
  check(
    'scope=habits:read is granted as asked',
    t.body.scope === 'habits:read',
    JSON.stringify(t.body),
  )
  r = await api('rpc/today_habits', t.body.access_token, { p_date: today })
  check('read-only token reads', r.status === 200)
  r = await api('rpc/toggle_habit', t.body.access_token, { p_habit: HABIT, p_date: today })
  check('read-only token cannot toggle', r.status === 403, `${r.status} ${JSON.stringify(r.body)}`)

  // ── Revocation ──────────────────────────────────────────────────────────
  s = await signIn()
  t = await exchange(s.code, s.verifier)
  let res = await fetch(`${OAUTH}/revoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT, token: t.body.refresh_token }),
  })
  check('/revoke answers 200', res.status === 200)
  r = await api('rpc/today_habits', t.body.access_token, { p_date: today })
  check('after /revoke the access token is refused', r.status === 403, `${r.status}`)
  check(
    '…and so is the refresh token',
    (await token({ grant_type: 'refresh_token', refresh_token: t.body.refresh_token })).body
      .error === 'invalid_grant',
  )

  s = await signIn()
  t = await exchange(s.code, s.verifier)
  sql(
    `select set_config('request.jwt.claims', '${JSON.stringify({ role: 'authenticated', sub: USER })}', true), public.oauth_disconnect('${CLIENT}')`,
  )
  r = await api('rpc/today_habits', t.body.access_token, { p_date: today })
  check('"Disconnect" in Profile cuts the live access token', r.status === 403, `${r.status}`)
  check(
    '…and the refresh token',
    (await token({ grant_type: 'refresh_token', refresh_token: t.body.refresh_token })).body
      .error === 'invalid_grant',
  )

  // An app token must never act as the user on the consent side.
  s = await signIn()
  t = await exchange(s.code, s.verifier)
  r = await api('rpc/oauth_decide', t.body.access_token, {
    p_request: s.requestId,
    p_approve: true,
  })
  check('an app token cannot approve requests', r.status === 403, `${r.status}`)
} finally {
  sql(`delete from auth.users where id = '${USER}'`)
  server.close()
}

console.log(failures ? `\n${failures} check(s) failed` : '\noauth_flow: all checks passed')
process.exit(failures ? 1 : 0)
