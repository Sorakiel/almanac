import type { SignupWeek } from '@/features/admin/types'
import { useT } from '@/hooks/useT'

interface SignupsChartProps {
  weeks: SignupWeek[]
  height?: number
}

/** Signups-per-week bar chart — accent-gradient bars scaled to the peak week. */
export function SignupsChart({ weeks, height = 120 }: SignupsChartProps) {
  const { t } = useT()
  const weekLabel = (w: SignupWeek) => t('insights.weekShort', { n: w.week })
  const max = Math.max(1, ...weeks.map((w) => w.count))

  return (
    <div className="rounded-card bg-panel p-5 pb-4">
      <div className="flex items-end gap-3" style={{ height }}>
        {weeks.map((w) => (
          <div
            key={w.week}
            className="flex-1 rounded-t-md bg-gradient-to-b from-accent-bright to-accent-deep"
            style={{ height: `${Math.max(4, (w.count / max) * 100)}%` }}
            role="img"
            aria-label={t('admin.signupsAria', { week: weekLabel(w), count: w.count })}
          />
        ))}
      </div>
      <div className="mt-2.5 flex justify-between font-mono text-[10px] text-muted-strong">
        {weeks.map((w) => (
          <span key={w.week}>{weekLabel(w)}</span>
        ))}
      </div>
    </div>
  )
}
