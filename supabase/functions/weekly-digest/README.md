# weekly-digest edge function

Pushes a one-line summary of the last 7 days — habit check-ins, workouts
completed, pages read — at the local day and time chosen in **Settings →
Weekly digest**. Off by default.

Shares delivery with `daily-reminder`: same Web Push mechanism, same
`push_subscriptions` rows, same VAPID secrets. No new infrastructure.

## Why the content is simple

The count queries are deliberately dumb — total check-ins, total completed
workouts, total pages read over the last 7 days — rather than reimplementing
the client's streak/due-today/frequency logic in Deno. A summary that's
occasionally rounder than the app's own numbers is fine; a summary that
silently drifts from them because two implementations disagree is not. If a
user has nothing to report (no check-ins, no workouts, no reading), the
digest is skipped rather than sent empty.

## One-time setup

Requires the same secrets as `daily-reminder` — if that function is already
deployed, skip straight to step 3.

1. **Function secrets** (same VAPID pair `daily-reminder` uses):

   ```sh
   supabase secrets set \
     VAPID_PUBLIC_KEY="B..." \
     VAPID_PRIVATE_KEY="..." \
     VAPID_SUBJECT="mailto:you@example.com" \
     APP_URL="https://almanac-sorakiels-projects.vercel.app"
   ```

2. **Deploy:**

   ```sh
   supabase functions deploy weekly-digest
   ```

3. **Schedule it every five minutes**, same cadence as the daily reminder —
   the function itself decides who's actually due, matching a day-of-week
   *and* a five-minute time window per profile. Run once in the SQL editor,
   replacing `<PROJECT_REF>` and `<ANON_OR_SERVICE_KEY>`:

   ```sql
   select cron.schedule(
     'almanac-weekly-digest',
     '*/5 * * * *',
     $$
     select net.http_post(
       url     := 'https://<PROJECT_REF>.functions.supabase.co/weekly-digest',
       headers := '{"Authorization": "Bearer <ANON_OR_SERVICE_KEY>", "Content-Type": "application/json"}'::jsonb
     );
     $$
   );
   ```

## Test it

```sh
curl -X POST 'https://<PROJECT_REF>.functions.supabase.co/weekly-digest' \
  -H 'Authorization: Bearer <ANON_OR_SERVICE_KEY>'
```

Answers `{"sent":N,"pruned":M}`. `{"sent":0}` is the normal answer almost
always — it only fires for someone whose local day+time just matched their
chosen digest slot AND who has something to report.

## Notes / limits

- One push per subscribed browser, same as the daily reminder — someone with
  a phone and a laptop gets one on each.
- `digest_sent_on` caps delivery at once per local day, mirroring
  `reminder_sent_on` — a five-minute window can otherwise qualify more than
  once.
- Reuses the exact `push_subscriptions` rows the daily reminder uses. Turning
  the digest off in Settings must not unsubscribe the browser if the daily
  reminder is still on — see `DigestSheet.tsx` / `ReminderSheet.tsx` for how
  the client keeps that shared resource straight.
