import { useEffect, useRef } from 'react'
import { browserTimezone } from '@/lib/date'
import {
  habitReminderId,
  isCapacitor,
  isNativeScheduler,
  isNotifyGranted,
  isTauri,
  pushNotification,
  scheduleHabitReminders,
} from '@/lib/platform/notify'
import { enablePush, pushSupported } from '@/lib/platform/push'
import { useSession } from '@/hooks/useSession'
import { useT } from '@/hooks/useT'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { planHabitReminders } from '@/features/habits/lib/reminders'
import { useProfile } from '@/features/settings/hooks/useProfile'

/**
 * Per-habit reminders ("water at 11:00"), one path per runtime:
 *  - Web: the server pushes them (daily-reminder edge function); here we only
 *    make sure this browser has a push subscription to receive them.
 *  - Android: one-shot OS notifications, re-planned whenever the habits change,
 *    so a habit already done today isn't nagged.
 *  - Desktop (Tauri): a foreground timer per habit, checked again on firing.
 *
 * Mounted once in the authenticated shell, next to the daily reminder.
 */
export function useHabitReminders(): void {
  const { habits } = useHabits()
  const { profile } = useProfile()
  const { user } = useSession()
  const { t } = useT()
  const timezone = profile?.timezone ?? browserTimezone()
  const body = t('habits.reminder.body')

  const habitsRef = useRef(habits)
  useEffect(() => {
    habitsRef.current = habits
  }, [habits])

  const withReminder = habits.filter((h) => h.reminder_at !== null)
  // Re-plan only when something that moves a reminder changes, not on every render.
  const signature = withReminder
    .map((h) => `${h.id}:${h.reminder_at}:${h.dueToday}:${h.isComplete}:${h.name}`)
    .join('|')
  const any = withReminder.length > 0

  // Web: a reminder set on another device still needs this browser subscribed.
  // Never prompts — only back-fills once permission is already granted.
  useEffect(() => {
    if (!any || !user || isTauri() || isCapacitor() || !pushSupported()) return
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    void enablePush(user.id).catch(() => undefined)
  }, [any, user])

  useEffect(() => {
    if (!isCapacitor()) return
    const now = Date.now()
    void scheduleHabitReminders(
      planHabitReminders(habitsRef.current, timezone).map((r) => ({
        id: habitReminderId(r.habitId),
        title: r.name,
        body,
        at: new Date(now + r.inMs),
      })),
    )
  }, [signature, timezone, body])

  useEffect(() => {
    if (!isTauri() || isNativeScheduler()) return
    const timers = planHabitReminders(habitsRef.current, timezone).map((r) =>
      window.setTimeout(() => {
        const habit = habitsRef.current.find((h) => h.id === r.habitId)
        if (!habit?.dueToday || habit.isComplete) return
        void isNotifyGranted().then((ok) => (ok ? pushNotification(habit.name, body) : undefined))
      }, r.inMs),
    )
    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [signature, timezone, body])
}
