import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.generated'

export type FocusSessionInsert = Database['public']['Tables']['focus_sessions']['Insert']

/** Record a finished Flow block (minutes focused + what on). Own-rows via RLS. */
export async function createFocusSession(input: FocusSessionInsert): Promise<void> {
  const { error } = await supabase.from('focus_sessions').insert(input)
  if (error) throw error
}
