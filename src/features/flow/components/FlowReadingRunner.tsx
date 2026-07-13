import { useState } from 'react'
import { toast } from 'sonner'
import { BookOpen, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { IconTile } from '@/components/common/IconTile'
import { useBook } from '@/features/reading/hooks/useBook'
import { useReadingProgress } from '@/features/reading/hooks/useReadingProgress'
import { unitNoun, unitNounPlural } from '@/features/reading/lib/progress'

interface FlowReadingRunnerProps {
  bookId: string
  /** Session length in minutes, logged with the reading session. */
  minutes: number
  onFinish: () => void
}

/** In-session reading panel: log where you stopped, save progress + time, end. */
export function FlowReadingRunner({ bookId, minutes, onFinish }: FlowReadingRunnerProps) {
  const { book, isLoading } = useBook(bookId)
  const logProgress = useReadingProgress()
  const [value, setValue] = useState('')
  const [seeded, setSeeded] = useState(false)

  // Seed the field once the book loads — adjust state during render, not in an
  // effect (avoids the sync-setState-in-effect anti-pattern).
  if (book && !seeded) {
    setSeeded(true)
    setValue(String(book.current_unit))
  }

  if (isLoading || !book) return null

  const finish = () => {
    const next = Number.parseInt(value, 10)
    const nextUnit = Number.isFinite(next) && next >= 0 ? next : book.current_unit
    logProgress.mutate(
      { book, nextUnit, minutes },
      {
        onSuccess: () => {
          toast.success('Reading logged — nice session.')
          onFinish()
        },
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : 'Could not log your reading'),
      },
    )
  }

  return (
    <div className="flex flex-col gap-4 rounded-card border bg-surface p-5">
      <div className="flex items-center gap-3">
        <IconTile icon={BookOpen} tone="bg-amber/15 text-amber" size="sm" />
        <div className="min-w-0">
          <p className="truncate font-semibold">{book.title}</p>
          <p className="font-mono text-[10px] text-muted-strong">
            at {book.current_unit}
            {book.total_units ? ` / ${book.total_units}` : ''} {unitNounPlural(book.progress_mode)}
          </p>
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="label-mono">Which {unitNoun(book.progress_mode)} did you reach?</span>
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </label>

      <Button onClick={finish} disabled={logProgress.isPending}>
        <Check className="h-4 w-4" />
        Log & finish
      </Button>
    </div>
  )
}
