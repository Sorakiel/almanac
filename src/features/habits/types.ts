import type { Database } from '@/types/database.generated'

export type Habit = Database['public']['Tables']['habits']['Row']
export type HabitInsert = Database['public']['Tables']['habits']['Insert']
export type HabitLog = Database['public']['Tables']['habit_logs']['Row']
export type HabitFrequency = Database['public']['Enums']['habit_frequency']

/** A habit joined with today's log plus recent history — the render unit. */
export interface HabitWithTodayLog extends Habit {
  todayCount: number
  isComplete: boolean
  /** Per-day completed flag (0/1) over the recent window, oldest→newest. */
  series: number[]
  /** Days completed within the recent window. */
  completedRecent: number
  /** Length of the recent window (e.g. 7). */
  windowDays: number
  /** Completion rate over the window, 0–1. */
  rate: number
  /** Days until next due (every_n_days only; 0 for everything else). */
  dueInDays: number
  /** False only for an every_n_days habit still inside its rest interval. */
  dueToday: boolean
}
