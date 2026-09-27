import { SectionLabel } from '@/components/common/SectionLabel'
import { BookCard } from '@/features/reading/components/BookCard'
import { groupBooks } from '@/features/reading/lib/library'
import { riseStagger } from '@/lib/motion'
import type { Book } from '@/features/reading/types'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

interface ShelfProps {
  title: string
  books: Book[]
  /** Two cards per row on wide screens; a narrow side column keeps one. */
  wide?: boolean
}

/** One titled run of book cards; renders nothing when empty. */
export function Shelf({ title, books, wide = false }: ShelfProps) {
  if (books.length === 0) return null
  const stagger = riseStagger()
  return (
    <section className="flex flex-col gap-3">
      <SectionLabel accessory={String(books.length)}>{title}</SectionLabel>
      <div className={cn('grid gap-3', wide && 'lg:grid-cols-2')}>
        {books.map((book, i) => {
          const rise = stagger(i)
          return (
            <div key={book.id} className={rise.className} style={rise.style}>
              <BookCard book={book} />
            </div>
          )
        })}
      </div>
    </section>
  )
}

/** The phone's library, grouped: currently reading, up next, then finished. */
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
