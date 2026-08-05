-- RET-7: weekly digest, delivered over Web Push (same mechanism as the daily
-- reminder — no new domain, no new infra, just a second thing the existing
-- push_subscriptions rows can receive).
--
-- Mirrors reminder_hour/reminder_minute/reminder_sent_on exactly, plus a
-- digest_day (0=Sunday..6=Saturday) since a weekly send needs a day as well
-- as a time. Off by default: this is a new, unsolicited notification and
-- should never turn itself on for an existing account.

alter table profiles
  add column if not exists digest_enabled boolean not null default false,
  add column if not exists digest_day smallint not null default 0,
  add column if not exists digest_hour smallint not null default 18,
  add column if not exists digest_minute smallint not null default 0,
  add column if not exists digest_sent_on date;

alter table profiles
  add constraint profiles_digest_day_check check (digest_day between 0 and 6),
  add constraint profiles_digest_hour_check check (digest_hour between 0 and 23),
  add constraint profiles_digest_minute_check check (digest_minute between 0 and 59);

comment on column profiles.digest_enabled is 'Opt-in for the weekly summary push.';
comment on column profiles.digest_day is 'Day of week to send the digest, 0=Sunday..6=Saturday, in the profile''s own timezone.';
comment on column profiles.digest_hour is 'Local hour (0-23) to send the digest.';
comment on column profiles.digest_minute is 'Local minute (0-59) to send the digest.';
comment on column profiles.digest_sent_on is
  'Local date the digest last sent, so a five-minute cron cannot send it twice in the same week.';
