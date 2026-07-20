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

export async function createReadingSession(input: ReadingSessionInsert): Promise<ReadingSession> {
  const { data, error } = await supabase.from('reading_sessions').insert(input).select().single()
  if (error) throw error
  return data
}
