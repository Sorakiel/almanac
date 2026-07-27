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
import { RecentSessions } from '@/features/workouts/components/RecentSessions'
import { WorkoutsWorkspace } from '@/features/workouts/components/desktop/WorkoutsWorkspace'
import { WorkoutsRail } from '@/features/workouts/components/desktop/WorkoutsRail'
import { useWorkouts } from '@/features/workouts/hooks/useWorkouts'
import { useTrainingOverview } from '@/features/workouts/hooks/useTrainingOverview'
import { splitWorkouts } from '@/features/workouts/lib/summary'
import { dayStateFor, workoutForDay } from '@/features/workouts/lib/week'
import { useMediaQuery } from '@/hooks/useMediaQuery'

function WorkoutsPage() {
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

  const { active, completed } = splitWorkouts(workouts)
  const selectedDay = workoutForDay(overview.workouts, selectedKey, overview.timezone)
  const selectedDayLabel = new Intl.DateTimeFormat('en-GB', {
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
          <h1 className="mt-1 text-2xl">Training</h1>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-16" role="status" aria-live="polite">
          <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
          <span className="sr-only">Loading workouts…</span>
        </div>
      ) : isError ? (
        <EmptyState
          icon={RefreshCw}
          title="Couldn't load your workouts"
          description="Something went wrong reaching the server."
          action={
            <Button size="sm" variant="surface" onClick={refetch}>
              Try again
            </Button>
          }
        />
      ) : workouts.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No workouts yet"
          description="Add your first training session to start a log."
          action={
            <Button size="sm" onClick={openNew}>
              <Plus className="h-4 w-4" />
              New workout
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
            <SectionLabel>{selectedKey === overview.todayKey ? 'TODAY' : selectedDayLabel}</SectionLabel>
            {selectedDay ? (
              <TodaySessionCard
                workout={selectedDay.workout}
                doneToday={selectedDay.done}
                dayState={dayStateFor(selectedKey, overview.todayKey)}
              />
            ) : (
              <div className="rounded-[22px] border border-dashed p-6 text-center">
                <p className="text-sm text-muted">No session scheduled — rest day.</p>
              </div>
            )}
          </div>

          {active.length > 0 ? (
            <div className="flex flex-col gap-3">
              <SectionLabel>TO DO</SectionLabel>
              {active.map((w) => (
                <WorkoutCard key={w.id} workout={w} />
              ))}
            </div>
          ) : null}

          {completed.length > 0 ? (
            <div className="flex flex-col gap-3">
              <SectionLabel accessory={`${overview.recent.length}`}>RECENT</SectionLabel>
              <div className="rounded-card border bg-surface px-4 py-2">
                <RecentSessions workouts={overview.recent} />
              </div>
            </div>
          ) : null}

          <Button size="lg" onClick={openNew} className="w-full shadow-glow">
            <Plus className="h-4 w-4" />
            New workout
          </Button>
        </Cascade>
      )}

      {formSheet}
    </section>
  )
}

export default WorkoutsPage
