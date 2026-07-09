import { toast } from 'sonner'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProgressBlocks } from '@/components/common/ProgressBlocks'
import { useToggleHabit } from '@/features/habits/hooks/useToggleHabit'
import type { HabitWithTodayLog } from '@/features/habits/types'

interface FocusBlockProps {
  habits: HabitWithTodayLog[]
}

/** The "NOW · FOCUS" card — surfaces the next habit and completes it in one tap. */
export function FocusBlock({ habits }: FocusBlockProps) {
  const toggle = useToggleHabit()
  const total = habits.length
  const completed = habits.filter((h) => h.isComplete).length
  const next = habits.find((h) => !h.isComplete) ?? null
  const allDone = total > 0 && completed === total

  const completeNext = () => {
    if (!next) return
    toggle.mutate(
      { habit: next },
      {
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : 'Could not update habit'),
      },
    )
  }

  return (
    <div className="rounded-card border border-accent/25 bg-accent/10 p-4">
      <p className="label-mono text-accent">
        FOCUS · {completed} of {total} done
      </p>
      <p className="mt-2 text-xl font-semibold tracking-title">
        {allDone ? 'All done today 🎉' : (next?.name ?? 'Add your first habit')}
      </p>

      <div className="mt-4 flex items-center gap-3">
        <ProgressBlocks value={completed} total={total || 1} className="flex-1" />
        <span className="label-mono normal-case tracking-normal tabular-nums text-foreground">
          {Math.round((completed / (total || 1)) * 100)}%
        </span>
      </div>

      {next ? (
        <div className="mt-4 flex items-center justify-between">
          <span className="label-mono">{total - completed} to go</span>
          <Button size="sm" onClick={completeNext}>
            <Check className="h-4 w-4" />
            Done
          </Button>
        </div>
      ) : null}
    </div>
  )
}
