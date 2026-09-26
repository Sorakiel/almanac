-- Per-habit reminder (v0.6 Phase 4): "water at 11:00", apart from the one
-- daily nudge in profiles.reminder_*.
--
-- `reminder_at`: minutes since local midnight (0–1439) in the profile's
-- timezone; null = no reminder for this habit. Minutes rather than `time` so
-- the edge function compares plain integers, as it already does for the daily
-- nudge.
-- `reminder_sent_on`: the local day this habit's reminder last went out. The
-- cron tick runs every five minutes over a window, so without it a habit could
-- be nudged twice in one day.
--
-- No new RLS policy: the habits policies are per row, not per column.

alter table public.habits
  add column if not exists reminder_at smallint
    check (reminder_at between 0 and 1439),
  add column if not exists reminder_sent_on date;

comment on column public.habits.reminder_at is
  'Local minutes since midnight to remind about this habit; null = no reminder.';
comment on column public.habits.reminder_sent_on is
  'Local date the per-habit reminder was last sent (one per day).';

-- The edge function looks up only habits with a reminder on every tick.
create index if not exists habits_reminder_at_idx
  on public.habits (reminder_at)
  where reminder_at is not null and archived_at is null;
