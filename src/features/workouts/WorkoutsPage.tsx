import { useState } from 'react'
import { Dumbbell, Loader2, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Cascade } from '@/components/common/Cascade'
import { EmptyState } from '@/components/common/EmptyState'
import { SectionLabel } from '@/components/common/SectionLabel'
import { Rail } from '@/components/common/desktop/rail'
import { WorkoutCard } from '@/features/workouts/components/WorkoutCard'
import { WorkoutFormSheet } from '@/features/workouts/components/WorkoutFormSheet'
import { WeekStrip } from '@/features/workouts/components/WeekStrip'
import { TodaySessionCard } from '@/features/workouts/components/TodaySessionCard'
import { SessionResumeBanner } from '@/features/workouts/components/SessionResumeBanner'
import { WorkoutsWorkspace } from '@/features/workouts/components/desktop/WorkoutsWorkspace'
import { WorkoutsRail } from '@/features/workouts/components/desktop/WorkoutsRail'
import { useWorkouts } from '@/features/workouts/hooks/useWorkouts'
import { useTrainingOverview } from '@/features/workouts/hooks/useTrainingOverview'
import { dayStateFor, workoutForDay } from '@/features/workouts/lib/week'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useT } from '@/hooks/useT'
import { intlLocale } from '@/lib/dateLocale'

function WorkoutsPage() {
  const { t, locale } = useT()
  const { workouts, isLoading, isError, refetch } = useWorkouts()
  const overview = useTrainingOverview()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [formOpen, setFormOpen] = useState(false)
  const [selectedKey, setSelectedKey] = useState(overview.todayKey)

  const openNew = () => setFormOpen(true)

  const formSheet = formOpen ? <WorkoutFormSheet open onOpenChange={setFormOpen} /> : null

  if (isDesktop) {
    return (
      <>
        <WorkoutsWorkspace
          workouts={workouts}
          overview={overview}
          isLoading={isLoading}
          isError={isError}
          refetch={refetch}
          onNew={openNew}
        />
        <Rail>
          <WorkoutsRail overview={overview} />
        </Rail>
        {formSheet}
      </>
    )
  }

  const selectedDay = workoutForDay(overview.workouts, selectedKey, overview.timezone)
  const selectedDayLabel = new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
    .format(new Date(`${selectedKey}T00:00:00Z`))
    .toUpperCase()

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-end justify-between">
        <div>
          <p className="label-mono">// {overview.week.label}</p>
          <h1 className="mt-1 text-2xl">{t('workouts.title')}</h1>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-16" role="status" aria-live="polite">
          <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
          <span className="sr-only">{t('workouts.loading')}</span>
        </div>
      ) : isError ? (
        <EmptyState
          icon={RefreshCw}
          title={t('workouts.loadFailed')}
          description={t('workouts.loadFailedHint')}
          action={
            <Button size="sm" variant="surface" onClick={refetch}>
              {t('workouts.tryAgain')}
            </Button>
          }
        />
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
        <Cascade>
          <SessionResumeBanner workouts={overview.workouts} />

          <WeekStrip
            days={overview.week.days}
            selectedKey={selectedKey}
            onSelect={setSelectedKey}
          />

          <div className="flex flex-col gap-2">
            <SectionLabel>
              {selectedKey === overview.todayKey
                ? t('workouts.todayLower').toUpperCase()
                : selectedDayLabel}
            </SectionLabel>
            {selectedDay ? (
              <TodaySessionCard
                workout={selectedDay.workout}
                doneToday={selectedDay.done}
                dayState={dayStateFor(selectedKey, overview.todayKey)}
              />
            ) : (
              <div className="rounded-[22px] border border-dashed p-6 text-center">
                <p className="text-sm text-muted">{t('workouts.restDay')}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <SectionLabel accessory={`${workouts.length}`}>
              {t('workouts.allWorkouts')}
            </SectionLabel>
            {workouts.map((w) => (
              <WorkoutCard key={w.id} workout={w} />
            ))}
          </div>

          <Button size="lg" onClick={openNew} className="w-full shadow-glow">
            <Plus className="h-4 w-4" />
            {t('workouts.newWorkout')}
          </Button>
        </Cascade>
      )}

      {formSheet}
    </section>
  )
}

export default WorkoutsPage
