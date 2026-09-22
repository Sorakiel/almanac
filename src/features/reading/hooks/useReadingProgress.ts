import { useSession } from '@/hooks/useSession'
import { useOfflineMutation } from '@/hooks/useOfflineMutation'
import { trackEvent } from '@/lib/analytics'
import { useToday } from '@/hooks/useToday'
import { OFFLINE_MUTATION_KEYS } from '@/lib/offlineMutations'
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
 */
export function useReadingProgress() {
  const { user } = useSession()
  const { dateKey } = useToday()
  const userId = user?.id ?? ''

  return useOfflineMutation(
    OFFLINE_MUTATION_KEYS.logReadingProgress,
    ({ book, nextUnit, minutes = 0 }: LogProgressInput) => ({
      book,
      nextUnit,
      minutes,
      userId,
      dateKey,
    }),
    {
      onSuccess: (_data, { book }) =>
        trackEvent('reading_progress_logged', { mode: book.progress_mode }),
    },
  )
}
