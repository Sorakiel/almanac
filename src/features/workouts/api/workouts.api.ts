import { isUniqueViolation } from '@/lib/pgErrors'
import { supabase } from '@/lib/supabase'
import type { Workout, WorkoutInsert } from '@/features/workouts/types'

/** A user's workouts, newest-scheduled first (undated sink to the bottom). */
export async function fetchWorkouts(userId: string): Promise<Workout[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .order('scheduled_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

/** A single workout by id (own-rows RLS applies). */
export async function fetchWorkoutById(id: string): Promise<Workout> {
  const { data, error } = await supabase.from('workouts').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

/** Insert a workout; with a client id a retried insert resolves to the saved row, not a twin. */
export async function createWorkout(input: WorkoutInsert): Promise<Workout> {
  const { data, error } = await supabase.from('workouts').insert(input).select().single()
  if (isUniqueViolation(error) && input.id) return fetchWorkoutById(input.id)
  if (error) throw error
  return data
}

type WorkoutPatch = Partial<
  Pick<
    Workout,
    | 'name'
    | 'scheduled_date'
    | 'completed_at'
    | 'recurrence'
    | 'recurrence_days'
    | 'recurrence_interval'
  >
>

export async function updateWorkout(id: string, patch: WorkoutPatch): Promise<Workout> {
  const { data, error } = await supabase
    .from('workouts')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteWorkout(id: string): Promise<void> {
  const { error } = await supabase.from('workouts').delete().eq('id', id)
  if (error) throw error
}

/** Finish or reopen a workout's session on a local day; returns the workout with its last finish. */
export async function setSessionDone(id: string, date: string, done: boolean): Promise<Workout> {
  const { data, error } = await supabase.rpc('set_workout_session_done', {
    p_workout_id: id,
    p_date: date,
    p_done: done,
  })
  if (error) throw error
  return data
}
