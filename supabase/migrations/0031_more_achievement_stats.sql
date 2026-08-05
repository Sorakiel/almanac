-- Extend the achievement aggregates with training tonnage, deep-work minutes,
-- and time-of-day habit patterns (early bird / night owl) — same rationale as
-- 0026: a handful of numbers are derived from history that grows without
-- bound (set_logs, focus_sessions, habit_logs), and the achievements query is
-- mounted globally by the celebration watchers, not just the achievements
-- page. Folding the aggregation into SQL keeps it O(1) over the wire instead
-- of linear in a user's lifetime of data.
--
-- Local-hour bucketing needs the caller's IANA zone (created_at is UTC), so
-- this is a NEW overload — achievement_stats(date, text) — rather than
-- replacing achievement_stats(date). The old 1-arg version is left in place
-- so the currently-deployed frontend keeps working unmodified; a follow-up
-- migration drops it once the 2-arg-calling frontend is confirmed live.
--
-- SECURITY INVOKER, same as 0026: reads as the caller, RLS applies as usual.

create or replace function public.achievement_stats(p_today date, p_timezone text)
returns table (
  total_completions bigint,
  best_streak int,
  current_streak int,
  total_tonnage numeric,
  focus_minutes bigint,
  early_count bigint,
  late_count bigint
)
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
    ), 0),
    coalesce((
      select sum(coalesce(sl.reps, 0) * coalesce(sl.weight, 0))
      from set_logs sl
      join workout_exercises we on we.id = sl.workout_exercise_id
      join workouts w on w.id = we.workout_id
      where w.user_id = (select auth.uid())
        and sl.done
    ), 0),
    coalesce((
      select sum(minutes)
      from focus_sessions
      where user_id = (select auth.uid())
    ), 0),
    (
      select count(*)
      from habit_logs
      where user_id = (select auth.uid())
        and count >= 1
        and extract(hour from (created_at at time zone p_timezone)) < 7
    ),
    (
      select count(*)
      from habit_logs
      where user_id = (select auth.uid())
        and count >= 1
        and extract(hour from (created_at at time zone p_timezone)) >= 23
    );
$$;

comment on function public.achievement_stats(date, text) is
  'All-time achievement aggregates for the calling user: habit streaks/completions, training tonnage, focus minutes, and time-of-day habit patterns. Superset of achievement_stats(date), kept alongside it until the frontend calling the old signature is confirmed retired.';

-- Postgres grants EXECUTE to PUBLIC by default; keep it off the anon surface
-- (see 0024). Revoking from anon alone is a no-op when the grant came via
-- PUBLIC.
revoke execute on function public.achievement_stats(date, text) from public, anon;
grant execute on function public.achievement_stats(date, text) to authenticated;
