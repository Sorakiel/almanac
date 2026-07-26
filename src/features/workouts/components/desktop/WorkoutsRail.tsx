import { Dumbbell } from 'lucide-react'
import { SectionLabel } from '@/components/common/SectionLabel'
import { RecentSessions } from '@/features/workouts/components/RecentSessions'
import type { TrainingOverview } from '@/features/workouts/hooks/useTrainingOverview'

interface WorkoutsRailProps {
  overview: TrainingOverview
}

/** Desktop training rail: identity, this-week snapshot, and recent sessions. */
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

      <div className="rounded-[18px] border bg-surface p-[18px]">
        <p className="font-mono text-[10px] uppercase tracking-label text-muted-strong">this week</p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-semibold tabular-nums">
            {overview.weekDone}
            <span className="text-muted-strong"> / {overview.weekDue}</span>
          </span>
          <span className="font-mono text-[10px] uppercase tracking-label text-muted-strong">
            sessions done
          </span>
        </div>
      </div>

      <div className="rounded-[18px] border bg-surface p-[18px]">
        <SectionLabel>RECENT</SectionLabel>
        <div className="mt-1">
          <RecentSessions workouts={overview.recent} />
        </div>
      </div>
    </div>
  )
}
