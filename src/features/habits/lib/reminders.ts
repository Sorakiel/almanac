import { msUntilDailyTime } from '@/lib/date'
import type { HabitWithTodayLog } from '@/features/habits/types'

const DAY_MS = 86_400_000

export interface PlannedReminder {
  habitId: string
  name: string
  /** Milliseconds from `now` until it should fire. */
  inMs: number
}

/** "11:00" ↔ 660: the column stores minutes since local midnight. */
export function formatReminder(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function parseReminder(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value)
  if (!match) return null
  const h = Number(match[1])
  const m = Number(match[2])
  if (h > 23 || m > 59) return null
  return h * 60 + m
}

/**
 * The next reminder for each habit that has one. Today's time counts only
 * while it is still ahead and the habit is still owed today — done, skipped
 * on purpose or resting habits wait for tomorrow's. Tomorrow is assumed due:
 * the plan is rebuilt whenever the habits change, so a wrong guess about a
 * day that hasn't started yet corrects itself once it has.
 */
export function planHabitReminders(
  habits: HabitWithTodayLog[],
  timezone: string,
  now: Date = new Date(),
): PlannedReminder[] {
  const toMidnight = msUntilDailyTime(0, 0, timezone, now)
  return habits.flatMap((habit) => {
    if (habit.reminder_at === null || habit.archived_at) return []
    const h = Math.floor(habit.reminder_at / 60)
    const m = habit.reminder_at % 60
    const next = msUntilDailyTime(h, m, timezone, now)
    const todayAhead = next < toMidnight
    const owedToday = habit.dueToday && !habit.isComplete
    const inMs = todayAhead && !owedToday ? next + DAY_MS : next
    return [{ habitId: habit.id, name: habit.name, inMs }]
  })
}
