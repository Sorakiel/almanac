import { SectionLabel } from '@/components/common/SectionLabel'
import { BookCard } from '@/features/reading/components/BookCard'
import { groupBooks } from '@/features/reading/lib/library'
import type { Book } from '@/features/reading/types'

function Shelf({ title, books }: { title: string; books: Book[] }) {
  if (books.length === 0) return null
  return (
    <div className="flex flex-col gap-3">
      <SectionLabel accessory={String(books.length)}>{title}</SectionLabel>
      <div className="grid gap-3 lg:grid-cols-2">
        {books.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </div>
  )
}

/** The library, grouped: currently reading, up next, then finished. */
export function BookShelf({ books }: { books: Book[] }) {
  const grouped = groupBooks(books)
  return (
    <div className="flex flex-col gap-5">
      <Shelf title="READING NOW" books={grouped.reading} />
      <Shelf title="UP NEXT" books={grouped.to_read} />
      <Shelf title="FINISHED" books={grouped.finished} />
    </div>
  )
}
