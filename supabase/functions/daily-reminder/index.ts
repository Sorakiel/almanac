// Almanac daily email reminder.
//
// Invoke this hourly (see supabase/functions/daily-reminder/README.md for the
// pg_cron schedule). On each run it finds users whose local hour now equals
// their chosen reminder_hour, still have daily habits left to finish today, and
// emails them a nudge via Resend.
//
// Runs with the SERVICE ROLE key (bypasses RLS) — deploy it as a Supabase Edge
// Function, never ship this key to the browser.
//
// Required function secrets (supabase secrets set ...):
//   RESEND_API_KEY   — Resend API key
//   REMINDER_FROM    — verified sender, e.g. "Almanac <hello@yourdomain.com>"
//   APP_URL          — app origin for the CTA link, e.g. https://almanac-psi-three.vercel.app
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface ReminderProfile {
  id: string
  timezone: string
  reminder_hour: number
}

/** The hour (0–23) it is right now in the given IANA timezone. */
function localHour(timezone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false,
  }).formatToParts(new Date())
  const hour = parts.find((p) => p.type === 'hour')?.value ?? '0'
  return Number(hour) % 24
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

async function sendEmail(to: string, unfinished: number): Promise<boolean> {
  const from = Deno.env.get('REMINDER_FROM')
  const apiKey = Deno.env.get('RESEND_API_KEY')
  const appUrl = Deno.env.get('APP_URL') ?? ''
  if (!from || !apiKey) {
    console.error('Missing REMINDER_FROM or RESEND_API_KEY')
    return false
  }

  const plural = unfinished === 1 ? 'habit' : 'habits'
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to,
      subject: `You still have ${unfinished} ${plural} to finish today`,
      html:
        `<div style="font-family:system-ui,sans-serif;max-width:480px">` +
        `<h2 style="margin:0 0 8px">Keep the streak alive</h2>` +
        `<p style="color:#555">You have <strong>${unfinished} ${plural}</strong> left to complete today.</p>` +
        `<p><a href="${appUrl}" style="display:inline-block;background:#EF8857;color:#fff;` +
        `padding:10px 18px;border-radius:10px;text-decoration:none">Open Almanac →</a></p>` +
        `</div>`,
    }),
  })
  if (!res.ok) {
    console.error('Resend error', res.status, await res.text())
    return false
  }
  return true
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, timezone, reminder_hour')
    .eq('reminder_enabled', true)
  if (error) {
    console.error('profiles query failed', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  let sent = 0
  for (const profile of (profiles ?? []) as ReminderProfile[]) {
    const timezone = profile.timezone || 'UTC'
    if (localHour(timezone) !== profile.reminder_hour) continue

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

    const today = localDateKey(timezone)
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

    const { data: userData } = await supabase.auth.admin.getUserById(profile.id)
    const email = userData.user?.email
    if (!email) continue

    if (await sendEmail(email, unfinished)) sent += 1
  }

  return new Response(JSON.stringify({ sent }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
