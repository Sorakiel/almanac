import { Link } from 'react-router-dom'
import { BookCover } from '@/features/reading/components/BookCover'
import { useQuickRead, READING_SESSION_MIN } from '@/features/reading/hooks/useQuickRead'
import { progressPct, unitsLeft } from '@/features/reading/lib/progress'
import { daysToFinish } from '@/features/reading/lib/rhythm'
import type { Book } from '@/features/reading/types'
import { useT } from '@/hooks/useT'

interface ReadingHeroProps {
  book: Book
  /** Units a day over the last two weeks — the pace behind the forecast. */
  pace: number
}

function Meta({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-footnote text-muted">
      <b className="num block text-callout font-medium text-foreground">{value}</b>
      {label}
    </div>
  )
}

/**
 * The book in hand (the prototype's `rHero`): cover, where it stands, when it
 * will be done at this pace, "+N стр" and a focus block to read in.
 */
export function ReadingHero({ book, pace }: ReadingHeroProps) {
  const { t } = useT()
  const { readToday, amount, goal, log, readInFocus } = useQuickRead(book)
  const pct = progressPct(book)
  const left = unitsLeft(book)
  const days = daysToFinish(left, pace || (goal ?? 0))
  const mode = book.progress_mode
  const href = `/reading/${book.id}`

  return (
    <section
      aria-label={t('reading.screen.now')}
      className="hero-glow hero-glow-amber grid gap-3 rounded-3xl bg-surface p-4.5"
    >
      <div className="flex items-start gap-4">
        <Link to={href} tabIndex={-1} aria-hidden="true">
          <BookCover title={book.title} author={book.author} />
        </Link>
        <div className="grid min-w-0 flex-1 gap-1.5">
          <p className="text-footnote font-medium text-muted">{t('reading.screen.now')}</p>
          <Link
            to={href}
            className="rounded-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <h2 className="text-headline font-bold tracking-title">{book.title}</h2>
          </Link>
          <p className="text-callout text-muted">{book.author ?? t('reading.unknownAuthor')}</p>
          {pct !== null ? (
            <div
              className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-foreground/10"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={book.title}
            >
              <b
                className="block h-full rounded-full bg-amber transition-[width] duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          ) : null}
          <div className="mt-0.5 flex gap-4">
            <Meta
              value={`${book.current_unit}`}
              label={
                book.total_units
                  ? t(`reading.screen.ofTotal.${mode}`, { total: book.total_units })
                  : t(`reading.unitWord.${mode}`, { count: book.current_unit })
              }
            />
            {goal !== null ? (
              <Meta value={`${readToday}/${goal}`} label={t('reading.screen.today')} />
            ) : null}
          </div>
          {days !== null ? (
            <p className="text-footnote font-medium text-muted">
              {t('reading.screen.forecast', { count: days })}
            </p>
          ) : null}
        </div>
      </div>

      {left !== 0 ? (
        <div className="grid grid-cols-2 gap-2">
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
    </section>
  )
}
