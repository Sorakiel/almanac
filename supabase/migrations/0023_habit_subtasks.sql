-- Habit subtasks: an optional ordered checklist attached to a habit (e.g.
-- "Cold shower" -> rinse, 3min timer, stretch). A memory aid, not a gate on
-- the main habit completion — the one-tap complete toggle stays untouched.
-- Daily check state lives on the subtask itself as an array of local date
-- keys it was checked on, so no second per-day table is needed. Owner-scoped
-- via RLS like every user table.

create table habit_subtasks (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  habit_id         uuid not null references habits (id) on delete cascade,
  title            text not null,
  sort_order       integer not null default 0,
  completed_dates  date[] not null default '{}',
  created_at       timestamptz not null default now()
);
create index habit_subtasks_habit_id_idx on habit_subtasks (habit_id);

alter table habit_subtasks enable row level security;

create policy "habit_subtasks: select own" on habit_subtasks
  for select using (user_id = auth.uid() or public.is_admin());
create policy "habit_subtasks: insert own" on habit_subtasks
  for insert with check (user_id = auth.uid());
create policy "habit_subtasks: update own" on habit_subtasks
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "habit_subtasks: delete own" on habit_subtasks
  for delete using (user_id = auth.uid());
