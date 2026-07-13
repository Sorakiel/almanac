import type { Book, BookStatus } from '@/features/reading/types'

/** Books split by status, each newest-first (input is already newest-first). */
export interface GroupedBooks {
  reading: Book[]
  to_read: Book[]
  finished: Book[]
}

export function groupBooks(books: Book[]): GroupedBooks {
  return {
    reading: books.filter((b) => b.status === 'reading'),
    to_read: books.filter((b) => b.status === 'to_read'),
    finished: books.filter((b) => b.status === 'finished'),
  }
}

export interface LibraryStats {
  total: number
  reading: number
  finished: number
  /** Books finished in the calendar year of `dateKey`. */
  finishedThisYear: number
}

export function libraryStats(books: Book[], dateKey: string): LibraryStats {
  const year = dateKey.slice(0, 4)
  const count = (status: BookStatus) => books.filter((b) => b.status === status).length
  return {
    total: books.length,
    reading: count('reading'),
    finished: count('finished'),
    finishedThisYear: books.filter((b) => b.status === 'finished' && b.finished_on?.startsWith(year))
      .length,
  }
}
