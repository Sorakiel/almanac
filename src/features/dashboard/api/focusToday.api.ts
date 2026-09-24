import { supabase } from '@/lib/supabase'

/** Minutes of finished focus sessions on one local day (own rows via RLS). */
export async function fetchFocusMinutesOn(userId: string, date: string): Promise<number> {
  const { data, error } = await supabase
    .from('focus_sessions')
    .select('minutes')
    .eq('user_id', userId)
    .eq('date', date)
  if (error) throw error
  return data.reduce((sum, row) => sum + row.minutes, 0)
}
