import type { SessionExercise, SetLog } from '@/features/workouts/types'

/** Default rest between sets, in seconds (matches the spec-board session). */
export const DEFAULT_REST_SECONDS = 90

/** Rough per-set time budget (work + rest) used to estimate a session length. */
const MINUTES_PER_SET = 2.5

export interface SessionProgress {
  doneSets: number
  totalSets: number
  /** 0–100, share of planned sets ticked done. */
  pct: number
}

/** Roll up set completion across every exercise. */
export function sessionProgress(exercises: SessionExercise[]): SessionProgress {
  const sets = exercises.flatMap((e) => e.sets)
  const doneSets = sets.filter((s) => s.done).length
  const totalSets = sets.length
  const pct = totalSets > 0 ? Math.round((100 * doneSets) / totalSets) : 0
  return { doneSets, totalSets, pct }
}

/** Volume already lifted: reps × weight summed over completed sets. */
export function completedVolume(exercises: SessionExercise[]): number {
  return exercises
    .flatMap((e) => e.sets)
    .filter((s) => s.done)
    .reduce((sum, s) => sum + (s.reps ?? 0) * (s.weight ?? 0), 0)
}

/**
 * Planned volume for the whole session, from each exercise's targets
 * (sets × reps × weight) — the "▲ kg" figure on the today card, shown before
 * anything is logged.
 */
export function plannedVolume(exercises: SessionExercise[]): number {
  return exercises.reduce((sum, ex) => {
    const sets = ex.targetSets ?? ex.sets.length
    const reps = ex.targetReps ?? 0
    const weight = ex.targetWeight ?? 0
    return sum + sets * reps * weight
  }, 0)
}

/** Total planned sets across the session (targets, falling back to logged sets). */
export function plannedSetCount(exercises: SessionExercise[]): number {
  return exercises.reduce((sum, ex) => sum + (ex.targetSets ?? ex.sets.length), 0)
}

/** Rough session length in minutes from the planned set count. */
export function estimateMinutes(exercises: SessionExercise[]): number {
  return Math.round(plannedSetCount(exercises) * MINUTES_PER_SET)
}

/** True when an exercise still has an unticked set (or no sets logged yet). */
export function isExerciseDone(exercise: SessionExercise): boolean {
  return exercise.sets.length > 0 && exercise.sets.every((s) => s.done)
}

/**
 * Index of the exercise to focus on: the first one that isn't fully done.
 * Returns the last index when every exercise is complete, or -1 when empty.
 */
export function currentExerciseIndex(exercises: SessionExercise[]): number {
  if (exercises.length === 0) return -1
  const idx = exercises.findIndex((ex) => !isExerciseDone(ex))
  return idx === -1 ? exercises.length - 1 : idx
}

/** The first not-done set of an exercise, or null when all are done / none exist. */
export function currentSet(exercise: SessionExercise): SetLog | null {
  return exercise.sets.find((s) => !s.done) ?? null
}

/** Human target line for an exercise, e.g. "4 × 8 · 60 kg", or null if unset. */
export function exerciseTargetLabel(exercise: SessionExercise): string | null {
  const parts: string[] = []
  if (exercise.targetSets && exercise.targetReps) {
    parts.push(`${exercise.targetSets} × ${exercise.targetReps}`)
  } else if (exercise.targetReps) {
    parts.push(`${exercise.targetReps} reps`)
  }
  if (exercise.targetWeight) parts.push(`${exercise.targetWeight} kg`)
  return parts.length ? parts.join(' · ') : null
}

/** Format a millisecond span as `M:SS`, or `H:MM:SS` past an hour. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const ss = String(s).padStart(2, '0')
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${ss}`
  return `${m}:${ss}`
}
