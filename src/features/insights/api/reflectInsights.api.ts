import { supabase } from '@/lib/supabase'

/** One reflection reduced to the fields the stats need (own-rows via RLS). */
export interface ReflectInsightsRow {
  date: string
  day_rating: number | null
}

/** A user's reflections (date + rating only), for journaling stats. */
export async function fetchReflectInsightsData(userId: string): Promise<ReflectInsightsRow[]> {
  const { data, error } = await supabase
    .from('reflections')
    .select('date, day_rating')
    .eq('user_id', userId)
  if (error) throw error
  return data
}
