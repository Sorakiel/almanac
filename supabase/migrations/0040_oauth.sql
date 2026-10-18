-- "Sign in with Almanac": an OAuth 2.1 authorization server (authorization
-- code + PKCE S256, refresh-token rotation, revocation) for outside apps —
-- Almanac Notch first. The HTTP side is the `oauth` edge function; everything
-- that decides anything lives here. Documented in docs/API.md.
--
-- Why not Supabase Auth's own OAuth server: it matches redirect_uri as an exact
-- string (a desktop app's loopback port is random, RFC 8252 §7.3) and rejects
-- any scope outside openid/email/profile/phone, and its access tokens can do
-- everything a session can.
--
-- How an app token is held in:
--   * The access token is a JWT the edge function signs with its own key (an
--     imported standby key of the project). Its `role` claim is `almanac_app`,
--     a role with no table privileges at all.
--   * public.app_token_gate runs before every Data API request
--     (pgrst.db_pre_request) and lets that role reach only the functions listed
--     in oauth.api_functions.
--   * Each of those functions calls require_app_scope itself, which also checks
--     that the user hasn't disconnected the app — so "Disconnect" cuts a live
--     access token off at once, not when it expires.
-- A normal Almanac session never passes any of these checks: they only bite
-- when the role is almanac_app.

create schema oauth;
revoke all on schema oauth from public;

-- ── Registry ────────────────────────────────────────────────────────────────

-- Permissions an app can ask for: `<module>:<action>`. A new one is a row here,
-- a label in the app's i18n (oauthScopes.<name>) and a check in the functions it
-- guards.
create table oauth.scopes (
  name       text primary key check (name ~ '^[a-z][a-z_]*:[a-z][a-z_]*$'),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into oauth.scopes (name, sort_order) values
  ('habits:read', 10),
  ('habits:write', 20);

-- An app that may ask users to sign in. Registering a new one is one insert.
-- redirect_uris: exact URIs, or a loopback pattern with `*` for the port
-- (`http://127.0.0.1:*/oauth/callback`) — the only place a `*` may appear.
create table oauth.clients (
  id            text primary key check (id ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  name          text not null check (length(name) between 1 and 80),
  icon_url      text check (icon_url ~ '^https://'),
  redirect_uris text[] not null check (cardinality(redirect_uris) > 0),
  scopes        text[] not null check (cardinality(scopes) > 0),
  client_type   text not null default 'public' check (client_type in ('public', 'confidential')),
  -- sha256 hex of the client secret; confidential clients only.
  secret_hash   text,
  disabled_at   timestamptz,
  created_at    timestamptz not null default now(),
  check ((client_type = 'confidential') = (secret_hash is not null))
);

insert into oauth.clients (id, name, redirect_uris, scopes) values
  ('almanac-notch', 'Almanac Notch', array['http://127.0.0.1:*/oauth/callback'], array['habits:read', 'habits:write']);

-- Functions an app token may call, and the scope each needs. The gate reads
-- this; the function still checks its own scope.
create table oauth.api_functions (
  name  text primary key,
  scope text not null references oauth.scopes (name)
);

insert into oauth.api_functions (name, scope) values
  ('today_habits', 'habits:read'),
  ('toggle_habit', 'habits:write');

-- ── State ───────────────────────────────────────────────────────────────────

-- One /authorize call. Lives 10 minutes until the user decides; an approved
-- one carries a code that lives 60 seconds and works once.
create table oauth.requests (
  id              uuid primary key default gen_random_uuid(),
  client_id       text not null references oauth.clients (id) on delete cascade,
  redirect_uri    text not null,
  scopes          text[] not null,
  code_challenge  text not null,
  state           text,
  user_id         uuid references auth.users (id) on delete cascade,
  approved        boolean,
  code_hash       text unique,
  code_expires_at timestamptz,
  code_used_at    timestamptz,
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null default now() + interval '10 minutes'
);

create index oauth_requests_user_idx on oauth.requests (user_id);
create index oauth_requests_created_idx on oauth.requests (created_at);

-- A user's consent to one app. Deleting it is "Disconnect": its refresh tokens
-- go with it and require_app_scope stops honouring live access tokens.
create table oauth.grants (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  client_id    text not null references oauth.clients (id) on delete cascade,
  scopes       text[] not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  last_used_at timestamptz,
  unique (user_id, client_id)
);

create index oauth_grants_client_idx on oauth.grants (client_id);

-- Refresh tokens, sha256-hashed. Each use rotates: the row is marked used and
-- a child issued. Presenting a used one after the grace window is treated as
-- theft and revokes the whole grant.
create table oauth.refresh_tokens (
  id          uuid primary key default gen_random_uuid(),
  grant_id    uuid not null references oauth.grants (id) on delete cascade,
  token_hash  text not null unique,
  scopes      text[] not null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '90 days',
  used_at     timestamptz
);

create index oauth_refresh_tokens_grant_idx on oauth.refresh_tokens (grant_id);

alter table oauth.scopes enable row level security;
alter table oauth.clients enable row level security;
alter table oauth.api_functions enable row level security;
alter table oauth.requests enable row level security;
alter table oauth.grants enable row level security;
alter table oauth.refresh_tokens enable row level security;

-- ── Helpers ─────────────────────────────────────────────────────────────────

create function oauth.sha256_hex(p text) returns text
language sql immutable strict
set search_path = ''
as $$ select encode(extensions.digest(convert_to(p, 'UTF8'), 'sha256'), 'hex') $$;

create function oauth.random_token() returns text
language sql volatile
set search_path = ''
as $$ select translate(encode(extensions.gen_random_bytes(32), 'base64'), '+/=', '-_') $$;

-- Exact match, or a registered `http://127.0.0.1:*/path` / `http://[::1]:*/path`
-- with any port (RFC 8252 §7.3). Nothing else is a pattern.
create function oauth.redirect_allowed(p_client oauth.clients, p_uri text) returns boolean
language sql immutable
set search_path = ''
as $$
  select exists (
    select 1
    from unnest(p_client.redirect_uris) as r(uri)
    where r.uri = p_uri
       or (
         r.uri ~ '^http://(127\.0\.0\.1|\[::1\]):\*/'
         and p_uri ~ (
           '^' || replace(
             regexp_replace(r.uri, '([.?+^$()\[\]{}|\\])', '\\\1', 'g'),
             ':*', ':(?:[1-9][0-9]{0,4})'
           ) || '$'
         )
       )
  )
$$;

create function oauth.redirect_with(p_uri text, p_params text) returns text
language sql immutable
set search_path = ''
as $$ select p_uri || case when position('?' in p_uri) > 0 then '&' else '?' end || p_params $$;

-- ── Gate and scope check (the Data API side) ────────────────────────────────

create role almanac_app nologin noinherit;
grant almanac_app to authenticator;
grant usage on schema public to almanac_app;

-- Called by every API function an app may use. A regular session passes; an
-- app token passes only with the scope and a grant the user hasn't revoked.
create function public.require_app_scope(p_scope text) returns void
language plpgsql stable
security definer
set search_path = ''
as $$
declare
  v_claims jsonb := coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
begin
  if coalesce(v_claims ->> 'role', '') <> 'almanac_app' then
    return;
  end if;
  if not (p_scope = any (string_to_array(coalesce(v_claims ->> 'scope', ''), ' '))) then
    raise exception 'insufficient_scope: % required', p_scope using errcode = '42501';
  end if;
  if not exists (
    select 1 from oauth.grants g
    where g.user_id = (v_claims ->> 'sub')::uuid
      and g.client_id = v_claims ->> 'client_id'
      and p_scope = any (g.scopes)
  ) then
    raise exception 'access revoked' using errcode = '42501';
  end if;
end;
$$;

-- pgrst.db_pre_request: an app token may only call the listed functions.
-- Invoker on purpose — current_user is the request's role here.
create function public.app_token_gate() returns void
language plpgsql stable
set search_path = ''
as $$
begin
  if current_user <> 'almanac_app' then
    return;
  end if;
  if not public.app_token_path_allowed(current_setting('request.path', true)) then
    raise exception 'not available to app tokens' using errcode = '42501';
  end if;
end;
$$;

create function public.app_token_path_allowed(p_path text) returns boolean
language sql stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from oauth.api_functions f
    where p_path = '/rpc/' || f.name
  )
$$;

revoke execute on function public.require_app_scope(text) from public, anon;
grant execute on function public.require_app_scope(text) to authenticated, almanac_app;
revoke execute on function public.app_token_path_allowed(text) from public, anon, authenticated;
grant execute on function public.app_token_path_allowed(text) to almanac_app;
grant execute on function public.app_token_gate() to anon, authenticated, service_role, almanac_app;

alter role authenticator set pgrst.db_pre_request = 'public.app_token_gate';
notify pgrst, 'reload config';

-- ── Integration API under the gate ──────────────────────────────────────────
-- 0039's functions, now reachable by app tokens. They become security definer
-- because almanac_app has no table privileges; both already filter on
-- auth.uid() explicitly, so nothing about whose rows they touch changes. The
-- body moves to oauth.today_habits_for so toggle_habit (habits:write) doesn't
-- also demand habits:read to return the list.

create function oauth.today_habits_for(p_user uuid, p_date date) returns jsonb
language sql
stable
set search_path = public
as $$
  with active as (
    select h.*, greatest(1, h.daily_goal) as goal
    from habits h
    where h.user_id = p_user
      and h.archived_at is null
  ),
  day as (
    select
      a.id, a.name, a.icon, a.color, a.unit, a.sort_order, a.created_at, a.goal,
      case when a.frequency in ('weekly', 'x_per_week') then 'week' else a.time_of_day::text end as slot,
      coalesce(l.count, 0) as count,
      coalesce(l.count, 0) >= a.goal as done,
      exists (select 1 from habit_freezes f where f.habit_id = a.id and f.date = p_date) as frozen,
      case a.frequency
        when 'weekdays' then extract(isodow from p_date) < 6
        when 'every_n_days' then last_done.d is null or p_date - last_done.d >= a.target_count
        when 'every_n_weeks' then last_done.d is null or p_date - last_done.d >= a.target_count * 7
        else true
      end as due
    from active a
    left join habit_logs l on l.habit_id = a.id and l.date = p_date
    left join lateral (
      select max(x.date) as d
      from habit_logs x
      where x.habit_id = a.id
        and x.date between p_date - 63 and p_date
        and x.count >= a.goal
    ) last_done on true
  ),
  listed as (
    select * from day
    where not (frozen and not done)
      and (due or done)
  )
  select jsonb_build_object(
    'date', p_date,
    'done', count(*) filter (where done),
    'total', count(*),
    'habits', coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', id, 'name', name, 'icon', icon, 'color', color, 'unit', unit,
          'slot', slot, 'count', count, 'goal', goal, 'done', done
        )
        order by
          done,
          case when done then 0
            else array_position(array['morning', 'afternoon', 'evening', 'anytime', 'week'], slot)
          end,
          sort_order, created_at, id
      ),
      '[]'::jsonb
    )
  )
  from listed;
