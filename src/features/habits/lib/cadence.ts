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

/** Which quick chip a saved cadence reads as; anything else is the editor's «Своё». */
export function cadenceOf(frequency: HabitFrequency, targetCount: number): Cadence | 'custom' {
  const hit = CADENCE_ORDER.find(
    (c) => CADENCES[c].frequency === frequency && CADENCES[c].target_count === targetCount,
  )
  return hit ?? 'custom'
}

/* «Своё» in the edit sheet: every N days / weeks, or N times a week. */
export type CustomUnit = 'days' | 'weeks' | 'per_week'

export const UNIT_FREQ: Record<CustomUnit, HabitFrequency> = {
  days: 'every_n_days',
  weeks: 'every_n_weeks',
  per_week: 'x_per_week',
}
export const FREQ_UNIT: Partial<Record<HabitFrequency, CustomUnit>> = {
  every_n_days: 'days',
  every_n_weeks: 'weeks',
  x_per_week: 'per_week',
}
export const UNIT_RANGE: Record<CustomUnit, { min: number; max: number }> = {
  days: { min: 2, max: 30 },
  weeks: { min: 2, max: 8 },
  per_week: { min: 2, max: 7 },
}
export function clampToRange(value: number, { min, max }: { min: number; max: number }): number {
  return Math.min(max, Math.max(min, value))
}

export interface CadenceValue {
  frequency: HabitFrequency
  target_count: number
}

/** A cadence the quick chips don't cover, as «Каждые N дней / недель» or «N раз в неделю». */
export function customCadence(from: CadenceValue): CadenceValue {
  const unit = FREQ_UNIT[from.frequency]
  return unit
    ? { frequency: from.frequency, target_count: clampToRange(from.target_count, UNIT_RANGE[unit]) }
    : { frequency: 'every_n_days', target_count: 3 }
}
