import { Dumbbell } from 'lucide-react'
import { RecentSessions } from '@/features/workouts/components/RecentSessions'
import type { TrainingOverview } from '@/features/workouts/hooks/useTrainingOverview'

interface WorkoutsRailProps {
  overview: TrainingOverview
}

function StatTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex-1 rounded-2xl border bg-surface p-4">
      <p className="font-mono text-[9px] uppercase tracking-label text-muted-strong">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}

/** Desktop training rail: this-week / completed tiles and recent sessions. */
export function WorkoutsRail({ overview }: WorkoutsRailProps) {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-teal/15 text-teal"
        >
          <Dumbbell className="h-[18px] w-[18px]" />
        </span>
        <div>
          <p className="text-[15px] font-semibold">Training</p>
          <p className="font-mono text-[10px] text-muted-strong">your week</p>
        </div>
      </div>

      <div className="flex gap-3">
        <StatTile
          label="this week"
          value={
            <>
              {overview.weekDone}
              <span className="text-base text-muted-strong"> / {overview.weekDue}</span>
            </>
          }
        />
        <StatTile label="completed" value={overview.completedCount} />
      </div>

      <div className="rounded-[18px] border bg-surface p-[18px]">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-strong">recent</p>
        <div className="mt-2">
          <RecentSessions workouts={overview.recent} />
        </div>
      </div>
    </div>
  )
}
