import type { SessionHistoryRow } from '@/features/workouts/api/history.api'

export interface HistoryEntry {
  id: string
  workoutId: string
  date: string
  name: string
  minutes: number
  sets: number
  /** Σ reps × weight over the sets done, kg. */
  volume: number
}

export interface LiftSeries {
  name: string
  /** Heaviest weight per session, oldest first. */
  points: number[]
  /** Last point minus the first. */
  delta: number
}

const MS_PER_MINUTE = 60_000

/** One row per finished session: how long it took, sets done, volume moved. */
export function historyEntries(rows: SessionHistoryRow[]): HistoryEntry[] {
  return rows.map((row) => {
    const done = row.sets.filter((s) => s.done)
    const ms = Date.parse(row.completed_at) - Date.parse(row.started_at)
    return {
      id: row.id,
      workoutId: row.workout_id,
      date: row.date,
      name: row.workout_name,
      minutes: Number.isFinite(ms) && ms > 0 ? Math.round(ms / MS_PER_MINUTE) : 0,
      sets: done.length,
      volume: done.reduce((sum, s) => sum + (s.reps ?? 0) * (s.weight ?? 0), 0),
    }
  })
}

/**
 * The main lift — the weighted exercise done in the most sessions — and its
 * heaviest set per session over the last `max` of them. Null until it has two
 * points: one point is not a trend.
 */
export function mainLift(rows: SessionHistoryRow[], max = 8): LiftSeries | null {
  const sessionsByExercise = new Map<string, { name: string; count: number }>()
  for (const row of rows) {
    const seen = new Set<string>()
    for (const s of row.sets) {
      if (!s.done || !s.exercise_id || !s.weight || seen.has(s.exercise_id)) continue
      seen.add(s.exercise_id)
      const entry = sessionsByExercise.get(s.exercise_id)
      sessionsByExercise.set(s.exercise_id, {
        name: s.exercise_name ?? '',
        count: (entry?.count ?? 0) + 1,
      })
    }
  }
  let best: [string, { name: string; count: number }] | null = null
  for (const pair of sessionsByExercise) if (!best || pair[1].count > best[1].count) best = pair
  if (!best) return null

  const [exerciseId, { name }] = best
  const points = [...rows]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((row) =>
      Math.max(
        0,
        ...row.sets
          .filter((s) => s.done && s.exercise_id === exerciseId && s.weight)
          .map((s) => s.weight as number),
      ),
    )
    .filter((w) => w > 0)
    .slice(-max)
  if (points.length < 2) return null
  return { name, points, delta: (points.at(-1) ?? 0) - (points[0] ?? 0) }
}
