import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { fetchBooks } from '@/features/reading/api/books.api'
import type { Book } from '@/features/reading/types'

interface UseBooksResult {
  books: Book[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/** The signed-in user's library, newest first (own-rows via RLS). */
export function useBooks(): UseBooksResult {
  const { user } = useSession()
  const userId = user?.id ?? ''

  const query = useQuery({
    queryKey: ['books', userId],
    queryFn: () => fetchBooks(userId),
    enabled: Boolean(userId),
  })

  return {
    books: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => void query.refetch(),
  }
}
