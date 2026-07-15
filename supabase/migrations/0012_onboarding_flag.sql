-- Persist first-run onboarding completion on the profile so it survives across
-- devices and re-logins. It was previously kept only in localStorage, so a
-- skipped/completed onboarding kept reappearing on every new device.
--
-- Existing users are backfilled as already onboarded; only brand-new signups
-- (column default false) see the welcome flow. The existing "profiles: update
-- own" policy already lets a user set this column, and the 0006 role-lock
-- trigger only guards `role`, so no new policy is needed.

alter table public.profiles
  add column if not exists onboarded boolean not null default false;

update public.profiles set onboarded = true where onboarded = false;
