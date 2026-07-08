-- Almanac — initial schema.
-- All user-owned tables carry user_id and are protected by RLS ("own rows").
-- Timestamps are timestamptz (UTC); habit_logs.date is the user's LOCAL
-- calendar date, computed client-side from profiles.timezone.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type user_role as enum ('user', 'admin');
create type habit_frequency as enum ('daily', 'weekly', 'x_per_week');
create type feedback_status as enum ('open', 'planned', 'done', 'closed');

-- ---------------------------------------------------------------------------
-- profiles — one row per auth user (created by trigger on signup)
-- ---------------------------------------------------------------------------
create table profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url   text,
  timezone     text        not null default 'UTC',
  role         user_role   not null default 'user',
  created_at   timestamptz not null default now()
);

-- Admin check as a SECURITY DEFINER function so admin RLS policies can read
-- the role without recursively triggering profiles' own RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Auto-provision a profile row when a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- habits
-- ---------------------------------------------------------------------------
create table habits (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  name         text not null,
  description  text,
  icon         text,
  color        text,
  frequency    habit_frequency not null default 'daily',
  target_count integer not null default 1 check (target_count > 0),
  sort_order   integer not null default 0,
  archived_at  timestamptz,
  created_at   timestamptz not null default now()
);
create index habits_user_id_idx on habits (user_id);

-- ---------------------------------------------------------------------------
-- habit_logs — one row per habit per local day
-- ---------------------------------------------------------------------------
create table habit_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  habit_id   uuid not null references habits (id) on delete cascade,
  date       date not null,
  count      integer not null default 1 check (count >= 0),
  note       text,
  created_at timestamptz not null default now(),
  unique (habit_id, date)
);
create index habit_logs_user_date_idx on habit_logs (user_id, date);

-- ---------------------------------------------------------------------------
-- workouts / exercises / sets
-- ---------------------------------------------------------------------------
create table workouts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  name           text not null,
  scheduled_date date,
  completed_at   timestamptz,
  created_at     timestamptz not null default now()
);
create index workouts_user_id_idx on workouts (user_id);

create table exercises (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  name         text not null,
  muscle_group text,
  created_at   timestamptz not null default now()
);
create index exercises_user_id_idx on exercises (user_id);

create table workout_exercises (
  id            uuid primary key default gen_random_uuid(),
  workout_id    uuid not null references workouts (id) on delete cascade,
  exercise_id   uuid not null references exercises (id) on delete restrict,
  target_sets   integer,
  target_reps   integer,
  target_weight numeric(6, 2),
  sort_order    integer not null default 0
);
create index workout_exercises_workout_id_idx on workout_exercises (workout_id);

create table set_logs (
  id                  uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references workout_exercises (id) on delete cascade,
  set_number          integer not null,
  reps                integer,
  weight              numeric(6, 2),
  done                boolean not null default false,
  logged_at           timestamptz
);
create index set_logs_we_id_idx on set_logs (workout_exercise_id);

-- ---------------------------------------------------------------------------
-- quotes — global, read-only to users
-- ---------------------------------------------------------------------------
create table quotes (
  id     uuid primary key default gen_random_uuid(),
  text   text not null,
  author text
);

