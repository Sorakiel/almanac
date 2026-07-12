import { supabase } from '@/lib/supabase'

export interface WorkoutInsightsRow {
  id: string
  name: string
  completed_at: string | null
  created_at: string
  scheduled_date: string | null
  workout_exercises: {
    exercises: { name: string } | null
    set_logs: { reps: number | null; weight: number | null; done: boolean }[]
  }[]
}

/** Every workout for a user with its exercises + logged sets, for stats. */
export async function fetchWorkoutInsightsData(userId: string): Promise<WorkoutInsightsRow[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select(
      'id, name, completed_at, created_at, scheduled_date, workout_exercises(exercises(name), set_logs(reps, weight, done))',
    )
    .eq('user_id', userId)
  if (error) throw error
  return data as unknown as WorkoutInsightsRow[]
}
