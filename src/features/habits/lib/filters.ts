import type { HabitFrequency } from '@/features/habits/types'

/** Frequency filters, in cycle order. Labels come from `habits.filters.*` and
 *  are resolved at render — never here, or they stop following the language. */
export const FILTERS: { value: HabitFrequency | 'all' }[] = [
  { value: 'all' },
  { value: 'daily' },
  { value: 'weekdays' },
  { value: 'weekly' },
  { value: 'x_per_week' },
  { value: 'every_n_days' },
  { value: 'every_n_weeks' },
]

/**
 * Below this many habits the frequency filters are hidden.
 *
 * Seven filter pills over a list of two is furniture, not a tool — and on
 * mobile they pushed the list itself down by two rows to filter nothing.
 */
export const FILTER_THRESHOLD = 5
