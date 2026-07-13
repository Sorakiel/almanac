-- Daily email reminder preferences on the profile.
-- reminder_hour is the user's LOCAL hour (0–23); the reminder edge function
-- resolves it against profiles.timezone so 08:00 means 08:00 where they live.
-- No new RLS policy needed: the existing "profiles: update own" policy already
-- lets a user patch these columns, and the 0006 role-lock trigger only guards
-- the `role` column.

alter table public.profiles
  add column if not exists reminder_enabled boolean not null default false,
  add column if not exists reminder_hour smallint not null default 8
    check (reminder_hour between 0 and 23);
