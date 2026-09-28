import { X } from 'lucide-react'
import { formatReminder, parseReminder } from '@/features/habits/lib/reminders'
import { useT } from '@/hooks/useT'

interface HabitReminderFieldProps {
  /** Minutes after midnight, or null for none. */
  value: number | null
  onChange: (value: number | null) => void
  labelClassName: string
}

/** A time for this habit's own reminder, cleared with ×. */
export function HabitReminderField({ value, onChange, labelClassName }: HabitReminderFieldProps) {
  const { t } = useT()
  return (
    <>
      <label htmlFor="habit-reminder" className={labelClassName}>
        {t('habits.reminder.label')}
      </label>
      <div className="flex items-center gap-2">
        <input
          id="habit-reminder"
          type="time"
          value={value === null ? '' : formatReminder(value)}
          onChange={(event) => onChange(parseReminder(event.target.value))}
          className="num h-12 flex-1 rounded-control bg-sheet-fill px-3.5 text-body text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
        />
        {value !== null ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={t('habits.reminder.clear')}
            className="grid h-12 w-12 place-items-center rounded-control bg-sheet-fill text-muted hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </>
  )
}
