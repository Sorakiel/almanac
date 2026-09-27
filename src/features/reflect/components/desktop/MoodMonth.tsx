import { MOODS, monthCells, moodFor } from '@/features/reflect/lib/moods'
import type { Reflection } from '@/features/reflect/types'
import { useT } from '@/hooks/useT'
import { addDaysToKey, dateFromKey } from '@/lib/date'
import { intlLocale } from '@/lib/dateLocale'
import { cn } from '@/lib/utils'

interface MoodMonthProps {
  todayKey: string
  reflections: Reflection[]
}

// Any Monday: the weekday headers are read off the week that starts here.
const A_MONDAY = '2026-09-21'

/** This month's mood, one cell a day: colour of the day's mood, today outlined. */
export function MoodMonth({ todayKey, reflections }: MoodMonthProps) {
  const { t, locale } = useT()
  const dateLocale = intlLocale(locale)
  const { lead, days } = monthCells(todayKey)
  const moodByDay = new Map(reflections.map((r) => [r.date, r.mood]))
  const weekday = new Intl.DateTimeFormat(dateLocale, { timeZone: 'UTC', weekday: 'short' })
  const dayLabel = new Intl.DateTimeFormat(dateLocale, {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'long',
  })

  return (
    <section className="rounded-card bg-surface p-4" aria-label={t('reflect.moodMonth')}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-callout font-semibold first-letter:uppercase">
          {new Intl.DateTimeFormat(dateLocale, { timeZone: 'UTC', month: 'long' }).format(
            dateFromKey(todayKey),
          )}
        </h2>
        <span className="text-footnote text-muted">{t('reflect.moodMonth')}</span>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 7 }, (_, i) => (
          <span key={i} className="text-center text-caption text-muted-strong">
            {weekday.format(dateFromKey(addDaysToKey(A_MONDAY, i)))}
          </span>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <span key={`lead-${i}`} aria-hidden="true" />
        ))}
        {days.map((key) => {
          const mood = moodFor(moodByDay.get(key) ?? null)
          const label = mood
            ? `${dayLabel.format(dateFromKey(key))} · ${t(`dashboard.modules.moods.${mood.key}`)}`
            : dayLabel.format(dateFromKey(key))
          return (
            <span
                key={key}
                role="img"
                aria-label={label}
                title={label}
                className={cn(
                  'aspect-square rounded-inner',
                  mood ? mood.dot : 'bg-foreground/5',
                  key > todayKey && 'opacity-35',
                  key === todayKey && 'ring-2 ring-inset ring-foreground',
                )}
              />
          )
        })}
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-2.5 gap-y-1">
        {MOODS.map((m) => (
          <li key={m.value} className="flex items-center gap-1 text-footnote text-muted">
            <span aria-hidden="true" className={cn('h-2 w-2 rounded-full', m.dot)} />
            {t(`dashboard.modules.moods.${m.key}`)}
          </li>
        ))}
      </ul>
    </section>
  )
}
