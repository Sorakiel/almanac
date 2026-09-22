import { Dumbbell } from 'lucide-react'
import type { SessionExercise, Workout } from '@/features/workouts/types'
import { useT } from '@/hooks/useT'
import { RailCard, RailNote, RailRow } from '@/components/common/desktop/RailCard'
import { RailIdentity } from '@/components/common/desktop/RailIdentity'

interface WorkoutSessionRailProps {
  workout: Workout
  exercises: SessionExercise[]
}

/** Desktop rail for a workout session: progress and total volume lifted. */
export function WorkoutSessionRail({ workout, exercises }: WorkoutSessionRailProps) {
  const { t } = useT()
  const allSets = exercises.flatMap((e) => e.sets)
  const doneSets = allSets.filter((s) => s.done)
  const volume = doneSets.reduce((sum, s) => sum + (s.reps ?? 0) * (s.weight ?? 0), 0)

  return (
    <div className="flex flex-col gap-3.5">
      <RailIdentity
        icon={Dumbbell}
        tone="bg-teal/15 text-teal"
        title={workout.name}
        subtitle={workout.completed_at ? 'completed' : 'in progress'}
      />

      <RailCard label={t('workouts.sessionLower')}>
        <RailRow label={t('workouts.exercisesLower')} value={String(exercises.length)} />
        <RailRow label={t('workouts.setsDone')} value={`${doneSets.length} / ${allSets.length}`} />
        <RailRow label={t('workouts.volume')} value={`${Math.round(volume)} kg`} />
      </RailCard>

      <RailNote label="tip" tone="teal">
        {t('workouts.session.railHint')}
      </RailNote>
    </div>
  )
}
