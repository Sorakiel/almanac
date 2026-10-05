import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Dumbbell } from '@/components/common/icons'
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
import { WorkoutFormSheet } from '@/features/workouts/components/WorkoutFormSheet'
import { WorkoutsWorkspace } from '@/features/workouts/components/desktop/WorkoutsWorkspace'
import { useTrainingOverview } from '@/features/workouts/hooks/useTrainingOverview'
import { useWorkoutHistory } from '@/features/workouts/hooks/useWorkoutHistory'
import { useWorkouts } from '@/features/workouts/hooks/useWorkouts'
import { historyEntries, mainLift } from '@/features/workouts/lib/history'
import { dayStateFor, workoutForDay } from '@/features/workouts/lib/week'
import { useCreateIntent } from '@/hooks/useCreateIntent'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useOpenKey } from '@/hooks/useSheetKey'
import { useT } from '@/hooks/useT'

/** History rows shown on the page; the chart reads further back. */
const HISTORY_ROWS = 6

function WorkoutsPage() {
  const { t } = useT()
  const { workouts, isLoading, isError, refetch } = useWorkouts()
  const overview = useTrainingOverview()
  const { rows } = useWorkoutHistory()
  const history = useMemo(() => historyEntries(rows.slice(0, HISTORY_ROWS)), [rows])
  const lift = useMemo(() => mainLift(rows), [rows])
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [formOpen, setFormOpen] = useCreateIntent()
  const [selectedKey, setSelectedKey] = useState(overview.todayKey)

  const openNew = () => setFormOpen(true)

  const formKey = useOpenKey(formOpen)
  const formSheet = <WorkoutFormSheet key={formKey} open={formOpen} onOpenChange={setFormOpen} />

  if (isDesktop) {
    return (
      <>
        <WorkoutsWorkspace
          workouts={workouts}
          overview={overview}
          history={history}
          lift={lift}
          isLoading={isLoading}
          isError={isError}
          refetch={refetch}
          onNew={openNew}
        />
        {formSheet}
      </>
    )
  }

  const selectedDay = workoutForDay(overview.workouts, selectedKey, overview.timezone)

  // The phone follows the mobile prototype's order: plan and progress above history.
  return (
    <section className="flex flex-col">
      <TrainingHeader overview={overview} />

      {isLoading ? (
        <LoadingState label={t('workouts.loading')} className="py-16" />
      ) : isError ? (
        <ErrorState title={t('workouts.loadFailed')} onRetry={refetch} />
      ) : workouts.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title={t('workouts.emptyTitle')}
          description={t('workouts.emptyHint')}
          action={
            <Button size="sm" onClick={openNew}>
              <Plus className="h-4 w-4" />
              {t('workouts.newWorkout')}
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-5">
          <Cascade>
            <SessionResumeBanner workouts={overview.workouts} />
            <div className="flex flex-col gap-3.5">
              <WeekStrip
                days={overview.week.days}
                selectedKey={selectedKey}
                onSelect={setSelectedKey}
              />
              {selectedDay ? (
                <TodaySessionCard
                  workout={selectedDay.workout}
                  doneToday={selectedDay.done}
                  dayState={dayStateFor(selectedKey, overview.todayKey)}
                  dateKey={selectedKey}
                />
              ) : (
                <p className="rounded-3xl bg-surface p-6 text-center text-callout text-muted">
                  {t('workouts.restDay')}
                </p>
              )}
            </div>
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
            <section>
              <SectionHead>{t('workouts.lift.title')}</SectionHead>
              <LiftChart lift={lift} />
            </section>
            <section>
              <SectionHead>{t('workouts.recent')}</SectionHead>
              <SessionHistory entries={history} />
            </section>
            <ExerciseLibraryLink />
          </Cascade>
        </div>
      )}

      {formSheet}
    </section>
  )
}

export default WorkoutsPage
