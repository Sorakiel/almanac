-- Checks for 0039_integration_api (today_habits / toggle_habit).
--
-- There is no local stack, so this runs against staging as one statement that
-- always ends in an exception: every fixture row is rolled back whether the
-- checks pass or not. Success reads "integration_api: all checks passed"; anything
-- else names the failed check.
--
-- Day under test: Saturday 2026-10-17 (weekdays habits rest).
do $test$
declare
  me constant uuid := 'a0000000-0000-4000-8000-0000000000a1';
  other constant uuid := 'a0000000-0000-4000-8000-0000000000a2';
  d constant date := '2026-10-17';
  r jsonb;
  ids text[];
  h_morning uuid := gen_random_uuid();   -- daily, morning, open
  h_water uuid := gen_random_uuid();     -- daily, evening, goal 3, 1 logged
  h_weekdays uuid := gen_random_uuid();  -- rests on Saturday
  h_interval_rest uuid := gen_random_uuid(); -- every 3 days, done yesterday
  h_interval_due uuid := gen_random_uuid();  -- every 3 days, done 3 days ago
  h_weekly uuid := gen_random_uuid();    -- weekly, time morning → slot week
  h_skipped uuid := gen_random_uuid();   -- frozen today, not done
  h_frozen_done uuid := gen_random_uuid(); -- frozen today but done → listed as done
  h_done uuid := gen_random_uuid();      -- done today
  h_archived uuid := gen_random_uuid();
  h_foreign uuid := gen_random_uuid();
begin
  insert into auth.users (id, instance_id, aud, role, email)
  values
    (me, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'api-test-me@example.invalid'),
    (other, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'api-test-other@example.invalid');

  insert into habits (id, user_id, name, frequency, target_count, daily_goal, time_of_day, sort_order, archived_at)
  values
    (h_done,          me, 'done',          'daily',        1, 1, 'morning',   0, null),
    (h_water,         me, 'water',         'daily',        1, 3, 'evening',   1, null),
    (h_morning,       me, 'morning',       'daily',        1, 1, 'morning',   2, null),
    (h_weekdays,      me, 'weekdays',      'weekdays',     1, 1, 'morning',   3, null),
    (h_interval_rest, me, 'interval rest', 'every_n_days', 3, 1, 'anytime',   4, null),
    (h_interval_due,  me, 'interval due',  'every_n_days', 3, 1, 'anytime',   5, null),
    (h_weekly,        me, 'weekly',        'weekly',       1, 1, 'morning',   6, null),
    (h_skipped,       me, 'skipped',       'daily',        1, 1, 'afternoon', 7, null),
    (h_frozen_done,   me, 'frozen done',   'daily',        1, 1, 'afternoon', 8, null),
    (h_archived,      me, 'archived',      'daily',        1, 1, 'morning',   9, now()),
    (h_foreign,    other, 'foreign',       'daily',        1, 1, 'morning',   0, null);

  insert into habit_logs (user_id, habit_id, date, count)
  values
    (me, h_done, d, 1),
    (me, h_water, d, 1),
    (me, h_interval_rest, d - 1, 1),
    (me, h_interval_due, d - 3, 1),
    (me, h_frozen_done, d, 1),
    (me, h_morning, d + 1, 1);  -- a later day must not count

  insert into habit_freezes (user_id, habit_id, date)
  values (me, h_skipped, d), (me, h_frozen_done, d);

  perform set_config('request.jwt.claims', json_build_object('sub', me, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- today_habits ------------------------------------------------------------
  r := today_habits(d);
  select array_agg(x->>'name' order by ord) into ids
  from jsonb_array_elements(r->'habits') with ordinality as t(x, ord);

  if ids is distinct from array['morning', 'water', 'interval due', 'weekly', 'done', 'frozen done'] then
    raise exception 'order/filter: got %', ids;
  end if;
  if (r->>'total')::int <> 6 or (r->>'done')::int <> 2 then
    raise exception 'totals: got done=% total=%', r->>'done', r->>'total';
  end if;
  if r->>'date' <> '2026-10-17' then
    raise exception 'date: got %', r->>'date';
  end if;
  if (select x from jsonb_array_elements(r->'habits') x where x->>'name' = 'water')
     <> jsonb_build_object('id', h_water, 'name', 'water', 'icon', null, 'color', null, 'unit', null,
                           'slot', 'evening', 'count', 1, 'goal', 3, 'done', false) then
    raise exception 'water row: got %', (select x from jsonb_array_elements(r->'habits') x where x->>'name' = 'water');
  end if;
  if (select x->>'slot' from jsonb_array_elements(r->'habits') x where x->>'name' = 'weekly') <> 'week' then
    raise exception 'weekly slot';
  end if;

  -- Monday: the weekdays habit is back.
  if not exists (select 1 from jsonb_array_elements(today_habits(d + 2)->'habits') x where x->>'name' = 'weekdays') then
    raise exception 'weekdays habit missing on Monday';
  end if;

  -- toggle_habit -----------------------------------------------------------
  r := toggle_habit(h_morning, d);   -- open → done
  if not exists (select 1 from jsonb_array_elements(r->'habits') x where x->>'name' = 'morning' and (x->>'done')::bool) then
    raise exception 'toggle did not complete morning: %', r;
  end if;
  if (r->>'done')::int <> 3 then
    raise exception 'done after toggle: %', r->>'done';
  end if;

  r := toggle_habit(h_morning, d);   -- done → cleared
  if exists (select 1 from habit_logs where habit_id = h_morning and date = d) then
    raise exception 'toggle did not clear morning';
  end if;

  r := toggle_habit(h_water, d);     -- 1/3 → 2/3
  r := toggle_habit(h_water, d);     -- 2/3 → 3/3, done
  if (select count from habit_logs where habit_id = h_water and date = d) <> 3 then
    raise exception 'water count after two taps';
  end if;
  r := toggle_habit(h_water, d);     -- done → cleared
  if exists (select 1 from habit_logs where habit_id = h_water and date = d) then
    raise exception 'toggle did not clear water';
  end if;

  begin
    perform toggle_habit(h_foreign, d);
    raise exception 'foreign toggle was allowed';
  exception when sqlstate 'P0002' then null;
  end;
  begin
    perform toggle_habit(h_archived, d);
    raise exception 'archived toggle was allowed';
  exception when sqlstate 'P0002' then null;
  end;
  if (select count from habit_logs where habit_id = h_foreign) is not null then
    raise exception 'foreign habit got a log';
  end if;

  -- anon cannot call it
  reset role;
  set local role anon;
  begin
    perform today_habits(d);
    raise exception 'anon could call today_habits';
  exception when insufficient_privilege then null;
  end;

  raise exception 'integration_api: all checks passed';
end
$test$;
