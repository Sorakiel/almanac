import { Flame } from 'lucide-react'
import { AlmanacNarrator } from '@/features/dashboard/components/AlmanacNarrator'
import { QuoteCard } from '@/features/dashboard/components/QuoteCard'
import { TodaySummary } from '@/features/dashboard/components/TodaySummary'
import type { HabitWithTodayLog } from '@/features/habits/types'
import { useT } from '@/hooks/useT'

interface DashboardRailProps {
  habits: HabitWithTodayLog[]
}

/**
 * Desktop context rail for Today.
 *
 * A rail shows what the page does not. This one used to restate today's
 * percentage, the week rate and the habit count — all three already large on
 * the workspace, three columns to the left. What it carries now is the one
 * thing the grid of tiles can't answer at a glance: which streaks break if
 * today ends here.
 */
export function DashboardRail({ habits }: DashboardRailProps) {
  const { t } = useT()
  const atRisk = habits.filter((h) => h.atRisk && !h.isComplete)
  const strongest = [...habits].sort((a, b) => b.rate - a.rate)[0]

  return (
    <div className="flex flex-col gap-3.5">
      <AlmanacNarrator habits={habits} />

      <TodaySummary habits={habits} />

      <QuoteCard />

      {habits.length > 0 ? (
        <div className="rounded-[18px] border bg-surface p-[18px]">
          <p className="font-mono text-[10px] uppercase tracking-label text-muted-strong">
            {atRisk.length > 0 ? t('dashboard.attention') : t('dashboard.strongest')}
          </p>
          {atRisk.length > 0 ? (
            <ul className="mt-2.5 flex flex-col gap-2">
              {atRisk.slice(0, 4).map((habit) => (
                <li key={habit.id} className="flex items-center gap-2.5 text-[13.5px]">
                  <Flame className="h-3.5 w-3.5 flex-none text-accent" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{habit.name}</span>
                  <span className="flex-none font-mono text-[11px] tabular-nums text-muted-strong">
                    {habit.streak}
                    {t('dashboard.daysUnit')}
                  </span>
                </li>
              ))}
            </ul>
          ) : strongest ? (
            <div className="mt-2.5 flex items-baseline gap-2.5">
              <span className="min-w-0 flex-1 truncate text-[13.5px]">{strongest.name}</span>
              <span className="flex-none font-mono text-[13.5px] font-semibold tabular-nums text-accent">
                {Math.round(strongest.rate * 100)}%
              </span>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
