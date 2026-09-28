import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { useBook } from '@/features/reading/hooks/useBook'
import {
  useReadingProgress,
  useUndoReadingProgress,
} from '@/features/reading/hooks/useReadingProgress'
import { quickAmount, unitCount, unitsReadOn } from '@/features/reading/lib/progress'
import type { Book } from '@/features/reading/types'
import { useT } from '@/hooks/useT'
import { useToday } from '@/hooks/useToday'
import { BURST_COLORS, burst } from '@/lib/burst'
import { toastWithUndo } from '@/lib/undoToast'
import { toUserError } from '@/lib/userError'
import { useFocusStore } from '@/stores/focus'

/** "Читать 25 мин" — one focus block with the book as its target. */
export const READING_SESSION_MIN = 25

interface QuickRead {
  /** Units logged today across this book's sessions. */
  readToday: number
  /** What "+N" logs now: the rest of today's goal, or the goal again once met. */
  amount: number
  goal: number | null
  /** Log `amount` from the tapped button: sparks, then a toast with Undo. */
  log: (from: Element | null) => void
  /** Open Focus with a 25-minute block on this book. */
  readInFocus: () => void
}

/** The book's daily loop, shared by the reading hero and the book's page. */
export function useQuickRead(book: Book): QuickRead {
  const { t } = useT()
  const navigate = useNavigate()
  const { dateKey } = useToday()
  const { sessions } = useBook(book.id)
  const logProgress = useReadingProgress()
  const undo = useUndoReadingProgress()
  const startFocus = useFocusStore((s) => s.start)

  const readToday = unitsReadOn(sessions, dateKey)
  const amount = quickAmount(book, readToday)
  const goal = book.daily_goal && book.daily_goal > 0 ? book.daily_goal : null

  const log = (from: Element | null) => {
    const before = book
    const sessionId = crypto.randomUUID()
    // Not awaited: the numbers move now; offline the write queues.
    logProgress.mutate(
      { book, nextUnit: book.current_unit + amount, sessionId },
      { onError: (error) => toast.error(toUserError(error, t, 'reading.progressFailed')) },
    )
    burst(from, BURST_COLORS.reading)
    const units = unitCount(book.progress_mode, amount, t)
    const metNow = goal !== null && readToday < goal && readToday + amount >= goal
    toastWithUndo(
      t(metNow ? 'reading.screen.loggedGoal' : 'reading.screen.logged', { units }),
      t('common.undo'),
      () => undo.mutate({ book: before, sessionId }),
    )
  }

  const readInFocus = () => {
    startFocus(READING_SESSION_MIN, book.title, { bookId: book.id })
    navigate('/flow')
  }

  return { readToday, amount, goal, log, readInFocus }
}
