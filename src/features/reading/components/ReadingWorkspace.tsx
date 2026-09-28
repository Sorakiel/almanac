import { useState } from 'react'
import { BookOpen, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { SectionHead } from '@/components/common/SectionHead'
import { BookNotes } from '@/features/reading/components/BookNotes'
import { FinishedList } from '@/features/reading/components/FinishedList'
import { NoteSheet } from '@/features/reading/components/NoteSheet'
import { QueueShelf } from '@/features/reading/components/QueueShelf'
import { ReadingHero } from '@/features/reading/components/ReadingHero'
import { RhythmChart } from '@/features/reading/components/RhythmChart'
import { useBook } from '@/features/reading/hooks/useBook'
import { useRecentReading } from '@/features/reading/hooks/useRecentReading'
import { groupBooks } from '@/features/reading/lib/library'
import {
  RHYTHM_DAYS,
  dailyAverage,
  finishedThisYear,
  readingStreak,
  unitsPerDay,
} from '@/features/reading/lib/rhythm'
import type { Book } from '@/features/reading/types'
import { useOpenKey } from '@/hooks/useSheetKey'
import { useT } from '@/hooks/useT'
import { useToday } from '@/hooks/useToday'

interface ReadingWorkspaceProps {
  books: Book[]
  onAdd: () => void
}

/** The current book's notes — desktop only, as in `MOD.desk('reading')`. */
function CurrentNotes({ book }: { book: Book }) {
  const { t } = useT()
  const { notes } = useBook(book.id)
  const [open, setOpen] = useState(false)
  const key = useOpenKey(open)
  return (
    <section>
      <SectionHead aside={t('reading.screen.notesAside', { n: book.current_unit })}>
        {t('reading.notes')}
      </SectionHead>
      <BookNotes book={book} notes={notes} onAdd={() => setOpen(true)} />
      <NoteSheet key={key} book={book} open={open} onOpenChange={setOpen} />
    </section>
  )
}

/**
 * "Чтение" on every width (`MOD.reading` / `MOD.desk('reading')`): streak
 * and books this year over the title; the book in hand, the queue, the
 * rhythm and what is finished. Desktop is the module grid — hero, notes and
 * finished on the left, queue and rhythm in a sticky 360px column; the phone
 * flows the same pieces in the prototype's order.
 */
export function ReadingWorkspace({ books, onAdd }: ReadingWorkspaceProps) {
  const { t } = useT()
  const { dateKey } = useToday()
  const { sessions } = useRecentReading()
  const grouped = groupBooks(books)
  const [current, ...alsoReading] = grouped.reading
  const queue = [...alsoReading, ...grouped.to_read]
  const perDay = unitsPerDay(sessions, dateKey, RHYTHM_DAYS)
  const streak = readingStreak(sessions, dateKey)
  const thisYear = finishedThisYear(books, dateKey)
  const summary =
    [
      streak > 0 ? t('reading.screen.streak', { count: streak }) : null,
      thisYear > 0
        ? t('reading.screen.year', { count: thisYear, year: dateKey.slice(0, 4) })
        : null,
    ]
      .filter(Boolean)
      .join(' · ') || t('reading.subtitle')

  const header = (
    <header className="mx-0.5 mb-4 mt-2">
      <p className="text-callout font-medium text-muted">{summary}</p>
      <h1 className="text-large-title font-bold tracking-title">{t('reading.title')}</h1>
    </header>
  )

  if (books.length === 0) {
    return (
      <div className="w-full">
        {header}
        <EmptyState
          icon={BookOpen}
          title={t('reading.emptyTitle')}
          description={t('reading.emptyHint')}
          action={
            <Button size="sm" onClick={onAdd}>
              <Plus className="h-4 w-4" />
              {t('reading.addFirstBook')}
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="w-full">
      {header}
      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-module lg:items-start lg:gap-6">
        <div className="contents lg:grid lg:min-w-0 lg:grid-cols-1 lg:content-start lg:gap-3.5">
          <div className="order-1 lg:order-none">
            {current ? (
              <ReadingHero book={current} pace={dailyAverage(perDay)} />
            ) : (
              <div className="rounded-3xl bg-surface p-4.5">
                <p className="text-body font-semibold">{t('reading.screen.nothingTitle')}</p>
                <p className="mt-1 text-callout text-muted">{t('reading.screen.nothingHint')}</p>
              </div>
            )}
          </div>
          {current ? (
            <div className="hidden lg:block">
              <CurrentNotes book={current} />
            </div>
          ) : null}
          {grouped.finished.length > 0 ? (
            <section className="order-4 lg:order-none">
              <SectionHead aside={`${grouped.finished.length}`}>
                {t('reading.finishedSection')}
              </SectionHead>
              <FinishedList books={grouped.finished} />
            </section>
          ) : null}
        </div>
        <aside
          aria-label={t('reading.upNext')}
          className="contents lg:sticky lg:top-toolbar-clearance lg:grid lg:min-w-0 lg:grid-cols-1 lg:content-start lg:gap-3.5"
        >
          <section className="order-2 min-w-0 lg:order-none">
            <SectionHead aside={queue.length > 0 ? `${queue.length}` : undefined}>
              {t('reading.upNext')}
            </SectionHead>
            <QueueShelf books={queue} onAdd={onAdd} />
          </section>
          <section className="order-3 lg:order-none">
            <div className="lg:hidden">
              <SectionHead aside={t('reading.screen.rhythmWindow')}>
                {t('reading.screen.rhythm')}
              </SectionHead>
            </div>
            <RhythmChart perDay={perDay} />
          </section>
        </aside>
      </div>
    </div>
  )
}
