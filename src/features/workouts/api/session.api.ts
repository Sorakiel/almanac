import { supabase } from '@/lib/supabase'
import type { Exercise, SessionExercise, SetLog } from '@/features/workouts/types'

interface WorkoutExerciseRow {
  id: string
  exercise_id: string
  target_sets: number | null
  target_reps: number | null
  target_weight: number | null
  sort_order: number
  exercises: { name: string; muscle_group: string | null } | null
  set_logs: SetLog[]
}

/** A workout's exercises with their nested set logs, in display order. */
export async function fetchSessionExercises(workoutId: string): Promise<SessionExercise[]> {
  const { data, error } = await supabase
    .from('workout_exercises')
    .select(
      'id, exercise_id, target_sets, target_reps, target_weight, sort_order, exercises(name, muscle_group), set_logs(*)',
    )
    .eq('workout_id', workoutId)
    .order('sort_order', { ascending: true })
  if (error) throw error

  return (data as unknown as WorkoutExerciseRow[]).map((row) => ({
    id: row.id,
    exerciseId: row.exercise_id,
    name: row.exercises?.name ?? 'Exercise',
    muscleGroup: row.exercises?.muscle_group ?? null,
    targetSets: row.target_sets,
    targetReps: row.target_reps,
    targetWeight: row.target_weight,
    sortOrder: row.sort_order,
    sets: [...row.set_logs].sort((a, b) => a.set_number - b.set_number),
  }))
}

/** The user's exercise library (for the add-exercise picker). */
export async function fetchExerciseLibrary(userId: string): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

/** Create a library exercise, or return the existing one with the same name. */
export async function createExercise(
  userId: string,
  name: string,
  muscleGroup: string | null,
): Promise<Exercise> {
  const { data, error } = await supabase
    .from('exercises')
    .insert({ user_id: userId, name, muscle_group: muscleGroup })
    .select()
    .single()
  if (error) throw error
  return data
}

interface AddExerciseInput {
  workoutId: string
  exerciseId: string
  sortOrder: number
  targetSets: number | null
  targetReps: number | null
  targetWeight: number | null
}

/** Attach an exercise to a workout. */
export async function addWorkoutExercise(input: AddExerciseInput): Promise<void> {
  const { error } = await supabase.from('workout_exercises').insert({
    workout_id: input.workoutId,
    exercise_id: input.exerciseId,
    sort_order: input.sortOrder,
    target_sets: input.targetSets,
    target_reps: input.targetReps,
    target_weight: input.targetWeight,
  })
  if (error) throw error
}

export async function removeWorkoutExercise(id: string): Promise<void> {
  const { error } = await supabase.from('workout_exercises').delete().eq('id', id)
  if (error) throw error
}

/** Append a set to an exercise, prefilled from the target where available. */
export async function addSet(
  workoutExerciseId: string,
  setNumber: number,
  reps: number | null,
  weight: number | null,
): Promise<void> {
  const { error } = await supabase.from('set_logs').insert({
    workout_exercise_id: workoutExerciseId,
    set_number: setNumber,
    reps,
    weight,
  })
  if (error) throw error
}

export async function updateSet(
  id: string,
  patch: Partial<Pick<SetLog, 'reps' | 'weight' | 'done'>>,
): Promise<void> {
  const { error } = await supabase.from('set_logs').update(patch).eq('id', id)
  if (error) throw error
}

export async function removeSet(id: string): Promise<void> {
  const { error } = await supabase.from('set_logs').delete().eq('id', id)
  if (error) throw error
}
