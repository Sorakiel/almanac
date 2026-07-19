import type { Database } from '@/types/database.generated'

export type Habit = Database['public']['Tables']['habits']['Row']
export type HabitInsert = Database['public']['Tables']['habits']['Insert']
export type HabitLog = Database['public']['Tables']['habit_logs']['Row']
export type HabitFreeze = Database['public']['Tables']['habit_freezes']['Row']
export type HabitFrequency = Database['public']['Enums']['habit_frequency']
export type HabitTimeOfDay = Database['public']['Enums']['habit_time_of_day']

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
  /** Days until next due (interval cadences only; 0 for everything else). */
  dueInDays: number
  /** Consecutive completed days ending today (or yesterday if today is open). */
  streak: number
  /** Due today, not yet done, and sitting on a live streak — one miss ends it. */
  atRisk: boolean
  /** Today is protected by a streak freeze — a miss won't break the run. */
  frozenToday: boolean
  /** False for an interval habit still resting, or a weekdays habit on a weekend. */
  dueToday: boolean
}
