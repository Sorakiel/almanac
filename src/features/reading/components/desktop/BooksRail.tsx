import { BookOpen } from 'lucide-react'
import { BookTicker } from '@/features/reading/components/BookTicker'
import { libraryStats } from '@/features/reading/lib/library'
import { useToday } from '@/hooks/useToday'
import type { Book } from '@/features/reading/types'
import { useT } from '@/hooks/useT'
import { RailCard, RailRow } from '@/components/common/desktop/RailCard'
import { RailIdentity } from '@/components/common/desktop/RailIdentity'

/** Desktop Reading context rail: identity + a library snapshot. */
export function BooksRail({ books }: { books: Book[] }) {
  const { t } = useT()
  const { dateKey } = useToday()
  const stats = libraryStats(books, dateKey)
  const year = dateKey.slice(0, 4)

  return (
    <div className="flex flex-col gap-3.5">
      <RailIdentity
        icon={BookOpen}
        tone="bg-amber/15 text-amber"
        title={t('reading.library')}
        subtitle="your shelf"
      />

      <RailCard label="snapshot">
        <RailRow label={t('reading.books')} value={String(stats.total)} />
        <RailRow label={t('reading.readingLower')} value={String(stats.reading)} />
        <RailRow label={t('reading.finishedLower')} value={String(stats.finished)} />
        <RailRow label={`finished ${year}`} value={String(stats.finishedThisYear)} />
      </RailCard>

      <BookTicker books={books} />
    </div>
  )
}
