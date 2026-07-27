import { useState } from 'react'
import { X } from 'lucide-react'
import type { SetLog } from '@/features/workouts/types'

interface SetRowProps {
  set: SetLog
  onCommit: (patch: { reps?: number | null; weight?: number | null }) => void
  onRemove: () => void
}

/** Parse an input string to a non-negative number, or null when blank. */
function parseNum(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const n = Number(trimmed)
  return Number.isFinite(n) && n >= 0 ? n : null
}

const FIELD =
  'h-10 rounded-xl border bg-bg text-center text-sm tabular-nums transition-colors focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

/** One editable planned set: "set n · reps × weight kg" with a remove control. */
export function SetRow({ set, onCommit, onRemove }: SetRowProps) {
  const [reps, setReps] = useState(set.reps?.toString() ?? '')
  const [weight, setWeight] = useState(set.weight?.toString() ?? '')

  return (
    <div className="flex items-center gap-2.5">
      <span className="w-11 flex-none font-mono text-[10px] uppercase tracking-label text-muted-strong">
        set {set.set_number}
      </span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={reps}
        placeholder="reps"
        aria-label={`Reps for set ${set.set_number}`}
        onChange={(e) => setReps(e.target.value)}
        onBlur={() => onCommit({ reps: parseNum(reps) })}
        className={`${FIELD} w-16`}
      />
      <span className="text-sm text-muted-strong">×</span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        value={weight}
        placeholder="kg"
        aria-label={`Weight for set ${set.set_number}`}
        onChange={(e) => setWeight(e.target.value)}
        onBlur={() => onCommit({ weight: parseNum(weight) })}
        className={`${FIELD} w-20`}
      />
      <span className="font-mono text-[11px] text-muted-strong">kg</span>
      <div className="flex-1" />
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove set ${set.set_number}`}
        className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-muted-strong transition-colors hover:bg-bg hover:text-accent"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}
