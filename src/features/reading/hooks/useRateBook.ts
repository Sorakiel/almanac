import { useMutation, type MutateOptions } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { OFFLINE_MUTATION_KEYS, type RateBookVariables } from '@/lib/offlineMutations'
import type { Book } from '@/features/reading/types'

interface RateBookInput {
  book: Book
  rating: number | null
}

/**
 * Set (or clear) a book's rating. Persists it on the book and, when a rating is
 * set, appends a rating-change event with the current progress — so we can chart
 * how the rating moved while the book was being read.
 *
 * mutationFn and the settle invalidation live once in registerOfflineMutations
 * (src/lib/offlineMutations.ts) — see useToggleHabit for why.
 */
export function useRateBook() {
  const { user } = useSession()
  const userId = user?.id ?? ''

  const mutation = useMutation<void, Error, RateBookVariables>({
    mutationKey: OFFLINE_MUTATION_KEYS.rateBook,
  })

  return {
    ...mutation,
    mutate: (input: RateBookInput, options?: MutateOptions<void, Error, RateBookVariables>) =>
      mutation.mutate({ ...input, userId }, options),
    mutateAsync: (input: RateBookInput) => mutation.mutateAsync({ ...input, userId }),
  }
}
