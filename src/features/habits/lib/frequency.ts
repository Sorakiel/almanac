import type { Habit } from '@/features/habits/types'

/** Human label for a habit's cadence, e.g. "daily" or "4× / wk". */
export function frequencyLabel(habit: Pick<Habit, 'frequency' | 'target_count'>): string {
  switch (habit.frequency) {
    case 'weekly':
      return 'weekly'
    case 'x_per_week':
      return `${habit.target_count}× / wk`
    case 'daily':
    default:
      return 'daily'
  }
}
