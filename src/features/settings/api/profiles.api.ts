import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.generated'

export type Profile = Database['public']['Tables']['profiles']['Row']

/** The signed-in user's own profile row (RLS restricts to auth.uid()). */
export async function fetchOwnProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error) throw error
  return data
}
