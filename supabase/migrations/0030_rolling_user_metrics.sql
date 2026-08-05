-- Rolling active-user and new-user counts, for Grafana.
--
-- `daily_activity` only ever showed a single day's distinct users, so the
-- existing "Active users · last 7 days" panel took max(active_users) over
-- 7 rows — the busiest single day, not the number of distinct people seen
-- across the window. With five users that gap barely shows; it will lie
-- once the roster grows. These views compute real trailing-window counts.

-- ---------------------------------------------------------------------------
-- Any product usage, one row per (user, day), across every logging surface.
-- ---------------------------------------------------------------------------
create or replace view analytics.user_activity_days as
select user_id, date as day from habit_logs where count >= 1
union
select user_id, completed_at::date as day from workouts where completed_at is not null
union
select user_id, date as day from reading_sessions
union
select user_id, date as day from reflections
union
select user_id, date as day from focus_sessions;

-- ---------------------------------------------------------------------------
-- Active users — trailing 7/30/100-day distinct counts, one row per day so
-- Grafana can plot the trend rather than just today's snapshot.
-- ---------------------------------------------------------------------------
create or replace view analytics.active_users_rolling as
with days as (
  select generate_series(current_date - 89, current_date, interval '1 day')::date as day
)
select
  d.day,
  (select count(distinct user_id) from analytics.user_activity_days a
     where a.day between d.day - 6 and d.day) as active_7d,
  (select count(distinct user_id) from analytics.user_activity_days a
     where a.day between d.day - 29 and d.day) as active_30d,
  (select count(distinct user_id) from analytics.user_activity_days a
     where a.day between d.day - 99 and d.day) as active_100d
from days d;

-- ---------------------------------------------------------------------------
-- New users — trailing 7/30/100-day signup counts, same shape.
-- ---------------------------------------------------------------------------
create or replace view analytics.new_users_rolling as
with days as (
  select generate_series(current_date - 89, current_date, interval '1 day')::date as day
)
select
  d.day,
  (select count(*) from profiles p
     where p.created_at::date between d.day - 6 and d.day) as new_users_7d,
  (select count(*) from profiles p
     where p.created_at::date between d.day - 29 and d.day) as new_users_30d,
  (select count(*) from profiles p
     where p.created_at::date between d.day - 99 and d.day) as new_users_100d
from days d;

-- Belt and braces alongside the schema-level default privilege from 0027.
grant select on
  analytics.user_activity_days,
  analytics.active_users_rolling,
  analytics.new_users_rolling
to analytics_reader;
