import { localDateKey, weekdayOfKey } from '@/lib/date'
import type { Workout } from '@/features/workouts/types'

/** Short weekday names, indexed 0=Sun … 6=Sat (matches weekdayOfKey). */
export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Whole days from `fromKey` to `toKey` (UTC math on `YYYY-MM-DD`). */
function daysBetween(fromKey: string, toKey: string): number {
  const [fy, fm, fd] = fromKey.split('-').map(Number)
  const [ty, tm, td] = toKey.split('-').map(Number)
  const from = Date.UTC(fy ?? 1970, (fm ?? 1) - 1, fd ?? 1)
  const to = Date.UTC(ty ?? 1970, (tm ?? 1) - 1, td ?? 1)
  return Math.round((to - from) / 86_400_000)
}

/** Human label for a workout's schedule, or null when it's a plain one-off. */
export function recurrenceLabel(w: Workout): string | null {
  switch (w.recurrence) {
    case 'daily':
      return 'Every day'
    case 'weekdays': {
      const days = w.recurrence_days ?? []
      if (days.length === 0) return 'Weekly'
      if (days.length === 7) return 'Every day'
      return [...days]
        .sort((a, b) => a - b)
        .map((d) => WEEKDAY_LABELS[d])
        .join(' · ')
    }
    case 'every_n_days':
      return w.recurrence_interval ? `Every ${w.recurrence_interval} days` : null
    default:
      return null
  }
}

/** True when the workout is scheduled to happen on the given local date. */
export function isDueOn(w: Workout, dateKey: string): boolean {
  switch (w.recurrence) {
    case 'daily':
      return true
    case 'weekdays':
      return (w.recurrence_days ?? []).includes(weekdayOfKey(dateKey))
    case 'every_n_days':
      if (!w.scheduled_date || !w.recurrence_interval) return false
      if (dateKey < w.scheduled_date) return false
      return daysBetween(w.scheduled_date, dateKey) % w.recurrence_interval === 0
    default:
      return w.scheduled_date === dateKey
  }
}

/** True when the workout was completed on the given local date. */
export function isDoneOn(w: Workout, dateKey: string, timezone: string): boolean {
  if (!w.completed_at) return false
  return localDateKey(timezone, new Date(w.completed_at)) === dateKey
}

/** True when a workout carries any recurring schedule (not a one-off). */
export function isRecurring(w: Workout): boolean {
  return w.recurrence !== 'none'
}
