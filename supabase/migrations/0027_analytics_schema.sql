-- An `analytics` schema of aggregate views, for Grafana.
--
-- PostHog answers "which screens do people open". This answers the other half:
-- what is actually in the database — who is still active, which modules have
-- ever been used by anyone, and whether the user count is going anywhere.
--
-- Three rules hold every view here together:
--
--   1. **Aggregates only.** No row ids, no names, no bodies. A dashboard the
--      owner leaves open on a second monitor must not be able to show a
--      friend's habit names or journal entries. Counts and dates only.
--   2. **The views bypass RLS on purpose.** They are SECURITY DEFINER by
--      default (owned by `postgres`, no `security_invoker`), because a
--      cross-user aggregate is exactly what RLS would otherwise prevent. That
--      is why rule 1 is not negotiable — it is the only thing standing between
--      this schema and everyone's data.
--   3. **Nothing here is reachable from the app.** The schema is not exposed
--      through PostgREST, and `anon`/`authenticated` get no privileges on it.
--
-- The reader role is created without a password: a password in a migration
-- would be a password in a public repository. Set one out of band, once:
--
--     alter role analytics_reader with password '<generated>';
--
-- and put it only in the Grafana data source.

create schema if not exists analytics;

-- ---------------------------------------------------------------------------
-- Daily activity — is anyone still using this?
-- ---------------------------------------------------------------------------
create or replace view analytics.daily_activity as
with days as (
  select generate_series(current_date - 89, current_date, interval '1 day')::date as day
)
select
  d.day,
  (select count(distinct user_id) from habit_logs l where l.date = d.day and l.count >= 1)
    as active_users,
  (select count(*) from habit_logs l where l.date = d.day and l.count >= 1)
    as habit_completions,
  (select count(*) from workouts w where w.completed_at::date = d.day)
    as workouts_completed,
  (select count(*) from reading_sessions r where r.date = d.day)
    as reading_sessions,
  (select count(*) from reflections f where f.date = d.day)
    as reflections_written,
  (select count(*) from focus_sessions s where s.date = d.day)
    as focus_sessions
from days d;

-- ---------------------------------------------------------------------------
-- Module adoption — the audit's "breadth outran depth", as a query
-- ---------------------------------------------------------------------------
create or replace view analytics.module_adoption as
select 'habits' as module,
       (select count(*) from habits) as rows_total,
       (select count(distinct user_id) from habits) as users_ever,
       (select max(date) from habit_logs) as last_activity
union all
select 'workouts',
       (select count(*) from workouts),
       (select count(distinct user_id) from workouts),
       (select max(completed_at)::date from workouts)
union all
select 'reading',
       (select count(*) from books),
       (select count(distinct user_id) from books),
       (select max(date) from reading_sessions)
union all
select 'reflect',
       (select count(*) from reflections),
       (select count(distinct user_id) from reflections),
       (select max(date) from reflections)
union all
select 'flow',
       (select count(*) from focus_sessions),
       (select count(distinct user_id) from focus_sessions),
       (select max(date) from focus_sessions)
union all
select 'social',
       (select count(*) from friendships),
       (select count(distinct requester_id) from friendships),
       (select max(created_at)::date from friendships)
union all
select 'achievements',
       (select count(*) from achievement_grants),
       (select count(distinct user_id) from achievement_grants),
       (select max(created_at)::date from achievement_grants);

-- ---------------------------------------------------------------------------
-- User growth — small numbers, but the trend is the point
-- ---------------------------------------------------------------------------
create or replace view analytics.user_growth as
select week, signups, sum(signups) over (order by week) as total_users
from (
  select date_trunc('week', created_at)::date as week, count(*) as signups
  from profiles
  group by 1
) weekly
order by week;

-- ---------------------------------------------------------------------------
-- Reader role — read-only, this schema only
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'analytics_reader') then
    create role analytics_reader login;
  end if;
end
$$;

grant usage on schema analytics to analytics_reader;
grant select on all tables in schema analytics to analytics_reader;
alter default privileges in schema analytics grant select on tables to analytics_reader;

-- Belt and braces: the reader must not be able to reach the base tables, and
-- the app roles must not be able to reach the aggregates.
revoke all on schema analytics from anon, authenticated;
revoke all on schema public from analytics_reader;
