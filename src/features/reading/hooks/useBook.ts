import { useQuery } from '@tanstack/react-query'
import { fetchBookById } from '@/features/reading/api/books.api'
import { fetchBookNotes } from '@/features/reading/api/notes.api'
import { fetchReadingSessions } from '@/features/reading/api/sessions.api'
import type { Book, BookNote, ReadingSession } from '@/features/reading/types'

interface UseBookResult {
  book: Book | undefined
  notes: BookNote[]
  sessions: ReadingSession[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/** A single book with its notes and reading sessions (own-rows via RLS). */
export function useBook(id: string | undefined): UseBookResult {
  const enabled = Boolean(id)

  const bookQuery = useQuery({
    queryKey: ['book', id],
    queryFn: () => fetchBookById(id as string),
    enabled,
  })

  const notesQuery = useQuery({
    queryKey: ['bookNotes', id],
    queryFn: () => fetchBookNotes(id as string),
    enabled,
  })

  const sessionsQuery = useQuery({
    queryKey: ['readingSessions', id],
    queryFn: () => fetchReadingSessions(id as string),
    enabled,
  })

  return {
    book: bookQuery.data,
    notes: notesQuery.data ?? [],
    sessions: sessionsQuery.data ?? [],
    isLoading: bookQuery.isLoading || notesQuery.isLoading || sessionsQuery.isLoading,
    isError: bookQuery.isError,
    refetch: () => {
      void bookQuery.refetch()
      void notesQuery.refetch()
      void sessionsQuery.refetch()
    },
  }
}
