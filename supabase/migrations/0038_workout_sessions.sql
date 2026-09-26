-- Workout sessions: one row per workout per local day it was trained.
--
-- Until now a workout's set_logs were both the plan (how many sets, reps,
-- weight) and the record (done, logged_at), and completion was a single
-- workouts.completed_at. A recurring workout finished once therefore stayed
-- "done" forever, and there was no history to chart a weight against.
--
-- Now the rows with session_id null are the plan, and a session's own
-- set_logs rows are what was actually done that day. workouts.completed_at is
-- kept as "last completed" (max over sessions) so the analytics views, the
-- weekly digest and achievements read it unchanged.
--
-- Additive and lossless: every done set is copied into a backfilled session
-- before the plan rows are reset.

create table workout_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  workout_id   uuid not null references workouts (id) on delete cascade,
  date         date not null,
  started_at   timestamptz not null default now(),
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  unique (workout_id, date)
);
create index workout_sessions_user_id_date_idx on workout_sessions (user_id, date);

alter table workout_sessions enable row level security;

create policy "workout_sessions: select own" on workout_sessions
  for select using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "workout_sessions: insert own" on workout_sessions
  for insert with check (
    user_id = (select auth.uid())
    and exists (select 1 from workouts w where w.id = workout_id and w.user_id = (select auth.uid()))
  );
create policy "workout_sessions: update own" on workout_sessions
  for update using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "workout_sessions: delete own" on workout_sessions
  for delete using (user_id = (select auth.uid()));

alter table set_logs
  add column session_id uuid references workout_sessions (id) on delete cascade;
comment on column set_logs.session_id is
  'Null = the plan row; set = what was logged in that session.';
create index set_logs_session_id_idx on set_logs (session_id);
-- Nulls are distinct, so plan rows are unconstrained; one log per planned set per session.
alter table set_logs
  add constraint set_logs_session_set_key unique (session_id, workout_exercise_id, set_number);

-- A foreign key is checked without RLS, so nothing else stops a log row from
-- pointing at a session of another workout (or another user). The lookup runs
-- as the caller: a session they cannot see does not exist here.
create function set_logs_session_matches() returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.session_id is not null and not exists (
    select 1
    from workout_sessions s
    join workout_exercises we on we.workout_id = s.workout_id
    where s.id = new.session_id and we.id = new.workout_exercise_id
  ) then
    raise exception 'set_logs.session_id does not belong to this workout'
      using errcode = '23503';
  end if;
  return new;
end;
$$;

create trigger set_logs_session_matches
  before insert or update of session_id, workout_exercise_id on set_logs
  for each row execute function set_logs_session_matches();

-- ---------------------------------------------------------------------------
-- Backfill
-- ---------------------------------------------------------------------------

-- A session for every workout that was finished or has ticked sets, dated on
-- the owner's local calendar day of the finish (or the last tick).
insert into workout_sessions (user_id, workout_id, date, started_at, completed_at)
select
  w.user_id,
  w.id,
  (coalesce(w.completed_at, t.last_tick, now()) at time zone coalesce(p.timezone, 'UTC'))::date,
  coalesce(t.first_tick, w.completed_at, w.created_at),
  w.completed_at
from workouts w
left join profiles p on p.id = w.user_id
left join lateral (
  select min(sl.logged_at) as first_tick, max(sl.logged_at) as last_tick, bool_or(sl.done) as any_done
  from set_logs sl
  join workout_exercises we on we.id = sl.workout_exercise_id
  where we.workout_id = w.id
) t on true
where w.completed_at is not null or coalesce(t.any_done, false);

insert into set_logs (workout_exercise_id, set_number, reps, weight, done, logged_at, rest_seconds, session_id)
select sl.workout_exercise_id, sl.set_number, sl.reps, sl.weight, true, sl.logged_at, sl.rest_seconds, s.id
from set_logs sl
join workout_exercises we on we.id = sl.workout_exercise_id
join workout_sessions s on s.workout_id = we.workout_id
where sl.session_id is null and sl.done
on conflict (session_id, workout_exercise_id, set_number) do nothing;

update set_logs set done = false, logged_at = null
where session_id is null and (done or logged_at is not null);

-- ---------------------------------------------------------------------------
-- Writes the client makes (security invoker: RLS applies as usual)
-- ---------------------------------------------------------------------------

-- The session for a workout on a day, created on first use.
create function ensure_workout_session(p_workout_id uuid, p_date date) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into workout_sessions (user_id, workout_id, date)
  values ((select auth.uid()), p_workout_id, p_date)
  on conflict (workout_id, date) do update set date = excluded.date
  returning id into v_id;
  return v_id;
end;
$$;

-- Log one planned set in the day's session. Idempotent: a replayed offline
-- tick writes the same row again.
create function log_workout_set(
  p_workout_exercise_id uuid,
  p_set_number integer,
  p_date date,
  p_reps integer,
  p_weight numeric,
  p_done boolean,
  p_rest_seconds smallint default null
) returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_workout_id uuid;
  v_session_id uuid;
begin
  select we.workout_id into v_workout_id from workout_exercises we where we.id = p_workout_exercise_id;
  if v_workout_id is null then
    raise exception 'workout exercise not found' using errcode = 'P0002';
  end if;

  v_session_id := ensure_workout_session(v_workout_id, p_date);

  insert into set_logs (workout_exercise_id, set_number, reps, weight, done, logged_at, rest_seconds, session_id)
  values (
    p_workout_exercise_id, p_set_number, p_reps, p_weight, p_done,
    case when p_done then now() end, p_rest_seconds, v_session_id
  )
  on conflict (session_id, workout_exercise_id, set_number) do update set
    reps = excluded.reps,
    weight = excluded.weight,
    done = excluded.done,
    logged_at = case when excluded.done then coalesce(set_logs.logged_at, now()) end,
    rest_seconds = excluded.rest_seconds;
end;
$$;

-- Finish (or reopen) the day's session and keep workouts.completed_at as the
-- last finish, so a reopened day falls back to the one before it.
create function set_workout_session_done(p_workout_id uuid, p_date date, p_done boolean)
returns workouts
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_session_id uuid;
  v_workout workouts;
begin
  if p_done then
    v_session_id := ensure_workout_session(p_workout_id, p_date);
    update workout_sessions set completed_at = coalesce(completed_at, now()) where id = v_session_id;
  else
    -- A one-off is finished once, whichever day that was; reopening it means all of it.
    update workout_sessions s set completed_at = null
    where s.workout_id = p_workout_id
      and (s.date = p_date
        or exists (select 1 from workouts w where w.id = p_workout_id and w.recurrence = 'none'));
  end if;

  update workouts
  set completed_at = (select max(s.completed_at) from workout_sessions s where s.workout_id = p_workout_id)
  where id = p_workout_id
  returning * into v_workout;
  if v_workout.id is null then
    raise exception 'workout not found' using errcode = 'P0002';
  end if;
  return v_workout;
end;
$$;

revoke execute on function ensure_workout_session(uuid, date) from public, anon;
revoke execute on function log_workout_set(uuid, integer, date, integer, numeric, boolean, smallint) from public, anon;
revoke execute on function set_workout_session_done(uuid, date, boolean) from public, anon;
grant execute on function ensure_workout_session(uuid, date) to authenticated;
grant execute on function log_workout_set(uuid, integer, date, integer, numeric, boolean, smallint) to authenticated;
grant execute on function set_workout_session_done(uuid, date, boolean) to authenticated;
