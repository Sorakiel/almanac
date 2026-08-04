-- Make the daily reminder respect the minute the user actually chose.
--
-- Settings offers a time picker down to the minute, and the sender only ever
-- compared the hour — so a reminder set for 13:25 arrived at 13:00, if it
-- arrived at all. The pg_cron schedule moves to every five minutes and the
-- function matches a five-minute window, which means a run can now qualify
-- more than once per day. This column is the guard: one nudge per local day,
-- whatever the cron does.

alter table profiles
  add column if not exists reminder_sent_on date;

comment on column profiles.reminder_sent_on is
  'Local date of the last daily reminder sent, so a five-minute cron cannot nudge twice.';
