-- Optional per-book daily reading goal: read N units/day, where a "unit" is a
-- page or chapter depending on the book's progress_mode. Null means no goal.
-- Today's progress toward it is derived client-side from reading_sessions on the
-- local date, so no extra columns are needed for tracking.

alter table public.books
  add column if not exists daily_goal integer
    check (daily_goal is null or daily_goal >= 1);
