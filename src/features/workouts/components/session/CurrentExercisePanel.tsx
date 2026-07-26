import { Check, Play, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exerciseTargetLabel, formatClock } from '@/features/workouts/lib/session'
import type { SessionExercise, SetLog } from '@/features/workouts/types'
import { cn } from '@/lib/utils'

interface CurrentExercisePanelProps {
  exercise: SessionExercise
  /** The set to complete next, or null when every set is done. */
  currentSet: SetLog | null
  restMs: number | null
  onCompleteSet: () => void
  onSkipRest: () => void
  disabled: boolean
}

/** One set chip: ✓ when done, accent ring when current, muted when upcoming. */
function SetChip({ set, isCurrent }: { set: SetLog; isCurrent: boolean }) {
  const value = set.reps != null ? `${set.reps}${set.weight != null ? `×${set.weight}` : ''}` : '—'
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border py-3',
        set.done && 'border-teal/40 bg-teal/10 text-teal',
        isCurrent && !set.done && 'border-accent bg-accent/10',
        !set.done && !isCurrent && 'bg-surface text-muted',
      )}
    >
      <span className="font-mono text-[9px] uppercase tracking-label text-muted-strong">
        set {set.set_number}
      </span>
      <span className="mt-1 text-sm font-semibold tabular-nums">
        {set.done ? <Check className="h-4 w-4" aria-hidden="true" /> : value}
      </span>
    </div>
  )
}

/** The focused current-exercise block: target, set grid, rest timer, complete CTA. */
export function CurrentExercisePanel({
  exercise,
  currentSet,
  restMs,
  onCompleteSet,
  onSkipRest,
  disabled,
}: CurrentExercisePanelProps) {
  const target = exerciseTargetLabel(exercise)
  const resting = restMs !== null

  return (
    <section className="rounded-[28px] border bg-panel p-5 lg:p-6">
      <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-label text-accent">
        <Play className="h-3 w-3" aria-hidden="true" />
        current exercise
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-title lg:text-[28px]">{exercise.name}</h2>
      {target ? (
        <p className="mt-1 font-mono text-xs uppercase tracking-label text-muted-strong">{target}</p>
      ) : null}

      {exercise.sets.length > 0 ? (
        <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {exercise.sets.map((set) => (
            <SetChip key={set.id} set={set} isCurrent={set.id === currentSet?.id} />
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm text-muted">No sets planned — add sets on the workout page.</p>
      )}

      {resting ? (
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-accent/30 bg-accent/5 px-4 py-2.5">
          <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-label text-accent">
            <Timer className="h-3.5 w-3.5" aria-hidden="true" />
            rest {formatClock(restMs)}
          </span>
          <button
            type="button"
            onClick={onSkipRest}
            className="font-mono text-[10px] uppercase tracking-label text-muted hover:text-foreground"
          >
            skip
          </button>
        </div>
      ) : null}

      <Button
        size="lg"
        className="mt-5 w-full shadow-glow"
        disabled={disabled || !currentSet}
        onClick={onCompleteSet}
      >
        <Check className="h-4 w-4" />
        {currentSet ? `Complete set ${currentSet.set_number}` : 'Exercise complete'}
      </Button>
    </section>
  )
}
