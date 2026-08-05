# daily-reminder edge function

Pushes users a nudge when they still have daily habits left to complete, at the
local time they chose in **Settings → Daily reminder** — hour _and_ minute.

It runs with the service-role key (bypasses RLS) and delivers over **Web Push**.

## Why not email any more

It used to send mail through Resend, and it worked — for exactly one person.
Resend only delivers from a verified domain; without one, mail reaches nobody but
the Resend account owner. Buying a domain isn't on the table, so for four of five
users the reminder toggle switched on nothing at all. Web Push needs no domain
and no money, and it reaches the phone rather than an inbox nobody reads.

The trade: on iOS, Web Push only works once Almanac is added to the home screen
(that's an Apple restriction, not ours). Android and desktop browsers need no
such step. The PWA manifest that makes the iOS install possible shipped in the
same release.

## Status

Deployed on **staging** and verified as far as the environment allows:

- the `push_subscriptions` table, its RLS (own rows only, cross-user insert
  refused with 42501) and the endpoint upsert path — verified;
- the service worker registers, activates, and carries the push +
  notificationclick handlers — verified;
- **actual delivery is unverified.** The sandboxed browser used for development
  reports `Notification.permission = "denied"` and will not hand out a push
  subscription, so nothing here has yet pushed a real message to a real device.
  First real proof has to come from a phone or a normal desktop browser.

## One-time setup

1. **Generate a VAPID key pair.** The public half goes to the client, the private
   half never leaves the server:

   ```sh
   node -e "const c=require('crypto');const{publicKey,privateKey}=c.generateKeyPairSync('ec',{namedCurve:'prime256v1'});console.log('PUBLIC='+publicKey.export({type:'spki',format:'der'}).subarray(-65).toString('base64url'));console.log('PRIVATE='+privateKey.export({format:'jwk'}).d)"
   ```

2. **Set the function secrets:**

   ```sh
   supabase secrets set \
     VAPID_PUBLIC_KEY="B..." \
     VAPID_PRIVATE_KEY="..." \
     VAPID_SUBJECT="mailto:you@example.com" \
     APP_URL="https://almanac-sorakiels-projects.vercel.app"
   ```

   `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

3. **Put the same public key in the client**, as `VITE_VAPID_PUBLIC_KEY` — in
   `.env.local` and in the Vercel environment variables. The two must match, or
   subscriptions are created against one key and signed with another and every
   push is rejected.

4. **Deploy the function:**

   ```sh
   supabase functions deploy daily-reminder
   ```

5. **Schedule it every five minutes** so each user's chosen time is checked.
   Hourly would silently round everyone's reminder down to `:00`. Run once in
   the Supabase SQL editor, replacing `<PROJECT_REF>` and `<ANON_OR_SERVICE_KEY>`:

   ```sql
   create extension if not exists pg_cron;
   create extension if not exists pg_net;

   select cron.schedule(
     'almanac-daily-reminder',
     '*/5 * * * *',  -- every five minutes
     $$
     select net.http_post(
       url     := 'https://<PROJECT_REF>.functions.supabase.co/daily-reminder',
       headers := '{"Authorization": "Bearer <ANON_OR_SERVICE_KEY>", "Content-Type": "application/json"}'::jsonb
     );
     $$
   );
   ```

   The function decides who to notify from each profile's timezone and reminder
   time, firing when local time has just passed it (never before). Because a
   user can qualify on more than one tick, `profiles.reminder_sent_on` caps it at
   one nudge per local day.

## Test it

```sh
curl -X POST 'https://<PROJECT_REF>.functions.supabase.co/daily-reminder' \
  -H 'Authorization: Bearer <ANON_OR_SERVICE_KEY>'
```

It answers `{"sent":N,"pruned":M}`. `sent` counts accepted pushes; `pruned`
counts subscriptions the push service reported as gone (404/410) and that were
deleted — a browser that was uninstalled or had its data cleared. It only
notifies people for whom it is currently their reminder hour _and_ who have
unfinished daily habits, so `{"sent":0}` is the normal answer most of the time.

## Notes / limits

- The "unfinished" check counts **daily** habits only — a lightweight nudge, not
  a cadence audit. Weekly / every-N / weekday cadences aren't chased yet.
- One notification per subscribed browser per qualifying hour. Someone with a
  laptop and a phone gets one on each; that is deliberate, since we cannot know
  which device they are holding.
- `RESEND_API_KEY` and `REMINDER_FROM` are no longer read. They can be removed
  from the function secrets whenever convenient.
