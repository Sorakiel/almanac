import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { ProgressBlocks } from '@/components/common/ProgressBlocks'
import { RatingBars } from '@/components/common/RatingBars'
import { progressPct, unitCount } from '@/features/reading/lib/progress'
import type { Book } from '@/features/reading/types'
import { BookStatusTag } from '@/features/reading/components/BookStatusTag'
import { useT } from '@/hooks/useT'

/** Library list item: title, author, status, and progress. Links to detail. */
export function BookCard({ book }: { book: Book }) {
  const { t } = useT()
  const pct = progressPct(book)

  return (
    <Link to={`/reading/${book.id}`} className="block rounded-card">
      <Card className="flex flex-col gap-3 p-4 transition-colors hover:border-accent/40">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{book.title}</p>
            {book.author ? (
              <p className="truncate text-[13px] text-muted">{book.author}</p>
            ) : (
              <p className="text-[13px] text-muted-strong">{t('reading.unknownAuthor')}</p>
            )}
          </div>
          <div className="flex flex-none flex-col items-end gap-1">
            <BookStatusTag status={book.status} />
            {book.rating ? (
              <RatingBars
                value={book.rating}
                aria-label={t('a11y.ratedOfFive', { value: book.rating })}
              />
            ) : null}
          </div>
        </div>

        {pct !== null ? (
          <div className="flex items-center gap-3">
            <ProgressBlocks value={book.current_unit} total={book.total_units ?? 1} blocks={18} />
            <span className="ml-auto font-mono text-[11px] tabular-nums text-muted-strong">
              {pct}%
            </span>
          </div>
        ) : book.current_unit > 0 ? (
          <p className="font-mono text-[11px] text-muted-strong">
            {t('reading.unitsIn', { units: unitCount(book.progress_mode, book.current_unit, t) })}
          </p>
        ) : null}
      </Card>
    </Link>
  )
}
