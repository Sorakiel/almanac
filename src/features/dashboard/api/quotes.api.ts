import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.generated'

export type Quote = Database['public']['Tables']['quotes']['Row']

/** All quotes (a small global, read-only table). */
export async function fetchQuotes(): Promise<Quote[]> {
  const { data, error } = await supabase.from('quotes').select('*')
  if (error) throw error
  return data
}
