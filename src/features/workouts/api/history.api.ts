import { supabase } from '@/lib/supabase'

/** One finished session with what was logged in it — the raw input of `lib/history`. */
export interface SessionHistoryRow {
  id: string
  date: string
  started_at: string
  completed_at: string
  workout_id: string
  workout_name: string
  sets: {
    reps: number | null
    weight: number | null
    done: boolean
    exercise_id: string | null
    exercise_name: string | null
  }[]
}

interface RawRow {
  id: string
  date: string
  started_at: string
  completed_at: string
  workout_id: string
  workouts: { name: string } | null
  set_logs: {
    reps: number | null
    weight: number | null
    done: boolean
    workout_exercises: {
      exercise_id: string
      exercises: { name: string } | null
    } | null
  }[]
}

/** The user's most recent finished sessions (RLS scopes them), newest first. */
export async function fetchSessionHistory(limit = 30): Promise<SessionHistoryRow[]> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select(
      'id, date, started_at, completed_at, workout_id, workouts(name), set_logs(reps, weight, done, workout_exercises(exercise_id, exercises(name)))',
    )
    .not('completed_at', 'is', null)
    .order('date', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data as unknown as RawRow[]).map((row) => ({
    id: row.id,
    date: row.date,
    started_at: row.started_at,
    completed_at: row.completed_at,
    workout_id: row.workout_id,
    workout_name: row.workouts?.name ?? '',
    sets: row.set_logs.map((s) => ({
      reps: s.reps,
      weight: s.weight,
      done: s.done,
      exercise_id: s.workout_exercises?.exercise_id ?? null,
      exercise_name: s.workout_exercises?.exercises?.name ?? null,
    })),
  }))
}
