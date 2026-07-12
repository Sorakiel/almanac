import type { SignupWeek } from '@/features/admin/types'

interface SignupsChartProps {
  weeks: SignupWeek[]
  height?: number
}

/** Signups-per-week bar chart — accent-gradient bars scaled to the peak week. */
export function SignupsChart({ weeks, height = 120 }: SignupsChartProps) {
  const max = Math.max(1, ...weeks.map((w) => w.count))

  return (
    <div className="rounded-card bg-panel p-5 pb-4">
      <div className="flex items-end gap-3" style={{ height }}>
        {weeks.map((w) => (
          <div
            key={w.label}
            className="flex-1 rounded-t-md bg-gradient-to-b from-accent to-accent-deep"
            style={{ height: `${Math.max(4, (w.count / max) * 100)}%` }}
            role="img"
            aria-label={`${w.label}: ${w.count} signups`}
          />
        ))}
      </div>
      <div className="mt-2.5 flex justify-between font-mono text-[10px] text-muted-strong">
        {weeks.map((w) => (
          <span key={w.label}>{w.label}</span>
        ))}
      </div>
    </div>
  )
}
