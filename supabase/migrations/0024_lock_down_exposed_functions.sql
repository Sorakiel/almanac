-- Trim the REST/RPC surface down to what the app actually calls.
--
-- Postgres grants EXECUTE on new functions to the PUBLIC role by default, and
-- Supabase's `anon`/`authenticated` roles inherit from it. Every function in
-- `public` therefore becomes a callable endpoint under /rest/v1/rpc/ unless
-- something takes the grant away. Several never should have been reachable.
--
-- Verified on the staging project before landing here: the first attempt
-- revoked from `anon` alone and changed nothing, because the grant came via
-- PUBLIC. Revoking from PUBLIC and re-granting to `authenticated` is what
-- actually moves the needle.

-- ---------------------------------------------------------------------------
-- 1. pg_net
-- ---------------------------------------------------------------------------
-- The extension is registered against the `public` schema, but its functions
-- live in `net`, which PostgREST does not publish — so this is defence in
-- depth, not an open door. Still, `anon` has no business holding EXECUTE on an
-- HTTP client: if `net` were ever added to the exposed schemas the grant would
-- turn into an SSRF primitive. Nothing in this app calls pg_net; Supabase's own
-- webhooks invoke it as a privileged role and are unaffected.
--
-- Done dynamically: the object list belongs to the extension and shifts
-- between versions, so enumerating it by hand would rot.
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_depend d on d.objid = p.oid and d.deptype = 'e'
    join pg_extension e on e.oid = d.refobjid and e.extname = 'pg_net'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', r.sig);
  end loop;

  for r in
    select c.oid::regclass as rel
    from pg_class c
    join pg_depend d on d.objid = c.oid and d.deptype = 'e'
    join pg_extension e on e.oid = d.refobjid and e.extname = 'pg_net'
    where c.relkind in ('r', 'v', 'm', 'S', 'p')
  loop
    execute format('revoke all on %s from public, anon, authenticated', r.rel);
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- 2. Orphaned trigger function
-- ---------------------------------------------------------------------------
-- `prevent_role_change` exists in production but in no migration and no source
-- file — a leftover from an earlier take on the role lock that was renamed to
-- `prevent_role_escalation` (migration 0006) without dropping the original. It
-- has been sitting on the REST surface as a SECURITY DEFINER function ever
-- since. Found by diffing production's advisors against a staging project
-- rebuilt from these migrations.
drop function if exists public.prevent_role_change();

-- ---------------------------------------------------------------------------
-- 3. Trigger functions are never called directly
-- ---------------------------------------------------------------------------
-- A trigger fires independently of EXECUTE grants (same reasoning as 0002's
-- treatment of handle_new_user), so no client role needs this one.
revoke all on function public.prevent_role_escalation() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. RLS helpers
-- ---------------------------------------------------------------------------
-- `authenticated` MUST keep EXECUTE: policy expressions are evaluated with the
-- querying role's privileges, and these two are referenced by 43 policies
-- between them — revoking there would break reads across the whole app. Only
-- anonymous callers lose access, and the app makes no anonymous table reads
-- (the signed-out screen calls landing_stats and nothing else).
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

revoke execute on function public.is_owner() from public, anon;
grant execute on function public.is_owner() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Deliberately left alone
-- ---------------------------------------------------------------------------
-- public.landing_stats() stays anon-callable. Supabase's advisor flags it, but
-- anonymous access is the entire point: it feeds the community counters on the
-- signed-out /auth screen (migration 0005, features/auth/api/landingStats.api.ts).
-- Revoking it would silently blank that panel.
