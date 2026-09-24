import { Link } from 'react-router-dom'
import { Dumbbell } from 'lucide-react'
import { useWorkoutDetail } from '@/features/workouts/hooks/useWorkoutDetail'
import { recurrenceLabel } from '@/features/workouts/lib/recurrence'
import { useT } from '@/hooks/useT'
import type { DueWorkout } from '@/features/workouts/hooks/useTodaysWorkouts'
import { ModuleCard, ModuleDonePill } from './ModuleCard'

interface WorkoutModuleCardProps {
  item: DueWorkout
}

/** Today's training: its name, what is in it, and "Start" straight into the session. */
export function WorkoutModuleCard({ item }: WorkoutModuleCardProps) {
  const { t } = useT()
  const { workout, doneToday } = item
  const { exercises } = useWorkoutDetail(workout.id)
  const names = exercises.map((e) => e.name).join(' · ')

  return (
    <ModuleCard
      icon={Dumbbell}
      hue="teal"
      kicker={t('dashboard.modules.trainingToday')}
      value={workout.name}
      action={
        doneToday ? (
          <ModuleDonePill>{t('dashboard.modules.done')}</ModuleDonePill>
        ) : (
          <Link to={`/train/${workout.id}/session`} className="today-pill is-teal">
            {t('dashboard.modules.start')}
          </Link>
        )
      }
    >
      <div className="today-mod-foot">
        <span>{names || (recurrenceLabel(workout, t) ?? t('dashboard.scheduledToday'))}</span>
        {exercises.length > 0 ? (
          <span className="flex-none">
            {t('dashboard.modules.exercises', { count: exercises.length })}
          </span>
        ) : null}
      </div>
    </ModuleCard>
  )
}
