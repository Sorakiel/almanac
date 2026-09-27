import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { BookDetailPanel } from '@/features/reading/components/BookDetailPanel'
import { BookFormSheet } from '@/features/reading/components/BookFormSheet'
import { QueueShelf } from '@/features/reading/components/QueueShelf'
import { RhythmChart } from '@/features/reading/components/RhythmChart'
import { SectionHead } from '@/components/common/SectionHead'
import { useBooks } from '@/features/reading/hooks/useBooks'
import { useRecentReading } from '@/features/reading/hooks/useRecentReading'
import { groupBooks } from '@/features/reading/lib/library'
import { RHYTHM_DAYS, unitsPerDay } from '@/features/reading/lib/rhythm'
import { useCreateIntent } from '@/hooks/useCreateIntent'
import { useOpenKey } from '@/hooks/useSheetKey'
import { useT } from '@/hooks/useT'
import { useToday } from '@/hooks/useToday'

/**
 * One book. On desktop the prototype's `MOD.desk('book')`: the book on the
 * left, the rhythm and the queue in a sticky 360px column; the phone drops
 * the column.
 */
function BookDetailPage() {
  const { t } = useT()
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { dateKey } = useToday()
  const { books } = useBooks()
  const { sessions } = useRecentReading()
  const [formOpen, setFormOpen] = useCreateIntent()
  const formKey = useOpenKey(formOpen)
  const grouped = groupBooks(books)
  const queue = [...grouped.reading, ...grouped.to_read].filter((b) => b.id !== id)

  return (
    <div className="flex w-full flex-col">
      <Link
        to="/reading"
        className="-ml-1.5 inline-flex items-center gap-0.5 self-start py-2 text-body text-accent"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        {t('reading.title')}
      </Link>
      <div className="lg:grid lg:grid-cols-module lg:items-start lg:gap-6">
        <div className="min-w-0">
          <BookDetailPanel id={id} onGone={() => navigate('/reading')} />
        </div>
        <aside
          aria-label={t('reading.upNext')}
          className="sticky top-toolbar-clearance hidden min-w-0 grid-cols-1 content-start gap-3.5 lg:grid"
        >
          <RhythmChart perDay={unitsPerDay(sessions, dateKey, RHYTHM_DAYS)} />
          <section className="min-w-0">
            <SectionHead aside={queue.length > 0 ? `${queue.length}` : undefined}>
              {t('reading.upNext')}
            </SectionHead>
            <QueueShelf books={queue} onAdd={() => setFormOpen(true)} />
          </section>
        </aside>
      </div>
      <BookFormSheet key={formKey} open={formOpen} onOpenChange={setFormOpen} />
    </div>
  )
}

export default BookDetailPage
