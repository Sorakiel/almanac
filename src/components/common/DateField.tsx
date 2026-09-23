import { forwardRef } from 'react'
import { CalendarDays } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { dateFromKey } from '@/lib/date'
import { intlLocale } from '@/lib/dateLocale'
import { cn } from '@/lib/utils'

interface DateFieldProps {
  /** `YYYY-MM-DD`, or '' for no date. */
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  name?: string
  className?: string
}

/**
 * A date input that reads in the interface language.
 *
 * A native `<input type="date">` formats itself in the *browser's* locale and
 * ignores `lang`, so a Russian screen in an English browser showed mm/dd/yyyy.
 * The formatted date is drawn by us; the native input sits invisibly on top so
 * tapping still opens the platform picker (and keyboard entry still works).
 */
export const DateField = forwardRef<HTMLInputElement, DateFieldProps>(
  ({ value, onChange, onBlur, name, className }, ref) => {
    const { t, locale } = useT()
    // The year only when it isn't this one — "3 сентября 2026 г." wraps in a half-width field.
    const sameYear = value.slice(0, 4) === String(new Date().getFullYear())
    const label = value
      ? new Intl.DateTimeFormat(intlLocale(locale), {
          day: 'numeric',
          month: 'long',
          year: sameYear ? undefined : 'numeric',
          timeZone: 'UTC',
        }).format(dateFromKey(value))
      : t('common.noDate')

    return (
      <div
        className={cn(
          'relative flex h-12 w-full items-center justify-between gap-2 rounded-[13px] border bg-surface px-4 text-sm',
          'focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-bg',
          className,
        )}
      >
        <span aria-hidden="true" className={cn('min-w-0 truncate', !value && 'text-muted-strong')}>
          {label}
        </span>
        <CalendarDays aria-hidden="true" className="h-4 w-4 flex-none text-muted-strong" />
        <input
          ref={ref}
          type="date"
          name={name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          onClick={(event) => {
            // Chromium only opens the calendar from its own icon otherwise.
            try {
              event.currentTarget.showPicker()
            } catch {
              // Not supported or not allowed here — the field is still editable.
            }
          }}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
    )
  },
)
DateField.displayName = 'DateField'
