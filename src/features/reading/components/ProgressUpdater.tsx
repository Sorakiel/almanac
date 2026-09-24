import { useState } from 'react'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProgressBlocks } from '@/components/common/ProgressBlocks'
import { SectionLabel } from '@/components/common/SectionLabel'
import { AmountStepper } from '@/features/reading/components/AmountStepper'
import { useReadingProgress } from '@/features/reading/hooks/useReadingProgress'
import {
  progressPct,
  quickAmount,
  stepSize,
  unitsLeft,
  unitsReadOn,
} from '@/features/reading/lib/progress'
import { cn } from '@/lib/utils'
import { useToday } from '@/hooks/useToday'
import type { Book, ReadingSession } from '@/features/reading/types'
import { useT } from '@/hooks/useT'
import { toUserError } from '@/lib/userError'

interface ProgressUpdaterProps {
  book: Book
  /** This book's sessions — today's units sum into the goal tally. */
  sessions: ReadingSession[]
}

/**
 * Where the book stands and one tap to move it: "+N" logs today's remaining
 * goal, the stepper adjusts N first. Setting an exact page, the dates and the
 * rating live in Edit — they are occasional, and this is the daily loop.
 */
export function ProgressUpdater({ book, sessions }: ProgressUpdaterProps) {
  const { t } = useT()
  const logProgress = useReadingProgress()
  const { dateKey } = useToday()
  const readToday = unitsReadOn(sessions, dateKey)
  const suggested = quickAmount(book, readToday)
  // The stepper overrides the suggestion until the next log resets it.
  const [override, setOverride] = useState<number | null>(null)
  const amount = override ?? suggested

  const pct = progressPct(book)
  const left = unitsLeft(book)
  const goal = book.daily_goal && book.daily_goal > 0 ? book.daily_goal : null
  const goalMet = goal !== null && readToday >= goal
  const done = left === 0
  const mode = book.progress_mode

  const log = () => {
    // Not awaited: the numbers move now; offline the write queues.
    logProgress.mutate(
      { book, nextUnit: book.current_unit + amount },
      { onError: (error) => toast.error(toUserError(error, t, 'reading.progressFailed')) },
    )
    if (goal !== null && readToday < goal && readToday + amount >= goal) {
      toast.success(t('reading.goalMetToast'))
    }
    setOverride(null)
  }

  return (
    <section className="flex flex-col gap-3">
      <SectionLabel accessory={pct !== null ? <span className="num">{pct}%</span> : undefined}>
        {t('reading.progress')}
      </SectionLabel>

      <div className="flex flex-col gap-4 rounded-card border bg-surface p-4">
        <p className="text-callout text-muted">
          <span className="num text-headline text-foreground">{book.current_unit}</span>
          {book.total_units ? (
            <>
              {' '}
              {t('reading.of')} <span className="num">{book.total_units}</span>
            </>
          ) : null}{' '}
          {t(`reading.unitWord.${mode}`, { count: book.total_units ?? book.current_unit })}
        </p>

        {pct !== null ? (
          <ProgressBlocks
            value={book.current_unit}
            total={book.total_units ?? 1}
            blocks={24}
            size="md"
            animated
          />
        ) : null}

        {goal !== null ? (
          <div className="flex items-center justify-between gap-3 text-callout">
            <span className="text-muted">{t('reading.todayLabel')}</span>
            <span
              className={cn('flex items-center gap-1.5', goalMet ? 'text-success' : 'text-muted')}
            >
              {goalMet ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
              <span className="num">
                {readToday} / {goal}
              </span>
              {goalMet ? t('reading.goalMet') : null}
            </span>
          </div>
        ) : null}

        {done ? (
          <p className="flex items-center gap-2 text-callout text-success">
            <Check className="h-4 w-4" aria-hidden="true" />
            {t('reading.bookDone')}
          </p>
        ) : (
          <div className="flex items-center gap-2">
            <AmountStepper value={amount} onChange={setOverride} step={stepSize(mode)} max={left} />
            <Button size="lg" className="flex-1" onClick={log}>
              {t(`reading.quickAdd.${mode}`, { count: amount })}
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
