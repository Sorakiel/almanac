import type { FocusSessionRow } from '@/features/flow/api/focusSessions.api'
import { focusWeek } from '@/features/flow/lib/week'
import { useT } from '@/hooks/useT'
import { dateFromKey } from '@/lib/date'
import { intlLocale } from '@/lib/dateLocale'
import { cn } from '@/lib/utils'

/** The tallest bar, in minutes; anything longer is drawn full height. */
const BAR_MAX_MIN = 90
const BAR_MAX_PX = 64
const BAR_MIN_PX = 4

/** «Неделя» — seven bars of focused minutes, today in accent (prototype `MOD.fWeek`). */
export function FocusWeek({ rows, todayKey }: { rows: FocusSessionRow[]; todayKey: string }) {
  const { t, locale } = useT()
  const week = focusWeek(rows, todayKey)
  const total = week.reduce((sum, d) => sum + d.minutes, 0)
  const day = new Intl.DateTimeFormat(intlLocale(locale), { weekday: 'short', timeZone: 'UTC' })

  return (
    <section className="flow-chart" aria-label={t('flow.week')}>
      <h3 className="flow-chart-h">
        {t('flow.week')}
        <span>{t('flow.minutesShort', { count: total })}</span>
      </h3>
      <div className="flow-bars">
        {week.map((d) => {
          const label = day.format(dateFromKey(d.key))
          return (
            <div key={d.key} className={cn(d.isToday && 'is-today')}>
              <i
                className={cn(d.minutes === 0 && 'is-zero')}
                style={{
                  height: Math.max(
                    BAR_MIN_PX,
                    (Math.min(d.minutes, BAR_MAX_MIN) / BAR_MAX_MIN) * BAR_MAX_PX,
                  ),
                }}
                title={`${label}: ${t('flow.minutesShort', { count: d.minutes })}`}
              />
              <span className="first-letter:uppercase">{label.replace('.', '')}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
