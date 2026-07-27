import type { SessionExercise } from '@/features/workouts/types'

/** Common preset rest intervals surfaced in the set editor (seconds). */
export const REST_PRESETS = [0, 30, 45, 60, 90, 120, 150, 180]

export interface DraftSet {
  /** Real set_logs id, or a `tmp-*` placeholder for a not-yet-saved set. */
  id: string
  reps: number | null
  weight: number | null
  restSeconds: number | null
}

export interface DraftExercise {
  /** Real workout_exercises id, or a `tmp-*` placeholder. */
  id: string
  /** The library exercises.id — always real (created before it enters the draft). */
  exerciseId: string
  name: string
  muscleGroup: string | null
  sets: DraftSet[]
}

export interface WorkoutDraft {
  name: string
  exercises: DraftExercise[]
}

/** True for a placeholder id that doesn't exist in the DB yet. */
export function isTempId(id: string): boolean {
  return id.startsWith('tmp-')
}

/** Snapshot the saved workout into an editable draft. */
export function buildDraft(name: string, exercises: SessionExercise[]): WorkoutDraft {
  return {
    name,
    exercises: exercises.map((ex) => ({
      id: ex.id,
      exerciseId: ex.exerciseId,
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      sets: ex.sets.map((s) => ({
        id: s.id,
        reps: s.reps,
        weight: s.weight,
        restSeconds: s.rest_seconds ?? null,
      })),
    })),
  }
}

/** A stable string of the draft's meaningful content, for dirty-checking. */
export function draftSignature(draft: WorkoutDraft): string {
  return JSON.stringify({
    name: draft.name.trim(),
    exercises: draft.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      sets: ex.sets.map((s) => [s.reps, s.weight, s.restSeconds]),
    })),
  })
}

export interface ExerciseSummary {
  setCount: number
  reps: number | null
  weight: number | null
}

/** Representative "N sets · R reps · W kg" figures for a collapsed row / chip. */
export function exerciseSummary(ex: DraftExercise): ExerciseSummary {
  const first = ex.sets[0]
  return {
    setCount: ex.sets.length,
    reps: first?.reps ?? null,
    weight: first?.weight ?? null,
  }
}

/** "3 × 10" style chip, or null when there are no sets / reps. */
export function setsChip(ex: DraftExercise): string | null {
  const { setCount, reps } = exerciseSummary(ex)
  if (setCount === 0) return null
  return reps != null ? `${setCount} × ${reps}` : `${setCount} sets`
}

/** "dumbbell · 3 sets · 10 reps · 22 kg" subtitle parts, joined. */
export function exerciseSubtitle(ex: DraftExercise): string {
  const { setCount, reps, weight } = exerciseSummary(ex)
  const parts: string[] = []
  if (ex.muscleGroup) parts.push(ex.muscleGroup)
  parts.push(`${setCount} ${setCount === 1 ? 'set' : 'sets'}`)
  if (reps != null) parts.push(`${reps} reps`)
  if (weight != null) parts.push(`${weight} kg`)
  return parts.join(' · ')
}

export interface DraftSummary {
  exercises: number
  sets: number
  /** Planned volume in kg (reps × weight across all sets). */
  volume: number
}

export function draftSummary(draft: WorkoutDraft): DraftSummary {
  let sets = 0
  let volume = 0
  for (const ex of draft.exercises) {
    sets += ex.sets.length
    for (const s of ex.sets) volume += (s.reps ?? 0) * (s.weight ?? 0)
  }
  return { exercises: draft.exercises.length, sets, volume }
}

/** "8.2t" / "820 kg" compact volume label. */
export function volumeLabel(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`
  return `${Math.round(kg)} kg`
}

/** Unique muscle groups across the draft, e.g. "CHEST · SHOULDERS". */
export function muscleSummary(draft: WorkoutDraft): string | null {
  const groups = [...new Set(draft.exercises.map((e) => e.muscleGroup).filter(Boolean))]
  return groups.length ? groups.join(' · ').toUpperCase() : null
}

/** Rough session length in minutes (~2.5 min per set). */
export function estimateMinutes(draft: WorkoutDraft): number {
  return Math.round(draftSummary(draft).sets * 2.5)
}

/** Human rest label, e.g. "90s" or "—" when unset/zero. */
export function restLabel(seconds: number | null): string {
  return seconds && seconds > 0 ? `${seconds}s` : '—'
}
