import type { Database, HabitFrequency } from '@/types/database.generated'

export type Habit = Database['public']['Tables']['habits']['Row']
export type HabitInsert = Database['public']['Tables']['habits']['Insert']
export type HabitLog = Database['public']['Tables']['habit_logs']['Row']

export type { HabitFrequency }

/** A habit joined with today's log — the unit the dashboard and list render. */
export interface HabitWithTodayLog extends Habit {
  todayCount: number
  isComplete: boolean
}
