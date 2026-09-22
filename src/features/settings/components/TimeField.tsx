import { reminderTimeLabel } from '@/features/settings/lib/reminder'

interface TimeFieldProps {
  label: string
  hour: number
  minute: number
  onChange: (hour: number, minute: number) => void
  disabled?: boolean
}

/** A native HH:MM time input bound to separate hour/minute numbers. */
export function TimeField({ label, hour, minute, onChange, disabled }: TimeFieldProps) {
  const handleChange = (value: string) => {
    // Native time input yields "HH:MM"; ignore an empty clear.
    const [h, m] = value.split(':').map(Number)
    if (Number.isFinite(h) && Number.isFinite(m)) onChange(h as number, m as number)
  }

  return (
    <label className="flex flex-col gap-1.5">
      <span className="label-mono">{label}</span>
      <input
        type="time"
        value={reminderTimeLabel(hour, minute)}
        onChange={(event) => handleChange(event.target.value)}
        disabled={disabled}
        aria-label={label}
        className="w-full rounded-tile border bg-surface px-3 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
      />
    </label>
  )
}
