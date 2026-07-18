import { isWeekendKey } from '@/lib/date'
import type { Habit, HabitTimeOfDay } from '@/features/habits/types'

type FreqHabit = Pick<Habit, 'frequency' | 'target_count'>

/** Human label for a habit's cadence, e.g. "daily" or "every 3 days". */
export function frequencyLabel(habit: FreqHabit): string {
  switch (habit.frequency) {
    case 'weekly':
      return 'weekly'
    case 'weekdays':
      return 'weekdays'
    case 'x_per_week':
      return `${habit.target_count}× / wk`
    case 'every_n_days':
      return `every ${habit.target_count} days`
    case 'every_n_weeks':
      return `every ${habit.target_count} weeks`
    case 'daily':
    default:
      return 'daily'
  }
}

const TIME_OF_DAY_LABELS: Record<HabitTimeOfDay, string> = {
  anytime: 'anytime',
  morning: 'morning',
  afternoon: 'afternoon',
  evening: 'evening',
}

/** Human label for a time-of-day preference; null for the neutral "anytime". */
export function timeOfDayLabel(value: HabitTimeOfDay): string | null {
  return value === 'anytime' ? null : TIME_OF_DAY_LABELS[value]
}

/**
 * How many taps mark the habit complete for one day. Interval cadences
 * (every_n_days / every_n_weeks) store the interval in target_count, so a
 * single completion is enough on a due day.
 */
export function dailyTarget(habit: FreqHabit): number {
  return isInterval(habit) ? 1 : habit.target_count
}

/** True for the "once every N days/weeks" cadences. */
export function isInterval(habit: Pick<Habit, 'frequency'>): boolean {
  return habit.frequency === 'every_n_days' || habit.frequency === 'every_n_weeks'
}

/** Interval length in days for every-N cadences, else null. */
export function intervalDays(habit: FreqHabit): number | null {
  if (habit.frequency === 'every_n_days') return habit.target_count
  if (habit.frequency === 'every_n_weeks') return habit.target_count * 7
  return null
}

/**
 * Days until an interval habit is next due, given the most recent completed
 * date key (or null). 0 = due today. Non-interval habits are always due (0).
 * `daysSinceLastDone` is measured in whole local days.
 */
export function dueInDays(habit: FreqHabit, daysSinceLastDone: number | null): number {
  const n = intervalDays(habit)
  if (n === null) return 0
  if (daysSinceLastDone === null) return 0
  return Math.max(0, n - daysSinceLastDone)
}

/**
 * How many completions a cadence expects across the given window of local date
 * keys — the denominator for a schedule-aware completion rate. A "2× / week"
 * habit expects 2 in a 7-day window, an "every 3 days" habit ~2.3, not 7.
 */
export function expectedCompletionsInWindow(habit: FreqHabit, windowKeys: string[]): number {
  const days = windowKeys.length
  switch (habit.frequency) {
    case 'weekdays':
      return windowKeys.filter((key) => !isWeekendKey(key)).length
    case 'weekly':
      return days / 7
    case 'x_per_week':
      return (habit.target_count * days) / 7
    case 'every_n_days':
      return days / habit.target_count
    case 'every_n_weeks':
      return days / (habit.target_count * 7)
    case 'daily':
    default:
      return days
  }
}

/**
 * Whether the habit should be acted on for the given local date. Weekdays
 * habits rest on weekends; interval habits rest until their next due day;
 * everything else is due every day.
 */
export function isDueOn(
  habit: FreqHabit,
  dateKey: string,
  daysSinceLastDone: number | null,
): boolean {
  if (habit.frequency === 'weekdays') return !isWeekendKey(dateKey)
  return dueInDays(habit, daysSinceLastDone) === 0
}
