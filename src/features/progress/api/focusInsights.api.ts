import { supabase } from '@/lib/supabase'

/** One focus session reduced to the fields the stats need (own-rows via RLS). */
export interface FocusInsightsRow {
  date: string
  minutes: number
}

/** A user's finished focus sessions (date + minutes), for Deep Work stats. */
export async function fetchFocusInsightsData(userId: string): Promise<FocusInsightsRow[]> {
  const { data, error } = await supabase
    .from('focus_sessions')
    .select('date, minutes')
    .eq('user_id', userId)
  if (error) throw error
  return data
}
