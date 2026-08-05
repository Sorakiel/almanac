// Almanac weekly digest — Web Push.
//
// Invoke this every five minutes (see README.md for the pg_cron schedule). On
// each run it finds users whose local day-of-week and time have just passed
// the digest slot they chose, and pushes them a one-line summary of the last
// 7 days: habit check-ins, workouts completed, pages read.
//
// Same delivery mechanism as daily-reminder (Web Push, same
// push_subscriptions rows) — this is a second thing an existing subscription
// receives, not a new channel. Deliberately does not replicate the client's
// streak/due-today logic (frequency, freezes, weekday cadences): a weekly
// count is a summary, not an audit, and the simpler the server-side query the
// less likely it silently drifts from what the app itself shows.
//
// Runs with the SERVICE ROLE key (bypasses RLS) — deploy as a Supabase Edge
// Function, never ship this key to the browser.
//
// Required function secrets: same as daily-reminder (VAPID_PUBLIC_KEY,
// VAPID_PRIVATE_KEY, VAPID_SUBJECT, APP_URL). SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY are injected automatically.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

interface DigestProfile {
  id: string
  timezone: string
  digest_day: number
  digest_hour: number
  digest_minute: number
  digest_sent_on: string | null
}

interface StoredSubscription {
  id: string
  endpoint: string
  p256dh: string
  auth: string
}

/** How wide a window a single cron tick covers, in minutes. */
const TICK_MINUTES = 5

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

/** 0=Sunday..6=Saturday in the given timezone. */
function localWeekday(timezone: string): number {
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'short' }).format(
    new Date(),
  )
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday)
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

/** Whether `now` has just passed the chosen time, within one cron tick. */
function isDue(nowMinutes: number, target: number): boolean {
  const delta = nowMinutes - target
  return delta >= 0 && delta < TICK_MINUTES
}

/** 7 days ago (inclusive), YYYY-MM-DD, in the given timezone. */
function weekAgoDateKey(timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(Date.now() - 6 * 86_400_000))
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
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
    .select('id, timezone, digest_day, digest_hour, digest_minute, digest_sent_on')
    .eq('digest_enabled', true)
  if (error) {
    console.error('profiles query failed', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  let sent = 0
  let pruned = 0

  for (const profile of (profiles ?? []) as DigestProfile[]) {
    const timezone = profile.timezone || 'UTC'
    const today = localDateKey(timezone)
    if (profile.digest_sent_on === today) continue
    if (localWeekday(timezone) !== profile.digest_day) continue
    const target = profile.digest_hour * 60 + (profile.digest_minute ?? 0)
    if (!isDue(localMinutes(timezone), target)) continue

    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', profile.id)
    if (!subscriptions || subscriptions.length === 0) continue

    const since = weekAgoDateKey(timezone)

    const [{ count: checkIns }, { data: activeHabits }, { count: workoutsDone }, { data: sessions }] =
      await Promise.all([
        supabase
          .from('habit_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .gte('date', since)
          .gte('count', 1),
        supabase.from('habits').select('id').eq('user_id', profile.id).is('archived_at', null),
        supabase
          .from('workouts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .gte('completed_at', `${since}T00:00:00Z`),
        supabase
          .from('reading_sessions')
          .select('units_read')
          .eq('user_id', profile.id)
          .gte('date', since),
      ])

    // Nothing to report — skip rather than push an empty "0 across everything".
    const pagesRead = (sessions ?? []).reduce((sum, s) => sum + (s.units_read ?? 0), 0)
    const habitCount = activeHabits?.length ?? 0
    const workoutCount = workoutsDone ?? 0
    if (!checkIns && !workoutCount && !pagesRead) continue

    const parts: string[] = []
    if (checkIns) parts.push(`${checkIns} habit check-in${checkIns === 1 ? '' : 's'}`)
    if (workoutCount) parts.push(`${workoutCount} workout${workoutCount === 1 ? '' : 's'}`)
    if (pagesRead) parts.push(`${pagesRead} page${pagesRead === 1 ? '' : 's'} read`)

    const payload = JSON.stringify({
      title: 'Your week in Almanac',
      body:
        parts.join(' · ') +
        (habitCount > 0 ? ` — across ${habitCount} active habit${habitCount === 1 ? '' : 's'}` : ''),
      url: appUrl,
      tag: 'almanac-weekly-digest',
    })

    // Stamp before sending: a push that fails is not worth retrying every five
    // minutes for the rest of the day.
    await supabase.from('profiles').update({ digest_sent_on: today }).eq('id', profile.id)

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
