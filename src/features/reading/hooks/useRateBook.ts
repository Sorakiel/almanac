import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { updateBook } from '@/features/reading/api/books.api'
import { logBookRatingEvent } from '@/features/reading/api/ratings.api'
import type { Book } from '@/features/reading/types'

/**
 * Set (or clear) a book's rating. Persists it on the book and, when a rating is
 * set, appends a rating-change event with the current progress — so we can chart
 * how the rating moved while the book was being read.
 */
export function useRateBook() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const userId = user?.id ?? ''

  return useMutation({
    mutationFn: async ({ book, rating }: { book: Book; rating: number | null }) => {
      await updateBook(book.id, { rating })
      if (rating !== null) {
        await logBookRatingEvent({
          user_id: userId,
          book_id: book.id,
          rating,
          current_unit: book.current_unit,
        })
      }
    },
    onSuccess: (_data, { book }) => {
      void queryClient.invalidateQueries({ queryKey: ['books', userId] })
      void queryClient.invalidateQueries({ queryKey: ['book', book.id] })
      void queryClient.invalidateQueries({ queryKey: ['bookRatingEvents', book.id] })
    },
  })
}
