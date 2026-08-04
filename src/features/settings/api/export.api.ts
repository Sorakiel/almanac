import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.generated'

/** One exported table: whatever RLS lets the signed-in user read of their own rows. */
type Rows = Record<string, unknown>[]

type TableName = keyof Database['public']['Tables']

export interface ExportPayload {
  exportedAt: string
  appVersion: string
  userId: string
  email: string | null
  data: Record<string, Rows>
}

/**
 * Tables keyed directly by `user_id`. `push_subscriptions` is deliberately absent:
 * it holds browser endpoints and auth secrets, which are plumbing rather than the
 * user's own record, and re-importing them elsewhere would be meaningless.
 */
const OWNED_TABLES = [
  'habits',
  'habit_logs',
  'habit_freezes',
  'habit_subtasks',
  'workouts',
  'exercises',
  'books',
  'reading_sessions',
  'book_notes',
  'reflections',
  'focus_sessions',
  'feedback',
  'achievement_grants',
  'activity_events',
] as const satisfies readonly TableName[]

async function selectAll(table: TableName, column: string, value: string): Promise<Rows> {
  const { data, error } = await supabase.from(table).select('*').eq(column, value)
  if (error) throw error
  return (data ?? []) as Rows
}

async function selectIn(table: TableName, column: string, values: string[]): Promise<Rows> {
  if (values.length === 0) return []
  const { data, error } = await supabase.from(table).select('*').in(column, values)
  if (error) throw error
  return (data ?? []) as Rows
}

function ids(rows: Rows): string[] {
  return rows.map((row) => row.id).filter((id): id is string => typeof id === 'string')
}

/**
 * Everything the signed-in user owns, in one object. Every read goes through the
 * ordinary anon key and RLS — there is no privileged path here, so an export can
 * never contain another person's rows even if a table were added to the list by
 * mistake.
 */
export async function fetchExport(
  userId: string,
  email: string | null,
  appVersion: string,
): Promise<ExportPayload> {
  const data: Record<string, Rows> = {}

  data.profile = await selectAll('profiles', 'id', userId)

  const owned = await Promise.all(OWNED_TABLES.map((t) => selectAll(t, 'user_id', userId)))
  OWNED_TABLES.forEach((table, i) => {
    data[table] = owned[i] ?? []
  })

  // Workout children hang off the workout, not the user — RLS reaches them through
  // an EXISTS on the parent, so they have to be fetched by parent id.
  const workoutExercises = await selectIn(
    'workout_exercises',
    'workout_id',
    ids(data.workouts ?? []),
  )
  data.workout_exercises = workoutExercises
  data.set_logs = await selectIn('set_logs', 'workout_exercise_id', ids(workoutExercises))

  const { data: friendships, error } = await supabase
    .from('friendships')
    .select('*')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
  if (error) throw error
  data.friendships = (friendships ?? []) as Rows

  return {
    exportedAt: new Date().toISOString(),
    appVersion,
    userId,
    email,
    data,
  }
}
