import { Minus, Plus } from 'lucide-react'
import { useT } from '@/hooks/useT'

interface AmountStepperProps {
  value: number
  onChange: (value: number) => void
  step: number
  /** Upper bound — the units left in the book, when its length is known. */
  max: number | null
}

/** −/+ around the amount the "+N" button will log. 44 px targets, number in `.num`. */
export function AmountStepper({ value, onChange, step, max }: AmountStepperProps) {
  const { t } = useT()
  const clamp = (next: number) => Math.max(1, max === null ? next : Math.min(max, next))
  // Snap to the step grid so 7 → 10 rather than 7 → 12.
  const down = () => onChange(clamp(value % step === 0 ? value - step : value - (value % step)))
  const up = () =>
    onChange(clamp(value % step === 0 ? value + step : value + step - (value % step)))

  return (
    <div
      role="group"
      aria-label={t('reading.amountAria')}
      className="flex h-12 flex-none items-center rounded-2xl border bg-surface"
    >
      <button
        type="button"
        onClick={down}
        disabled={value <= 1}
        aria-label={t('reading.stepLess')}
        className="flex h-11 w-11 items-center justify-center rounded-l-2xl text-muted transition-colors hover:text-foreground disabled:opacity-40"
      >
        <Minus className="h-4 w-4" aria-hidden="true" />
      </button>
      <output aria-live="polite" className="num w-10 text-center text-body text-foreground">
        {value}
      </output>
      <button
        type="button"
        onClick={up}
        disabled={max !== null && value >= max}
        aria-label={t('reading.stepMore')}
        className="flex h-11 w-11 items-center justify-center rounded-r-2xl text-muted transition-colors hover:text-foreground disabled:opacity-40"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}
