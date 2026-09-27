import { useNavigate } from 'react-router-dom'
import type { HistoryEntry } from '@/features/workouts/lib/history'
import { useT } from '@/hooks/useT'
import { dateFromKey } from '@/lib/date'
import { intlLocale } from '@/lib/dateLocale'

interface SessionHistoryProps {
  entries: HistoryEntry[]
}

/** Finished sessions (the prototype's "История"): date block, workout, time · sets, volume. */
export function SessionHistory({ entries }: SessionHistoryProps) {
  const { t, locale } = useT()
  const navigate = useNavigate()
  const dateLocale = intlLocale(locale)
  const month = new Intl.DateTimeFormat(dateLocale, { timeZone: 'UTC', month: 'short' })

  if (entries.length === 0) {
    return (
      <p className="rounded-card bg-surface px-4 py-5 text-callout text-muted">
        {t('workouts.history.empty')}
      </p>
    )
  }

  return (
    <ul className="divide-y overflow-hidden rounded-card bg-surface">
      {entries.map((e) => (
        <li key={e.id}>
          <button
            type="button"
            onClick={() => navigate(`/train/${e.workoutId}`)}
            className="flex min-h-14 w-full items-center gap-3 px-3.5 py-2 text-left transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
          >
            <span className="w-11 flex-none text-center text-caption font-medium leading-tight text-muted">
              <b className="num block text-headline font-semibold text-foreground">
                {Number(e.date.slice(8, 10))}
              </b>
              {month.format(dateFromKey(e.date))}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-body font-medium">{e.name}</span>
              <span className="block truncate text-footnote text-muted">
                {t('workouts.history.row', {
                  minutes: e.minutes,
                  sets: t('workouts.setsCount', { count: e.sets }),
                })}
              </span>
            </span>
            {e.volume > 0 ? (
              <span className="num flex-none text-callout text-muted">
                {t('workouts.history.volume', {
                  value: Math.round(e.volume).toLocaleString(dateLocale),
                })}
              </span>
            ) : null}
          </button>
        </li>
      ))}
    </ul>
  )
}
