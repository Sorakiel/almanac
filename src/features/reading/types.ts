import type { Database } from '@/types/database.generated'

export type Book = Database['public']['Tables']['books']['Row']
export type BookInsert = Database['public']['Tables']['books']['Insert']
export type BookNote = Database['public']['Tables']['book_notes']['Row']
export type BookNoteInsert = Database['public']['Tables']['book_notes']['Insert']
export type ReadingSession = Database['public']['Tables']['reading_sessions']['Row']
export type ReadingSessionInsert = Database['public']['Tables']['reading_sessions']['Insert']

export type BookProgressMode = Database['public']['Enums']['book_progress_mode']
export type BookStatus = Database['public']['Enums']['book_status']