$$;

revoke execute on function oauth.today_habits_for(uuid, date) from public;

create or replace function public.today_habits(p_date date) returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.require_app_scope('habits:read');
  return oauth.today_habits_for((select auth.uid()), p_date);
end;
$$;

create or replace function public.toggle_habit(p_habit uuid, p_date date) returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_user uuid := (select auth.uid());
  v_goal integer;
  v_count integer;
begin
  perform public.require_app_scope('habits:write');

  -- The row lock serialises taps on one habit, so two quick taps read as two.
  select greatest(1, h.daily_goal) into v_goal
  from habits h
  where h.id = p_habit
    and h.user_id = v_user
    and h.archived_at is null
  for update;
  if not found then
    raise exception 'habit not found' using errcode = 'P0002';
  end if;

  select l.count into v_count from habit_logs l where l.habit_id = p_habit and l.date = p_date;

  if coalesce(v_count, 0) >= v_goal then
    delete from habit_logs where habit_id = p_habit and date = p_date;
  else
    insert into habit_logs (user_id, habit_id, date, count)
    values (v_user, p_habit, p_date, 1)
    on conflict (habit_id, date) do update set count = habit_logs.count + 1;
  end if;

  return oauth.today_habits_for(v_user, p_date);
end;
$$;

revoke execute on function public.today_habits(date) from public, anon;
revoke execute on function public.toggle_habit(uuid, date) from public, anon;
grant execute on function public.today_habits(date) to authenticated, almanac_app;
grant execute on function public.toggle_habit(uuid, date) to authenticated, almanac_app;

