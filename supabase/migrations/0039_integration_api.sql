-- Integration API: today's habits as the app counts them, and one tap as in
-- the app — for external clients that sign in as a user (documented in
-- docs/API.md).
--
-- An outside client would otherwise need its own copy of the "what is on
-- today" rules. These mirror the app: useHabits.join (isDueOn, dailyTarget,
-- skippedToday) + planToday (slots, order, dueCount) and useToggleHabit (a
-- completed habit clears, otherwise +1). Change those and these together.
-- The app itself does not call them; nothing existing changes.
--
-- Compatibility: fields of the returned object are only ever added. Removing
-- or changing one means a new function name, not an edit to these.
--
-- security invoker: RLS applies as for any other client write. The explicit
-- user_id = auth.uid() filter matters anyway — the habits select policy also
-- lets an admin read every row, and a client must only ever see its own.
--
-- Not done here: the streak-milestone activity event the app emits after a
-- closing tap. It needs the full streak (freezes, cadence) and is
-- best-effort in the app too; a milestone reached through the API goes
-- unannounced in the feed.

-- Today's list for p_date (the device's local calendar day), as
-- {date, done, total, habits: [{id, name, icon, color, unit, slot, count, goal, done}]}.
-- habits: what counts today (due or already done; a skipped day is left out),
-- open ones first by slot morning → afternoon → evening → anytime → week, then
-- the done ones; sort_order, created_at within each.
create function today_habits(p_date date) returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with active as (
    select h.*, greatest(1, h.daily_goal) as goal
    from habits h
    where h.user_id = (select auth.uid())
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
    -- Same 64-day window the client fetches (every 8 weeks + a buffer).
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

-- One tap on p_date: a completed habit is cleared, anything else gets +1.
-- Returns today_habits(p_date) so the caller redraws without a second request.
-- Raises P0002 for a habit that is not the caller's, archived or gone.
create function toggle_habit(p_habit uuid, p_date date) returns jsonb
language plpgsql
volatile
security invoker
set search_path = public
as $$
declare
  v_goal integer;
  v_count integer;
begin
  -- The row lock serialises taps on one habit, so two quick taps read as two.
  select greatest(1, h.daily_goal) into v_goal
  from habits h
  where h.id = p_habit
    and h.user_id = (select auth.uid())
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
    values ((select auth.uid()), p_habit, p_date, 1)
    on conflict (habit_id, date) do update set count = habit_logs.count + 1;
  end if;

  return today_habits(p_date);
end;
$$;

revoke execute on function today_habits(date) from public, anon;
revoke execute on function toggle_habit(uuid, date) from public, anon;
grant execute on function today_habits(date) to authenticated;
grant execute on function toggle_habit(uuid, date) to authenticated;
