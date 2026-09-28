import type { FocusSessionRow } from '@/features/flow/api/focusSessions.api'
import { useT } from '@/hooks/useT'
import { addDaysToKey } from '@/lib/date'
import { intlLocale } from '@/lib/dateLocale'

/** How many of the latest blocks the list shows. */
const RECENT = 3
const MS_PER_MINUTE = 60_000

interface FocusRecentProps {
  rows: FocusSessionRow[]
  todayKey: string
  timezone: string
}

/** «Недавние» — the last few blocks: what, when it started, how long (prototype `MOD.fRecent`). */
export function FocusRecent({ rows, todayKey, timezone }: FocusRecentProps) {
  const { t, locale } = useT()
  const loc = intlLocale(locale)
  const time = new Intl.DateTimeFormat(loc, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  })
  const date = new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'short', timeZone: timezone })
  const when = (r: FocusSessionRow) => {
    const start = new Date(Date.parse(r.created_at) - r.minutes * MS_PER_MINUTE)
    const dayWord =
      r.date === todayKey
        ? t('flow.today')
        : r.date === addDaysToKey(todayKey, -1)
          ? t('flow.yesterday')
          : date.format(start)
    return `${dayWord}, ${time.format(start)}`
  }

  if (rows.length === 0) {
    return <p className="flow-rows px-4 py-4 text-callout text-muted">{t('flow.recentEmpty')}</p>
  }
  return (
    <ul className="flow-rows">
      {rows.slice(0, RECENT).map((r) => (
        <li key={r.id} className="flow-row">
          <div className="min-w-0 flex-1">
            <b>{r.label ?? t('flow.defaultSessionLabel')}</b>
            <small>{when(r)}</small>
          </div>
          <span className="flow-row-v">{t('flow.minutesShort', { count: r.minutes })}</span>
        </li>
      ))}
    </ul>
  )
}
