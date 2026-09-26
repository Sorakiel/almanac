import type { TFunction } from '@/hooks/useT'
import type { Habit } from '@/features/habits/types'

/** Units the app knows how to pluralise; anything else is the user's own word. */
export const GOAL_UNITS = ['glasses', 'pages', 'minutes', 'times'] as const
export type GoalUnit = (typeof GOAL_UNITS)[number]

export const GOAL_MIN = 1
export const GOAL_MAX = 999
export const UNIT_MAX = 16

/** One-tap goals in the form, e.g. "8 glasses". */
export const GOAL_PRESETS = [
  { key: 'glasses', goal: 8, unit: 'glasses' },
  { key: 'pages', goal: 20, unit: 'pages' },
  { key: 'minutes', goal: 30, unit: 'minutes' },
] as const
export type GoalPresetKey = (typeof GOAL_PRESETS)[number]['key']

export interface Goal {
  goal: number
  unit: string | null
}

export type GoalMode = 'once' | GoalPresetKey | 'custom'

export const ONCE: Goal = { goal: 1, unit: null }

export function isKnownUnit(unit: string | null): unit is GoalUnit {
  return (GOAL_UNITS as readonly string[]).includes(unit ?? '')
}

/** Which chip a stored goal reads as. */
export function goalMode({ goal, unit }: Goal): GoalMode {
  if (goal === 1 && !unit) return 'once'
  return GOAL_PRESETS.find((p) => p.goal === goal && p.unit === unit)?.key ?? 'custom'
}

/** A habit that counts up to more than one tap a day. */
export function isQuantitative(habit: Pick<Habit, 'daily_goal'>): boolean {
  return habit.daily_goal > 1
}

/** The unit word for `count`: pluralised when known, as typed when not. */
export function unitLabel(unit: string | null, count: number, t: TFunction): string {
  if (!unit) return ''
  return isKnownUnit(unit) ? t(`habits.goal.units.${unit}`, { count }) : unit
}

/** "3 of 8 glasses" — the unit agrees with the goal, as in "8 glasses". */
export function goalProgress(
  count: number,
  habit: Pick<Habit, 'daily_goal' | 'unit'>,
  t: TFunction,
): string {
  const base = t('habits.goal.progress', { count, goal: habit.daily_goal })
  const unit = unitLabel(habit.unit, habit.daily_goal, t)
  return unit ? `${base} ${unit}` : base
}

/** Trimmed, length-capped, null when empty — what the column accepts. */
export function normalizeUnit(raw: string | null): string | null {
  const trimmed = (raw ?? '').trim().slice(0, UNIT_MAX)
  return trimmed || null
}
