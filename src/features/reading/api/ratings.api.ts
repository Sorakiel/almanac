import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.generated'

export type BookRatingEvent = Database['public']['Tables']['book_rating_events']['Row']
type BookRatingEventInsert = Database['public']['Tables']['book_rating_events']['Insert']

/** Append a rating-change event (for stats on how a book's rating evolved). */
export async function logBookRatingEvent(input: BookRatingEventInsert): Promise<void> {
  const { error } = await supabase.from('book_rating_events').insert(input)
  if (error) throw error
}
