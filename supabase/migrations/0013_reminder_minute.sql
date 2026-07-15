-- Minute-level precision for the daily reminder. Users can now pick any local
-- time (e.g. 02:17), not just the top of the hour. reminder_hour stays the hour
-- (0–23); reminder_minute is the minute (0–59). Existing rows default to :00,
-- preserving their current reminder time.

alter table public.profiles
  add column if not exists reminder_minute smallint not null default 0
    check (reminder_minute between 0 and 59);
