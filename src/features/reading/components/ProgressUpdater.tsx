import { useState } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProgressBlocks } from '@/components/common/ProgressBlocks'
import { SectionLabel } from '@/components/common/SectionLabel'
import { useReadingProgress } from '@/features/reading/hooks/useReadingProgress'
import { progressPct, unitNoun, unitNounPlural } from '@/features/reading/lib/progress'
import type { Book } from '@/features/reading/types'

const QUICK_ADD: Record<Book['progress_mode'], number[]> = {
  pages: [5, 10, 25],
  chapters: [1, 2, 3],
}

/** Detail progress control: set the current page/chapter or add a quick amount. */
export function ProgressUpdater({ book }: { book: Book }) {
  const logProgress = useReadingProgress()
  const [value, setValue] = useState(String(book.current_unit))
  const [lastUnit, setLastUnit] = useState(book.current_unit)

  // Re-seed the field when progress lands from elsewhere (quick-add, Flow):
  // adjust state during render rather than in an effect (React's own pattern).
  if (book.current_unit !== lastUnit) {
    setLastUnit(book.current_unit)
    setValue(String(book.current_unit))
  }

  const pct = progressPct(book)
  const noun = unitNoun(book.progress_mode)

  const commit = (nextUnit: number) => {
    logProgress.mutate(
      { book, nextUnit },
      {
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : 'Could not update progress'),
      },
    )
  }

  const onSave = () => {
    const next = Number.parseInt(value, 10)
    if (!Number.isFinite(next) || next < 0) {
      toast.error('Enter a valid number')
      return
    }
    commit(next)
  }

  return (
    <section className="flex flex-col gap-3">
      <SectionLabel accessory={pct !== null ? `${pct}%` : undefined}>PROGRESS</SectionLabel>

      <div className="rounded-card border bg-surface p-4">
        <p className="font-mono text-sm text-muted-strong">
          <span className="text-lg text-foreground">{book.current_unit}</span>
          {book.total_units ? ` / ${book.total_units}` : ''} {unitNounPlural(book.progress_mode)}
        </p>

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

        <div className="mt-4 flex items-end gap-2">
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="label-mono">Current {noun}</span>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          </label>
          <Button onClick={onSave} disabled={logProgress.isPending}>
            Save
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_ADD[book.progress_mode].map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => commit(book.current_unit + amount)}
              disabled={logProgress.isPending}
              className="inline-flex items-center gap-1 rounded-pill border px-3 py-1 font-mono text-[11px] text-muted transition-colors hover:border-accent/40 hover:text-foreground disabled:opacity-50"
            >
              <Plus className="h-3 w-3" aria-hidden="true" />
              {amount} {book.progress_mode === 'chapters' ? 'ch' : 'pp'}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
