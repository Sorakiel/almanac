-- Richer "Repeats" model + a time-of-day preference for habits.
--
-- New cadences:
--   'weekdays'      — due Mon–Fri only (day-of-week gated client-side).
--   'every_n_weeks' — "once every N weeks"; interval N stored in target_count,
--                     mirroring how 'every_n_days' reuses that slot.
alter type habit_frequency add value if not exists 'weekdays';
alter type habit_frequency add value if not exists 'every_n_weeks';

-- Optional time-of-day nudge shown on the habit. 'anytime' is the neutral
-- default so existing rows need no backfill.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'habit_time_of_day') then
    create type habit_time_of_day as enum ('anytime', 'morning', 'afternoon', 'evening');
  end if;
end
$$;

alter table habits
  add column if not exists time_of_day habit_time_of_day not null default 'anytime';