-- ── Consent (called by the web app as the signed-in user) ───────────────────

-- Refuses app tokens: an app must never approve or list apps for the user.
create function oauth.session_user_id() returns uuid
language plpgsql stable
set search_path = ''
as $$
declare
  v_claims jsonb := coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
begin
  if coalesce(v_claims ->> 'role', '') <> 'authenticated' or (v_claims ->> 'sub') is null then
    raise exception 'sign in required' using errcode = '42501';
  end if;
  return (v_claims ->> 'sub')::uuid;
end;
$$;

-- What the consent modal shows. `auto` = an existing grant already covers
-- these scopes, so the app may approve without asking again.
-- Raises P0002 for an unknown, expired or already decided request.
create function public.oauth_request_details(p_request uuid) returns jsonb
language plpgsql stable
security definer
set search_path = ''
as $$
declare
  v_user uuid := oauth.session_user_id();
  v_req oauth.requests;
  v_client oauth.clients;
begin
  select * into v_req from oauth.requests r
  where r.id = p_request and r.approved is null and r.expires_at > now();
  if not found then
    raise exception 'request not found' using errcode = 'P0002';
  end if;
  select * into v_client from oauth.clients c where c.id = v_req.client_id;

  return jsonb_build_object(
    'client', jsonb_build_object('id', v_client.id, 'name', v_client.name, 'icon_url', v_client.icon_url),
    'scopes', to_jsonb(v_req.scopes),
    'email', (select u.email from auth.users u where u.id = v_user),
    'auto', exists (
      select 1 from oauth.grants g
      where g.user_id = v_user and g.client_id = v_req.client_id and g.scopes @> v_req.scopes
    )
  );
