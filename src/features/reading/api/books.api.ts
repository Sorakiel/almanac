import { supabase } from '@/lib/supabase'
import type { Book, BookInsert } from '@/features/reading/types'

/** A user's books, most recently added first (own-rows via RLS). */
export async function fetchBooks(userId: string): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchBookById(id: string): Promise<Book> {
  const { data, error } = await supabase.from('books').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createBook(input: BookInsert): Promise<Book> {
  const { data, error } = await supabase.from('books').insert(input).select().single()
  if (error) throw error
  return data
}

export type BookPatch = Partial<
  Pick<
    Book,
    | 'title'
    | 'author'
    | 'progress_mode'
    | 'total_units'
    | 'current_unit'
    | 'status'
    | 'started_on'
    | 'finished_on'
    | 'rating'
  >
>

export async function updateBook(id: string, patch: BookPatch): Promise<Book> {
  const { data, error } = await supabase.from('books').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteBook(id: string): Promise<void> {
  const { error } = await supabase.from('books').delete().eq('id', id)
  if (error) throw error
}
