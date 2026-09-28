import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.generated'

export type FocusSessionInsert = Database['public']['Tables']['focus_sessions']['Insert']

/** A logged block as the Flow screen lists it. */
export interface FocusSessionRow {
  id: string
  date: string
  minutes: number
  label: string | null
  created_at: string
}

/** Record a finished Flow block (minutes focused + what on). Own-rows via RLS. */
export async function createFocusSession(input: FocusSessionInsert): Promise<void> {
  const { error } = await supabase.from('focus_sessions').insert(input)
  if (error) throw error
}

/** Take a just-logged block back (the finish toast's Undo). */
export async function deleteFocusSession(id: string): Promise<void> {
  const { error } = await supabase.from('focus_sessions').delete().eq('id', id)
  if (error) throw error
}

/** Blocks logged on or after `sinceKey`, newest first — the week bars and the recent list. */
export async function fetchFocusSessionsSince(
  userId: string,
  sinceKey: string,
): Promise<FocusSessionRow[]> {
  const { data, error } = await supabase
    .from('focus_sessions')
    .select('id, date, minutes, label, created_at')
    .eq('user_id', userId)
    .gte('date', sinceKey)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}
