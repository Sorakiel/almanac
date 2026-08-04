// Almanac daily reminder — Web Push.
//
// Invoke this every five minutes (see README.md for the pg_cron schedule). On
// each run it finds users whose local time has just passed the reminder time
// they chose, still have daily habits left to finish today, and pushes them a
// nudge.
//
// It used to run hourly and compare only the hour, which quietly discarded the
// minute the user picked in Settings: 13:25 fired at 13:00. Matching a window
// means a user can qualify on more than one tick, so `profiles.reminder_sent_on`
// caps it at one nudge per local day.
//
// This used to send email through Resend. Resend will only deliver from a
// verified domain, there is no domain, and buying one isn't on the table — so
// for four of five people the reminder toggle switched on nothing at all. Web
// Push needs no domain and no money.
//
// Runs with the SERVICE ROLE key (bypasses RLS) — deploy it as a Supabase Edge
// Function, never ship this key to the browser.
//
// Required function secrets (supabase secrets set ...):
//   VAPID_PUBLIC_KEY   — same key the client subscribes with
//   VAPID_PRIVATE_KEY  — its pair; server only
//   VAPID_SUBJECT      — contact URI, e.g. "mailto:you@example.com"
//   APP_URL            — app origin the notification opens
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

interface ReminderProfile {
  id: string
  timezone: string
  reminder_hour: number
  reminder_minute: number
  reminder_sent_on: string | null
}

/** How wide a window a single cron tick covers, in minutes. */
const TICK_MINUTES = 5

interface StoredSubscription {
  id: string
  endpoint: string
  p256dh: string
  auth: string
}

/** Minutes since local midnight in the given IANA timezone. */
function localMinutes(timezone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(new Date())
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0') % 24
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0')
  return hour * 60 + minute
}

/**
 * Whether `now` has just passed the chosen time, within one cron tick.
 *
 * Deliberately "at or just after", never "just before": a reminder that arrives
 * early is a reminder for a time the user did not pick.
 */
function isDue(nowMinutes: number, target: number): boolean {
  const delta = nowMinutes - target
  return delta >= 0 && delta < TICK_MINUTES
}

/** Today's calendar date (YYYY-MM-DD) in the given timezone. */
function localDateKey(timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

// deno-lint-ignore no-explicit-any
function statusOf(error: any): number | undefined {
  return typeof error?.statusCode === 'number' ? error.statusCode : undefined
}

Deno.serve(async () => {
  const publicKey = Deno.env.get('VAPID_PUBLIC_KEY')
  const privateKey = Deno.env.get('VAPID_PRIVATE_KEY')
  const subject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:almanac@example.com'
  const appUrl = Deno.env.get('APP_URL') ?? '/'
  if (!publicKey || !privateKey) {
    console.error('Missing VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY')
    return new Response(JSON.stringify({ error: 'vapid keys not configured' }), { status: 500 })
  }
  webpush.setVapidDetails(subject, publicKey, privateKey)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, timezone, reminder_hour, reminder_minute, reminder_sent_on')
    .eq('reminder_enabled', true)
  if (error) {
    console.error('profiles query failed', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  let sent = 0
  let pruned = 0

  for (const profile of (profiles ?? []) as ReminderProfile[]) {
    const timezone = profile.timezone || 'UTC'
    const today = localDateKey(timezone)
    if (profile.reminder_sent_on === today) continue
    const target = profile.reminder_hour * 60 + (profile.reminder_minute ?? 0)
    if (!isDue(localMinutes(timezone), target)) continue

    // Count active daily habits vs. those already logged today. We limit the
    // "due" check to daily habits to keep the cadence logic simple — a nudge,
    // not an audit. Weekly / custom cadences aren't chased here yet.
    const { data: habits } = await supabase
      .from('habits')
      .select('id')
      .eq('user_id', profile.id)
      .eq('frequency', 'daily')
      .is('archived_at', null)
    const habitIds = (habits ?? []).map((h) => h.id)
    if (habitIds.length === 0) continue

    const { data: logs } = await supabase
      .from('habit_logs')
      .select('habit_id')
      .eq('user_id', profile.id)
      .eq('date', today)
      .gte('count', 1)
      .in('habit_id', habitIds)
    const doneCount = new Set((logs ?? []).map((l) => l.habit_id)).size
    const unfinished = habitIds.length - doneCount
    if (unfinished <= 0) continue

    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', profile.id)
    if (!subscriptions || subscriptions.length === 0) continue

    const plural = unfinished === 1 ? 'habit' : 'habits'
    const payload = JSON.stringify({
      title: 'Keep the streak alive',
      body: `${unfinished} ${plural} left to finish today.`,
      url: appUrl,
      tag: 'almanac-daily-reminder',
    })

    // Stamp before sending: a push that fails is not worth retrying every five
    // minutes for the rest of the day.
    await supabase.from('profiles').update({ reminder_sent_on: today }).eq('id', profile.id)

    for (const sub of subscriptions as StoredSubscription[]) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        )
        sent += 1
        await supabase
          .from('push_subscriptions')
          .update({ last_success_at: new Date().toISOString() })
          .eq('id', sub.id)
      } catch (err) {
        const status = statusOf(err)
        // 404/410 mean the browser threw the subscription away (uninstalled,
        // cleared data). Keeping it would mean pushing into the void forever.
        if (status === 404 || status === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
          pruned += 1
        } else {
          console.error('push failed', status, String(err).slice(0, 200))
        }
      }
    }
  }

  return new Response(JSON.stringify({ sent, pruned }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
