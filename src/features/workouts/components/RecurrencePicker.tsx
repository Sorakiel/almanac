import { WEEKDAY_LABELS } from '@/features/workouts/lib/recurrence'
import type { WorkoutRecurrence } from '@/features/workouts/types'
import { cn } from '@/lib/utils'

export interface RecurrenceValue {
  recurrence: WorkoutRecurrence
  days: number[]
  interval: number | null
}

interface RecurrencePickerProps {
  value: RecurrenceValue
  onChange: (value: RecurrenceValue) => void
}

const MODES: { value: WorkoutRecurrence; label: string }[] = [
  { value: 'none', label: 'Once' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'every_n_days', label: 'Every N' },
]

/** Schedule picker: one-off, daily, specific weekdays, or every-N-days. */
export function RecurrencePicker({ value, onChange }: RecurrencePickerProps) {
  const toggleDay = (day: number) => {
    const days = value.days.includes(day)
      ? value.days.filter((d) => d !== day)
      : [...value.days, day]
    onChange({ ...value, days })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Repeat">
        {MODES.map((mode) => (
          <button
            key={mode.value}
            type="button"
            role="radio"
            aria-checked={value.recurrence === mode.value}
            onClick={() => onChange({ ...value, recurrence: mode.value })}
            className={cn(
              'rounded-tile border py-2.5 font-mono text-[11px] tracking-label transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              value.recurrence === mode.value
                ? 'border-accent bg-accent/15 text-accent'
                : 'text-muted hover:text-foreground',
            )}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {value.recurrence === 'weekdays' ? (
        <div className="flex justify-between gap-1.5" role="group" aria-label="Days of the week">
          {WEEKDAY_LABELS.map((label, day) => {
            const active = value.days.includes(day)
            return (
              <button
                key={day}
                type="button"
                aria-pressed={active}
                aria-label={label}
                onClick={() => toggleDay(day)}
                className={cn(
                  'flex h-10 flex-1 items-center justify-center rounded-lg border text-xs font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                  active
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'text-muted hover:text-foreground',
                )}
              >
                {label[0]}
              </button>
            )
          })}
        </div>
      ) : null}

      {value.recurrence === 'every_n_days' ? (
        <label className="flex items-center gap-2 text-sm text-muted">
          Every
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={value.interval ?? ''}
            onChange={(e) =>
              onChange({ ...value, interval: e.target.value ? Number(e.target.value) : null })
            }
            className="h-10 w-16 rounded-lg border bg-surface text-center text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
          days
        </label>
      ) : null}
    </div>
  )
}
