import { useState } from 'react'
import { Dumbbell, Loader2, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Cascade } from '@/components/common/Cascade'
import { EmptyState } from '@/components/common/EmptyState'
import { SectionLabel } from '@/components/common/SectionLabel'
import { Rail } from '@/components/common/desktop/rail'
import { WorkoutCard } from '@/features/workouts/components/WorkoutCard'
import { WorkoutFormSheet } from '@/features/workouts/components/WorkoutFormSheet'
import { WorkoutTicker } from '@/features/workouts/components/WorkoutTicker'
import { WorkoutsWorkspace } from '@/features/workouts/components/desktop/WorkoutsWorkspace'
import { WorkoutsRail } from '@/features/workouts/components/desktop/WorkoutsRail'
import { useWorkouts } from '@/features/workouts/hooks/useWorkouts'
import { splitWorkouts } from '@/features/workouts/lib/summary'
import { useMediaQuery } from '@/hooks/useMediaQuery'

function WorkoutsPage() {
  const { workouts, isLoading, isError, refetch } = useWorkouts()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [formOpen, setFormOpen] = useState(false)

  const openNew = () => setFormOpen(true)

  const formSheet = formOpen ? <WorkoutFormSheet open onOpenChange={setFormOpen} /> : null

  if (isDesktop) {
    return (
      <>
        <WorkoutsWorkspace
          workouts={workouts}
          isLoading={isLoading}
          isError={isError}
          refetch={refetch}
          onNew={openNew}
        />
        <Rail>
          <WorkoutsRail workouts={workouts} />
        </Rail>
        {formSheet}
      </>
    )
  }

  const { active, completed } = splitWorkouts(workouts)

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-end justify-between">
        <div>
          <p className="label-mono">// train</p>
          <h1 className="mt-1 text-2xl">Workouts</h1>
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
          <WorkoutTicker workouts={workouts} />

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
              <SectionLabel>COMPLETED</SectionLabel>
              {completed.map((w) => (
                <WorkoutCard key={w.id} workout={w} />
              ))}
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
