import { lastNDateKeys } from '@/lib/date'
import type { WorkoutInsightsRow } from '@/features/insights/api/workoutInsights.api'
import type { ExerciseFrequency, ExercisePR, WorkoutInsights } from '@/features/insights/types'

const TOP_N = 5

/** The workout's effective calendar date for time-bucketing. */
function workoutDate(w: WorkoutInsightsRow): string {
  return (w.completed_at ?? w.scheduled_date ?? w.created_at).slice(0, 10)
}

/**
 * Roll workouts + their sets into training stats. Volume and the 30-day count
 * bucket by the workout's date (completed → scheduled → created); frequency and
 * PRs span all history. A "done set" with reps and weight counts toward volume.
 */
export function computeWorkoutInsights(
  rows: WorkoutInsightsRow[],
  todayKey: string,
): WorkoutInsights {
  const since30 = lastNDateKeys(todayKey, 30)[0]!

  let volume30d = 0
  let completed30d = 0
  const sessionsByExercise = new Map<string, number>()
  const bestByExercise = new Map<string, ExercisePR>()

  for (const w of rows) {
    const date = workoutDate(w)
    const inWindow = date >= since30
    if (w.completed_at && inWindow) completed30d += 1

    for (const we of w.workout_exercises) {
      const name = we.exercises?.name?.trim()
      if (name) sessionsByExercise.set(name, (sessionsByExercise.get(name) ?? 0) + 1)

      for (const set of we.set_logs) {
        if (!set.done) continue
        const reps = set.reps ?? 0
        const weight = set.weight ?? 0
        if (inWindow) volume30d += reps * weight
        if (name && weight > 0) {
          const best = bestByExercise.get(name)
          if (!best || weight > best.weight || (weight === best.weight && reps > best.reps)) {
            bestByExercise.set(name, { name, weight, reps })
          }
        }
      }
    }
  }

  const topExercises: ExerciseFrequency[] = [...sessionsByExercise.entries()]
    .map(([name, sessions]) => ({ name, sessions }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, TOP_N)

  const prs: ExercisePR[] = [...bestByExercise.values()]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, TOP_N)

  return {
    totalSessions: rows.length,
    completedSessions: rows.filter((w) => w.completed_at).length,
    completed30d,
    volume30d: Math.round(volume30d),
    topExercises,
    prs,
    hasData: rows.length > 0,
  }
}