end;
$$;

-- The user's answer. Returns {redirect_url}: the app's redirect_uri with a
-- one-time code (60 s) and state, or with error=access_denied.
create function public.oauth_decide(p_request uuid, p_approve boolean) returns jsonb
language plpgsql volatile
security definer
set search_path = ''
as $$
declare
  v_user uuid := oauth.session_user_id();
  v_req oauth.requests;
  v_code text;
  v_state text;
begin
  select * into v_req from oauth.requests r
  where r.id = p_request and r.approved is null and r.expires_at > now()
  for update;
  if not found then
    raise exception 'request not found' using errcode = 'P0002';
  end if;

  v_state := case when v_req.state is null then '' else '&state=' || v_req.state end;

  if not p_approve then
    update oauth.requests set approved = false, user_id = v_user where id = v_req.id;
    return jsonb_build_object(
      'redirect_url',
      oauth.redirect_with(v_req.redirect_uri, 'error=access_denied' || v_state)
    );
  end if;

  insert into oauth.grants (user_id, client_id, scopes)
  values (v_user, v_req.client_id, v_req.scopes)
  on conflict (user_id, client_id) do update
    set scopes = (select array_agg(distinct s order by s) from unnest(oauth.grants.scopes || excluded.scopes) s),
        updated_at = now();

  v_code := oauth.random_token();
  update oauth.requests
  set approved = true,
      user_id = v_user,
      code_hash = oauth.sha256_hex(v_code),
      code_expires_at = now() + interval '60 seconds'
  where id = v_req.id;

  return jsonb_build_object(
    'redirect_url',
    oauth.redirect_with(v_req.redirect_uri, 'code=' || v_code || v_state)
  );
end;
$$;

-- Profile → Connected apps.
create function public.oauth_connected_apps() returns jsonb
language sql stable
security definer
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'client_id', c.id, 'name', c.name, 'icon_url', c.icon_url,
        'scopes', to_jsonb(g.scopes), 'connected_at', g.created_at, 'last_used_at', g.last_used_at
      )
      order by g.created_at desc
    ),
    '[]'::jsonb
  )
  from oauth.grants g
  join oauth.clients c on c.id = g.client_id
  where g.user_id = oauth.session_user_id()
