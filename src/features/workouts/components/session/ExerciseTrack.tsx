import type { Cursor } from '@/features/workouts/lib/sessionRun'
import type { SessionExercise } from '@/features/workouts/types'
import { cn } from '@/lib/utils'

interface ExerciseTrackProps {
  exercises: SessionExercise[]
  cursor: Cursor | null
  onPick: (index: number) => void
}

/**
 * Every exercise as a pill with a dot per set (`MOD.wTrack`): grey to do,
 * teal done, the current one breathing in a ring. Tap to switch exercise;
 * a finished one dims and carries a ✓.
 */
export function ExerciseTrack({ exercises, cursor, onPick }: ExerciseTrackProps) {
  return (
    // A sideways strip on the phone; one row per exercise, dots right, on the desktop.
    <div className="ws-track -mx-0.5 flex gap-2 overflow-x-auto p-0.5 lg:mx-0 lg:flex-col lg:overflow-visible">
      {exercises.map((ex, i) => {
        const on = cursor?.exercise === i
        const all = ex.sets.length > 0 && ex.sets.every((s) => s.done)
        return (
          <button
            key={ex.id}
            type="button"
            onClick={() => onPick(i)}
            aria-pressed={on}
            className={cn(
              'flex-none rounded-2xl bg-surface px-3 py-2.5 text-left transition',
              'grid gap-1.75 lg:flex lg:w-full lg:items-center lg:justify-between lg:gap-3',
              on && 'ring-2 ring-teal',
              all && 'opacity-55',
            )}
          >
            <b className="whitespace-nowrap text-callout font-semibold">
              {ex.name}
              {all ? <span className="text-teal"> ✓</span> : null}
            </b>
            <span className="flex gap-1">
              {ex.sets.map((s, j) => (
                <i
                  key={s.id}
                  className={cn(
                    'h-2.25 w-2.25 rounded-full transition-colors duration-300',
                    s.done ? 'bg-teal' : 'bg-foreground/15',
                    on && cursor?.set === j && 'ws-dot-current',
                  )}
                />
              ))}
            </span>
          </button>
        )
      })}
    </div>
  )
}
