import type { Book } from '@/features/reading/types'

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
