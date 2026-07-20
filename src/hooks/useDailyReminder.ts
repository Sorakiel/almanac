import { useEffect, useRef } from 'react'
import { browserTimezone, msUntilDailyTime } from '@/lib/date'
import { setBadgeCount } from '@/lib/desktop'
import {
  clearScheduledReminders,
  isMobilePlatform,
  isNotifyGranted,
  pushNotification,
  scheduleDailyReminder,
} from '@/lib/notify'
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

  // Native mobile schedule: survives the app being closed.
  useEffect(() => {
    if (enabled) void scheduleDailyReminder(hour, minute, REMINDER_BODY)
    else void clearScheduledReminders()
  }, [enabled, hour, minute])

  // Foreground scheduler for desktop/web (mobile is covered by the OS schedule).
  useEffect(() => {
    if (!enabled || isMobilePlatform()) return

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
