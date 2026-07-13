import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { ProgressBlocks } from '@/components/common/ProgressBlocks'
import { Tag } from '@/components/common/Tag'
import { progressPct, statusLabel, unitNounPlural } from '@/features/reading/lib/progress'
import type { Book, BookStatus } from '@/features/reading/types'

const STATUS_TONE: Record<BookStatus, 'muted' | 'accent' | 'teal'> = {
  to_read: 'muted',
  reading: 'accent',
  finished: 'teal',
}

/** Library list item: title, author, status, and progress. Links to detail. */
export function BookCard({ book }: { book: Book }) {
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
              <p className="text-[13px] text-muted-strong">Unknown author</p>
            )}
          </div>
          <div className="flex flex-none flex-col items-end gap-1">
            <Tag tone={STATUS_TONE[book.status]}>{statusLabel(book.status)}</Tag>
            {book.rating ? (
              <span className="font-mono text-[10px] text-amber">{'★'.repeat(book.rating)}</span>
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
            {book.current_unit} {unitNounPlural(book.progress_mode)} in
          </p>
        ) : null}
      </Card>
    </Link>
  )
}