$$;

-- "Disconnect": revokes the app's refresh tokens and, through
-- require_app_scope, its live access tokens.
create function public.oauth_disconnect(p_client text) returns void
language sql volatile
security definer
set search_path = ''
as $$
  delete from oauth.grants g
  where g.user_id = oauth.session_user_id() and g.client_id = p_client
$$;

revoke execute on function public.oauth_request_details(uuid) from public, anon;
revoke execute on function public.oauth_decide(uuid, boolean) from public, anon;
revoke execute on function public.oauth_connected_apps() from public, anon;
revoke execute on function public.oauth_disconnect(text) from public, anon;
grant execute on function public.oauth_request_details(uuid) to authenticated;
grant execute on function public.oauth_decide(uuid, boolean) to authenticated;
grant execute on function public.oauth_connected_apps() to authenticated;
grant execute on function public.oauth_disconnect(text) to authenticated;

-- ── Server side (called by the edge function with the service role) ─────────
-- Each returns {error, error_description} in OAuth's own terms on failure.

create function public.oauth_svc_authorize(
  p_client_id text,
  p_redirect_uri text,
  p_scope text,
  p_code_challenge text,
  p_code_challenge_method text,
  p_state text
) returns jsonb
language plpgsql volatile
security definer
set search_path = ''
as $$
declare
  v_client oauth.clients;
  v_scopes text[];
  v_id uuid;
begin
  select * into v_client from oauth.clients c where c.id = p_client_id and c.disabled_at is null;
  if not found then
    return jsonb_build_object('error', 'invalid_client', 'error_description', 'unknown client_id', 'redirect', false);
  end if;
  if p_redirect_uri is null or not oauth.redirect_allowed(v_client, p_redirect_uri) then
    return jsonb_build_object('error', 'invalid_request', 'error_description', 'redirect_uri is not registered for this client', 'redirect', false);
  end if;

  -- From here the redirect_uri is trusted, so errors go back to it.
  if p_state is not null and (p_state !~ '^[A-Za-z0-9._~-]+$' or length(p_state) > 512) then
    return jsonb_build_object('error', 'invalid_request', 'error_description', 'state must be 1-512 URL-safe characters', 'redirect', true);
  end if;
  if coalesce(p_code_challenge_method, '') <> 'S256' then
    return jsonb_build_object('error', 'invalid_request', 'error_description', 'code_challenge_method must be S256', 'redirect', true);
  end if;
  if coalesce(p_code_challenge, '') !~ '^[A-Za-z0-9_-]{43}$' then
    return jsonb_build_object('error', 'invalid_request', 'error_description', 'code_challenge must be a base64url SHA-256', 'redirect', true);
  end if;

  v_scopes := case
    when coalesce(btrim(p_scope), '') = '' then v_client.scopes
    else (select array_agg(distinct s order by s) from unnest(regexp_split_to_array(btrim(p_scope), '\s+')) s)
  end;
  if not (v_client.scopes @> v_scopes)
     or exists (select 1 from unnest(v_scopes) s where s not in (select name from oauth.scopes)) then
    return jsonb_build_object('error', 'invalid_scope', 'error_description', 'scope not allowed for this client', 'redirect', true);
  end if;

  delete from oauth.requests where expires_at < now() - interval '1 day';

  insert into oauth.requests (client_id, redirect_uri, scopes, code_challenge, state)
  values (v_client.id, p_redirect_uri, v_scopes, p_code_challenge, p_state)
  returning id into v_id;

  return jsonb_build_object('request_id', v_id);
end;
$$;

-- Client authentication shared by token and revoke: public clients send no
-- secret, confidential ones must.
create function oauth.authenticate_client(p_client_id text, p_secret text) returns oauth.clients
language plpgsql stable
set search_path = ''
as $$
declare
  v_client oauth.clients;
begin
  select * into v_client from oauth.clients c where c.id = p_client_id and c.disabled_at is null;
  if not found then
    return null;
  end if;
  if v_client.client_type = 'confidential'
     and (p_secret is null or oauth.sha256_hex(p_secret) <> v_client.secret_hash) then
    return null;
  end if;
  return v_client;
