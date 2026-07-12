import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.generated'

export type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

/** The signed-in user's own profile row (RLS restricts to auth.uid()). */
export async function fetchOwnProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error) throw error
  return data
}

/** Patch the signed-in user's own profile (RLS restricts to auth.uid()). */
export async function updateOwnProfile(userId: string, patch: ProfileUpdate): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select('*')
    .single()
  if (error) throw error
  return data
}
