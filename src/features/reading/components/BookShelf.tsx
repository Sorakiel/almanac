import { SectionLabel } from '@/components/common/SectionLabel'
import { BookCard } from '@/features/reading/components/BookCard'
import { groupBooks } from '@/features/reading/lib/library'
import { riseStagger } from '@/lib/motion'
import type { Book } from '@/features/reading/types'
import { useT } from '@/hooks/useT'

function Shelf({ title, books }: { title: string; books: Book[] }) {
  if (books.length === 0) return null
  const stagger = riseStagger()
  return (
    <div className="flex flex-col gap-3">
      <SectionLabel accessory={String(books.length)}>{title}</SectionLabel>
      <div className="grid gap-3 lg:grid-cols-2">
        {books.map((book, i) => {
          const rise = stagger(i)
          return (
            <div key={book.id} className={rise.className} style={rise.style}>
              <BookCard book={book} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** The library, grouped: currently reading, up next, then finished. */
export function BookShelf({ books }: { books: Book[] }) {
  const { t } = useT()
  const grouped = groupBooks(books)
  return (
    <div className="flex flex-col gap-5">
      <Shelf title={t('reading.readingNow')} books={grouped.reading} />
      <Shelf title={t('reading.upNext')} books={grouped.to_read} />
      <Shelf title={t('reading.finishedSection')} books={grouped.finished} />
    </div>
  )
}
