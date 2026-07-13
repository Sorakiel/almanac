import { supabase } from '@/lib/supabase'
import type { Book, ReadingSession } from '@/features/reading/types'

export interface ReadingInsightsData {
  books: Book[]
  sessions: Pick<ReadingSession, 'book_id' | 'minutes' | 'units_read' | 'date'>[]
}

/** A user's books plus their reading sessions, for reading stats (own-rows RLS). */
export async function fetchReadingInsightsData(userId: string): Promise<ReadingInsightsData> {
  const [booksRes, sessionsRes] = await Promise.all([
    supabase.from('books').select('*').eq('user_id', userId),
    supabase
      .from('reading_sessions')
      .select('book_id, minutes, units_read, date')
      .eq('user_id', userId),
  ])
  if (booksRes.error) throw booksRes.error
  if (sessionsRes.error) throw sessionsRes.error
  return { books: booksRes.data, sessions: sessionsRes.data }
}
