-- Public landing stats for the pre-auth brand panel.
--
-- The /auth screen has no session, and members / longest streak / avg
-- completion are aggregates across ALL users that per-user RLS would never
-- expose. A SECURITY DEFINER function is the RLS-safe way to publish a few
-- community-level counters (no PII, no per-user rows) to anonymous visitors.

create or replace function public.landing_stats()
returns table (members integer, longest_streak integer, avg_completion integer)
language sql
security definer
set search_path = public
stable
as $$
  -- Distinct calendar days each habit hit its target (a completed day).
  with done as (
    select l.habit_id, l.date
    from habit_logs l
    join habits h on h.id = l.habit_id
    where l.count >= greatest(coalesce(h.target_count, 1), 1)
    group by l.habit_id, l.date
  ),
  -- Gaps-and-islands: consecutive days share one group key per habit.
  islands as (
    select habit_id,
           date - (row_number() over (partition by habit_id order by date))::int as grp
    from done
  ),
  runs as (
    select count(*) as len from islands group by habit_id, grp
  ),
  -- Completion over the last 30 days, scoped to daily habits so the
  -- "expected days" denominator is well defined.
  daily_habits as (
    select count(*) as n from habits
    where frequency = 'daily' and archived_at is null
  ),
  daily_done as (
    select count(*) as c
    from habit_logs l
    join habits h on h.id = l.habit_id
    where h.frequency = 'daily'
      and h.archived_at is null
      and l.date > current_date - 30
      and l.count >= greatest(coalesce(h.target_count, 1), 1)
  )
  select
    (select count(*)::int from profiles),
    (select coalesce(max(len), 0)::int from runs),
    case
      when (select n from daily_habits) = 0 then 0
      else least(
        round(100.0 * (select c from daily_done) / ((select n from daily_habits) * 30.0))::int,
        100
      )
    end;
$$;

grant execute on function public.landing_stats() to anon, authenticated;
