import { isUniqueViolation } from '@/lib/pgErrors'
import { supabase } from '@/lib/supabase'
import type { ReadingSession, ReadingSessionInsert } from '@/features/reading/types'

/** Reading sessions for a book, newest first (own-rows via RLS). */
export async function fetchReadingSessions(bookId: string): Promise<ReadingSession[]> {
  const { data, error } = await supabase
    .from('reading_sessions')
    .select('*')
    .eq('book_id', bookId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

/**
 * One day's reading across every book since `sinceKey` — the screen's rhythm
 * and streak. Bounded, so a long history never loads whole.
 */
export async function fetchRecentReadingSessions(
  userId: string,
  sinceKey: string,
): Promise<ReadingSession[]> {
  const { data, error } = await supabase
    .from('reading_sessions')
    .select('*')
    .eq('user_id', userId)
    .gte('date', sinceKey)
    .order('date', { ascending: false })
  if (error) throw error
  return data
}

/** Insert a session; with a client id a retried insert is a no-op, not a twin. */
export async function createReadingSession(input: ReadingSessionInsert): Promise<void> {
  const { error } = await supabase.from('reading_sessions').insert(input)
  if (isUniqueViolation(error) && input.id) return
  if (error) throw error
}

/** Remove one session — the Undo of a "+N" tap. Gone already is fine. */
export async function deleteReadingSession(id: string): Promise<void> {
  const { error } = await supabase.from('reading_sessions').delete().eq('id', id)
  if (error) throw error
}
