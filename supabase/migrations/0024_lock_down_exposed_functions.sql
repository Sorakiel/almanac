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
-- 1. pg_net — deliberately NOT touched
-- ---------------------------------------------------------------------------
-- Supabase's advisor flags pg_net as an extension in `public`, and anon does
-- hold EXECUTE on its HTTP functions. An earlier draft of this migration
-- revoked those grants. Two reasons it isn't here:
--
--   * It would not have worked. The functions are owned by `supabase_admin`
--     and migrations run as `postgres`; a REVOKE by a non-owner raises a
--     WARNING and changes nothing. The migration would have reported success
--     while doing nothing at all — worse than leaving it alone, because the
--     next reader would believe it was handled.
--
--   * It would have been harmful if it had worked. pg_net is load-bearing:
--     the hourly `almanac-daily-reminder` pg_cron job calls net.http_post to
--     invoke the daily-reminder edge function. Dropping the PUBLIC grant could
--     have stopped every reminder email.
--
-- The exposure is also smaller than the advisor implies: the functions live in
-- schema `net`, which PostgREST does not publish, so they are not reachable
-- over the REST API regardless of the grant.
--
-- ---------------------------------------------------------------------------
-- 2. The undocumented role-lock trigger
-- ---------------------------------------------------------------------------
-- `prevent_role_change` appears in no migration and no source file, so it read
-- as orphaned — but it is not. A live trigger, `profiles_no_self_role_change`
-- on public.profiles, depends on it. Production refused the DROP, which is the
-- only reason this surfaced: staging, rebuilt from these migrations, contains
-- neither the function nor the trigger, so it could not have caught this.
--
-- On inspection it is the earlier, weaker sibling of prevent_role_escalation
-- (0007): it lets any admin change a role, where the newer one demands the
-- owner and forbids touching the `owner` role at all. Both fire BEFORE UPDATE
-- on profiles and both must pass, so the stricter one already governs every
-- case this would permit — it is redundant rather than load-bearing.
--
-- Redundant is not the same as safe to delete, and removing a security guard
-- deserves its own deliberate change rather than riding along with a lint fix.
-- So this migration only takes it off the REST surface; the trigger keeps
-- working exactly as before.
revoke all on function public.prevent_role_change() from public, anon, authenticated;

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
