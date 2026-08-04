import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepperProps {
  value: number | null
  /** Set an absolute value (from typing). */
  onChange: (value: number | null) => void
  /** Adjust by a delta (from the buttons) — accumulates on rapid clicks. */
  onStep: (delta: number) => void
  step?: number
  ariaLabel: string
  className?: string
}

/** Parse an input string to a non-negative number, or null when blank. */
function parseNum(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const n = Number(trimmed)
  return Number.isFinite(n) && n >= 0 ? n : null
}

/** A compact "− value +" numeric stepper; the value is also directly editable. */
export function Stepper({ value, onChange, onStep, step = 1, ariaLabel, className }: StepperProps) {
  return (
    <div
      className={cn(
        'flex items-center rounded-xl border bg-panel focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/40',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onStep(-step)}
        aria-label={`Decrease ${ariaLabel}`}
        className="flex h-10 w-10 flex-none items-center justify-center rounded-l-xl text-accent transition-colors hover:bg-bg"
      >
        <Minus className="h-4 w-4" aria-hidden="true" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={value ?? ''}
        aria-label={ariaLabel}
        onChange={(e) => onChange(parseNum(e.target.value))}
        className="w-full min-w-0 bg-transparent text-center text-sm font-semibold tabular-nums [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => onStep(step)}
        aria-label={`Increase ${ariaLabel}`}
        className="flex h-10 w-10 flex-none items-center justify-center rounded-r-xl text-accent transition-colors hover:bg-bg"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}
