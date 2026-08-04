import { useEffect, useRef } from 'react'
import { browserTimezone, msUntilDailyTime } from '@/lib/date'
import { setBadgeCount } from '@/lib/desktop'
import {
  clearScheduledReminders,
  isNativeScheduler,
  isNotifyGranted,
  pushNotification,
  scheduleDailyReminder,
} from '@/lib/notify'
import { isCapacitor, isTauri } from '@/lib/notify'
import { enablePush, pushSupported } from '@/lib/push'
import { useSession } from '@/hooks/useSession'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { useProfile } from '@/features/settings/hooks/useProfile'
import type { HabitWithTodayLog } from '@/features/habits/types'

const REMINDER_BODY = 'Time to log your habits for today.'

/** Habits still due and unfinished today. */
function remainingCount(habits: HabitWithTodayLog[]): number {
  return habits.filter((h) => h.dueToday && !h.isComplete).length
}

/** Send the desktop/web nudge — but only if something's actually left to do. */
async function fireForegroundNudge(habits: HabitWithTodayLog[]): Promise<void> {
  const remaining = remainingCount(habits)
  if (remaining === 0) return
  if (!(await isNotifyGranted())) return
  const noun = remaining === 1 ? 'habit' : 'habits'
  await pushNotification('Almanac', `You still have ${remaining} ${noun} to finish today.`)
}

/**
 * Drives the daily habit reminder from the user's saved preference. Two paths:
 *  - Mobile: register an OS-scheduled repeating notification (fires when closed).
 *  - Desktop / web: a foreground timer that nudges at the local hour while open,
 *    and only when habits actually remain.
 *
 * Mounted once in the authenticated shell.
 */
export function useDailyReminder(): void {
  const { profile } = useProfile()
  const { habits } = useHabits()
  const { user } = useSession()

  const enabled = profile?.reminder_enabled ?? false
  const hour = profile?.reminder_hour ?? 8
  const minute = profile?.reminder_minute ?? 0
  const timezone = profile?.timezone ?? browserTimezone()

  // Read the freshest habits inside the timer without re-arming on every change.
  const habitsRef = useRef(habits)
  useEffect(() => {
    habitsRef.current = habits
  }, [habits])

  // Keep the app-icon badge in sync with unfinished habits (native shell only).
  useEffect(() => {
    void setBadgeCount(remainingCount(habits))
  }, [habits])

  // Back-fill a Web Push subscription for reminders switched on before push
  // existed — or on a browser that has simply never subscribed. Without this the
  // server has no endpoint to push to and the reminder silently does nothing,
  // which is exactly how it shipped broken: the toggle only ever subscribed at
  // the moment it was saved, so every already-enabled reminder stayed dead.
  //
  // Only when permission is already granted. Prompting on app load is how apps
  // get notifications blocked forever.
  useEffect(() => {
    if (!enabled || !user) return
    if (isTauri() || isCapacitor() || !pushSupported()) return
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    void enablePush(user.id).catch(() => undefined)
  }, [enabled, user])

  // Native mobile schedule: survives the app being closed.
  useEffect(() => {
    if (enabled) void scheduleDailyReminder(hour, minute, REMINDER_BODY)
    else void clearScheduledReminders()
  }, [enabled, hour, minute])

  // Foreground scheduler for everywhere the OS can't hold a schedule for us.
  // Gated on the scheduler, not on "is mobile": a phone running the web build
  // has no native schedule either, and used to fall through both branches.
  useEffect(() => {
    if (!enabled || isNativeScheduler()) return

    let timer: number
    const arm = () => {
      timer = window.setTimeout(
        () => {
          void fireForegroundNudge(habitsRef.current)
          arm()
        },
        msUntilDailyTime(hour, minute, timezone),
      )
    }
    arm()

    return () => window.clearTimeout(timer)
  }, [enabled, hour, minute, timezone])
}
