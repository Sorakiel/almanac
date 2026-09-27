import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { ChevronRight } from 'lucide-react'
import { ConfirmSheet } from '@/components/common/ConfirmSheet'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingState } from '@/components/common/LoadingState'
import { SectionHead } from '@/components/common/SectionHead'
import { Button } from '@/components/ui/button'
import { BookCover } from '@/features/reading/components/BookCover'
import { BookFormSheet } from '@/features/reading/components/BookFormSheet'
import { BookNotes } from '@/features/reading/components/BookNotes'
import { NoteSheet } from '@/features/reading/components/NoteSheet'
import { PageStepper } from '@/features/reading/components/PageStepper'
import { useBook } from '@/features/reading/hooks/useBook'
import { useBookMutations } from '@/features/reading/hooks/useBookMutations'
import { useQuickRead, READING_SESSION_MIN } from '@/features/reading/hooks/useQuickRead'
import { useReadingProgress } from '@/features/reading/hooks/useReadingProgress'
import { unitCount } from '@/features/reading/lib/progress'
import type { Book } from '@/features/reading/types'
import { useOpenKey } from '@/hooks/useSheetKey'
import { useT } from '@/hooks/useT'
import { useToday } from '@/hooks/useToday'
import { dateFromKey } from '@/lib/date'
import { intlLocale } from '@/lib/dateLocale'
import { toUserError } from '@/lib/userError'
import { cn } from '@/lib/utils'

interface BookDetailPanelProps {
  id: string
  /** The book was deleted or failed to load — leave it. */
  onGone: () => void
}

function ActRow({
  children,
  onClick,
  danger,
  value,
  chevron,
}: {
  children: ReactNode
  onClick: () => void
  danger?: boolean
  value?: string
  chevron?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex min-h-[50px] w-full items-center justify-between gap-3 px-4 text-left text-body transition-colors hover:bg-foreground/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent',
        danger && 'text-danger',
      )}
    >
      {children}
      {chevron ? (
        <span className="flex items-center gap-1 text-muted">
          {value}
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </span>
      ) : null}
    </button>
  )
}

/** The loaded book: cover, stepper, "+N" / focus, notes, settings. */
function BookBody({ book, onGone }: { book: Book; onGone: () => void }) {
  const { t, locale } = useT()
  const { dateKey } = useToday()
  const { notes } = useBook(book.id)
  const { amount, log, readInFocus } = useQuickRead(book)
  const logProgress = useReadingProgress()
  const { update } = useBookMutations()
  const [editOpen, setEditOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [finishOpen, setFinishOpen] = useState(false)
  const editKey = useOpenKey(editOpen)
  const noteKey = useOpenKey(noteOpen)
  const mode = book.progress_mode
  const done = book.total_units !== null && book.current_unit >= book.total_units

  const since = book.started_on
    ? t('reading.screen.since', {
        date: new Intl.DateTimeFormat(intlLocale(locale), {
          day: 'numeric',
          month: 'long',
          timeZone: 'UTC',
        }).format(dateFromKey(book.started_on)),
      })
    : null

  const step = (delta: 1 | -1) =>
    logProgress.mutate(
      { book, nextUnit: book.current_unit + delta },
      { onError: (error) => toast.error(toUserError(error, t, 'reading.progressFailed')) },
    )

  const finish = () => {
    update.mutate(
      {
        id: book.id,
        patch: { status: 'finished', finished_on: book.finished_on ?? dateKey },
      },
      { onError: (error) => toast.error(toUserError(error, t, 'reading.updateFailed')) },
    )
    setFinishOpen(false)
    toast.success(t('reading.screen.finishedToast'))
  }

  return (
    <div className="flex flex-col">
      <div className="mb-4 mt-1 grid justify-items-center gap-2.5 text-center">
        <BookCover title={book.title} author={book.author} size="lg" />
        <div>
          <h1 className="text-title font-bold leading-tight tracking-title">{book.title}</h1>
          <p className="mt-1 text-callout text-muted">
            {[book.author ?? t('reading.unknownAuthor'), since].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      <PageStepper book={book} onStep={step} />

      {!done ? (
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={(e) => log(e.currentTarget)}
            className="h-12 rounded-full bg-accent text-body font-semibold text-on-accent transition-transform active:scale-95"
          >
            {t(`reading.quickAdd.${mode}`, { count: amount })}
          </button>
          <button
            type="button"
            onClick={readInFocus}
            className="h-12 rounded-full bg-sheet-fill text-body font-semibold text-foreground transition-transform active:scale-95"
          >
            {t('reading.screen.readFor', { count: READING_SESSION_MIN })}
          </button>
        </div>
      ) : null}

      <section className="mt-5">
        <SectionHead aside={notes.length > 0 ? `${notes.length}` : undefined}>
          {t('reading.notes')}
        </SectionHead>
        <BookNotes book={book} notes={notes} onAdd={() => setNoteOpen(true)} />
      </section>

      <div className="mt-5 divide-y divide-foreground/10 overflow-hidden rounded-card bg-surface">
        <ActRow
          onClick={() => setEditOpen(true)}
          chevron
          value={book.daily_goal ? unitCount(mode, book.daily_goal, t) : t('reading.screen.noGoal')}
        >
          {t('reading.screen.dailyGoal')}
        </ActRow>
        <ActRow onClick={() => setEditOpen(true)} chevron>
          {t('reading.screen.editBook')}
        </ActRow>
        {book.status !== 'finished' ? (
          <ActRow onClick={() => setFinishOpen(true)} danger>
            {t('reading.screen.markFinished')}
          </ActRow>
        ) : null}
      </div>

      <NoteSheet key={`note-${noteKey}`} book={book} open={noteOpen} onOpenChange={setNoteOpen} />
      <ConfirmSheet
        open={finishOpen}
        onOpenChange={setFinishOpen}
        title={t('reading.screen.finishTitle', { title: book.title })}
        description={t('reading.screen.finishDescription')}
        confirmLabel={t('reading.screen.finishConfirm')}
        onConfirm={finish}
      />
      {/* Remounted on each opening (the key), so the form starts from the book
          as it is now, while staying mounted through the close for its exit. */}
      <BookFormSheet
        key={`edit-${editKey}`}
        open={editOpen}
        onOpenChange={setEditOpen}
        book={book}
        onDeleted={onGone}
      />
    </div>
  )
}

/** One book (the prototype's `MOD.book`), wired to its data. */
export function BookDetailPanel({ id, onGone }: BookDetailPanelProps) {
  const { t } = useT()
  const { book, isLoading, isError } = useBook(id)

  if (isLoading) return <LoadingState label={t('reading.loadingBook')} />
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
  return <BookBody book={book} onGone={onGone} />
}
