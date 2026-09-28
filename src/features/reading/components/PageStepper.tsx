import { PopNumber } from '@/components/common/PopNumber'
import { progressPct } from '@/features/reading/lib/progress'
import type { Book } from '@/features/reading/types'
import { useT } from '@/hooks/useT'

interface PageStepperProps {
  book: Book
  onStep: (delta: 1 | -1) => void
}

/**
 * Where the reader is (the prototype's `.m-bigstep`): −, the big page number,
 * +. The one place progress is set by hand — no second "exact page" form.
 */
export function PageStepper({ book, onStep }: PageStepperProps) {
  const { t } = useT()
  const pct = progressPct(book)
  const mode = book.progress_mode
  const atEnd = book.total_units !== null && book.current_unit >= book.total_units
  const round =
    'grid h-12 w-12 place-items-center rounded-full bg-sheet-fill text-headline font-semibold text-accent transition-transform active:scale-90 disabled:opacity-40'
  return (
    <div className="flex items-center justify-between rounded-card bg-surface p-3">
      <button
        type="button"
        onClick={() => onStep(-1)}
        disabled={book.current_unit <= 0}
        aria-label={t('reading.screen.minusOne')}
        className={round}
      >
        −
      </button>
      <div className="text-center" aria-live="polite">
        <PopNumber
          value={book.current_unit}
          className="block text-[34px] font-medium leading-tight tracking-[-0.03em]"
        />
        <small className="text-footnote text-muted">
          {book.total_units && pct !== null
            ? t(`reading.screen.position.${mode}`, { total: book.total_units, pct })
            : t(`reading.screen.positionOpen.${mode}`)}
        </small>
      </div>
      <button
        type="button"
        onClick={() => onStep(1)}
        disabled={atEnd}
        aria-label={t('reading.screen.plusOne')}
        className={round}
      >
        +
      </button>
    </div>
  )
}
