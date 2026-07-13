import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, Pencil, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { SectionLabel } from '@/components/common/SectionLabel'
import { Tag } from '@/components/common/Tag'
import { BookFormSheet } from '@/features/reading/components/BookFormSheet'
import { ProgressUpdater } from '@/features/reading/components/ProgressUpdater'
import { BookStatusControls } from '@/features/reading/components/BookStatusControls'
import { NotesSection } from '@/features/reading/components/NotesSection'
import { useBook } from '@/features/reading/hooks/useBook'
import { statusLabel, unitNounPlural } from '@/features/reading/lib/progress'
import { useFocusStore } from '@/stores/focus'
import type { BookStatus } from '@/features/reading/types'

const STATUS_TONE: Record<BookStatus, 'muted' | 'accent' | 'teal'> = {
  to_read: 'muted',
  reading: 'accent',
  finished: 'teal',
}

const READING_SESSION_MIN = 25

function BookDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const startFocus = useFocusStore((s) => s.start)
  const { book, notes, sessions, isLoading, isError } = useBook(id)
  const [editOpen, setEditOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex justify-center py-24" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
        <span className="sr-only">Loading book…</span>
      </div>
    )
  }

  if (isError || !book) {
    return (
      <EmptyState
        title="Book not found"
        description="It may have been removed."
        action={
          <Button size="sm" variant="surface" onClick={() => navigate('/reading')}>
            Back to library
          </Button>
        }
      />
    )
  }

  const readInFlow = () => {
    startFocus(READING_SESSION_MIN, book.title, { bookId: book.id })
    navigate('/flow')
  }

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-6">
      <div>
        <Link
          to="/reading"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Library
        </Link>

        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl tracking-title lg:text-[32px]">{book.title}</h1>
            <p className="mt-1 text-muted">{book.author ?? 'Unknown author'}</p>
            <div className="mt-2 flex items-center gap-2">
              <Tag tone={STATUS_TONE[book.status]}>{statusLabel(book.status)}</Tag>
              <span className="label-mono text-muted-strong">
                by {book.progress_mode === 'chapters' ? 'chapter' : 'page'}
              </span>
            </div>
          </div>
          <Button variant="surface" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      <Button onClick={readInFlow} size="lg" className="w-full shadow-glow">
        <Timer className="h-4 w-4" />
        Read in Flow · {READING_SESSION_MIN} min
      </Button>

      <ProgressUpdater book={book} sessions={sessions} />
      <BookStatusControls book={book} />
      <NotesSection book={book} notes={notes} />

      {sessions.length > 0 ? (
        <section className="flex flex-col gap-3">
          <SectionLabel accessory={`${sessions.length}`}>SESSIONS</SectionLabel>
          <div className="rounded-card border bg-surface">
            {sessions.slice(0, 8).map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between gap-3 border-b px-4 py-2.5 text-[13px] last:border-b-0"
              >
                <span className="font-mono text-muted-strong">{session.date}</span>
                <span className="text-muted">
                  {session.minutes > 0 ? `${session.minutes} min` : '—'}
                  {session.units_read > 0
                    ? ` · ${session.units_read} ${unitNounPlural(book.progress_mode)}`
                    : ''}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <BookFormSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        book={book}
        onDeleted={() => navigate('/reading')}
      />
    </div>
  )
}

export default BookDetailPage