end;
$$;

create function oauth.issue_refresh(p_grant uuid, p_scopes text[]) returns text
language plpgsql volatile
set search_path = ''
as $$
declare
  v_token text := oauth.random_token();
begin
  insert into oauth.refresh_tokens (grant_id, token_hash, scopes)
  values (p_grant, oauth.sha256_hex(v_token), p_scopes);
  update oauth.grants set last_used_at = now() where id = p_grant;
  return v_token;
end;
$$;

-- grant_type=authorization_code. The code is spent on the first attempt,
-- right or wrong; presenting a spent code revokes what it was exchanged for.
create function public.oauth_svc_exchange_code(
  p_client_id text,
  p_client_secret text,
  p_code text,
  p_redirect_uri text,
  p_code_verifier text
) returns jsonb
language plpgsql volatile
security definer
set search_path = ''
as $$
declare
  v_client oauth.clients := oauth.authenticate_client(p_client_id, p_client_secret);
  v_req oauth.requests;
  v_grant oauth.grants;
begin
  if v_client.id is null then
    return jsonb_build_object('error', 'invalid_client', 'error_description', 'client authentication failed');
  end if;

  select * into v_req from oauth.requests r
  where r.code_hash = oauth.sha256_hex(coalesce(p_code, ''))
  for update;
  if not found or v_req.client_id <> v_client.id then
    return jsonb_build_object('error', 'invalid_grant', 'error_description', 'unknown code');
  end if;

  if v_req.code_used_at is not null then
    delete from oauth.grants g where g.user_id = v_req.user_id and g.client_id = v_req.client_id;
    return jsonb_build_object('error', 'invalid_grant', 'error_description', 'code already used; access revoked');
  end if;

  update oauth.requests set code_used_at = now() where id = v_req.id;
  -- The spent-code check above must survive this function's own error returns,
  -- so failures below return instead of raising.

  if v_req.code_expires_at < now() then
    return jsonb_build_object('error', 'invalid_grant', 'error_description', 'code expired');
  end if;
  if p_redirect_uri is distinct from v_req.redirect_uri then
    return jsonb_build_object('error', 'invalid_grant', 'error_description', 'redirect_uri does not match');
  end if;
  if coalesce(p_code_verifier, '') !~ '^[A-Za-z0-9._~-]{43,128}$'
     or translate(encode(extensions.digest(convert_to(p_code_verifier, 'UTF8'), 'sha256'), 'base64'), '+/=', '-_')
        <> v_req.code_challenge then
    return jsonb_build_object('error', 'invalid_grant', 'error_description', 'code_verifier does not match');
  end if;

  select * into v_grant from oauth.grants g
  where g.user_id = v_req.user_id and g.client_id = v_req.client_id and g.scopes @> v_req.scopes;
  if not found then
    return jsonb_build_object('error', 'invalid_grant', 'error_description', 'access revoked');
  end if;

  return jsonb_build_object(
    'user_id', v_req.user_id,
    'email', (select u.email from auth.users u where u.id = v_req.user_id),
    'client_id', v_client.id,
    'scopes', to_jsonb(v_req.scopes),
    'refresh_token', oauth.issue_refresh(v_grant.id, v_req.scopes)
  );
end;
$$;

-- grant_type=refresh_token, with rotation. A token used again within 10 s
-- (a retry after a lost response) still works; later, it is a stolen copy
-- and the whole grant goes.
create function public.oauth_svc_refresh(
  p_client_id text,
  p_client_secret text,
  p_refresh_token text
) returns jsonb
language plpgsql volatile
security definer
set search_path = ''
as $$
declare
  v_client oauth.clients := oauth.authenticate_client(p_client_id, p_client_secret);
  v_rt oauth.refresh_tokens;
  v_grant oauth.grants;
  v_scopes text[];
