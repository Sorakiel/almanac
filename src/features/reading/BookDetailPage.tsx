import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { BookDetailPanel } from '@/features/reading/components/BookDetailPanel'
import { Shelf } from '@/features/reading/components/BookShelf'
import { useBooks } from '@/features/reading/hooks/useBooks'
import { groupBooks } from '@/features/reading/lib/library'
import { useT } from '@/hooks/useT'

/**
 * One book. On desktop the prototype's `.dk-mgrid`: the book on the left, the
 * queue in a sticky 360px column on the right; the phone drops the column.
 */
function BookDetailPage() {
  const { t } = useT()
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { books } = useBooks()
  const queue = groupBooks(books).to_read.filter((b) => b.id !== id)

  return (
    <div className="flex w-full flex-col gap-3">
      <Link
        to="/reading"
        className="inline-flex items-center gap-1.5 self-start text-footnote text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t('reading.title')}
      </Link>
      <div className="lg:grid lg:grid-cols-module lg:items-start lg:gap-6">
        <div className="min-w-0">
          <BookDetailPanel id={id} onGone={() => navigate('/reading')} />
        </div>
        {queue.length > 0 ? (
          <aside
            aria-label={t('reading.upNext')}
            className="sticky top-toolbar-clearance hidden min-w-0 grid-cols-1 content-start gap-3.5 lg:grid"
          >
            <Shelf title={t('reading.upNext')} books={queue} />
          </aside>
        ) : null}
      </div>
    </div>
  )
}

export default BookDetailPage
