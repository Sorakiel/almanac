import type { Book, BookProgressMode, BookStatus, ReadingSession } from '@/features/reading/types'
import type { BookPatch } from '@/features/reading/api/books.api'
import type { TFunction } from '@/hooks/useT'

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
export function unitNoun(mode: BookProgressMode, t: TFunction): string {
  return t(`reading.unitSingular.${mode}`)
}

/** Plural unit noun for the tracking mode ("pages" / "chapters"), for labels. */
export function unitNounPlural(mode: BookProgressMode, t: TFunction): string {
  return t(`reading.form.${mode}`)
}

/** A count with its unit, declined for the count: "1 page", "5 страниц". */
export function unitCount(mode: BookProgressMode, count: number, t: TFunction): string {
  return `${count} ${t(`reading.unitWord.${mode}`, { count })}`
}

/** Shelf-status label. */
export function statusLabel(status: BookStatus, t: TFunction): string {
  return t(`reading.statuses.${status}`)
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

/** Units logged for `dateKey` across a book's sessions — the "read today" tally. */
export function unitsReadOn(
  sessions: Pick<ReadingSession, 'date' | 'units_read'>[],
  dateKey: string,
): number {
  return sessions.filter((s) => s.date === dateKey).reduce((sum, s) => sum + s.units_read, 0)
}

/** How much one tap of the stepper moves the amount: pages in fives, chapters one by one. */
export function stepSize(mode: BookProgressMode): number {
  return mode === 'pages' ? 5 : 1
}

/** Units left before the end, or null when the length is unknown. */
export function unitsLeft(book: Pick<Book, 'current_unit' | 'total_units'>): number | null {
  if (!book.total_units || book.total_units <= 0) return null
  return Math.max(0, book.total_units - book.current_unit)
}

/**
 * What the one-tap "+N" button logs before anyone touches the stepper: what is
 * left of today's goal, or the whole goal once it is met (reading on is fine),
 * or a sensible default when there is no goal — never past the last page.
 */
export function quickAmount(book: Book, readToday: number): number {
  const goal = book.daily_goal && book.daily_goal > 0 ? book.daily_goal : null
  const fallback = book.progress_mode === 'pages' ? 10 : 1
  const wanted = goal ? (readToday < goal ? goal - readToday : goal) : fallback
  const left = unitsLeft(book)
  return Math.max(1, left === null ? wanted : Math.min(wanted, left))
}

/**
 * What logging `nextUnit` does to a book: the capped position, the status it
 * moves into and the start/finish dates it stamps, plus how many units that
 * was. Shared by the write itself and the screen's optimistic patch, so the two
 * cannot disagree.
 */
export function progressPatch(
  book: Book,
  nextUnit: number,
  dateKey: string,
): { patch: BookPatch; delta: number } {
  const capped =
    book.total_units && book.total_units > 0
      ? Math.min(nextUnit, book.total_units)
      : Math.max(0, nextUnit)
  const status = statusForProgress(book, capped)
  const patch: BookPatch = { current_unit: capped, status }
  if (status === 'reading' && !book.started_on) patch.started_on = dateKey
  if (status === 'finished' && !book.finished_on) patch.finished_on = dateKey
  return { patch, delta: Math.max(0, capped - book.current_unit) }
}