begin
  if v_client.id is null then
    return jsonb_build_object('error', 'invalid_client', 'error_description', 'client authentication failed');
  end if;

  select * into v_rt from oauth.refresh_tokens t
  where t.token_hash = oauth.sha256_hex(coalesce(p_refresh_token, ''))
  for update;
  if not found then
    return jsonb_build_object('error', 'invalid_grant', 'error_description', 'unknown refresh_token');
  end if;
  select * into v_grant from oauth.grants g where g.id = v_rt.grant_id;
  if v_grant.client_id <> v_client.id then
    return jsonb_build_object('error', 'invalid_grant', 'error_description', 'unknown refresh_token');
  end if;
  if v_rt.used_at is not null and v_rt.used_at < now() - interval '10 seconds' then
    delete from oauth.grants g where g.id = v_grant.id;
    return jsonb_build_object('error', 'invalid_grant', 'error_description', 'refresh_token reused; access revoked');
  end if;
  if v_rt.expires_at < now() then
    return jsonb_build_object('error', 'invalid_grant', 'error_description', 'refresh_token expired');
  end if;

  update oauth.refresh_tokens set used_at = coalesce(used_at, now()) where id = v_rt.id;
  -- Scopes the user has since taken away don't come back on refresh.
  v_scopes := array(select s from unnest(v_rt.scopes) s where s = any (v_grant.scopes));
  if cardinality(v_scopes) = 0 then
    return jsonb_build_object('error', 'invalid_grant', 'error_description', 'access revoked');
  end if;
  delete from oauth.refresh_tokens t where t.grant_id = v_grant.id and t.used_at < now() - interval '1 day';

  return jsonb_build_object(
    'user_id', v_grant.user_id,
    'email', (select u.email from auth.users u where u.id = v_grant.user_id),
    'client_id', v_client.id,
    'scopes', to_jsonb(v_scopes),
    'refresh_token', oauth.issue_refresh(v_grant.id, v_scopes)
  );
end;
$$;

-- RFC 7009. Revoking a refresh token disconnects the app for that user (the
-- same as "Disconnect"); anything unknown is quietly fine, as the RFC asks.
create function public.oauth_svc_revoke(
  p_client_id text,
  p_client_secret text,
  p_token text
) returns jsonb
language plpgsql volatile
security definer
set search_path = ''
as $$
declare
  v_client oauth.clients := oauth.authenticate_client(p_client_id, p_client_secret);
begin
  if v_client.id is null then
    return jsonb_build_object('error', 'invalid_client', 'error_description', 'client authentication failed');
  end if;
  delete from oauth.grants g
  using oauth.refresh_tokens t
  where t.token_hash = oauth.sha256_hex(coalesce(p_token, ''))
    and g.id = t.grant_id
    and g.client_id = v_client.id;
  return '{}'::jsonb;
end;
$$;

-- An access token is a JWT, so revoke can't look it up; the edge function
-- verifies it and passes the claims here.
create function public.oauth_svc_revoke_access(
  p_client_id text,
  p_client_secret text,
  p_user uuid
) returns jsonb
language plpgsql volatile
security definer
set search_path = ''
as $$
declare
  v_client oauth.clients := oauth.authenticate_client(p_client_id, p_client_secret);
begin
  if v_client.id is null then
    return jsonb_build_object('error', 'invalid_client', 'error_description', 'client authentication failed');
  end if;
  delete from oauth.grants g where g.client_id = v_client.id and g.user_id = p_user;
  return '{}'::jsonb;
end;
$$;

revoke execute on function public.oauth_svc_authorize(text, text, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.oauth_svc_exchange_code(text, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.oauth_svc_refresh(text, text, text) from public, anon, authenticated;
revoke execute on function public.oauth_svc_revoke(text, text, text) from public, anon, authenticated;
revoke execute on function public.oauth_svc_revoke_access(text, text, uuid) from public, anon, authenticated;
grant execute on function public.oauth_svc_authorize(text, text, text, text, text, text) to service_role;
grant execute on function public.oauth_svc_exchange_code(text, text, text, text, text) to service_role;
grant execute on function public.oauth_svc_refresh(text, text, text) to service_role;
grant execute on function public.oauth_svc_revoke(text, text, text) to service_role;
grant execute on function public.oauth_svc_revoke_access(text, text, uuid) to service_role;

-- The oauth schema's own functions run inside the definer functions above;
-- nobody calls them directly.
revoke execute on all functions in schema oauth from public;
