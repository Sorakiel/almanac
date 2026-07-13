-- Reading module: a personal library with progress, notes, and reading sessions.
--
-- Progress is tracked by pages OR chapters (`progress_mode`); `current_unit` is
-- the page/chapter reached and `total_units` the optional length. A book moves
-- to_read → reading → finished, with `started_on` / `finished_on` dates. Notes
-- can reference a page. Reading sessions (logged from Flow) build a history and
-- feed reading stats. All tables are owner-scoped via RLS — no cross-user access
-- beyond the existing admin read.

create type book_progress_mode as enum ('pages', 'chapters');
create type book_status as enum ('to_read', 'reading', 'finished');

create table books (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  title         text not null,
  author        text,
  progress_mode book_progress_mode not null default 'pages',
  total_units   integer check (total_units is null or total_units >= 0),
  current_unit  integer not null default 0 check (current_unit >= 0),
  status        book_status not null default 'to_read',
  started_on    date,
  finished_on   date,
  rating        smallint check (rating is null or (rating >= 1 and rating <= 5)),
  created_at    timestamptz not null default now()
);
create index books_user_id_idx on books (user_id);

create table book_notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  book_id    uuid not null references books (id) on delete cascade,
  body       text not null,
  page       integer check (page is null or page >= 0),
  created_at timestamptz not null default now()
);
create index book_notes_book_id_idx on book_notes (book_id);

create table reading_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  book_id    uuid not null references books (id) on delete cascade,
  minutes    integer not null default 0 check (minutes >= 0),
  units_read integer not null default 0 check (units_read >= 0),
  date       date not null,
  created_at timestamptz not null default now()
);
create index reading_sessions_book_id_idx on reading_sessions (book_id);
create index reading_sessions_user_date_idx on reading_sessions (user_id, date);

-- ===========================================================================
-- Row-Level Security — owner-scoped, mirroring every other user table.
-- ===========================================================================
alter table books            enable row level security;
alter table book_notes       enable row level security;
alter table reading_sessions enable row level security;

-- books
create policy "books: select own" on books
  for select using (user_id = auth.uid() or public.is_admin());
create policy "books: insert own" on books
  for insert with check (user_id = auth.uid());
create policy "books: update own" on books
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "books: delete own" on books
  for delete using (user_id = auth.uid());

-- book_notes
create policy "book_notes: select own" on book_notes
  for select using (user_id = auth.uid() or public.is_admin());
create policy "book_notes: insert own" on book_notes
  for insert with check (user_id = auth.uid());
create policy "book_notes: update own" on book_notes
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "book_notes: delete own" on book_notes
  for delete using (user_id = auth.uid());

-- reading_sessions
create policy "reading_sessions: select own" on reading_sessions
  for select using (user_id = auth.uid() or public.is_admin());
create policy "reading_sessions: insert own" on reading_sessions
  for insert with check (user_id = auth.uid());
create policy "reading_sessions: update own" on reading_sessions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "reading_sessions: delete own" on reading_sessions
  for delete using (user_id = auth.uid());
