import { useMutation, type MutateOptions } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { trackEvent } from '@/lib/analytics'
import { useToday } from '@/hooks/useToday'
import { OFFLINE_MUTATION_KEYS, type LogReadingProgressVariables } from '@/lib/offlineMutations'
import type { Book } from '@/features/reading/types'

interface LogProgressInput {
  book: Book
  /** The page/chapter the reader has now reached. */
  nextUnit: number
  /** Minutes spent this session — 0 for a plain progress edit. */
  minutes?: number
}

/**
 * Log reading progress: advance the book's current unit, auto-move its status
 * (to_read → reading → finished) and stamp the start/finish dates, then record a
 * reading session for the delta. One call keeps the book and its history in sync.
 *
 * mutationFn and the settle invalidation live once in registerOfflineMutations
 * (src/lib/offlineMutations.ts) — see useToggleHabit for why.
 */
export function useReadingProgress() {
  const { user } = useSession()
  const { dateKey } = useToday()
  const userId = user?.id ?? ''

  const mutation = useMutation<void, Error, LogReadingProgressVariables>({
    mutationKey: OFFLINE_MUTATION_KEYS.logReadingProgress,
    onSuccess: (_data, { book }) => {
      trackEvent('reading_progress_logged', { mode: book.progress_mode })
    },
  })

  const withDefaults = (input: LogProgressInput): LogReadingProgressVariables => ({
    book: input.book,
    nextUnit: input.nextUnit,
    minutes: input.minutes ?? 0,
    userId,
    dateKey,
  })

  return {
    ...mutation,
    mutate: (
      input: LogProgressInput,
      options?: MutateOptions<void, Error, LogReadingProgressVariables>,
    ) => mutation.mutate(withDefaults(input), options),
    mutateAsync: (input: LogProgressInput) => mutation.mutateAsync(withDefaults(input)),
  }
}
