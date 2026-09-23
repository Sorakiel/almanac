import { Clock } from 'lucide-react'
import { reminderTimeLabel } from '@/features/settings/lib/reminder'
import { useT } from '@/hooks/useT'
import { intlLocale } from '@/lib/dateLocale'
import { cn } from '@/lib/utils'

interface TimeFieldProps {
  label: string
  hour: number
  minute: number
  onChange: (hour: number, minute: number) => void
  disabled?: boolean
}

/**
 * A native HH:MM time input bound to separate hour/minute numbers. Like
 * `DateField`, the time is drawn in the interface language over an invisible
 * native input — left alone, an English browser shows "08:00 PM" on a Russian
 * screen.
 */
export function TimeField({ label, hour, minute, onChange, disabled }: TimeFieldProps) {
  const { locale } = useT()
  const shown = new Intl.DateTimeFormat(intlLocale(locale), {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(Date.UTC(2000, 0, 1, hour, minute))
  const handleChange = (value: string) => {
    // Native time input yields "HH:MM"; ignore an empty clear.
    const [h, m] = value.split(':').map(Number)
    if (Number.isFinite(h) && Number.isFinite(m)) onChange(h as number, m as number)
  }

  return (
    <label className="flex flex-col gap-1.5">
      <span className="label-mono">{label}</span>
      <div
        className={cn(
          'relative flex w-full items-center justify-between rounded-tile border bg-surface px-3 py-2.5 text-sm text-foreground',
          'focus-within:ring-2 focus-within:ring-accent',
          disabled && 'opacity-50',
        )}
      >
        <span aria-hidden="true" className="tabular-nums">
          {shown}
        </span>
        <Clock aria-hidden="true" className="h-4 w-4 text-muted-strong" />
        <input
          type="time"
          value={reminderTimeLabel(hour, minute)}
          onChange={(event) => handleChange(event.target.value)}
          onClick={(event) => {
            try {
              event.currentTarget.showPicker()
            } catch {
              // Not supported here — typing into the field still works.
            }
          }}
          disabled={disabled}
          aria-label={label}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
      </div>
    </label>
  )
}
