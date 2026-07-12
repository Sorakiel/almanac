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

export async function createWorkout(input: WorkoutInsert): Promise<Workout> {
  const { data, error } = await supabase.from('workouts').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateWorkout(
  id: string,
  patch: Partial<Pick<Workout, 'name' | 'scheduled_date' | 'completed_at'>>,
): Promise<Workout> {
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
