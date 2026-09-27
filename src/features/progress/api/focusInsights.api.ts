import { supabase } from '@/lib/supabase'

/** One focus session reduced to the fields the stats need (own-rows via RLS). */
export interface FocusInsightsRow {
  date: string
  minutes: number
  /** When the session was logged — its end; the start is this minus `minutes`. */
  created_at: string
}

/** A user's finished focus sessions (date, minutes, when), for the Progress card. */
export async function fetchFocusInsightsData(userId: string): Promise<FocusInsightsRow[]> {
  const { data, error } = await supabase
    .from('focus_sessions')
    .select('date, minutes, created_at')
    .eq('user_id', userId)
  if (error) throw error
  return data
}
