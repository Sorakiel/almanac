-- today_habits gives each habit its schedule and its last 64 days, so an
-- external client (the notch) can show the streak and the week the way the app
-- counts them (features/habits/lib/streak.ts runs on this history) instead of
-- guessing. Only keys are added: clients that read the old ones are unaffected.
--
--   frequency  habits.frequency ('daily', 'weekdays', 'every_n_days', ...)
--   target     habits.target_count (N of every_n_days / every_n_weeks)
--   history    64 characters, oldest first, the last one is p_date:
--              '1' done that day (count >= goal), 'f' frozen and not done, '0' else
--
-- 64 days is the window the app itself fetches (8 weeks + a buffer).

create or replace function oauth.today_habits_for(p_user uuid, p_date date) returns jsonb
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
      a.frequency::text as frequency, a.target_count,
      case when a.frequency in ('weekly', 'x_per_week') then 'week' else a.time_of_day::text end as slot,
      coalesce(l.count, 0) as count,
      coalesce(l.count, 0) >= a.goal as done,
      exists (select 1 from habit_freezes f where f.habit_id = a.id and f.date = p_date) as frozen,
      case a.frequency
        when 'weekdays' then extract(isodow from p_date) < 6
        when 'every_n_days' then last_done.d is null or p_date - last_done.d >= a.target_count
        when 'every_n_weeks' then last_done.d is null or p_date - last_done.d >= a.target_count * 7
        else true
      end as due,
      hist.s as history
    from active a
    left join habit_logs l on l.habit_id = a.id and l.date = p_date
    left join lateral (
      select max(x.date) as d
      from habit_logs x
      where x.habit_id = a.id
        and x.date between p_date - 63 and p_date
        and x.count >= a.goal
    ) last_done on true
    left join lateral (
      select string_agg(
        case
          when coalesce(x.count, 0) >= a.goal then '1'
          when exists (select 1 from habit_freezes f where f.habit_id = a.id and f.date = g.ts::date) then 'f'
          else '0'
        end,
        '' order by g.ts
      ) as s
      from generate_series((p_date - 63)::timestamp, p_date::timestamp, interval '1 day') as g(ts)
      left join habit_logs x on x.habit_id = a.id and x.date = g.ts::date
    ) hist on true
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
          'slot', slot, 'count', count, 'goal', goal, 'done', done,
          'frequency', frequency, 'target', target_count, 'history', history
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
