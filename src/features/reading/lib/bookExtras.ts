import type { Book } from '@/features/reading/types'

/** The edit-only fields, as the sheet holds them until Save. */
export interface BookExtras {
  /** The exact page/chapter, as typed — '' leaves it alone. */
  current: string
  startedOn: string
  finishedOn: string
  rating: number | null
}

/** The sheet's starting values for a book. */
export function extrasOf(book: Book): BookExtras {
  return {
    current: String(book.current_unit),
    startedOn: book.started_on ?? '',
    finishedOn: book.finished_on ?? '',
    rating: book.rating,
  }
}
