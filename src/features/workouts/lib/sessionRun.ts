import type { SessionHistoryRow } from '@/features/workouts/api/history.api'
import type { SessionExercise, SetLog } from '@/features/workouts/types'

/** Where the runner stands: an exercise and one of its sets, by index. */
export interface Cursor {
  exercise: number
  set: number
}

/** A set's numbers as the runner shows them — the plan, or what the user dialled in. */
export interface SetValues {
  weight: number
  reps: number
}

/** Per-set overrides from the −/+ steppers, keyed by the set's id. */
export type Overrides = Record<string, SetValues>

/** Weight step of the − / + buttons, kg. */
export const WEIGHT_STEP = 2.5
/** Reps step of the − / + buttons. */
export const REPS_STEP = 1

/**
 * The set to do next: the first undone one in plan order — unless the user
 * picked an exercise on the track that still has one, then its first.
 */
export function currentCursor(
  exercises: SessionExercise[],
  preferred: number | null,
): Cursor | null {
  const firstUndone = (i: number): Cursor | null => {
    const set = exercises[i]?.sets.findIndex((s) => !s.done) ?? -1
    return set >= 0 ? { exercise: i, set } : null
  }
  if (preferred !== null) {
    const picked = firstUndone(preferred)
    if (picked) return picked
  }
  for (let i = 0; i < exercises.length; i++) {
    const found = firstUndone(i)
    if (found) return found
  }
  return null
}

/** What a set will be logged as: its override, else its planned numbers. */
export function valuesOf(set: SetLog, overrides: Overrides): SetValues {
  return overrides[set.id] ?? { weight: set.weight ?? 0, reps: set.reps ?? 0 }
}

/**
 * Step the weight or reps of the current set and every undone set after it
 * in the same exercise — a heavier bar usually stays heavier.
 */
export function adjust(
  exercise: SessionExercise,
  fromSet: number,
  field: keyof SetValues,
  delta: number,
  overrides: Overrides,
): Overrides {
  const next = { ...overrides }
  exercise.sets.forEach((set, i) => {
    if (i < fromSet || set.done) return
    const v = valuesOf(set, overrides)
    const floor = field === 'reps' ? 1 : 0
    next[set.id] = { ...v, [field]: Math.max(floor, v[field] + delta) }
  })
  return next
}

export type NextUp =
  | { kind: 'set'; name: string; setNumber: number }
  | { kind: 'exercise'; name: string; values: SetValues }

/**
 * What follows `cursor` once its set is done: the next undone set of the
 * same exercise, else the first undone set of another. Null when nothing is left.
 */
export function nextUp(
  exercises: SessionExercise[],
  cursor: Cursor,
  overrides: Overrides,
): NextUp | null {
  const ex = exercises[cursor.exercise]
  if (!ex) return null
  for (let j = cursor.set + 1; j < ex.sets.length; j++) {
    if (!ex.sets[j]?.done) return { kind: 'set', name: ex.name, setNumber: j + 1 }
  }
  for (let i = 0; i < exercises.length; i++) {
    if (i === cursor.exercise) continue
    const other = exercises[i]
    const set = other?.sets.find((s) => !s.done)
    if (other && set)
      return { kind: 'exercise', name: other.name, values: valuesOf(set, overrides) }
  }
  return null
}

/**
 * The heaviest set of this exercise in the latest finished session before
 * `beforeDate` — "last time". Heavier wins; at the same weight, more reps.
 */
export function lastTime(
  rows: SessionHistoryRow[],
  exerciseId: string,
  beforeDate: string,
): SetValues | null {
  const sessions = rows
    .filter((r) => r.date < beforeDate)
    .sort((a, b) => b.date.localeCompare(a.date))
  for (const row of sessions) {
    const sets = row.sets.filter((s) => s.done && s.exercise_id === exerciseId)
    if (sets.length === 0) continue
    return sets.reduce<SetValues>(
      (best, s) => {
        const v = { weight: s.weight ?? 0, reps: s.reps ?? 0 }
        return v.weight > best.weight || (v.weight === best.weight && v.reps > best.reps) ? v : best
      },
      { weight: -1, reps: -1 },
    )
  }
  return null
}

/** Beats `last`: heavier, or as heavy for more reps. */
export function isRecord(value: SetValues, last: SetValues | null): boolean {
  if (!last) return false
  return value.weight > last.weight || (value.weight === last.weight && value.reps > last.reps)
}

/** The first exercise whose best done set beat last time, and by how much. */
export function sessionRecord(
  exercises: SessionExercise[],
  overrides: Overrides,
  last: (exercise: SessionExercise) => SetValues | null,
): { name: string; values: SetValues; delta: number } | null {
  for (const ex of exercises) {
    const before = last(ex)
    const best = ex.sets
      .filter((s) => s.done)
      .map((s) => valuesOf(s, overrides))
      .reduce<SetValues | null>(
        (b, v) => (!b || v.weight > b.weight || (v.weight === b.weight && v.reps > b.reps) ? v : b),
        null,
      )
    if (best && before && isRecord(best, before)) {
      return { name: ex.name, values: best, delta: best.weight - before.weight }
    }
  }
  return null
}

/** Sets done and reps × weight moved, over the sets ticked so far. */
export function sessionTotals(
  exercises: SessionExercise[],
  overrides: Overrides,
): { sets: number; volume: number } {
  const done = exercises.flatMap((e) => e.sets).filter((s) => s.done)
  return {
    sets: done.length,
    volume: done.reduce((sum, s) => {
      const v = valuesOf(s, overrides)
      return sum + v.weight * v.reps
    }, 0),
  }
}

/** `MM:SS` (or `H:MM:SS` past an hour) — the prototype's two-digit clock. */
export function formatTimer(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

/** "87,5" in Russian, "87.5" in English — the decimal comma follows the locale. */
export function formatKg(value: number, locale: string): string {
  return value.toLocaleString(locale, { maximumFractionDigits: 2 })
}
