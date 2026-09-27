import { supabase } from '@/lib/supabase'
import type { Reflection, ReflectionInsert } from '@/features/reflect/types'

/** A user's reflections, newest calendar day first (own-rows via RLS). */
export async function fetchReflections(userId: string): Promise<Reflection[]> {
  const { data, error } = await supabase
    .from('reflections')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

/**
 * Write the day's reflection, creating it or overwriting it — one row per
 * user and day (`unique(user_id, date)`). Autosave and Today's mood chips both
 * write the same day, often before either has read the other's insert back;
 * keyed by the day, they all land on the one row instead of a 409.
 */
export async function upsertReflection(row: Omit<ReflectionInsert, 'id'>): Promise<Reflection> {
  const { data, error } = await supabase
    .from('reflections')
    .upsert(row, { onConflict: 'user_id,date' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteReflection(id: string): Promise<void> {
  const { error } = await supabase.from('reflections').delete().eq('id', id)
  if (error) throw error
}

/**
 * The Undo of `deleteReflection`: put the very row back — same id, date and
 * timestamp — so it returns to its place in the history rather than as a new entry.
 */
export async function restoreReflection(reflection: Reflection): Promise<void> {
  const { error } = await supabase.from('reflections').insert(reflection)
  if (error) throw error
}
