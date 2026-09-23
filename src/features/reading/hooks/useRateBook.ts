import { useSession } from '@/hooks/useSession'
import { useOfflineMutation } from '@/hooks/useOfflineMutation'
import { OFFLINE_MUTATION_KEYS } from '@/lib/offlineMutations'
import type { Book } from '@/features/reading/types'

/**
 * Set (or clear) a book's rating. Persists it on the book and, when a rating is
 * set, appends a rating-change event with the current progress — so we can chart
 * how the rating moved while the book was being read.
 */
export function useRateBook() {
  const { user } = useSession()
  const userId = user?.id ?? ''

  return useOfflineMutation(
    OFFLINE_MUTATION_KEYS.rateBook,
    (input: { book: Book; rating: number | null }) => ({ ...input, userId }),
  )
}
