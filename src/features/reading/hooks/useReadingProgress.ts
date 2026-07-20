import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/hooks/useSession'
import { useToday } from '@/hooks/useToday'
import { updateBook, type BookPatch } from '@/features/reading/api/books.api'
import { createReadingSession } from '@/features/reading/api/sessions.api'
import { statusForProgress } from '@/features/reading/lib/progress'
import { emitActivity } from '@/features/social/api/social.api'
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
  const queryClient = useQueryClient()
  const { user } = useSession()
  const { dateKey } = useToday()
  const userId = user?.id ?? ''

  return useMutation({
    mutationFn: async ({ book, nextUnit, minutes = 0 }: LogProgressInput) => {
      const capped =
        book.total_units && book.total_units > 0
          ? Math.min(nextUnit, book.total_units)
          : Math.max(0, nextUnit)
      const delta = Math.max(0, capped - book.current_unit)
      const status = statusForProgress(book, capped)

      const patch: BookPatch = { current_unit: capped, status }
      if (status === 'reading' && !book.started_on) patch.started_on = dateKey
      if (status === 'finished' && !book.finished_on) patch.finished_on = dateKey

      await updateBook(book.id, patch)
      // Only log a session when something actually happened (time or pages).
      if (delta > 0 || minutes > 0) {
        await createReadingSession({
          user_id: userId,
          book_id: book.id,
          minutes,
          units_read: delta,
          date: dateKey,
        })
      }
      // Share pages/chapters read with friends — a count only, never the title.
      // Deduped per book per day in the DB; best-effort.
      if (delta > 0) {
        void emitActivity({
          user_id: userId,
          kind: 'reading_progress',
          subject: book.id,
          meta: { units: delta, unit: book.progress_mode },
          event_date: dateKey,
        }).catch(() => undefined)
      }
    },
    onSuccess: (_data, { book }) => {
      void queryClient.invalidateQueries({ queryKey: ['books', userId] })
      void queryClient.invalidateQueries({ queryKey: ['book', book.id] })
      void queryClient.invalidateQueries({ queryKey: ['readingSessions', book.id] })
    },
  })
}
