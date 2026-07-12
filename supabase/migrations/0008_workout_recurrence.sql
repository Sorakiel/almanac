-- Workout scheduling: let a workout recur instead of being a one-off.
--
-- `recurrence` picks the cadence; the extra columns carry its parameters:
--   none         → a one-off on `scheduled_date` (unchanged behaviour)
--   daily        → every day
--   weekdays     → on the weekdays in `recurrence_days` (0=Sun … 6=Sat)
--   every_n_days → every `recurrence_interval` days, anchored at `scheduled_date`
--
-- No RLS change — the existing workouts policies already scope to the owner.

create type workout_recurrence as enum ('none', 'daily', 'weekdays', 'every_n_days');

alter table workouts
  add column recurrence workout_recurrence not null default 'none',
  add column recurrence_days smallint[],
  add column recurrence_interval integer
    check (recurrence_interval is null or recurrence_interval > 0);
