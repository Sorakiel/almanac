import { useState } from 'react'
import { toast } from 'sonner'
import { Check, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProgressBlocks } from '@/components/common/ProgressBlocks'
import { SectionLabel } from '@/components/common/SectionLabel'
import { useReadingProgress } from '@/features/reading/hooks/useReadingProgress'
import { dailyGoalPct, progressPct, unitNoun, unitNounPlural } from '@/features/reading/lib/progress'
import { cn } from '@/lib/utils'
import { useToday } from '@/hooks/useToday'
import type { Book, ReadingSession } from '@/features/reading/types'

interface ProgressUpdaterProps {
  book: Book
  /** This book's sessions — today's units sum into the "read today" tally. */
  sessions: ReadingSession[]
}

/**
 * Progress control. "Read today" tallies the units logged for the current local
 * day (resetting every 24h); the add field appends however much you just read,
 * repeatably. A second field sets the current page/chapter absolutely.
 */
export function ProgressUpdater({ book, sessions }: ProgressUpdaterProps) {
  const logProgress = useReadingProgress()
  const { dateKey } = useToday()
  const [addValue, setAddValue] = useState('')
  const [currentValue, setCurrentValue] = useState('')

  const pct = progressPct(book)
  const noun = unitNoun(book.progress_mode)
  const nounPlural = unitNounPlural(book.progress_mode)
  const readToday = sessions
    .filter((s) => s.date === dateKey)
    .reduce((sum, s) => sum + s.units_read, 0)
  const goal = book.daily_goal
  const goalPct = goal ? dailyGoalPct(readToday, goal) : null
  const goalMet = goal ? readToday >= goal : false

  const commit = (nextUnit: number, onDone?: () => void) => {
    logProgress.mutate(
      { book, nextUnit },
      {
        onSuccess: () => onDone?.(),
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : 'Could not update progress'),
      },
    )
  }

  const onAdd = () => {
    const amount = Number.parseInt(addValue, 10)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error(`Enter how many ${nounPlural} you read`)
      return
    }
    commit(book.current_unit + amount, () => setAddValue(''))
  }

  const onSetCurrent = () => {
    const next = Number.parseInt(currentValue, 10)
    if (!Number.isFinite(next) || next < 0) {
      toast.error('Enter a valid number')
      return
    }
    commit(next, () => setCurrentValue(''))
  }

  return (
    <section className="flex flex-col gap-3">
      <SectionLabel accessory={pct !== null ? `${pct}%` : undefined}>PROGRESS</SectionLabel>

      <div className="rounded-card border bg-surface p-4">
        <div className="flex items-end justify-between gap-3">
          <p className="font-mono text-sm text-muted-strong">
            <span className="text-lg text-foreground">{book.current_unit}</span>
            {book.total_units ? ` / ${book.total_units}` : ''} {nounPlural}
          </p>
          <p className="label-mono text-accent">
            read today · {readToday} {readToday === 1 ? noun : nounPlural}
          </p>
        </div>

        {pct !== null ? (
          <div className="mt-3">
            <ProgressBlocks
              value={book.current_unit}
              total={book.total_units ?? 1}
              blocks={24}
              size="md"
              animated
            />
          </div>
        ) : null}

        {goal ? (
          <div
            className={cn(
              'mt-4 rounded-2xl border px-4 py-3 transition-colors',
              goalMet ? 'border-teal/40 bg-teal/10' : 'border-border bg-bg-deep',
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="label-mono normal-case">
                daily goal · {goal} {goal === 1 ? noun : nounPlural}/day
              </span>
              <span
                className={cn(
                  'flex items-center gap-1 font-mono text-sm tabular-nums',
                  goalMet ? 'text-teal' : 'text-muted-strong',
                )}
              >
                {goalMet ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
                {Math.min(readToday, goal)} / {goal}
              </span>
            </div>
            <div className="mt-2.5">
              <ProgressBlocks
                value={Math.min(readToday, goal)}
                total={goal}
                blocks={20}
                size="md"
                animated
                aria-label={`${goalPct}% of today's reading goal`}
              />
            </div>
          </div>
        ) : null}

        <div className="mt-4 flex items-end gap-2">
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="label-mono">{nounPlural} read just now</span>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="e.g. 12"
              value={addValue}
              onChange={(event) => setAddValue(event.target.value)}
            />
          </label>
          <Button onClick={onAdd} disabled={logProgress.isPending}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        <div className="mt-3 flex items-end gap-2">
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="label-mono">or set current {noun}</span>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder={String(book.current_unit)}
              value={currentValue}
              onChange={(event) => setCurrentValue(event.target.value)}
            />
          </label>
          <Button variant="surface" onClick={onSetCurrent} disabled={logProgress.isPending}>
            Set
          </Button>
        </div>
      </div>
    </section>
  )
}
