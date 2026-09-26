import { supabase } from '@/lib/supabase'
import type { Exercise, SessionData, SetLog } from '@/features/workouts/types'

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

interface SessionRow {
  date: string
  set_logs: SetLog[]
}

/**
 * A workout's exercises in display order, each planned set overlaid with what
 * was logged in the session being shown. A recurring workout shows today's
 * session (a fresh day starts unticked); a one-off keeps showing its latest
 * one, so a workout started yesterday carries on where it stopped.
 */
export async function fetchSessionExercises(
  workoutId: string,
  today: string,
): Promise<SessionData> {
  const [plan, latest] = await Promise.all([
    supabase
      .from('workout_exercises')
      .select(
        'id, exercise_id, target_sets, target_reps, target_weight, sort_order, exercises(name, muscle_group), set_logs(*)',
      )
      .eq('workout_id', workoutId)
      .is('set_logs.session_id', null)
      .order('sort_order', { ascending: true }),
    supabase
      .from('workout_sessions')
      .select('date, set_logs(*), workouts!inner(recurrence)')
      .eq('workout_id', workoutId)
      .lte('date', today)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])
  if (plan.error) throw plan.error
  if (latest.error) throw latest.error

  const row = latest.data as unknown as (SessionRow & { workouts: { recurrence: string } }) | null
  const session = row && (row.date === today || row.workouts.recurrence === 'none') ? row : null
  const logged = new Map(
    (session?.set_logs ?? []).map((l) => [`${l.workout_exercise_id}:${l.set_number}`, l]),
  )

  const exercises = (plan.data as unknown as WorkoutExerciseRow[]).map((ex) => ({
    id: ex.id,
    exerciseId: ex.exercise_id,
    name: ex.exercises?.name ?? 'Exercise',
    muscleGroup: ex.exercises?.muscle_group ?? null,
    targetSets: ex.target_sets,
    targetReps: ex.target_reps,
    targetWeight: ex.target_weight,
    sortOrder: ex.sort_order,
    sets: [...ex.set_logs]
      .sort((a, b) => a.set_number - b.set_number)
      .map((planned) => {
        const log = logged.get(`${ex.id}:${planned.set_number}`)
        // The plan row keeps its id and targets; only the record comes from the log.
        return { ...planned, done: log?.done ?? false, logged_at: log?.logged_at ?? null }
      }),
  }))
  return { date: session?.date ?? today, exercises }
}

/** Log one planned set in the session of `date`, creating the session on first use. */
export async function logSet(input: {
  workoutExerciseId: string
  setNumber: number
  date: string
  reps: number | null
  weight: number | null
  done: boolean
  restSeconds: number | null
}): Promise<void> {
  const { error } = await supabase.rpc('log_workout_set', {
    p_workout_exercise_id: input.workoutExerciseId,
    p_set_number: input.setNumber,
    p_date: input.date,
    // Nullable in SQL; the generated Args type only knows the non-null half.
    p_reps: input.reps as number,
    p_weight: input.weight as number,
    p_done: input.done,
    p_rest_seconds: input.restSeconds ?? undefined,
  })
  if (error) throw error
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

/** Attach an exercise to a workout, returning the new workout_exercises id. */
export async function addWorkoutExercise(input: AddExerciseInput): Promise<string> {
  const { data, error } = await supabase
    .from('workout_exercises')
    .insert({
      workout_id: input.workoutId,
      exercise_id: input.exerciseId,
      sort_order: input.sortOrder,
      target_sets: input.targetSets,
      target_reps: input.targetReps,
      target_weight: input.targetWeight,
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

/** Patch a workout_exercise (order / targets / swapped exercise). */
export async function updateWorkoutExercise(
  id: string,
  patch: Partial<{
    sort_order: number
    exercise_id: string
    target_sets: number | null
    target_reps: number | null
    target_weight: number | null
  }>,
): Promise<void> {
  const { error } = await supabase.from('workout_exercises').update(patch).eq('id', id)
  if (error) throw error
}

export async function removeWorkoutExercise(id: string): Promise<void> {
  const { error } = await supabase.from('workout_exercises').delete().eq('id', id)
  if (error) throw error
}

/** Append a set to an exercise, returning its new id. */
export async function addSet(input: {
  workoutExerciseId: string
  setNumber: number
  reps: number | null
  weight: number | null
  restSeconds?: number | null
}): Promise<string> {
  const { data, error } = await supabase
    .from('set_logs')
    .insert({
      workout_exercise_id: input.workoutExerciseId,
      set_number: input.setNumber,
      reps: input.reps,
      weight: input.weight,
      rest_seconds: input.restSeconds ?? null,
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function updateSet(
  id: string,
  patch: Partial<Pick<SetLog, 'reps' | 'weight' | 'done' | 'set_number' | 'rest_seconds'>>,
): Promise<void> {
  const { error } = await supabase.from('set_logs').update(patch).eq('id', id)
  if (error) throw error
}

export async function removeSet(id: string): Promise<void> {
  const { error } = await supabase.from('set_logs').delete().eq('id', id)
  if (error) throw error
}
