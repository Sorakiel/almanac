import type { HabitFrequency, HabitTimeOfDay } from '@/features/habits/types'

/** The four cadences the quick form offers — the rest live in the full editor. */
export type Cadence = 'daily' | 'weekdays' | 'three_a_week' | 'weekly'

export const CADENCES: Record<Cadence, { frequency: HabitFrequency; target_count: number }> = {
  daily: { frequency: 'daily', target_count: 1 },
  weekdays: { frequency: 'weekdays', target_count: 1 },
  three_a_week: { frequency: 'x_per_week', target_count: 3 },
  weekly: { frequency: 'weekly', target_count: 1 },
}

export const CADENCE_ORDER: Cadence[] = ['daily', 'weekdays', 'three_a_week', 'weekly']

/** Prototype order: the three parts of the day, then "whenever". */
export const TIME_ORDER: HabitTimeOfDay[] = ['morning', 'afternoon', 'evening', 'anytime']
