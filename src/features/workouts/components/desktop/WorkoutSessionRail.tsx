import { Dumbbell } from 'lucide-react'
import type { SessionExercise, Workout } from '@/features/workouts/types'
import { useT } from '@/hooks/useT'
import { useToday } from '@/hooks/useToday'
import { isCompletedOn } from '@/features/workouts/lib/recurrence'
import { RailCard, RailNote, RailRow } from '@/components/rail/RailCard'
import { RailIdentity } from '@/components/rail/RailIdentity'

interface WorkoutSessionRailProps {
  workout: Workout
  exercises: SessionExercise[]
}

/** Desktop rail for a workout session: progress and total volume lifted. */
export function WorkoutSessionRail({ workout, exercises }: WorkoutSessionRailProps) {
  const { t } = useT()
  const { dateKey, timezone } = useToday()
  const allSets = exercises.flatMap((e) => e.sets)
  const doneSets = allSets.filter((s) => s.done)
  const volume = doneSets.reduce((sum, s) => sum + (s.reps ?? 0) * (s.weight ?? 0), 0)

  return (
    <div className="flex flex-col gap-3.5">
      <RailIdentity
        icon={Dumbbell}
        tone="bg-teal/15 text-teal"
        title={workout.name}
        subtitle={
          isCompletedOn(workout, dateKey, timezone)
            ? t('workouts.statusCompleted')
            : t('workouts.statusInProgress')
        }
      />

      <RailCard label={t('workouts.sessionLower')}>
        <RailRow label={t('workouts.exercisesLower')} value={String(exercises.length)} />
        <RailRow label={t('workouts.setsDone')} value={`${doneSets.length} / ${allSets.length}`} />
        <RailRow
          label={t('workouts.volume')}
          value={t('units.kgValue', { value: Math.round(volume) })}
        />
      </RailCard>

      <RailNote label={t('workouts.tip')} tone="teal">
        {t('workouts.session.railHint')}
      </RailNote>
    </div>
  )
}
