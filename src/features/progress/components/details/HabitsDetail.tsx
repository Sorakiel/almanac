import { resolveHabitColor } from '@/features/habits/lib/habitVisuals'
import { BarRow } from '@/features/progress/components/details/BarRow'
import { DetailNote } from '@/features/progress/components/details/DetailNote'
import { YearStrip } from '@/features/progress/components/YearStrip'
import type { YearDay } from '@/features/progress/lib/yearActivity'
import type { Insights } from '@/features/progress/types'
import { weekdayLabels } from '@/lib/dateLocale'
import { useT } from '@/hooks/useT'
import { cn } from '@/lib/utils'

/** The phone shows the top five; the desktop card has the room for all. */
const PHONE_ROWS = 5

interface HabitsDetailProps {
  habits: Insights
  yearDays: YearDay[]
  todayKey: string
}

/** Per-habit bars, the strongest and weakest weekday, and the year. */
export function HabitsDetail({ habits, yearDays, todayKey }: HabitsDetailProps) {
  const { t, locale } = useT()
  const days = weekdayLabels(locale, 'long')
  return (
    <>
      {habits.byHabit.map((h, i) => (
        <div key={h.id} className={cn(i >= PHONE_ROWS && 'hidden lg:block')}>
          <BarRow
            label={h.name}
            value={h.rate}
            display={`${Math.round(h.rate * 100)}%`}
            color={resolveHabitColor(h.color).stroke}
            wide
          />
        </div>
      ))}
      {habits.bestWeekday !== null && habits.worstWeekday !== null ? (
        <DetailNote>
          {t('progress.weekdayNote', {
            best: days[habits.bestWeekday] ?? '',
            worst: days[habits.worstWeekday] ?? '',
          })}
        </DetailNote>
      ) : null}
      <YearStrip days={yearDays} todayKey={todayKey} className="mt-1 bg-sheet-fill dark:bg-bg" />
    </>
  )
}
