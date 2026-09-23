import type { TFunction } from '@/hooks/useT'

type MuscleKey =
  | 'legs'
  | 'back'
  | 'chest'
  | 'shoulders'
  | 'arms'
  | 'biceps'
  | 'triceps'
  | 'core'
  | 'abs'
  | 'glutes'
  | 'calves'
  | 'forearms'
  | 'hamstrings'
  | 'quads'
  | 'cardio'
  | 'fullBody'

/** Spellings people actually type, mapped to one dictionary key. */
const ALIASES: Record<string, MuscleKey> = {
  legs: 'legs',
  leg: 'legs',
  back: 'back',
  chest: 'chest',
  shoulders: 'shoulders',
  shoulder: 'shoulders',
  arms: 'arms',
  arm: 'arms',
  biceps: 'biceps',
  bicep: 'biceps',
  triceps: 'triceps',
  tricep: 'triceps',
  core: 'core',
  abs: 'abs',
  glutes: 'glutes',
  calves: 'calves',
  forearms: 'forearms',
  hamstrings: 'hamstrings',
  quads: 'quads',
  quadriceps: 'quads',
  cardio: 'cardio',
  'full body': 'fullBody',
  'full-body': 'fullBody',
  fullbody: 'fullBody',
}

/**
 * A muscle group is free text on the exercise row, so it arrives in whatever
 * language it was typed in. The common English ones read in the interface
 * language; anything else is the user's own word and shows as typed.
 */
export function muscleLabel(raw: string, t: TFunction): string {
  const key = ALIASES[raw.trim().toLowerCase()]
  return key ? t(`workouts.muscles.${key}`) : raw
}
