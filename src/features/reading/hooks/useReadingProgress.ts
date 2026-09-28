import { useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { useOfflineMutation } from '@/hooks/useOfflineMutation'
import { trackEvent } from '@/lib/analytics'
import { useToday } from '@/hooks/useToday'
import { OFFLINE_MUTATION_KEYS } from '@/lib/offlineMutations'
import { progressPatch } from '@/features/reading/lib/progress'
import { readingKeys } from '@/features/reading/hooks/queryKeys'
import type { Book, ReadingSession } from '@/features/reading/types'

interface LogProgressInput {
  book: Book
  /** The page/chapter the reader has now reached. */
  nextUnit: number
  /** Minutes spent this session — 0 for a plain progress edit. */
  minutes?: number
  /** Client id for the session row — pass one to be able to undo this log. */
  sessionId?: string
}

interface Snapshot {
  book: Book | undefined
  books: Book[] | undefined
  sessions: ReadingSession[] | undefined
}

/**
 * Log reading progress: advance the book's current unit, auto-move its status
 * (to_read → reading → finished) and stamp the start/finish dates, then record a
 * reading session for the delta. One call keeps the book and its history in sync.
 *
 * The screen moves first — position, status and today's tally — so the "+N"
 * tap reads instantly and offline; the settle invalidation then swaps in the
 * server's rows.
 */
export function useReadingProgress() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const { dateKey } = useToday()
  const userId = user?.id ?? ''

  return useOfflineMutation(
    OFFLINE_MUTATION_KEYS.logReadingProgress,
    ({ book, nextUnit, minutes = 0, sessionId }: LogProgressInput) => ({
      book,
      nextUnit,
      minutes,
      userId,
      dateKey,
      sessionId: sessionId ?? crypto.randomUUID(),
    }),
    {
      onMutate: async ({ book, nextUnit, minutes, sessionId }): Promise<Snapshot> => {
        const keys = {
          book: readingKeys.book(book.id),
          books: readingKeys.books(userId),
          sessions: readingKeys.sessions(book.id),
        }
        await Promise.all(
          Object.values(keys).map((queryKey) => queryClient.cancelQueries({ queryKey })),
        )
        const snapshot: Snapshot = {
          book: queryClient.getQueryData<Book>(keys.book),
          books: queryClient.getQueryData<Book[]>(keys.books),
          sessions: queryClient.getQueryData<ReadingSession[]>(keys.sessions),
        }

        const { patch, delta } = progressPatch(book, nextUnit, dateKey)
        queryClient.setQueryData<Book>(keys.book, (b) => (b ? { ...b, ...patch } : b))
        queryClient.setQueryData<Book[]>(keys.books, (list) =>
          list?.map((b) => (b.id === book.id ? { ...b, ...patch } : b)),
        )
        if (delta > 0 || minutes > 0) {
          const draft: ReadingSession = {
            id: sessionId ?? `pending-${Date.now()}`,
            user_id: userId,
            book_id: book.id,
            date: dateKey,
            units_read: delta,
            minutes,
            created_at: new Date().toISOString(),
          }
          queryClient.setQueryData<ReadingSession[]>(keys.sessions, (list) =>
            list ? [draft, ...list] : list,
          )
          queryClient.setQueryData<ReadingSession[]>(readingKeys.recent(userId), (list) =>
            list ? [draft, ...list] : list,
          )
        }
        return snapshot
      },
      onError: (_error, { book }, snapshot) => {
        if (!snapshot) return
        queryClient.setQueryData(readingKeys.book(book.id), snapshot.book)
        queryClient.setQueryData(readingKeys.books(userId), snapshot.books)
        queryClient.setQueryData(readingKeys.sessions(book.id), snapshot.sessions)
      },
      onSuccess: (_data, { book }) =>
        trackEvent('reading_progress_logged', { mode: book.progress_mode }),
    },
  )
}

/**
 * Undo a "+N": the book goes back to how it was and the session the tap
 * wrote is removed — on screen at once, on the server in order after the log.
 */
export function useUndoReadingProgress() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const userId = user?.id ?? ''

  return useOfflineMutation(
    OFFLINE_MUTATION_KEYS.undoReadingProgress,
    ({ book, sessionId }: { book: Book; sessionId: string }) => ({ book, sessionId, userId }),
    {
      onMutate: ({ book, sessionId }) => {
        const drop = (list: ReadingSession[] | undefined) => list?.filter((s) => s.id !== sessionId)
        queryClient.setQueryData<Book>(readingKeys.book(book.id), (b) => (b ? book : b))
        queryClient.setQueryData<Book[]>(readingKeys.books(userId), (list) =>
          list?.map((b) => (b.id === book.id ? book : b)),
        )
        queryClient.setQueryData<ReadingSession[]>(readingKeys.sessions(book.id), drop)
        queryClient.setQueryData<ReadingSession[]>(readingKeys.recent(userId), drop)
      },
    },
  )
}
