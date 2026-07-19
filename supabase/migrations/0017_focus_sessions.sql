-- Deep Work stats: once a device-local Flow timer finishes, it records how many
-- minutes were focused and on what. These rows feed the Focus section + heatmap
-- in Insights. Owner-scoped via RLS, mirroring every other user table.
--
-- No target FK on purpose — a session stores only a free-text label so its
-- history survives deleting the habit/book/workout it was about.

create table focus_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  label      text,
  minutes    integer not null default 0 check (minutes >= 0),
  date       date not null,
  created_at timestamptz not null default now()
);
create index focus_sessions_user_date_idx on focus_sessions (user_id, date);

alter table focus_sessions enable row level security;

create policy "focus_sessions: select own" on focus_sessions
  for select using (user_id = auth.uid() or public.is_admin());
create policy "focus_sessions: insert own" on focus_sessions
  for insert with check (user_id = auth.uid());
create policy "focus_sessions: update own" on focus_sessions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "focus_sessions: delete own" on focus_sessions
  for delete using (user_id = auth.uid());
