-- Reflect gains structured daily ratings (mood, energy, overall day), and books
-- get a rating-change audit log for stats. All 1–5 scales; owner-scoped RLS.

alter table reflections
  add column mood       smallint check (mood is null or (mood between 1 and 5)),
  add column energy     smallint check (energy is null or (energy between 1 and 5)),
  add column day_rating smallint check (day_rating is null or (day_rating between 1 and 5));

-- One row per rating change, so we can chart how a book's rating evolved while
-- it was being read (and when it changed).
create table book_rating_events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  book_id      uuid not null references books (id) on delete cascade,
  rating       smallint not null check (rating between 1 and 5),
  current_unit integer not null default 0,
  created_at   timestamptz not null default now()
);
create index book_rating_events_book_id_idx on book_rating_events (book_id);
create index book_rating_events_user_idx on book_rating_events (user_id, created_at);

alter table book_rating_events enable row level security;

create policy "book_rating_events: select own" on book_rating_events
  for select using (user_id = auth.uid() or public.is_admin());
create policy "book_rating_events: insert own" on book_rating_events
  for insert with check (user_id = auth.uid());
create policy "book_rating_events: delete own" on book_rating_events
  for delete using (user_id = auth.uid());
