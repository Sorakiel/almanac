# daily-reminder edge function

Emails users a nudge when they still have daily habits left to complete, at the
local hour they chose in **Settings → Daily reminder**.

It runs with the service-role key (bypasses RLS) and sends mail through
[Resend](https://resend.com).

## Status: LIVE (deployed 2026-07-14)

The function is deployed (verify_jwt on) and an hourly pg_cron job
`almanac-daily-reminder` (`0 * * * *`) invokes it via pg_net with the anon JWT.
Verified end-to-end: a manual call returned `200 {"sent":0}`. The three secrets
(RESEND_API_KEY / REMINDER_FROM / APP_URL) are set. Reminders fire for any user
who enables one in Settings. NOTE: with a Resend account that has no verified
domain, delivery only reaches the Resend account owner's own address — friends'
reminders need a verified domain.

The steps below document how to re-create this setup from scratch.

## One-time setup

1. **Resend account + verified sender.** Create a Resend account, verify a domain
   (or use their onboarding sender for testing), and copy an API key.

2. **Set the function secrets:**

   ```sh
   supabase secrets set \
     RESEND_API_KEY="re_xxx" \
     REMINDER_FROM="Almanac <hello@yourdomain.com>" \
     APP_URL="https://almanac-psi-three.vercel.app"
   ```

   `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

3. **Deploy the function:**

   ```sh
   supabase functions deploy daily-reminder
   ```

4. **Schedule it hourly** so each user's chosen hour is checked. Run this once in
   the Supabase SQL editor (enables the extensions, then schedules an hourly
   call). Replace `<PROJECT_REF>` and `<ANON_OR_SERVICE_KEY>`:

   ```sql
   create extension if not exists pg_cron;
   create extension if not exists pg_net;

   select cron.schedule(
     'almanac-daily-reminder',
     '0 * * * *',  -- top of every hour (UTC)
     $$
     select net.http_post(
       url     := 'https://<PROJECT_REF>.functions.supabase.co/daily-reminder',
       headers := '{"Authorization": "Bearer <ANON_OR_SERVICE_KEY>", "Content-Type": "application/json"}'::jsonb
     );
     $$
   );
   ```

   The function itself decides who to email based on each profile's timezone +
   `reminder_hour`, so an hourly tick is all it needs.

## Test it

Trigger a run manually (it only emails users for whom it's currently their
reminder hour with unfinished daily habits):

```sh
curl -X POST 'https://<PROJECT_REF>.functions.supabase.co/daily-reminder' \
  -H 'Authorization: Bearer <ANON_OR_SERVICE_KEY>'
```

## Notes / limits

- The "unfinished" check currently only counts **daily** habits — a lightweight
  nudge, not a full cadence audit. Weekly / every-N / weekday cadences aren't
  chased yet; extend the query in `index.ts` if you want them included.
- One email per user per qualifying hour. Since it's scheduled hourly and matched
  to `reminder_hour`, a user gets at most one nudge per day.
