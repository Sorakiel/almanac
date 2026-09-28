import { useState } from 'react'
import { Dumbbell, Plus } from 'lucide-react'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { Button } from '@/components/ui/button'
import { Cascade } from '@/components/common/Cascade'
import { EmptyState } from '@/components/common/EmptyState'
import { ExerciseLibraryLink } from '@/features/workouts/components/ExerciseLibraryLink'
import { LiftChart } from '@/features/workouts/components/LiftChart'
import { PlanList } from '@/features/workouts/components/PlanList'
import { SectionHead } from '@/components/common/SectionHead'
import { SessionHistory } from '@/features/workouts/components/SessionHistory'
import { SessionResumeBanner } from '@/features/workouts/components/SessionResumeBanner'
import { TodaySessionCard } from '@/features/workouts/components/TodaySessionCard'
import { TrainingHeader } from '@/features/workouts/components/TrainingHeader'
import { WeekStrip } from '@/features/workouts/components/WeekStrip'
import type { TrainingOverview } from '@/features/workouts/hooks/useTrainingOverview'
import type { HistoryEntry, LiftSeries } from '@/features/workouts/lib/history'
import { dayStateFor, workoutForDay } from '@/features/workouts/lib/week'
import type { WorkoutView } from '@/features/workouts/types'
import { useT } from '@/hooks/useT'

interface WorkoutsWorkspaceProps {
  workouts: WorkoutView[]
  overview: TrainingOverview
  history: HistoryEntry[]
  lift: LiftSeries | null
  isLoading: boolean
  isError: boolean
  refetch: () => void
  onNew: () => void
}

/**
 * Desktop training, the prototype's `MOD.desk('workouts')` in `.dk-mgrid`: the
 * week, the selected day's plan and history on the left; the templates, the
 * main lift and the library in a sticky 360px column on the right.
 */
export function WorkoutsWorkspace({
  workouts,
  overview,
  history,
  lift,
  isLoading,
  isError,
  refetch,
  onNew,
}: WorkoutsWorkspaceProps) {
  const { t } = useT()
  const [selectedKey, setSelectedKey] = useState(overview.todayKey)
  const selected = workoutForDay(overview.workouts, selectedKey, overview.timezone)

  return (
    <div className="w-full">
      <TrainingHeader overview={overview} />

      {isLoading ? (
        <LoadingState label={t('workouts.loading')} />
      ) : isError ? (
        <ErrorState title={t('workouts.loadFailed')} onRetry={refetch} />
      ) : workouts.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title={t('workouts.emptyTitle')}
          description={t('workouts.emptyHint')}
          action={
            <Button size="sm" onClick={onNew}>
              <Plus className="h-4 w-4" />
              {t('workouts.newWorkout')}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-module items-start gap-6">
          <div className="grid min-w-0 grid-cols-1 content-start gap-3.5">
            <Cascade>
              <SessionResumeBanner workouts={overview.workouts} />
              <WeekStrip
                days={overview.week.days}
                selectedKey={selectedKey}
                onSelect={setSelectedKey}
              />
              {selected ? (
                <TodaySessionCard
                  workout={selected.workout}
                  doneToday={selected.done}
                  dayState={dayStateFor(selectedKey, overview.todayKey)}
                  dateKey={selectedKey}
                />
              ) : (
                <p className="rounded-3xl bg-surface p-7 text-center text-callout text-muted">
                  {t('workouts.restDay')}
                </p>
              )}
              <section>
                <SectionHead>{t('workouts.recent')}</SectionHead>
                <SessionHistory entries={history} />
              </section>
            </Cascade>
          </div>

          <aside
            aria-label={t('workouts.allWorkouts')}
            className="sticky top-toolbar-clearance grid min-w-0 grid-cols-1 content-start gap-3.5"
          >
            <section>
              <SectionHead aside={t('workouts.plan.templates', { count: workouts.length })}>
                {t('workouts.allWorkouts')}
              </SectionHead>
              <PlanList
                workouts={workouts}
                todayKey={overview.todayKey}
                timezone={overview.timezone}
              />
            </section>
            <LiftChart lift={lift} titled />
            <ExerciseLibraryLink />
          </aside>
        </div>
      )}
    </div>
  )
}
