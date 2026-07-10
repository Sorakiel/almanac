import type { Habit } from '@/features/habits/types'

/** Human label for a habit's cadence, e.g. "daily" or "every 3 days". */
export function frequencyLabel(habit: Pick<Habit, 'frequency' | 'target_count'>): string {
  switch (habit.frequency) {
    case 'weekly':
      return 'weekly'
    case 'x_per_week':
      return `${habit.target_count}× / wk`
    case 'every_n_days':
      return `every ${habit.target_count} days`
    case 'daily':
    default:
      return 'daily'
  }
}

/**
 * How many taps mark the habit complete for one day. For every_n_days the
 * target_count column stores the interval N, not a per-day count.
 */
export function dailyTarget(habit: Pick<Habit, 'frequency' | 'target_count'>): number {
  return habit.frequency === 'every_n_days' ? 1 : habit.target_count
}

/**
 * Days until an every-N-days habit is next due, given the most recent
 * completed date key (or null). 0 = due today. Non-interval habits are always
 * due. `daysSinceLastDone` is measured in whole local days.
 */
export function dueInDays(
  habit: Pick<Habit, 'frequency' | 'target_count'>,
  daysSinceLastDone: number | null,
): number {
  if (habit.frequency !== 'every_n_days') return 0
  if (daysSinceLastDone === null) return 0
  return Math.max(0, habit.target_count - daysSinceLastDone)
}
