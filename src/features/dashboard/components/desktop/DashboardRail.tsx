import { QuoteCard } from '@/features/dashboard/components/QuoteCard'
import type { HabitWithTodayLog } from '@/features/habits/types'

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

/** "The Almanac watches your day" — the desktop context rail for Today. */
export function DashboardRail({ habits }: DashboardRailProps) {
  const due = habits.filter((h) => h.dueToday || h.isComplete)
  const completed = due.filter((h) => h.isComplete).length
  const todayPct = due.length ? Math.round((completed / due.length) * 100) : 0
  const weekRate = habits.length
    ? Math.round((habits.reduce((sum, h) => sum + h.rate, 0) / habits.length) * 100)
    : 0
  const strongest = [...habits].sort((a, b) => b.rate - a.rate)[0]

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-accent/15 text-[17px] text-accent"
        >
          ◇
        </span>
        <div>
          <p className="text-[15px] font-semibold">The Almanac</p>
          <p className="font-mono text-[10px] text-muted-strong">watching your day</p>
        </div>
      </div>

      <QuoteCard />

      <div className="rounded-[18px] border bg-surface p-[18px]">
        <p className="font-mono text-[10px] uppercase tracking-label text-muted-strong">this week</p>
        <div className="mt-2 flex flex-col">
          <Row label="on track" value={`${weekRate}%`} accent />
          <Row label="today" value={`${todayPct}%`} />
          <Row label="active habits" value={String(habits.length)} />
          {strongest ? <Row label="strongest" value={strongest.name} /> : null}
        </div>
      </div>
    </div>
  )
}
