import { SectionLabel } from '@/components/common/SectionLabel'
import { BookCard } from '@/features/reading/components/BookCard'
import { groupBooks } from '@/features/reading/lib/library'
import { riseStagger } from '@/lib/motion'
import type { Book } from '@/features/reading/types'
import { useT } from '@/hooks/useT'

interface Selection {
  /** The book open in the desktop inspector, if any. */
  selectedId?: string | null
  /** Given, a card opens the book in place instead of on its page. */
  onSelect?: (id: string) => void
}

function Shelf({
  title,
  books,
  selectedId,
  onSelect,
}: { title: string; books: Book[] } & Selection) {
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
              <BookCard
                book={book}
                onOpen={onSelect ? () => onSelect(book.id) : undefined}
                selected={selectedId === book.id}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** The library, grouped: currently reading, up next, then finished. */
export function BookShelf({ books, ...selection }: { books: Book[] } & Selection) {
  const { t } = useT()
  const grouped = groupBooks(books)
  return (
    <div className="flex flex-col gap-5">
      <Shelf title={t('reading.readingNow')} books={grouped.reading} {...selection} />
      <Shelf title={t('reading.upNext')} books={grouped.to_read} {...selection} />
      <Shelf title={t('reading.finishedSection')} books={grouped.finished} {...selection} />
    </div>
  )
}
