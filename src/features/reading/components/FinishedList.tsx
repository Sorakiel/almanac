import { Link } from 'react-router-dom'
import { BookCover } from '@/features/reading/components/BookCover'
import type { Book } from '@/features/reading/types'
import { useT } from '@/hooks/useT'
import { dateFromKey } from '@/lib/date'
import { intlLocale } from '@/lib/dateLocale'

const STARS = 5

/** "Прочитано" (the prototype's `rDone`): thumb, title, author · date, stars. */
export function FinishedList({ books }: { books: Book[] }) {
  const { t, locale } = useT()
  const dayMonth = new Intl.DateTimeFormat(intlLocale(locale), {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
  return (
    <ul className="divide-y divide-foreground/10 overflow-hidden rounded-card bg-surface">
      {books.map((book) => (
        <li key={book.id}>
          <Link
            to={`/reading/${book.id}`}
            className="flex min-h-[58px] items-center gap-3 px-3.5 py-2 transition-colors hover:bg-foreground/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
          >
            <BookCover title={book.title} size="xs" />
            <div className="min-w-0 flex-1">
              <b className="block truncate text-body font-medium">{book.title}</b>
              <small className="block truncate text-footnote text-muted">
                {book.finished_on
                  ? t('reading.screen.finishedRow', {
                      author: book.author ?? t('reading.unknownAuthor'),
                      date: dayMonth.format(dateFromKey(book.finished_on)),
                    })
                  : (book.author ?? t('reading.unknownAuthor'))}
              </small>
            </div>
            {book.rating ? (
              <span
                className="flex-none text-footnote tracking-[1px] text-amber"
                aria-label={t('a11y.ratedOfFive', { value: book.rating })}
              >
                {'★'.repeat(Math.min(STARS, book.rating))}
              </span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  )
}
