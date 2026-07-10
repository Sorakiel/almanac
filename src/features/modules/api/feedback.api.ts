import { supabase } from '@/lib/supabase'

/** File a piece of user feedback (module suggestions, ideas, bugs). */
export async function submitFeedback(userId: string, body: string): Promise<void> {
  const { error } = await supabase.from('feedback').insert({ user_id: userId, body })
  if (error) throw error
}
