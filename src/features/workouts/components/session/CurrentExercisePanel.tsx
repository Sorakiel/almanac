import { Check, Play } from 'lucide-react'
import { exerciseTargetLabel } from '@/features/workouts/lib/session'
import type { SessionExercise, SetLog } from '@/features/workouts/types'
import { cn } from '@/lib/utils'

interface CurrentExercisePanelProps {
  exercise: SessionExercise
  /** The set to complete next, or null when every set is done. */
  currentSet: SetLog | null
}

/** One set cell: ✓ when done, rep-count with an accent ring when current, else ○. */
function SetCell({ set, isCurrent }: { set: SetLog; isCurrent: boolean }) {
  return (
    <div
      className={cn(
        'relative flex-1 rounded-[14px] bg-bg py-4 text-center',
        isCurrent && 'border-[1.5px] border-accent',
      )}
    >
      {isCurrent ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[14px] border-[1.5px] border-accent motion-safe:animate-beacon"
        />
      ) : null}
      <div
        className={cn(
          'font-mono text-[10px] uppercase tracking-label',
          isCurrent ? 'text-accent' : 'text-muted-strong',
        )}
      >
        set {set.set_number}
      </div>
      <div className="mt-1.5 flex h-6 items-center justify-center">
        {set.done ? (
          <Check className="h-5 w-5 text-accent" aria-hidden="true" />
        ) : isCurrent ? (
          <span className="font-mono text-[20px] font-semibold tabular-nums leading-none">
            {set.reps ?? '—'}
          </span>
        ) : (
          <span
            aria-hidden="true"
            className="h-5 w-5 rounded-full border-[1.5px] border-muted-strong/40"
          />
        )}
      </div>
    </div>
  )
}

/** The focused current-exercise block: warm gradient card, target, and set grid. */
export function CurrentExercisePanel({ exercise, currentSet }: CurrentExercisePanelProps) {
  const target = exerciseTargetLabel(exercise)

  return (
    <>
      <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
        <Play className="h-3 w-3 fill-current" aria-hidden="true" />
        current exercise
      </p>

      <div className="relative mt-3.5">
        {/* Ambient "live" glow — the card breathes gently while a set is in play. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-5 rounded-[32px] bg-accent/25 blur-2xl motion-safe:animate-soft-pulse"
        />
        <div className="relative rounded-[24px] border border-accent/30 bg-gradient-to-br from-accent/[0.12] to-surface p-6 lg:p-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="min-w-0 truncate text-[26px] font-semibold tracking-title lg:text-[32px]">
              {exercise.name}
            </h2>
            {target ? (
              <span className="flex-none font-mono text-[13px] uppercase text-accent lg:text-sm">
                {target}
              </span>
            ) : null}
          </div>

          {exercise.sets.length > 0 ? (
            <div className="mt-5 flex gap-2.5 lg:gap-3">
              {exercise.sets.map((set) => (
                <SetCell key={set.id} set={set} isCurrent={set.id === currentSet?.id} />
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-muted">
              No sets planned — add sets on the workout page.
            </p>
          )}
        </div>
      </div>
    </>
  )
}
