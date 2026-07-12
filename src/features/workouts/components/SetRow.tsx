import { useState } from 'react'
import { Check, X } from 'lucide-react'
import type { SetLog } from '@/features/workouts/types'
import { cn } from '@/lib/utils'

interface SetRowProps {
  set: SetLog
  onToggleDone: (done: boolean) => void
  /** Edit-only: commit reps/weight changes. */
  onCommit?: (patch: { reps?: number | null; weight?: number | null }) => void
  /** Edit-only: remove the set. */
  onRemove?: () => void
  /** 'edit' (plan) shows inputs; 'run' (session) shows the plan read-only. */
  variant?: 'edit' | 'run'
}

/** Parse an input string to a non-negative number, or null when blank. */
function parseNum(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const n = Number(trimmed)
  return Number.isFinite(n) && n >= 0 ? n : null
}

/** Static plan label for a set, e.g. "8 × 60kg", "8 reps", or "Set 2". */
function planLabel(set: SetLog): string {
  if (set.reps != null && set.weight != null) return `${set.reps} × ${set.weight}kg`
  if (set.reps != null) return `${set.reps} reps`
  if (set.weight != null) return `${set.weight}kg`
  return `Set ${set.set_number}`
}

const FIELD =
  'h-9 w-full rounded-lg border bg-bg text-center text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent'

function DoneToggle({ set, onToggleDone }: { set: SetLog; onToggleDone: (done: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onToggleDone(!set.done)}
      aria-pressed={set.done}
      aria-label={set.done ? `Set ${set.set_number} not done` : `Set ${set.set_number} done`}
      className={cn(
        'flex h-9 w-9 flex-none items-center justify-center rounded-lg border transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        set.done
          ? 'border-teal/50 bg-teal/15 text-teal'
          : 'text-transparent hover:border-accent hover:text-accent',
      )}
    >
      <Check className="h-4 w-4" aria-hidden="true" />
    </button>
  )
}

/**
 * One set. In 'run' mode it's execution-only — tick the planned set done or not,
 * with no editing; reps/weight are shaped on the plan (the detail page).
 */
export function SetRow({ set, onToggleDone, onCommit, onRemove, variant = 'edit' }: SetRowProps) {
  const [reps, setReps] = useState(set.reps?.toString() ?? '')
  const [weight, setWeight] = useState(set.weight?.toString() ?? '')

  if (variant === 'run') {
    return (
      <div className="flex items-center gap-3">
        <DoneToggle set={set} onToggleDone={onToggleDone} />
        <span className="font-mono text-[10px] uppercase tracking-label text-muted-strong">
          set {set.set_number}
        </span>
        <span className={cn('text-sm tabular-nums', set.done && 'text-muted line-through')}>
          {planLabel(set)}
        </span>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2.5">
      <DoneToggle set={set} onToggleDone={onToggleDone} />

      <label className="flex items-center gap-1.5">
        <span className="sr-only">Reps for set {set.set_number}</span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={reps}
          placeholder="reps"
          onChange={(e) => setReps(e.target.value)}
          onBlur={() => onCommit?.({ reps: parseNum(reps) })}
          className={FIELD}
        />
      </label>

      <label className="flex items-center gap-1.5">
        <span className="sr-only">Weight for set {set.set_number}</span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          value={weight}
          placeholder="kg"
          onChange={(e) => setWeight(e.target.value)}
          onBlur={() => onCommit?.({ weight: parseNum(weight) })}
          className={FIELD}
        />
      </label>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove set ${set.set_number}`}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-strong transition-colors hover:bg-surface hover:text-accent"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}
