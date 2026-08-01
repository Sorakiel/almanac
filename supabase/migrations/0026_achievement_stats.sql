-- Aggregate the habit-log side of the achievement screen in the database.
--
-- The client used to pull `habit_logs.select('date, count')` with no filter at
-- all — the user's entire history, on every app load (the achievement query is
-- mounted by the celebration watchers in the app shell, not just by the
-- achievements page). That payload grows by one row per habit per day forever,
-- and only three numbers are ever derived from it: all-time check-offs, the
-- best run of consecutive days, and the current run.
--
-- Those three genuinely need deep history — the top tiers are 2500 check-offs
-- and a 100-day streak — so a date window would silently revoke badges people
-- had already earned. Computing them in SQL keeps them exact and makes the
-- response constant-size instead of linear in history.
--
-- SECURITY INVOKER: the function reads habit_logs as the caller, so RLS
-- applies as usual. `p_today` is the caller's *local* calendar date, which
-- only the client knows (profiles.timezone), so it comes in as an argument.

create or replace function public.achievement_stats(p_today date)
returns table (total_completions bigint, best_streak int, current_streak int)
language sql
stable
security invoker
set search_path = public
as $$
  with days as (
    select distinct date
    from habit_logs
    where user_id = (select auth.uid())
      and count >= 1
  ),
  -- Gaps and islands: consecutive dates share `date - row_number()`.
  islands as (
    select date, date - (row_number() over (order by date))::int as grp
    from days
  ),
  -- Today may legitimately still be blank, so the current run may end
  -- yesterday — same rule the client used.
  anchor as (
    select case
      when exists (select 1 from days where date = p_today) then p_today
      else p_today - 1
    end as day
  )
  select
    (
      select count(*)
      from habit_logs
      where user_id = (select auth.uid())
        and count >= 1
    ),
    coalesce((select max(len)::int from (select count(*) as len from islands group by grp) r), 0),
    coalesce((
      select ((select day from anchor) - min(i.date) + 1)::int
      from islands i
      where i.grp = (select grp from islands where date = (select day from anchor))
    ), 0);
$$;

comment on function public.achievement_stats(date) is
  'All-time habit check-offs plus best/current day streaks for the calling user.';

-- Postgres grants EXECUTE to PUBLIC by default; keep it off the anon surface
-- (see 0024). Revoking from anon alone is a no-op when the grant came via
-- PUBLIC.
revoke execute on function public.achievement_stats(date) from public, anon;
grant execute on function public.achievement_stats(date) to authenticated;