-- ---------------------------------------------------------------------------
-- reflections / feedback
-- ---------------------------------------------------------------------------
create table reflections (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  date       date not null,
  body       text not null,
  quote_id   uuid references quotes (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);
create index reflections_user_date_idx on reflections (user_id, date);

create table feedback (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  body       text not null,
  status     feedback_status not null default 'open',
  created_at timestamptz not null default now()
);

-- ===========================================================================
-- Row-Level Security
-- ===========================================================================
alter table profiles          enable row level security;
alter table habits            enable row level security;
alter table habit_logs        enable row level security;
alter table workouts          enable row level security;
alter table exercises         enable row level security;
alter table workout_exercises enable row level security;
alter table set_logs          enable row level security;
alter table quotes            enable row level security;
alter table reflections       enable row level security;
alter table feedback          enable row level security;

-- profiles: read/update own; admins may read all.
create policy "profiles: select own" on profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles: update own" on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Helper macro pattern below is inlined per table (Postgres has no policy macros).

-- habits
create policy "habits: select own" on habits
  for select using (user_id = auth.uid() or public.is_admin());
create policy "habits: insert own" on habits
  for insert with check (user_id = auth.uid());
create policy "habits: update own" on habits
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "habits: delete own" on habits
  for delete using (user_id = auth.uid());

-- habit_logs
create policy "habit_logs: select own" on habit_logs
  for select using (user_id = auth.uid() or public.is_admin());
create policy "habit_logs: insert own" on habit_logs
  for insert with check (user_id = auth.uid());
create policy "habit_logs: update own" on habit_logs
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "habit_logs: delete own" on habit_logs
  for delete using (user_id = auth.uid());

-- workouts
create policy "workouts: select own" on workouts
  for select using (user_id = auth.uid() or public.is_admin());
create policy "workouts: insert own" on workouts
  for insert with check (user_id = auth.uid());
create policy "workouts: update own" on workouts
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "workouts: delete own" on workouts
  for delete using (user_id = auth.uid());

-- exercises
create policy "exercises: select own" on exercises
  for select using (user_id = auth.uid() or public.is_admin());
create policy "exercises: insert own" on exercises
  for insert with check (user_id = auth.uid());
create policy "exercises: update own" on exercises
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "exercises: delete own" on exercises
  for delete using (user_id = auth.uid());

-- workout_exercises: no user_id column — scope through the parent workout.
create policy "workout_exercises: select via workout" on workout_exercises
  for select using (
    exists (select 1 from workouts w where w.id = workout_id and (w.user_id = auth.uid() or public.is_admin()))
  );
create policy "workout_exercises: insert via workout" on workout_exercises
  for insert with check (
    exists (select 1 from workouts w where w.id = workout_id and w.user_id = auth.uid())
  );
create policy "workout_exercises: update via workout" on workout_exercises
  for update using (
    exists (select 1 from workouts w where w.id = workout_id and w.user_id = auth.uid())
  );
create policy "workout_exercises: delete via workout" on workout_exercises
  for delete using (
    exists (select 1 from workouts w where w.id = workout_id and w.user_id = auth.uid())
  );

-- set_logs: scope through workout_exercise → workout.
create policy "set_logs: select via workout" on set_logs
  for select using (
    exists (
      select 1 from workout_exercises we
      join workouts w on w.id = we.workout_id
      where we.id = workout_exercise_id and (w.user_id = auth.uid() or public.is_admin())
    )
  );
create policy "set_logs: insert via workout" on set_logs
  for insert with check (
    exists (
      select 1 from workout_exercises we
      join workouts w on w.id = we.workout_id
      where we.id = workout_exercise_id and w.user_id = auth.uid()
    )
  );
create policy "set_logs: update via workout" on set_logs
  for update using (
    exists (
      select 1 from workout_exercises we
      join workouts w on w.id = we.workout_id
      where we.id = workout_exercise_id and w.user_id = auth.uid()
    )
  );
create policy "set_logs: delete via workout" on set_logs
  for delete using (
    exists (
      select 1 from workout_exercises we
      join workouts w on w.id = we.workout_id
      where we.id = workout_exercise_id and w.user_id = auth.uid()
    )
  );

-- quotes: any authenticated user may read; nobody writes from the client.
create policy "quotes: read for authenticated" on quotes
  for select to authenticated using (true);

-- reflections
create policy "reflections: select own" on reflections
  for select using (user_id = auth.uid() or public.is_admin());
create policy "reflections: insert own" on reflections
  for insert with check (user_id = auth.uid());
create policy "reflections: update own" on reflections
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "reflections: delete own" on reflections
  for delete using (user_id = auth.uid());

-- feedback: users create and read their own; admins read all.
create policy "feedback: select own" on feedback
  for select using (user_id = auth.uid() or public.is_admin());
create policy "feedback: insert own" on feedback
  for insert with check (user_id = auth.uid());
