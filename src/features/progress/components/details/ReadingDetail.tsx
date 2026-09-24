import { DetailNote } from '@/features/progress/components/details/DetailNote'
import type { ReadingPeriod } from '@/features/progress/lib/period'
import { dateFromKey } from '@/lib/date'
import { intlLocale } from '@/lib/dateLocale'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

/** A day with nothing read still gets a stub, so the gap reads as a gap. */
const EMPTY_BAR_PCT = 5

/** Pages per day as bars, and when the current book would be done at this pace. */
export function ReadingDetail({ data }: { data: ReadingPeriod }) {
  const { t, locale } = useT()
  const peak = Math.max(1, ...data.daily)
  const forecastDate = data.forecast
    ? new Intl.DateTimeFormat(intlLocale(locale), {
        day: 'numeric',
        month: 'long',
        timeZone: 'UTC',
      }).format(dateFromKey(data.forecast.date))
    : null
  return (
    <>
      <div className="flex h-14 items-end gap-1" role="img" aria-label={t('progress.readingBars')}>
        {data.daily.map((pages, i) => (
          <span
            key={i}
            className={cn('flex-1 rounded-t-sm bg-amber', pages === 0 && 'opacity-25')}
            style={{ height: `${pages === 0 ? EMPTY_BAR_PCT : Math.round((pages / peak) * 100)}%` }}
          />
        ))}
      </div>
      {data.forecast && forecastDate ? (
        <DetailNote>
          {t('progress.forecastNote', { title: data.forecast.title, date: forecastDate })}
        </DetailNote>
      ) : null}
    </>
  )
}
