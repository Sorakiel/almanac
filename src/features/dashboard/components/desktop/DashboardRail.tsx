import { AlmanacNarrator } from '@/features/dashboard/components/AlmanacNarrator'
import { QuoteCard } from '@/features/dashboard/components/QuoteCard'
import { TodaySummary } from '@/features/dashboard/components/TodaySummary'
import type { HabitWithTodayLog } from '@/features/habits/types'
import { useT } from '@/hooks/useT'

interface DashboardRailProps {
  habits: HabitWithTodayLog[]
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 pt-2.5 text-[13.5px] first:pt-0">
      <span className="flex-none text-muted">{label}</span>
      <span
        className={`min-w-0 truncate text-right font-mono tabular-nums ${accent ? 'font-semibold text-accent' : ''}`}
      >
        {value}
      </span>
    </div>
  )
}

/** "{t('dashboard.almanacWatches')}" — the desktop context rail for Today. */
export function DashboardRail({ habits }: DashboardRailProps) {
  const { t } = useT()
  const due = habits.filter((h) => h.dueToday || h.isComplete)
  const completed = due.filter((h) => h.isComplete).length
  const todayPct = due.length ? Math.round((completed / due.length) * 100) : 0
  const weekRate = habits.length
    ? Math.round((habits.reduce((sum, h) => sum + h.rate, 0) / habits.length) * 100)
    : 0
  const strongest = [...habits].sort((a, b) => b.rate - a.rate)[0]

  return (
    <div className="flex flex-col gap-3.5">
      <AlmanacNarrator habits={habits} />

      <TodaySummary habits={habits} />

      <QuoteCard />

      <div className="rounded-[18px] border bg-surface p-[18px]">
        <p className="font-mono text-[10px] uppercase tracking-label text-muted-strong">
          {t('dashboard.thisWeek')}
        </p>
        <div className="mt-2 flex flex-col">
          <Row label={t('dashboard.onTrack')} value={`${weekRate}%`} accent />
          <Row label={t('dashboard.today')} value={`${todayPct}%`} />
          <Row label={t('dashboard.activeHabits')} value={String(habits.length)} />
          {strongest ? <Row label={t('dashboard.strongest')} value={strongest.name} /> : null}
        </div>
      </div>
    </div>
  )
}
