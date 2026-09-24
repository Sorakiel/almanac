import { BookOpen } from 'lucide-react'
import { libraryStats } from '@/features/reading/lib/library'
import { useToday } from '@/hooks/useToday'
import type { Book } from '@/features/reading/types'
import { useT } from '@/hooks/useT'
import { RailCard, RailRow } from '@/components/rail/RailCard'
import { RailIdentity } from '@/components/rail/RailIdentity'

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
        subtitle={t('reading.shelf')}
      />

      <RailCard label={t('reading.snapshot')}>
        <RailRow label={t('reading.books')} value={String(stats.total)} />
        <RailRow label={t('reading.readingLower')} value={String(stats.reading)} />
        <RailRow label={t('reading.finishedLower')} value={String(stats.finished)} />
        <RailRow label={t('reading.finishedIn', { year })} value={String(stats.finishedThisYear)} />
      </RailCard>
    </div>
  )
}
