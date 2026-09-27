import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Timer } from 'lucide-react'
import { LoadingState } from '@/components/common/LoadingState'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { SectionLabel } from '@/components/common/SectionLabel'
import { BookFormSheet } from '@/features/reading/components/BookFormSheet'
import { ProgressUpdater } from '@/features/reading/components/ProgressUpdater'
import { BookStatusControls } from '@/features/reading/components/BookStatusControls'
import { NotesSection } from '@/features/reading/components/NotesSection'
import { useBook } from '@/features/reading/hooks/useBook'
import { unitCount } from '@/features/reading/lib/progress'
import { useFocusStore } from '@/stores/focus'
import { BookStatusTag } from '@/features/reading/components/BookStatusTag'
import { useOpenKey } from '@/hooks/useSheetKey'
import { useT } from '@/hooks/useT'
import { dateFromKey } from '@/lib/date'
import { intlLocale } from '@/lib/dateLocale'

const READING_SESSION_MIN = 25

interface BookDetailPanelProps {
  id: string
  /** The book was deleted or failed to load — leave it. */
  onGone: () => void
}

/** One book with everything it can do, wired to its data. */
export function BookDetailPanel({ id, onGone }: BookDetailPanelProps) {
  const { t, locale } = useT()
  const navigate = useNavigate()
  const startFocus = useFocusStore((s) => s.start)
  const { book, notes, sessions, isLoading, isError } = useBook(id)
  const [editOpen, setEditOpen] = useState(false)
  const editKey = useOpenKey(editOpen)

  if (isLoading) {
    return <LoadingState label={t('reading.loadingBook')} />
  }

  if (isError || !book) {
    return (
      <EmptyState
        title={t('reading.notFound')}
        description={t('reading.notFoundHint')}
        action={
          <Button size="sm" variant="surface" onClick={onGone}>
            {t('reading.backToLibrary')}
          </Button>
        }
      />
    )
  }

  // "23 сент." rather than ISO — a date is words, not a number.
  const sessionDay = (key: string) =>
    new Intl.DateTimeFormat(intlLocale(locale), {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    }).format(dateFromKey(key))

  const readInFlow = () => {
    startFocus(READING_SESSION_MIN, book.title, { bookId: book.id })
    navigate('/flow')
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-title lg:text-large-title">{book.title}</h1>
            <p className="mt-1 text-muted">{book.author ?? t('reading.unknownAuthor')}</p>
            <div className="mt-2 flex items-center gap-2">
              <BookStatusTag status={book.status} />
              <span className="label-mono text-muted-strong">
                {t(`reading.byUnit.${book.progress_mode}`)}
              </span>
            </div>
          </div>
          <Button variant="surface" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
            {t('reading.edit')}
          </Button>
        </div>
      </div>

      <Button onClick={readInFlow} size="lg" className="w-full shadow-glow">
        <Timer className="h-4 w-4" />
        {t('reading.readInFlow', { flow: t('modules.flow.label'), count: READING_SESSION_MIN })}
      </Button>

      <ProgressUpdater book={book} sessions={sessions} />
      <BookStatusControls book={book} />
      <NotesSection book={book} notes={notes} />

      {sessions.length > 0 ? (
        <section className="flex flex-col gap-3">
          <SectionLabel accessory={`${sessions.length}`}>{t('reading.sessions')}</SectionLabel>
          <div className="rounded-card border bg-surface">
            {sessions.slice(0, 8).map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between gap-3 border-b px-4 py-2.5 text-footnote last:border-b-0"
              >
                <span className="text-muted-strong">{sessionDay(session.date)}</span>
                <span className="text-muted">
                  {session.minutes > 0 ? t('units.minutes', { count: session.minutes }) : '—'}
                  {session.units_read > 0
                    ? ` · ${unitCount(book.progress_mode, session.units_read, t)}`
                    : ''}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Remounted on each opening (the key), so the form starts from the book
          as it is now — progress logged since the last edit included — while
          staying mounted through the close so its exit animation plays. */}
      <BookFormSheet
        key={editKey}
        open={editOpen}
        onOpenChange={setEditOpen}
        book={book}
        onDeleted={onGone}
      />
    </div>
  )
}
