import { Minus, Plus } from 'lucide-react'
import { useT } from '@/hooks/useT'

interface CountStepperProps {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
}

/** − value + control clamped to [min, max]. */
export function CountStepper({ value, onChange, min, max }: CountStepperProps) {
  const { t } = useT()
  return (
    <div className="flex items-center gap-1 rounded-xl bg-surface px-1.5 py-1">
      <button
        type="button"
        aria-label={t('habits.form.decrease')}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Minus className="h-4 w-4" aria-hidden="true" />
      </button>
      <span className="w-7 text-center font-mono tabular-nums">{value}</span>
      <button
        type="button"
        aria-label={t('habits.form.increase')}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-accent transition-colors hover:text-accent-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}
