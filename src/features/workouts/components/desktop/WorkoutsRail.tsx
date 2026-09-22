import { Dumbbell } from 'lucide-react'
import { RecentSessions } from '@/features/workouts/components/RecentSessions'
import type { TrainingOverview } from '@/features/workouts/hooks/useTrainingOverview'
import { useT } from '@/hooks/useT'
import { RailCard } from '@/components/common/desktop/RailCard'
import { RailIdentity } from '@/components/common/desktop/RailIdentity'

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
  const { t } = useT()
  return (
    <div className="flex flex-col gap-3.5">
      <RailIdentity
        icon={Dumbbell}
        tone="bg-teal/15 text-teal"
        title={t('workouts.title')}
        subtitle={t('workouts.yourWeek')}
      />

      <div className="flex gap-3">
        <StatTile
          label={t('workouts.thisWeek')}
          value={
            <>
              {overview.weekDone}
              <span className="text-base text-muted-strong"> / {overview.weekDue}</span>
            </>
          }
        />
        <StatTile label={t('workouts.completed')} value={overview.completedCount} />
      </div>

      <RailCard label={t('workouts.recent')}>
        <RecentSessions workouts={overview.recent} />
      </RailCard>
    </div>
  )
}
