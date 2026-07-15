import type { Book, BookProgressMode, BookStatus } from '@/features/reading/types'

/** Completion fraction 0–1 for a book, or null when its length is unknown. */
export function progressFraction(book: Pick<Book, 'current_unit' | 'total_units'>): number | null {
  if (!book.total_units || book.total_units <= 0) return null
  return Math.min(1, Math.max(0, book.current_unit / book.total_units))
}

/** Whole-percent progress, or null when the total length is unknown. */
export function progressPct(book: Pick<Book, 'current_unit' | 'total_units'>): number | null {
  const fraction = progressFraction(book)
  return fraction === null ? null : Math.round(fraction * 100)
}

/** Whole-percent of a daily reading goal met by `readToday` units (capped 100). */
export function dailyGoalPct(readToday: number, goal: number): number {
  if (goal <= 0) return 0
  return Math.min(100, Math.round((readToday / goal) * 100))
}

/** Singular unit noun for the tracking mode ("page" / "chapter"). */
export function unitNoun(mode: BookProgressMode): string {
  return mode === 'chapters' ? 'chapter' : 'page'
}

/** Plural unit noun for the tracking mode ("pages" / "chapters"). */
export function unitNounPlural(mode: BookProgressMode): string {
  return mode === 'chapters' ? 'chapters' : 'pages'
}

const STATUS_LABELS: Record<BookStatus, string> = {
  to_read: 'To read',
  reading: 'Reading',
  finished: 'Finished',
}

export function statusLabel(status: BookStatus): string {
  return STATUS_LABELS[status]
}

/**
 * The status a book should take once its progress reaches (or leaves) the end.
 * Used to auto-advance to `finished` when the last unit is logged, and to lift a
 * book out of `to_read` the moment any progress lands.
 */
export function statusForProgress(book: Book, nextUnit: number): BookStatus {
  if (book.total_units && book.total_units > 0 && nextUnit >= book.total_units) return 'finished'
  if (nextUnit > 0 && book.status === 'to_read') return 'reading'
  return book.status
}
