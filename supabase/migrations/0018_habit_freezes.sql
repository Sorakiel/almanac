-- Streak freeze (заморозка): let a user protect a specific day for a habit so a
-- miss on that day doesn't break the streak. A frozen due-day is treated as a
-- skip in the streak walk — it neither breaks the run nor counts toward it.
-- Forgiving streaks are a core product value; this makes that deliberate and
-- per-day rather than automatic. Owner-scoped via RLS like every user table.

create table habit_freezes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  habit_id   uuid not null references habits (id) on delete cascade,
  date       date not null,
  created_at timestamptz not null default now(),
  unique (habit_id, date)
);
create index habit_freezes_user_date_idx on habit_freezes (user_id, date);
create index habit_freezes_habit_id_idx on habit_freezes (habit_id);

alter table habit_freezes enable row level security;

create policy "habit_freezes: select own" on habit_freezes
  for select using (user_id = auth.uid() or public.is_admin());
create policy "habit_freezes: insert own" on habit_freezes
  for insert with check (user_id = auth.uid());
create policy "habit_freezes: delete own" on habit_freezes
  for delete using (user_id = auth.uid());
