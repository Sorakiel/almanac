import { ListChecks, Loader2, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { HabitCard } from '@/features/habits/components/HabitCard'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { useUiStore } from '@/stores/ui'

function HabitsPage() {
  const { habits, isLoading, isError, refetch } = useHabits()
  const openNewHabit = useUiStore((s) => s.openNewHabit)

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-end justify-between">
        <div>
          <p className="label-mono">// {habits.length} active</p>
          <h1 className="mt-1 text-2xl">Habits</h1>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-16" role="status" aria-live="polite">
          <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
          <span className="sr-only">Loading habits…</span>
        </div>
      ) : isError ? (
        <EmptyState
          icon={RefreshCw}
          title="Couldn't load your habits"
          description="Something went wrong reaching the server."
          action={
            <Button size="sm" variant="surface" onClick={refetch}>
              Try again
            </Button>
          }
        />
      ) : habits.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No habits yet"
          description="Create your first habit to start a streak."
          action={
            <Button size="sm" onClick={openNewHabit}>
              <Plus className="h-4 w-4" />
              Add habit
            </Button>
          }
        />
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {habits.map((habit) => (
              <li key={habit.id}>
                <HabitCard habit={habit} />
              </li>
            ))}
          </ul>
          <Button size="lg" onClick={openNewHabit} className="w-full">
            <Plus className="h-4 w-4" />
            New habit
          </Button>
        </>
      )}
    </section>
  )
}

export default HabitsPage
