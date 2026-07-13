import { supabase } from '@/lib/supabase'
import type { BookNote, BookNoteInsert } from '@/features/reading/types'

/** Notes for a book, newest first (own-rows via RLS). */
export async function fetchBookNotes(bookId: string): Promise<BookNote[]> {
  const { data, error } = await supabase
    .from('book_notes')
    .select('*')
    .eq('book_id', bookId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createBookNote(input: BookNoteInsert): Promise<BookNote> {
  const { data, error } = await supabase.from('book_notes').insert(input).select().single()
  if (error) throw error
  return data
}

export async function deleteBookNote(id: string): Promise<void> {
  const { error } = await supabase.from('book_notes').delete().eq('id', id)
  if (error) throw error
}
