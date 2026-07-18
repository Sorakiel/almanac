import { Dumbbell } from 'lucide-react'
import { IconTile } from '@/components/common/IconTile'
import { InsightStat } from '@/features/insights/components/InsightStat'
import type { WorkoutInsights } from '@/features/insights/types'

interface WorkoutInsightsSectionProps {
  data: WorkoutInsights
}

/** Training stats block: sessions/volume KPIs, top exercises, and PRs. */
export function WorkoutInsightsSection({ data }: WorkoutInsightsSectionProps) {
  return (
    <div className="flex flex-col gap-5">
      <p className="label-mono">// training · last 30 days</p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <InsightStat label="sessions" value={String(data.totalSessions)} accent />
        <InsightStat label="completed" value={String(data.completedSessions)} />
        <InsightStat label="done · 30d" value={String(data.completed30d)} />
        <InsightStat label="volume · 30d" value={String(data.volume30d)} unit="kg" />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="min-w-0 rounded-card border bg-surface p-4">
          <p className="label-mono mb-3">most frequent</p>
          {data.topExercises.length === 0 ? (
            <p className="text-sm text-muted">No exercises logged yet.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {data.topExercises.map((ex) => (
                <li key={ex.name} className="flex items-center gap-3">
                  <IconTile icon={Dumbbell} tone="bg-teal/15 text-teal" size="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm">{ex.name}</span>
                  <span className="font-mono text-[11px] text-muted-strong">
                    {ex.sessions}× session{ex.sessions === 1 ? '' : 's'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="min-w-0 rounded-card border bg-surface p-4">
          <p className="label-mono mb-3">personal records</p>
          {data.prs.length === 0 ? (
            <p className="text-sm text-muted">Log a set with weight to set a record.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {data.prs.map((pr) => (
                <li key={pr.name} className="flex items-center gap-3">
                  <span className="min-w-0 flex-1 truncate text-sm">{pr.name}</span>
                  <span className="font-mono text-[12px] text-accent">
                    {pr.weight}kg × {pr.reps}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
