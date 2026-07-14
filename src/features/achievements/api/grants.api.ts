import { supabase } from '@/lib/supabase'

/** Achievement ids granted to a user (own via RLS, or any user for admins). */
export async function fetchGrantedIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('achievement_grants')
    .select('achievement_id')
    .eq('user_id', userId)
  if (error) throw error
  return data.map((row) => row.achievement_id)
}

/** Award a manual achievement (owner only, enforced by RLS). */
export async function grantAchievement(
  userId: string,
  achievementId: string,
  grantedBy: string,
): Promise<void> {
  const { error } = await supabase
    .from('achievement_grants')
    .insert({ user_id: userId, achievement_id: achievementId, granted_by: grantedBy })
  if (error) throw error
}

/** Revoke a manual achievement (owner only, enforced by RLS). */
export async function revokeAchievement(userId: string, achievementId: string): Promise<void> {
  const { error } = await supabase
    .from('achievement_grants')
    .delete()
    .eq('user_id', userId)
    .eq('achievement_id', achievementId)
  if (error) throw error
}
