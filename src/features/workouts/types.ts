import type { Database } from '@/types/database.generated'

export type Workout = Database['public']['Tables']['workouts']['Row']
export type WorkoutInsert = Database['public']['Tables']['workouts']['Insert']
export type Exercise = Database['public']['Tables']['exercises']['Row']
export type WorkoutExercise = Database['public']['Tables']['workout_exercises']['Row']
export type SetLog = Database['public']['Tables']['set_logs']['Row']

/** A workout's lifecycle state, derived from its dates. */
export type WorkoutStatus = 'completed' | 'scheduled' | 'unplanned'

/** A workout plus its derived status — the list render unit. */
export interface WorkoutView extends Workout {
  status: WorkoutStatus
}

/** One exercise within a workout, joined with its name and logged sets. */
export interface SessionExercise {
  id: string
  exerciseId: string
  name: string
  muscleGroup: string | null
  targetSets: number | null
  targetReps: number | null
  targetWeight: number | null
  sortOrder: number
  sets: SetLog[]
}
